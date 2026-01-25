/**
 * Mathematical Predictions Service
 * Predicciones basadas en algoritmos matemáticos puros (sin IA)
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services, clients, pianos, appointments, inventory } from '../../../drizzle/schema.js';
import { and, gte, lte, count, sum, sql, desc, eq } from 'drizzle-orm';
import { cacheService } from '../../lib/cache.service.js';

// ============================================
// INTERFACES
// ============================================

export interface BusinessDataOptimized {
  revenue: {
    last12Months: number[];
    monthlyAverage: number;
  };
  services: {
    total: number;
    last12Months: number[];
  };
  clients: {
    total: number;
    active: number;
  };
}

export interface AIPredictionsEnhanced {
  revenue: {
    predictions: Array<{
      period: string;
      value: number;
      confidence: number;
      trend: 'up' | 'down' | 'stable';
      factors: string[];
    }>;
  };
  clientChurn: {
    topRiskClients: Array<{
      clientId: number;
      clientName: string;
      riskScore: number;
      lastService: string;
      daysSinceLastService: number;
      reason: string;
    }>;
  };
  maintenance: {
    predictions: Array<{
      pianoId: number;
      clientName: string;
      pianoInfo: string;
      lastService: string;
      predictedDate: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>;
  };
  workload: {
    predictions: Array<{
      week: string;
      scheduled: number;
      estimated: number;
      recommendation: string;
    }>;
  };
  inventory: {
    predictions: Array<{
      itemName: string;
      currentStock: number;
      predictedDemand: number;
      recommendedOrder: number;
      urgency: 'high' | 'medium' | 'low';
    }>;
  };
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Recopila datos de la BD de forma optimizada
 */
export async function collectBusinessDataOptimized(partnerId: string): Promise<BusinessDataOptimized> {
  const cacheKey = `business-data:${partnerId}`;
  try {
    const cached = await cacheService.get<BusinessDataOptimized>(cacheKey);
    if (cached) {
      console.log('[collectBusinessDataOptimized] ✅ Datos obtenidos del caché');
      return cached;
    }
  } catch (cacheError) {
    console.warn('[collectBusinessDataOptimized] ⚠️  Error al leer caché:', cacheError);
  }
  
  console.log('[collectBusinessDataOptimized] Cache MISS, consultando base de datos...');
  
  const db = await getDb();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  
  try {
    // Ingresos de los últimos 12 meses
    const revenueQuery = sql`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COALESCE(SUM(cost), 0) as total
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= ${twelveMonthsAgo.toISOString()}
        AND date <= ${now.toISOString()}
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const revenueResult = await db.execute(revenueQuery);
    const revenueByMonth = (revenueResult[0] as any[]).reduce((acc: any, row: any) => {
      acc[row.month] = Number(row.total || 0);
      return acc;
    }, {});
    
    const last12MonthsRevenue: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      last12MonthsRevenue.push(revenueByMonth[monthKey] || 0);
    }
    
    const monthlyAverage = last12MonthsRevenue.reduce((a, b) => a + b, 0) / 12;
    
    // Servicios de los últimos 12 meses
    const servicesQuery = sql`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= ${twelveMonthsAgo.toISOString()}
        AND date <= ${now.toISOString()}
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const servicesResult = await db.execute(servicesQuery);
    const servicesByMonth = (servicesResult[0] as any[]).reduce((acc: any, row: any) => {
      acc[row.month] = Number(row.total || 0);
      return acc;
    }, {});
    
    const last12MonthsServices: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      last12MonthsServices.push(servicesByMonth[monthKey] || 0);
    }
    
    // Clientes totales y activos
    const clientsQuery = sql`
      SELECT 
        COUNT(DISTINCT c.id) as total,
        COUNT(DISTINCT CASE 
          WHEN s.date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) 
          THEN c.id 
        END) as active
      FROM clients c
      LEFT JOIN pianos p ON p.clientId = c.id
      LEFT JOIN services s ON s.pianoId = p.id
      WHERE c.partnerId = ${partnerId}
    `;
    
    const clientsResult = await db.execute(clientsQuery);
    const clientsData = (clientsResult[0] as any[])[0];
    
    const businessData: BusinessDataOptimized = {
      revenue: {
        last12Months: last12MonthsRevenue,
        monthlyAverage,
      },
      services: {
        total: last12MonthsServices.reduce((a, b) => a + b, 0),
        last12Months: last12MonthsServices,
      },
      clients: {
        total: Number(clientsData.total || 0),
        active: Number(clientsData.active || 0),
      },
    };
    
    // Guardar en caché (1 hora)
    try {
      await cacheService.set(cacheKey, businessData, 3600);
    } catch (cacheError) {
      console.warn('[collectBusinessDataOptimized] ⚠️  Error al guardar en caché:', cacheError);
    }
    
    return businessData;
  } catch (error) {
    console.error('[collectBusinessDataOptimized] ❌ Error:', error);
    throw error;
  }
}

/**
 * Genera predicciones usando algoritmos matemáticos
 */
