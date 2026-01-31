/**
 * Servicio de Analíticas Avanzadas
 * Calcula métricas, estadísticas y tendencias para el negocio
 */

import { Client, Piano, Service } from '@/types';
import { Appointment } from '@/types/business';

// Tipos para las métricas
export interface KPIMetrics {
  totalRevenue: number;
  totalServices: number;
  totalClients: number;
  totalPianos: number;
  averageServicePrice: number;
  clientRetentionRate: number;
  newClientsThisMonth: number;
  servicesThisMonth: number;
  revenueThisMonth: number;
  revenueGrowth: number; // Porcentaje de crecimiento vs mes anterior
}

export interface MonthlyData {
  month: string; // "2024-01"
  label: string; // "Ene 2024"
  revenue: number;
  services: number;
  newClients: number;
}

export interface ServiceTypeStats {
  type: string;
  label: string;
  count: number;
  revenue: number;
  percentage: number;
  averagePrice: number;
}

export interface ClientStats {
  id: string;
  name: string;
  totalServices: number;
  totalSpent: number;
  lastServiceDate: string;
  pianoCount: number;
}

export interface PianoStats {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  kpis: KPIMetrics;
  monthlyTrend: MonthlyData[];
  serviceTypeStats: ServiceTypeStats[];
  topClients: ClientStats[];
  pianoDistribution: PianoStats[];
  upcomingAppointments: number;
  pendingInvoices: number;
}

// Etiquetas de tipos de servicio
const SERVICE_TYPE_LABELS: Record<string, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  maintenance: 'Mantenimiento',
  regulation: 'Regulación',
  voicing: 'Armonización',
  restoration: 'Restauración',
  appraisal: 'Tasación',
  moving: 'Transporte',
  other: 'Otros',
};

// Etiquetas de categorías de piano
const PIANO_CATEGORY_LABELS: Record<string, string> = {
  vertical: 'Vertical',
  grand: 'De Cola',
  digital: 'Digital',
  organ: 'Órgano',
  other: 'Otros',
};

// Nombres de meses en español
const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Obtiene el mes en formato "YYYY-MM"
 */
function getMonthKey(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Obtiene la etiqueta del mes (ej: "Ene 2024")
 */
function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}

/**
 * Calcula los KPIs principales
 */
export function calculateKPIs(
  clients: Client[],
  services: Service[],
  pianos: Piano[]
): KPIMetrics {
  const now = new Date();
  const currentMonth = getMonthKey(now);
  const lastMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  // Filtrar servicios por mes
  const servicesThisMonth = services.filter(s => getMonthKey(s.date) === currentMonth);
  const servicesLastMonth = services.filter(s => getMonthKey(s.date) === lastMonth);

  // Calcular ingresos
  const totalRevenue = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const revenueThisMonth = servicesThisMonth.reduce((sum, s) => sum + (s.cost || 0), 0);
  const revenueLastMonth = servicesLastMonth.reduce((sum, s) => sum + (s.cost || 0), 0);

  // Calcular crecimiento
  const revenueGrowth = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : 0;

  // Clientes nuevos este mes (basado en fecha de creación si existe, o primer servicio)
  const clientFirstService = new Map<string, string>();
  services.forEach(s => {
    if (!clientFirstService.has(s.clientId) || s.date < clientFirstService.get(s.clientId)!) {
      clientFirstService.set(s.clientId, s.date);
    }
  });
  
  const newClientsThisMonth = Array.from(clientFirstService.entries())
    .filter(([_, date]) => getMonthKey(date) === currentMonth)
    .length;

  // Tasa de retención (clientes con más de 1 servicio / total clientes con servicios)
  const clientServiceCount = new Map<string, number>();
  services.forEach(s => {
    clientServiceCount.set(s.clientId, (clientServiceCount.get(s.clientId) || 0) + 1);
  });
  const clientsWithServices = clientServiceCount.size;
  const returningClients = Array.from(clientServiceCount.values()).filter(count => count > 1).length;
  const clientRetentionRate = clientsWithServices > 0
    ? (returningClients / clientsWithServices) * 100
    : 0;

  // Precio medio de servicio
  const servicesWithPrice = services.filter(s => s.cost && s.cost > 0);
  const averageServicePrice = servicesWithPrice.length > 0
    ? servicesWithPrice.reduce((sum, s) => sum + (s.cost || 0), 0) / servicesWithPrice.length
    : 0;

  return {
    totalRevenue,
    totalServices: services.length,
    totalClients: clients.length,
    totalPianos: pianos.length,
    averageServicePrice,
    clientRetentionRate,
    newClientsThisMonth,
    servicesThisMonth: servicesThisMonth.length,
    revenueThisMonth,
    revenueGrowth,
  };
}

/**
 * Calcula la tendencia mensual de los últimos 12 meses
 */
