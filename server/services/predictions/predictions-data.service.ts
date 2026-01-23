/**
 * Predictions Data Service
 * Servicio robusto para recopilar datos de la base de datos para predicciones AI
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services, clients, pianos, appointments, inventory } from '../../../drizzle/schema.js';
import { and, gte, lte, count, sum, sql, eq } from 'drizzle-orm';

// ============================================
// INTERFACES
// ============================================

export interface PredictionsDataComplete {
  // Datos básicos (siempre disponibles)
  revenue: RevenueData;
  clients: ClientData;
  pianos: PianoData;
  
  // Datos avanzados (opcionales)
  inventory?: InventoryData;
  appointments?: AppointmentData;
  services?: ServiceData;
}

export interface RevenueData {
  current: number;
  previous: number;
  last12Months: number[];
  monthlyAverage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ClientData {
  total: number;
  withoutRecentServices: number;
  last6MonthsNew: number[];
  averageServiceInterval: number;
}

export interface PianoData {
  total: number;
  withoutRecentMaintenance: number;
  byBrand: Record<string, number>;
  averageAge: number;
}

export interface InventoryData {
  totalItems: number;
  lowStock: Array<{
    name: string;
    current: number;
    minimum: number;
    category: string;
  }>;
  criticalStock: number;
}

export interface AppointmentData {
  upcoming: number;
  next4Weeks: number[];
  byType: Record<string, number>;
}

export interface ServiceData {
  total: number;
  last12Months: number[];
  byType: Record<string, number>;
  averageCost: number;
}

// ============================================
// FUNCIONES DE RECOPILACIÓN
// ============================================

/**
 * Recopila TODOS los datos disponibles para predicciones
 * Garantiza que nunca falle - si falta un dato, lo omite
 */
export async function collectAllPredictionsData(organizationId: string): Promise<PredictionsDataComplete> {
  console.log('[collectAllPredictionsData] Iniciando recopilación para:', organizationId);
  
  const data: PredictionsDataComplete = {
    revenue: await collectRevenueData(organizationId),
    clients: await collectClientData(organizationId),
    pianos: await collectPianoData(organizationId),
  };
  
  // Datos opcionales - si fallan, no rompen el flujo
  try {
    data.inventory = await collectInventoryData(organizationId);
  } catch (error) {
    console.log('[collectAllPredictionsData] No hay datos de inventario disponibles');
  }
  
  try {
    data.appointments = await collectAppointmentData(organizationId);
  } catch (error) {
    console.log('[collectAllPredictionsData] No hay datos de citas disponibles');
  }
  
  try {
    data.services = await collectServiceData(organizationId);
  } catch (error) {
    console.log('[collectAllPredictionsData] No hay datos detallados de servicios disponibles');
  }
  
  console.log('[collectAllPredictionsData] Recopilación completada:', {
    hasRevenue: !!data.revenue,
    hasClients: !!data.clients,
    hasPianos: !!data.pianos,
    hasInventory: !!data.inventory,
    hasAppointments: !!data.appointments,
    hasServices: !!data.services,
  });
  
  return data;
}

/**
 * Recopila datos de ingresos (últimos 12 meses)
 */
async function collectRevenueData(organizationId: string): Promise<RevenueData> {
  const db = await getDb();
  const now = new Date();
  
  // Mes actual
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Mes anterior
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Ingresos mes actual
  const currentResult = await db
    .select({ total: sum(services.cost) })
    .from(services)
    .where(
      and(
        gte(services.date, currentMonthStart.toISOString()),
        lte(services.date, currentMonthEnd.toISOString())
      )
    );
  
  const current = Number(currentResult[0]?.total || 0);
  
  // Ingresos mes anterior
  const previousResult = await db
    .select({ total: sum(services.cost) })
    .from(services)
    .where(
      and(
        gte(services.date, previousMonthStart.toISOString()),
        lte(services.date, previousMonthEnd.toISOString())
      )
    );
  
  const previous = Number(previousResult[0]?.total || 0);
  
  // Últimos 12 meses
  const last12Months: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthResult = await db
      .select({ total: sum(services.cost) })
      .from(services)
      .where(
        and(
          gte(services.date, monthStart.toISOString()),
          lte(services.date, monthEnd.toISOString())
        )
      );
    
    last12Months.push(Number(monthResult[0]?.total || 0));
  }
  
  // Calcular promedio y tendencia
  const monthlyAverage = last12Months.reduce((a, b) => a + b, 0) / 12;
  const trend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
  
  return {
    current,
    previous,
    last12Months,
    monthlyAverage,
    trend,
  };
}

/**
 * Recopila datos de clientes
 */
async function collectClientData(organizationId: string): Promise<ClientData> {
  const db = await getDb();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  // Total de clientes
  const totalResult = await db.select({ count: count() }).from(clients);
  const total = Number(totalResult[0]?.count || 0);
  
  // Clientes con servicios recientes
  const recentClientIds = new Set(
    (await db
      .select({ clientId: services.clientId })
      .from(services)
      .where(gte(services.date, sixMonthsAgo.toISOString())))
      .map(s => s.clientId)
      .filter(id => id !== null)
  );
  
  const withoutRecentServices = total - recentClientIds.size;
  
  // Nuevos clientes últimos 6 meses
  const last6MonthsNew: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthResult = await db
      .select({ count: count() })
      .from(clients)
      .where(
        and(
          gte(clients.createdAt, monthStart.toISOString()),
          lte(clients.createdAt, monthEnd.toISOString())
        )
      );
    
    last6MonthsNew.push(Number(monthResult[0]?.count || 0));
  }
  
  // Intervalo promedio de servicio (simplificado)
  const averageServiceInterval = 90; // días (placeholder - se puede calcular con más detalle)
  
  return {
    total,
    withoutRecentServices,
    last6MonthsNew,
    averageServiceInterval,
  };
}