export async function generateMathPredictions(
  businessData: BusinessDataOptimized,
  partnerId: string
): Promise<AIPredictionsEnhanced> {
  const cacheKey = `math-predictions:${partnerId}`;
  try {
    const cached = await cacheService.get<AIPredictionsEnhanced>(cacheKey);
    if (cached) {
      console.log('[generateMathPredictions] ✅ Predicciones obtenidas del caché');
      return cached;
    }
  } catch (cacheError) {
    console.warn('[generateMathPredictions] ⚠️  Error al leer caché:', cacheError);
  }
  
  console.log('[generateMathPredictions] Generando predicciones matemáticas...');
  
  const predictions: AIPredictionsEnhanced = {
    revenue: await predictRevenue(businessData),
    clientChurn: await predictClientChurn(partnerId),
    maintenance: await predictMaintenance(partnerId),
    workload: await predictWorkload(partnerId),
    inventory: await predictInventory(partnerId),
  };
  
  // Guardar en caché (30 minutos)
  try {
    await cacheService.set(cacheKey, predictions, 1800);
  } catch (cacheError) {
    console.warn('[generateMathPredictions] ⚠️  Error al guardar en caché:', cacheError);
  }
  
  return predictions;
}

/**
 * Predice ingresos usando regresión lineal simple + estacionalidad
 */
