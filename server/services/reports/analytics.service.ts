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
    const db = await getDb();

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
    const db = await getDb();
    const startStr = dateRange.startDate.toISOString();
    const endStr = dateRange.endDate.toISOString();

    // Agrupar servicios por cliente
    const results = await db
      .select({
        clientId: services.clientId,
        totalRevenue: sum(services.cost),
        serviceCount: count(),
      })
      .from(services)
      .where(
        and(
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      )
      .groupBy(services.clientId);

    // Obtener información de clientes
    const topClients: TopClient[] = [];
    for (const result of results) {
      if (!result.clientId) continue;
      
      const clientInfo = await db
        .select()
        .from(clients)
        .where(eq(clients.id, result.clientId))
        .limit(1);

      if (clientInfo.length > 0) {
        topClients.push({
          clientId: result.clientId,
          clientName: clientInfo[0].name || 'Sin nombre',
          totalRevenue: Number(result.totalRevenue || 0),
          serviceCount: Number(result.serviceCount || 0),
          averageTicket: Number(result.totalRevenue || 0) / Number(result.serviceCount || 1),
        });
      }
    }

    // Ordenar según criterio
    const sorted = topClients.sort((a, b) => {
      if (sortBy === 'revenue') {
        return b.totalRevenue - a.totalRevenue;
      }
      return b.serviceCount - a.serviceCount;
    });

    return sorted.slice(0, limit);
  }

  /**
   * Obtiene rendimiento de técnicos
   */
  async getTechnicianPerformance(
    dateRange: DateRange
  ): Promise<TechnicianPerformance[]> {
    const db = await getDb();
    const startStr = dateRange.startDate.toISOString();
    const endStr = dateRange.endDate.toISOString();

    // Obtener asignaciones de trabajo en el período
    const assignments = await db
      .select({
        technicianId: workAssignments.technicianId,
        completedCount: count(),
      })
      .from(workAssignments)
      .where(
        and(
          gte(workAssignments.scheduledDate, startStr),
          lte(workAssignments.scheduledDate, endStr),
          eq(workAssignments.status, 'completed')
        )
      )
      .groupBy(workAssignments.technicianId);

    // Obtener información de técnicos y calcular ingresos
    const performance: TechnicianPerformance[] = [];
    for (const assignment of assignments) {
      if (!assignment.technicianId) continue;

      const techInfo = await db
        .select()
        .from(users)
        .where(eq(users.id, assignment.technicianId))
        .limit(1);

      if (techInfo.length > 0) {
        // Calcular ingresos de servicios del técnico
        const revenueResult = await db
          .select({ total: sum(services.cost) })
          .from(services)
          .innerJoin(workAssignments, eq(services.id, workAssignments.serviceId))
          .where(
            and(
              eq(workAssignments.technicianId, assignment.technicianId),
              gte(services.date, startStr),
              lte(services.date, endStr)
            )
          );

        const totalRevenue = Number(revenueResult[0]?.total || 0);
        const servicesCompleted = Number(assignment.completedCount || 0);

        performance.push({
          technicianId: assignment.technicianId,
          technicianName: techInfo[0].name || 'Sin nombre',
          servicesCompleted,
          totalRevenue,
          averageRating: 0, // TODO: Implementar sistema de ratings
          efficiency: servicesCompleted > 0 ? (servicesCompleted / 30) * 100 : 0, // Asumiendo 30 días
        });
      }
    }

    return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Obtiene distribución de pianos por marca
   */
  async getPianosByBrand(): Promise<PianosByBrand[]> {
    const db = await getDb();

    // Agrupar pianos por marca
    const results = await db
      .select({
        brand: pianos.brand,
        count: count(),
      })
      .from(pianos)
      .groupBy(pianos.brand);

    const total = results.reduce((sum, r) => sum + Number(r.count), 0);

    // Calcular edad promedio por marca
    const brandsWithAge: PianosByBrand[] = [];
    for (const result of results) {
      if (!result.brand) continue;

      const pianosOfBrand = await db
        .select({ year: pianos.year })
        .from(pianos)
        .where(eq(pianos.brand, result.brand));

      const currentYear = new Date().getFullYear();
      const ages = pianosOfBrand
        .filter(p => p.year)
        .map(p => currentYear - Number(p.year));
      
      const averageAge = ages.length > 0 
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length 
        : 0;

      brandsWithAge.push({
        brand: result.brand,
        count: Number(result.count),
        percentage: total > 0 ? (Number(result.count) / total) * 100 : 0,
        averageAge: Math.round(averageAge),
      });
    }

    return brandsWithAge.sort((a, b) => b.count - a.count);
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

      // Calcular clientes nuevos en el mes
      const db = await getDb();
      const startStr = date.toISOString();
      const endStr = monthEnd.toISOString();

      const newClientsResult = await db
        .select({ count: count() })
        .from(clients)
        .where(
          and(
            gte(clients.createdAt, startStr),
            lte(clients.createdAt, endStr)
          )
        );

      const newPianosResult = await db
        .select({ count: count() })
        .from(pianos)
        .where(
          and(
            gte(pianos.createdAt, startStr),
            lte(pianos.createdAt, endStr)
          )
        );

      trends.push({
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        year: date.getFullYear(),
        revenue: await this.getTotalRevenue(date, monthEnd),
        services: await this.getServiceCount(date, monthEnd),
        newClients: Number(newClientsResult[0]?.count || 0),
        newPianos: Number(newPianosResult[0]?.count || 0),
      });
    }

    return trends;
  }

  /**
   * Obtiene distribución geográfica
   */
  async getGeographicDistribution(): Promise<GeographicDistribution[]> {
    const db = await getDb();

    // Agrupar clientes por ciudad
    const results = await db
      .select({
        city: clients.city,
        count: count(),
      })
      .from(clients)
      .groupBy(clients.city);

    const total = results.reduce((sum, r) => sum + Number(r.count), 0);

    // Calcular ingresos por ciudad
    const distribution: GeographicDistribution[] = [];
    for (const result of results) {
      if (!result.city) continue;

      // Obtener servicios de clientes de esta ciudad
      const clientsInCity = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.city, result.city));

      const clientIds = clientsInCity.map(c => c.id);

      let cityRevenue = 0;
      if (clientIds.length > 0) {
        const revenueResult = await db
          .select({ total: sum(services.cost) })
          .from(services)
          .where(sql`${services.clientId} IN (${clientIds.join(',')})`);  
        
        cityRevenue = Number(revenueResult[0]?.total || 0);
      }

      distribution.push({
        city: result.city,
        region: result.city, // TODO: Agregar campo region en tabla clients
        clientCount: Number(result.count),
        pianoCount: 0, // TODO: Agregar conteo de pianos por ciudad
        revenue: cityRevenue,
      });
    }

    return distribution.sort((a, b) => b.revenue - a.revenue);
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
    const db = await getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const result = await db
      .select({ total: sum(services.cost) })
      .from(services)
      .where(
        and(
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    return Number(result[0]?.total || 0);
  }

  private async getServiceCount(startDate: Date, endDate: Date): Promise<number> {
    const db = await getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    const result = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    return Number(result[0]?.count || 0);
  }

  private async getServiceStats(startDate: Date, endDate: Date) {
    const db = await getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Contar total de services (servicios reales que generan ingresos)
    const totalResult = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    const total = Number(totalResult[0]?.count || 0);

    // Contar completados (services con status='completed' o que tengan cost > 0)
    const completedResult = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          gte(services.date, startStr),
          lte(services.date, endStr)
        )
      );
    const completed = Number(completedResult[0]?.count || 0);

    // Para services, todos los registrados se consideran completados
    // No hay estados cancelled o pending en la tabla services
    const cancelled = 0;
    const pending = 0;

    return { total, completed, pending, cancelled };
  }

  private async getClientStats(startDate: Date, endDate: Date) {
    const db = await getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Total de clientes
    const totalResult = await db
      .select({ count: count() })
      .from(clients);
    const total = Number(totalResult[0]?.count || 0);

    // Clientes nuevos en el período
    const newResult = await db
      .select({ count: count() })
      .from(clients)
      .where(
        and(
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
    const db = await getDb();
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    // Total de pianos
    const totalResult = await db
      .select({ count: count() })
      .from(pianos);
    const total = Number(totalResult[0]?.count || 0);

    // Pianos con servicio en el período (pianos distintos en appointments)
    const servicedResult = await db
      .selectDistinct({ pianoId: appointments.pianoId })
      .from(appointments)
      .where(
        and(
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
    const db = await getDb();
    
    // Contar técnicos distintos asignados a trabajos de esta organización
    const result = await (await db)
      .select({ technicianId: workAssignments.technicianId })
      .from(workAssignments);
    
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