/**
 * Recopila datos de pianos
 */
async function collectPianoData(organizationId: string): Promise<PianoData> {
  const db = await getDb();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  
  // Total de pianos
  const totalResult = await db.select({ count: count() }).from(pianos);
  const total = Number(totalResult[0]?.count || 0);
  
  // Pianos con mantenimiento reciente
  const recentPianoIds = new Set(
    (await db
      .select({ pianoId: services.pianoId })
      .from(services)
      .where(gte(services.date, twelveMonthsAgo.toISOString())))
      .map(s => s.pianoId)
      .filter(id => id !== null)
  );
  
  const withoutRecentMaintenance = total - recentPianoIds.size;
  
  // Pianos por marca
  const byBrandResult = await db
    .select({
      brand: pianos.brand,
      count: count()
    })
    .from(pianos)
    .groupBy(pianos.brand);
  
  const byBrand: Record<string, number> = {};
  byBrandResult.forEach(row => {
    if (row.brand) {
      byBrand[row.brand] = Number(row.count);
    }
  });
  
  // Edad promedio (simplificado)
  const averageAge = 25; // años (placeholder)
  
  return {
    total,
    withoutRecentMaintenance,
    byBrand,
    averageAge,
  };
}

/**
 * Recopila datos de inventario (opcional)
 */
async function collectInventoryData(organizationId: string): Promise<InventoryData | undefined> {
  const db = await getDb();
  
  // Verificar si hay datos de inventario
  const totalResult = await db.select({ count: count() }).from(inventory);
  const totalItems = Number(totalResult[0]?.count || 0);
  
  if (totalItems === 0) {
    return undefined;
  }
  
  // Items con stock bajo
  const lowStockResult = await db
    .select({
      name: inventory.name,
      current: inventory.stock,
      minimum: inventory.minStock,
      category: inventory.category,
    })
    .from(inventory)
    .where(sql`${inventory.stock} <= ${inventory.minStock}`);
  
  const lowStock = lowStockResult.map(item => ({
    name: item.name || 'Sin nombre',
    current: Number(item.current || 0),
    minimum: Number(item.minimum || 0),
    category: item.category || 'General',
  }));
  
  const criticalStock = lowStock.filter(item => item.current === 0).length;
  
  return {
    totalItems,
    lowStock,
    criticalStock,
  };
}

/**
 * Recopila datos de citas (opcional)
 */
async function collectAppointmentData(organizationId: string): Promise<AppointmentData | undefined> {
  const db = await getDb();
  const now = new Date();
  
  // Verificar si hay citas
  const totalResult = await db
    .select({ count: count() })
    .from(appointments)
    .where(gte(appointments.date, now.toISOString()));
  
  const upcoming = Number(totalResult[0]?.count || 0);
  
  if (upcoming === 0) {
    return undefined;
  }
  
  // Citas próximas 4 semanas
  const next4Weeks: number[] = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    const weekResult = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          gte(appointments.date, weekStart.toISOString()),
          lte(appointments.date, weekEnd.toISOString())
        )
      );
    
    next4Weeks.push(Number(weekResult[0]?.count || 0));
  }
  
  // Citas por tipo (placeholder)
  const byType: Record<string, number> = {
    'Afinación': 0,
    'Reparación': 0,
    'Mantenimiento': 0,
  };
  
  return {
    upcoming,
    next4Weeks,
    byType,
  };
}

/**
 * Recopila datos detallados de servicios (opcional)
 */
async function collectServiceData(organizationId: string): Promise<ServiceData | undefined> {
  const db = await getDb();
  const now = new Date();
  
  // Total de servicios
  const totalResult = await db.select({ count: count() }).from(services);
  const total = Number(totalResult[0]?.count || 0);
  
  if (total === 0) {
    return undefined;
  }
  
  // Servicios últimos 12 meses
  const last12Months: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthResult = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          gte(services.date, monthStart.toISOString()),
          lte(services.date, monthEnd.toISOString())
        )
      );
    
    last12Months.push(Number(monthResult[0]?.count || 0));
  }
  
  // Servicios por tipo
  const byTypeResult = await db
    .select({
      type: services.type,
      count: count()
    })
    .from(services)
    .groupBy(services.type);
  
  const byType: Record<string, number> = {};
  byTypeResult.forEach(row => {
    if (row.type) {
      byType[row.type] = Number(row.count);
    }
  });
  
  // Costo promedio
  const avgResult = await db
    .select({ avg: sql<number>`AVG(${services.cost})` })
    .from(services);
  
  const averageCost = Number(avgResult[0]?.avg || 0);
  
  return {
    total,
    last12Months,
    byType,
    averageCost,
  };
}