async function predictRevenue(businessData: BusinessDataOptimized) {
  const { last12Months, monthlyAverage } = businessData.revenue;
  
  // Calcular tendencia lineal (regresión simple)
  const n = last12Months.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += last12Months[i];
    sumXY += i * last12Months[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calcular estacionalidad (promedio de cada mes vs promedio general)
  const seasonality: number[] = [];
  for (let i = 0; i < 12; i++) {
    seasonality[i] = last12Months[i] / monthlyAverage || 1;
  }
  
  // Generar predicciones para los próximos 6 meses
  const predictions = [];
  const now = new Date();
  
  for (let i = 1; i <= 6; i++) {
    const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthIndex = futureMonth.getMonth();
    const trendValue = slope * (n + i - 1) + intercept;
    const seasonalFactor = seasonality[monthIndex] || 1;
    const predictedValue = Math.max(0, trendValue * seasonalFactor);
    
    // Determinar tendencia
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (slope > monthlyAverage * 0.05) trend = 'up';
    else if (slope < -monthlyAverage * 0.05) trend = 'down';
    
    // Factores
    const factors = [];
    if (trend === 'up') factors.push('Tendencia de crecimiento histórica');
    if (trend === 'down') factors.push('Tendencia de decrecimiento histórica');
    if (seasonalFactor > 1.1) factors.push('Mes de alta temporada');
    if (seasonalFactor < 0.9) factors.push('Mes de baja temporada');
    if (factors.length === 0) factors.push('Basado en promedio histórico');
    
    predictions.push({
      period: futureMonth.toISOString().slice(0, 7),
      value: Math.round(predictedValue),
      confidence: 75,
      trend,
      factors,
    });
  }
  
  return { predictions };
}

/**
 * Predice riesgo de churn basado en días desde último servicio
 */
async function predictClientChurn(partnerId: string) {
  const db = await getDb();
  
  // Obtener clientes con su último servicio
  const query = sql`
    SELECT 
      c.id as clientId,
      c.name as clientName,
      MAX(s.date) as lastService,
      DATEDIFF(NOW(), MAX(s.date)) as daysSinceLastService,
      COUNT(s.id) as totalServices,
      AVG(DATEDIFF(s2.date, s1.date)) as avgInterval
    FROM clients c
    LEFT JOIN pianos p ON p.clientId = c.id
    LEFT JOIN services s ON s.pianoId = p.id
    LEFT JOIN services s1 ON s1.pianoId = p.id
    LEFT JOIN services s2 ON s2.pianoId = p.id AND s2.date > s1.date
    WHERE c.partnerId = ${partnerId}
      AND c.isActive = 1
    GROUP BY c.id, c.name
    HAVING lastService IS NOT NULL
      AND daysSinceLastService > 180
    ORDER BY daysSinceLastService DESC
    LIMIT 50
  `;
  
  const result = await db.execute(query);
  const clientsData = result[0] as any[];
  
  const topRiskClients = clientsData.map((row: any) => {
    const days = Number(row.daysSinceLastService || 0);
    const avgInterval = Number(row.avgInterval || 365);
    
    // Calcular riesgo: días desde último servicio / intervalo promedio
    const riskScore = Math.min(100, Math.round((days / avgInterval) * 100));
    
    let reason = '';
    if (days > 730) reason = `Sin servicio desde hace ${Math.round(days / 365)} años`;
    else if (days > 365) reason = `Sin servicio desde hace más de 1 año`;
    else reason = `${days} días desde último servicio (promedio: ${Math.round(avgInterval)} días)`;
    
    return {
      clientId: Number(row.clientId),
      clientName: String(row.clientName),
      riskScore,
      lastService: row.lastService ? new Date(row.lastService).toISOString().slice(0, 10) : '',
      daysSinceLastService: days,
      reason,
    };
  });
  
  return { topRiskClients };
}

/**
 * Predice mantenimientos basado en intervalos históricos
 */
async function predictMaintenance(partnerId: string) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      p.id as pianoId,
      c.name as clientName,
      CONCAT(p.brand, ' ', p.model) as pianoInfo,
      MAX(s.date) as lastService,
      DATEDIFF(NOW(), MAX(s.date)) as daysSinceLastService,
      AVG(DATEDIFF(s2.date, s1.date)) as avgInterval
    FROM pianos p
    INNER JOIN clients c ON c.id = p.clientId
    LEFT JOIN services s ON s.pianoId = p.id
    LEFT JOIN services s1 ON s1.pianoId = p.id
    LEFT JOIN services s2 ON s2.pianoId = p.id AND s2.date > s1.date
    WHERE c.partnerId = ${partnerId}
      AND p.isActive = 1
    GROUP BY p.id, c.name, p.brand, p.model
    HAVING lastService IS NOT NULL
      AND daysSinceLastService > (avgInterval * 0.8)
    ORDER BY daysSinceLastService DESC
    LIMIT 50
  `;
  
  const result = await db.execute(query);
  const pianosData = result[0] as any[];
  
  const predictions = pianosData.map((row: any) => {
    const days = Number(row.daysSinceLastService || 0);
    const avgInterval = Number(row.avgInterval || 365);
    const lastServiceDate = new Date(row.lastService);
    const predictedDate = new Date(lastServiceDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (days > avgInterval * 1.2) priority = 'high';
    else if (days > avgInterval) priority = 'medium';
    
    const reason = `Intervalo promedio: ${Math.round(avgInterval)} días. Ya pasaron ${days} días.`;
    
    return {
      pianoId: Number(row.pianoId),
      clientName: String(row.clientName),
      pianoInfo: String(row.pianoInfo),
      lastService: lastServiceDate.toISOString().slice(0, 10),
      predictedDate: predictedDate.toISOString().slice(0, 10),
      priority,
      reason,
    };
  });
  
  return { predictions };
}

/**
 * Predice carga de trabajo basado en promedio histórico
 */
async function predictWorkload(partnerId: string) {
  const db = await getDb();
  
  // Obtener servicios de las últimas 12 semanas
  const query = sql`
    SELECT 
      YEARWEEK(date, 1) as week,
      COUNT(*) as total
    FROM services
    WHERE partnerId = ${partnerId}
      AND date >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
    GROUP BY YEARWEEK(date, 1)
    ORDER BY week ASC
  `;
  
  const result = await db.execute(query);
  const weeksData = result[0] as any[];
  
  const weeklyAverage = weeksData.length > 0
    ? weeksData.reduce((sum: number, row: any) => sum + Number(row.total), 0) / weeksData.length
    : 5;
  
  // Predecir próximas 4 semanas
  const predictions = [];
  const now = new Date();
  
  for (let i = 1; i <= 4; i++) {
    const futureDate = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(futureDate);
    weekStart.setDate(futureDate.getDate() - futureDate.getDay() + 1);
    
    const estimated = Math.round(weeklyAverage);
    
    let recommendation = '';
    if (estimated > 15) recommendation = 'Semana de alta carga. Considerar apoyo adicional.';
    else if (estimated > 10) recommendation = 'Carga normal. Planificar con anticipación.';
    else recommendation = 'Carga baja. Oportunidad para tareas administrativas.';
    
    predictions.push({
      week: weekStart.toISOString().slice(0, 10),
      scheduled: 0, // Se llenará con datos reales de appointments
      estimated,
      recommendation,
    });
  }
  
  return { predictions };
}

/**
 * Predice demanda de inventario basado en consumo histórico
 */
async function predictInventory(partnerId: string) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      i.name as itemName,
      i.quantity as currentStock,
      COALESCE(AVG(im.quantityUsed), 0) as avgUsage
    FROM inventory i
    LEFT JOIN inventory_movements im ON im.inventoryId = i.id
      AND im.type = 'out'
      AND im.createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    WHERE i.partnerId = ${partnerId}
      AND i.isActive = 1
    GROUP BY i.id, i.name, i.quantity
    HAVING avgUsage > 0
    ORDER BY (avgUsage * 4 - currentStock) DESC
    LIMIT 20
  `;
  
  const result = await db.execute(query);
  const inventoryData = result[0] as any[];
  
  const predictions = inventoryData.map((row: any) => {
    const currentStock = Number(row.currentStock || 0);
    const avgUsage = Number(row.avgUsage || 0);
    const predictedDemand = Math.round(avgUsage * 4); // Próximos 4 meses
    const recommendedOrder = Math.max(0, predictedDemand - currentStock);
    
    let urgency: 'high' | 'medium' | 'low' = 'low';
    if (currentStock < avgUsage * 2) urgency = 'high';
    else if (currentStock < avgUsage * 4) urgency = 'medium';
    
    return {
      itemName: String(row.itemName),
      currentStock,
      predictedDemand,
      recommendedOrder,
      urgency,
    };
  });
  
  return { predictions };
}
