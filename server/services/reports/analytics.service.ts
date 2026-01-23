/**
 * Servicio de Analytics y Reportes
 * Piano Emotion Manager
 * 
 * Proporciona métricas de negocio, KPIs y datos para dashboards
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, gte, lte, sql, count, sum, avg, desc } from 'drizzle-orm';
import { services, clients, pianos, appointments, users, workAssignments } from '../../../drizzle/schema.js';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DashboardMetrics {
  revenue: {
    total: number;
    previousPeriod: number;
    change: number;
    changePercent: number;
  };
  services: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    completionRate: number;
  };
  clients: {
    total: number;
    new: number;
    active: number;
    retention: number;
  };
  pianos: {
    total: number;
    serviced: number;
    pending: number;
  };
  averages: {
    ticketValue: number;
    servicesPerClient: number;
    revenuePerTechnician: number;
  };
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  services: number;
  averageTicket: number;
}

export interface ServicesByType {
  type: string;
  typeName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface TopClient {
  id: number;
  name: string;
  email: string;
  totalServices: number;
  totalRevenue: number;
  lastServiceDate: Date | null;
  pianoCount: number;
}

export interface TechnicianPerformance {
  id: number;
  name: string;
  servicesCompleted: number;
  revenue: number;
  averageRating: number;
  completionRate: number;
  averageServiceTime: number;
}

export interface PianosByBrand {
  brand: string;
  count: number;
  percentage: number;
  averageAge: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  revenue: number;
  services: number;
  newClients: number;
  newPianos: number;
}

export interface GeographicDistribution {
  city: string;
  region: string;
  clientCount: number;
  pianoCount: number;
  revenue: number;
}

// ============================================================================
// Analytics Service
// ============================================================================

export class AnalyticsService {
  private organizationId: number;

  constructor(organizationId: number) {
    this.organizationId = organizationId;
  }

  /**
   * Obtiene métricas principales del dashboard
   */
  async getDashboardMetrics(dateRange: DateRange): Promise<DashboardMetrics> {
    const { startDate, endDate } = dateRange;

    // Calcular período anterior para comparación
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Métricas de ingresos
    const currentRevenue = await this.getTotalRevenue(startDate, endDate);
    const previousRevenue = await this.getTotalRevenue(previousStartDate, previousEndDate);
    const revenueChange = currentRevenue - previousRevenue;
    const revenueChangePercent = previousRevenue > 0 
      ? (revenueChange / previousRevenue) * 100 
      : 0;

    // Métricas de servicios
    const serviceStats = await this.getServiceStats(startDate, endDate);

    // Métricas de clientes
    const clientStats = await this.getClientStats(startDate, endDate);

    // Métricas de pianos
    const pianoStats = await this.getPianoStats(startDate, endDate);

    // Promedios
    const averageTicket = serviceStats.completed > 0 
      ? currentRevenue / serviceStats.completed 
      : 0;

    const servicesPerClient = clientStats.active > 0 
      ? serviceStats.total / clientStats.active 
      : 0;

    const technicianCount = await this.getTechnicianCount();
    const revenuePerTechnician = technicianCount > 0 
      ? currentRevenue / technicianCount 
      : currentRevenue;

    return {
      revenue: {
        total: currentRevenue,
        previousPeriod: previousRevenue,
        change: revenueChange,
        changePercent: revenueChangePercent,
      },
      services: {
        total: serviceStats.total,
        completed: serviceStats.completed,
        pending: serviceStats.pending,
        cancelled: serviceStats.cancelled,
        completionRate: serviceStats.total > 0 
          ? (serviceStats.completed / serviceStats.total) * 100 
          : 0,
      },
      clients: {
        total: clientStats.total,
        new: clientStats.new,
        active: clientStats.active,
        retention: clientStats.retention,
      },
      pianos: {
        total: pianoStats.total,
        serviced: pianoStats.serviced,
        pending: pianoStats.pending,
      },
      averages: {
        ticketValue: averageTicket,
        servicesPerClient,
        revenuePerTechnician,
      },
    };
  }

  /**
   * Obtiene ingresos por período (día, semana, mes)
   */
  async getRevenueByPeriod(
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<RevenueByPeriod[]> {
    const { startDate, endDate } = dateRange;

    // Simulación de datos - En producción, esto vendría de la BD
    const periods: RevenueByPeriod[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      let periodLabel: string;
      let nextDate: Date;

      if (groupBy === 'day') {
        periodLabel = current.toISOString().split('T')[0];
        nextDate = new Date(current);
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (groupBy === 'week') {
        const weekNum = this.getWeekNumber(current);
        periodLabel = `Sem ${weekNum}`;
        nextDate = new Date(current);
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        periodLabel = current.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        nextDate = new Date(current);
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      // En producción, consultar BD para este período
      const revenue = await this.getTotalRevenue(current, nextDate);
      const services = await this.getServiceCount(current, nextDate);

      periods.push({
        period: periodLabel,
        revenue,
        services,
        averageTicket: services > 0 ? revenue / services : 0,
      });

      current.setTime(nextDate.getTime());
    }

    return periods;
  }

  /**
   * Obtiene servicios agrupados por tipo
   */
  async getServicesByType(dateRange: DateRange): Promise<ServicesByType[]> {
    const { startDate, endDate } = dateRange;
    const db = getDb();

    // Mapeo de tipos de servicio
    const serviceTypeNames: Record<string, string> = {
      tuning: 'Afinación',
      repair: 'Reparación',
      regulation: 'Regulación',
      maintenance_basic: 'Mantenimiento Básico',
      maintenance_complete: 'Mantenimiento Completo',
      maintenance_premium: 'Mantenimiento Premium',
      inspection: 'Inspección',
      restoration: 'Restauración',
      other: 'Otros',
    };

    // Consultar servicios agrupados por tipo
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const results = await db
      .select({
        type: services.serviceType,
        count: count(),
        revenue: sum(services.cost),
      })
      .from(services)
      .where(
        and(
          eq(services.organizationId, this.organizationId),
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      )
      .groupBy(services.serviceType);

    // Calcular total para porcentajes
    const totalServices = results.reduce((sum, r) => sum + Number(r.count), 0);

    // Formatear resultados
    return results.map(r => ({
      type: r.type,
      typeName: serviceTypeNames[r.type] || r.type,
      count: Number(r.count),
      revenue: Number(r.revenue || 0),
      percentage: totalServices > 0 ? (Number(r.count) / totalServices) * 100 : 0,
    }));
  }

  /**
   * Obtiene los mejores clientes
   */
  async getTopClients(
    dateRange: DateRange,
    limit: number = 10,
    sortBy: 'revenue' | 'services' = 'revenue'
  ): Promise<TopClient[]> {
    // En producción, consultar BD con joins
    // Placeholder con datos de ejemplo
    return [];
  }

  /**
   * Obtiene rendimiento de técnicos
   */
  async getTechnicianPerformance(
    dateRange: DateRange
  ): Promise<TechnicianPerformance[]> {
    // En producción, consultar BD
    return [];
  }

  /**
   * Obtiene distribución de pianos por marca
   */
  async getPianosByBrand(): Promise<PianosByBrand[]> {
    // En producción, consultar BD
    const brands = [
      'Steinway & Sons', 'Yamaha', 'Kawai', 'Bösendorfer', 
      'Bechstein', 'Fazioli', 'Petrof', 'Otros'
    ];

    let total = 0;
    const results: PianosByBrand[] = [];

    for (const brand of brands) {
      const count = Math.floor(Math.random() * 30) + 5;
      total += count;
      results.push({
        brand,
        count,
        percentage: 0,
        averageAge: Math.floor(Math.random() * 40) + 5,
      });
    }

    return results.map(r => ({
      ...r,
      percentage: (r.count / total) * 100,
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Obtiene tendencias mensuales
   */
  async getMonthlyTrends(months: number = 12): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      trends.push({
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        year: date.getFullYear(),
        revenue: await this.getTotalRevenue(date, monthEnd),
        services: await this.getServiceCount(date, monthEnd),
        newClients: Math.floor(Math.random() * 10) + 1,
        newPianos: Math.floor(Math.random() * 15) + 2,
      });
    }

    return trends;
  }

  /**
   * Obtiene distribución geográfica
   */
  async getGeographicDistribution(): Promise<GeographicDistribution[]> {
    // En producción, consultar BD agrupando por ciudad/región
    return [];
  }

  /**
   * Exporta datos a formato CSV
   */
  async exportToCSV(
    reportType: 'revenue' | 'services' | 'clients' | 'pianos',
    dateRange: DateRange
  ): Promise<string> {
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'revenue':
        headers = ['Período', 'Ingresos', 'Servicios', 'Ticket Medio'];
        const revenueData = await this.getRevenueByPeriod(dateRange, 'month');
        rows = revenueData.map(r => [
          r.period,
          r.revenue.toFixed(2),
          r.services.toString(),
          r.averageTicket.toFixed(2),
        ]);
        break;

      case 'services':
        headers = ['Tipo', 'Cantidad', 'Ingresos', 'Porcentaje'];
        const servicesData = await this.getServicesByType(dateRange);
        rows = servicesData.map(s => [
          s.typeName,
          s.count.toString(),
          s.revenue.toFixed(2),
          s.percentage.toFixed(1) + '%',
        ]);
        break;

      case 'pianos':
        headers = ['Marca', 'Cantidad', 'Porcentaje', 'Edad Media'];
        const pianosData = await this.getPianosByBrand();
        rows = pianosData.map(p => [
          p.brand,
          p.count.toString(),
          p.percentage.toFixed(1) + '%',
          p.averageAge.toString() + ' años',
        ]);
        break;

      default:
        headers = ['Sin datos'];
        rows = [];
    }

    // Generar CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const db = getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const result = await db
      .select({ total: sum(services.cost) })
      .from(services)
      .where(
        and(
          eq(services.organizationId, this.organizationId),
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    return Number(result[0]?.total || 0);
  }

  private async getServiceCount(startDate: Date, endDate: Date): Promise<number> {
    const db = getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const result = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          eq(services.organizationId, this.organizationId),
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    return Number(result[0]?.count || 0);
  }

  private async getServiceStats(startDate: Date, endDate: Date) {
    const db = getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Contar total de appointments
    const totalResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, this.organizationId),
          gte(appointments.date, startStr),
          lte(appointments.date, endStr)
        )
      );
    const total = Number(totalResult[0]?.count || 0);

    // Contar completados
    const completedResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, this.organizationId),
          eq(appointments.status, 'completed'),
          gte(appointments.date, startStr),
          lte(appointments.date, endStr)
        )
      );
    const completed = Number(completedResult[0]?.count || 0);

    // Contar cancelados
    const cancelledResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, this.organizationId),
          eq(appointments.status, 'cancelled'),
          gte(appointments.date, startStr),
          lte(appointments.date, endStr)
        )
      );
    const cancelled = Number(cancelledResult[0]?.count || 0);

    // Pendientes = scheduled + confirmed
    const pending = total - completed - cancelled;

    return { total, completed, pending, cancelled };
  }

  private async getClientStats(startDate: Date, endDate: Date) {
    const db = getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Total de clientes
    const totalResult = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.organizationId, this.organizationId));
    const total = Number(totalResult[0]?.count || 0);

    // Clientes nuevos en el período
    const newResult = await db
      .select({ count: count() })
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, this.organizationId),
          gte(clients.createdAt, startStr),
          lte(clients.createdAt, endStr)
        )
      );
    const newClients = Number(newResult[0]?.count || 0);

    // Clientes activos (con appointments en el período)
    const activeResult = await db
      .selectDistinct({ clientId: appointments.clientId })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, this.organizationId),
          gte(appointments.date, startStr),
          lte(appointments.date, endStr)
        )
      );
    const active = activeResult.length;

    // Tasa de retención: clientes activos / total de clientes * 100
    const retention = total > 0 ? (active / total) * 100 : 0;

    return {
      total,
      new: newClients,
      active,
      retention,
    };
  }

  private async getPianoStats(startDate: Date, endDate: Date) {
    const db = getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Total de pianos
    const totalResult = await db
      .select({ count: count() })
      .from(pianos)
      .where(eq(pianos.organizationId, this.organizationId));
    const total = Number(totalResult[0]?.count || 0);

    // Pianos con servicio en el período (pianos distintos en appointments)
    const servicedResult = await db
      .selectDistinct({ pianoId: appointments.pianoId })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, this.organizationId),
          gte(appointments.date, startStr),
          lte(appointments.date, endStr)
        )
      );
    const serviced = servicedResult.filter(r => r.pianoId !== null).length;

    // Pendientes = total - serviced
    const pending = total - serviced;

    return {
      total,
      serviced,
      pending,
    };
  }

  private async getTechnicianCount(): Promise<number> {
    const db = getDb();
    
    // Contar técnicos distintos asignados a trabajos de esta organización
    const result = await (await db)
      .select({ technicianId: workAssignments.technicianId })
      .from(workAssignments)
      .where(eq(workAssignments.organizationId, this.organizationId));
    
    // Contar técnicos únicos
    const uniqueTechnicians = new Set(result.map(r => r.technicianId));
    return uniqueTechnicians.size || 1; // Mínimo 1 para evitar división por cero
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAnalyticsService(organizationId: number): AnalyticsService {
  return new AnalyticsService(organizationId);
}