export function calculateMonthlyTrend(
  services: Service[],
  clients: Client[],
  months: number = 12
): MonthlyData[] {
  const now = new Date();
  const result: MonthlyData[] = [];

  // Crear mapa de primer servicio por cliente
  const clientFirstService = new Map<string, string>();
  services.forEach(s => {
    if (!clientFirstService.has(s.clientId) || s.date < clientFirstService.get(s.clientId)!) {
      clientFirstService.set(s.clientId, s.date);
    }
  });

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(date);
    
    const monthServices = services.filter(s => getMonthKey(s.date) === monthKey);
    const revenue = monthServices.reduce((sum, s) => sum + (s.cost || 0), 0);
    
    const newClients = Array.from(clientFirstService.entries())
      .filter(([_, firstDate]) => getMonthKey(firstDate) === monthKey)
      .length;

    result.push({
      month: monthKey,
      label: getMonthLabel(monthKey),
      revenue,
      services: monthServices.length,
      newClients,
    });
  }

  return result;
}

/**
 * Calcula estadísticas por tipo de servicio
 */
export function calculateServiceTypeStats(services: Service[]): ServiceTypeStats[] {
  const typeMap = new Map<string, { count: number; revenue: number }>();

  services.forEach(s => {
    const current = typeMap.get(s.type) || { count: 0, revenue: 0 };
    typeMap.set(s.type, {
      count: current.count + 1,
      revenue: current.revenue + (s.cost || 0),
    });
  });

  const total = services.length;
  const result: ServiceTypeStats[] = [];

  typeMap.forEach((stats, type) => {
    result.push({
      type,
      label: SERVICE_TYPE_LABELS[type] || type,
      count: stats.count,
      revenue: stats.revenue,
      percentage: total > 0 ? (stats.count / total) * 100 : 0,
      averagePrice: stats.count > 0 ? stats.revenue / stats.count : 0,
    });
  });

  // Ordenar por cantidad descendente
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Obtiene los top clientes por gasto total
 */
export function getTopClients(
  clients: Client[],
  services: Service[],
  pianos: Piano[],
  limit: number = 10
): ClientStats[] {
  const clientStats = new Map<string, {
    totalServices: number;
    totalSpent: number;
    lastServiceDate: string;
  }>();

  services.forEach(s => {
    const current = clientStats.get(s.clientId) || {
      totalServices: 0,
      totalSpent: 0,
      lastServiceDate: '',
    };
    
    clientStats.set(s.clientId, {
      totalServices: current.totalServices + 1,
      totalSpent: current.totalSpent + (s.cost || 0),
      lastServiceDate: s.date > current.lastServiceDate ? s.date : current.lastServiceDate,
    });
  });

  const result: ClientStats[] = [];

  clients.forEach(client => {
    const stats = clientStats.get(client.id);
    if (stats) {
      const pianoCount = pianos.filter(p => p.clientId === client.id).length;
      const name = client.type === 'company' 
        ? client.companyName || 'Sin nombre'
        : `${client.firstName} ${client.lastName}`.trim() || 'Sin nombre';
      
      result.push({
        id: client.id,
        name,
        totalServices: stats.totalServices,
        totalSpent: stats.totalSpent,
        lastServiceDate: stats.lastServiceDate,
        pianoCount,
      });
    }
  });

  // Ordenar por gasto total descendente
  return result.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
}

/**
 * Calcula la distribución de pianos por categoría
 */
export function calculatePianoDistribution(pianos: Piano[]): PianoStats[] {
  const categoryMap = new Map<string, number>();

  pianos.forEach(p => {
    categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
  });

  const total = pianos.length;
  const result: PianoStats[] = [];

  categoryMap.forEach((count, category) => {
    result.push({
      category,
      label: PIANO_CATEGORY_LABELS[category] || category,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    });
  });

  // Ordenar por cantidad descendente
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Calcula todas las analíticas
 */
export function calculateAllAnalytics(
  clients: Client[],
  services: Service[],
  pianos: Piano[],
  appointments: Appointment[] = []
): AnalyticsData {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Citas pendientes (futuras y no canceladas)
  const upcomingAppointments = appointments.filter(
    a => a.date >= today && a.status !== 'cancelled'
  ).length;

  return {
    kpis: calculateKPIs(clients, services, pianos),
    monthlyTrend: calculateMonthlyTrend(services, clients),
    serviceTypeStats: calculateServiceTypeStats(services),
    topClients: getTopClients(clients, services, pianos),
    pianoDistribution: calculatePianoDistribution(pianos),
    upcomingAppointments,
    pendingInvoices: calculatePendingInvoices(services),
  };
}

/**
 * Calcula el número de facturas pendientes basado en servicios completados sin facturar
 */
function calculatePendingInvoices(services: Service[]): number {
  // Contar servicios completados que no tienen factura asociada
  const completedServices = services.filter(s => 
    s.status === 'completed' && !s.invoiceId
  );
  
  return completedServices.length;
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Formatea una fecha corta
 */
export function formatShortDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
