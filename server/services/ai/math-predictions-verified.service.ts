/**
 * Predicciones Matemáticas - Versión Verificada
 * Usa ÚNICAMENTE columnas que existen en el schema real de la BD
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

export interface MathPredictions {
  revenue: {
    predictions: Array<{
      period: string;
      value: number;
      confidence: 'high' | 'medium' | 'low';
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
      brand: string;
      model: string;
      daysSinceLastService: number;
      predictedDate: string;
      urgency: 'urgent' | 'soon' | 'normal';
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
    predictions: any[];
  };
}

/**
 * Genera predicciones matemáticas basadas en datos históricos
 */
export async function generateMathPredictions(partnerId: number): Promise<MathPredictions> {
  console.log('[generateMathPredictions] Iniciando para partnerId:', partnerId);

  try {
    const [revenue, clientChurn, maintenance, workload, inventory] = await Promise.all([
      predictRevenue(partnerId),
      predictClientChurn(partnerId),
      predictMaintenance(partnerId),
      predictWorkload(partnerId),
      predictInventory(partnerId)
    ]);

    return {
      revenue,
      clientChurn,
      maintenance,
      workload,
      inventory
    };
  } catch (error) {
    console.error('[generateMathPredictions] Error:', error);
    throw error;
  }
}

/**
 * 1. INGRESOS: Predicción basada en promedio de últimos 3 meses
 */
async function predictRevenue(partnerId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Obtener ingresos de los últimos 6 meses
    const result = await db.execute(sql`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(cost) as total,
        COUNT(*) as count
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND cost IS NOT NULL
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `);

    const monthlyData = (result as any)[0] || [];
    
    if (monthlyData.length === 0) {
      return {
        predictions: [{
          period: 'Próximo mes',
          value: 0,
          confidence: 'low' as const,
          trend: 'stable' as const,
          factors: ['Sin datos históricos suficientes']
        }]
      };
    }

    // Calcular promedio y tendencia
    const totals = monthlyData.map((m: any) => Number(m.total || 0));
    const avg = totals.reduce((a: number, b: number) => a + b, 0) / totals.length;
    
    // Tendencia simple: comparar últimos 2 meses con primeros 2 meses
    const recent = totals.slice(-2).reduce((a: number, b: number) => a + b, 0) / 2;
    const older = totals.slice(0, 2).reduce((a: number, b: number) => a + b, 0) / 2;
    const trend = recent > older * 1.1 ? 'up' : recent < older * 0.9 ? 'down' : 'stable';

    const predictions = [];
    
    // Predicción para próximo mes
    predictions.push({
      period: 'Próximo mes',
      value: Math.round(avg),
      confidence: monthlyData.length >= 3 ? 'high' as const : 'medium' as const,
      trend: trend as 'up' | 'down' | 'stable',
      factors: [
        `Basado en promedio de ${monthlyData.length} meses`,
        `Tendencia ${trend === 'up' ? 'creciente' : trend === 'down' ? 'decreciente' : 'estable'}`
      ]
    });

    // Predicción para próximos 3 meses
    predictions.push({
      period: 'Próximos 3 meses',
      value: Math.round(avg * 3),
      confidence: 'medium' as const,
      trend: trend as 'up' | 'down' | 'stable',
      factors: [`Proyección basada en promedio mensual de ${Math.round(avg)}€`]
    });

    return { predictions };
  } catch (error) {
    console.error('[predictRevenue] Error:', error);
    return { predictions: [] };
  }
}

/**
 * 2. CLIENTES EN RIESGO: Sin servicios en más de 180 días
 */
async function predictClientChurn(partnerId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.execute(sql`
      SELECT 
        c.id as clientId,
        c.name as clientName,
        MAX(s.date) as lastService,
        DATEDIFF(NOW(), MAX(s.date)) as daysSinceLastService,
        COUNT(s.id) as totalServices
      FROM clients c
      INNER JOIN pianos p ON p.clientId = c.id
      INNER JOIN services s ON s.pianoId = p.id
      WHERE c.partnerId = ${partnerId}
      GROUP BY c.id, c.name
      HAVING daysSinceLastService > 180
      ORDER BY daysSinceLastService DESC
      LIMIT 50
    `);

    const clientsData = (result as any)[0] || [];
    
    const topRiskClients = clientsData.map((row: any) => {
      const days = Number(row.daysSinceLastService || 0);
      
      // Calcular riesgo basado en días
      let riskScore = 0;
      if (days > 730) riskScore = 95;
      else if (days > 540) riskScore = 85;
      else if (days > 365) riskScore = 70;
      else if (days > 270) riskScore = 50;
      else riskScore = 30;
      
      let reason = '';
      if (days > 730) reason = `Sin servicio desde hace ${Math.round(days / 365)} años`;
      else if (days > 365) reason = `Sin servicio desde hace más de 1 año`;
      else reason = `${days} días desde último servicio`;
      
      return {
        clientId: Number(row.clientId),
        clientName: String(row.clientName),
        riskScore,
        lastService: row.lastService ? new Date(row.lastService).toISOString().slice(0, 10) : '',
        daysSinceLastService: days,
        reason
      };
    });

    return { topRiskClients };
  } catch (error) {
    console.error('[predictClientChurn] Error:', error);
    return { topRiskClients: [] };
  }
}

/**
 * 3. MANTENIMIENTO: Pianos que necesitan servicio pronto
 */
async function predictMaintenance(partnerId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.execute(sql`
      SELECT 
        p.id as pianoId,
        p.brand,
        p.model,
        c.name as clientName,
        MAX(s.date) as lastService,
        DATEDIFF(NOW(), MAX(s.date)) as daysSinceLastService,
        p.tuningIntervalDays
      FROM pianos p
      INNER JOIN clients c ON c.id = p.clientId
      INNER JOIN services s ON s.pianoId = p.id
      WHERE c.partnerId = ${partnerId}
      GROUP BY p.id, p.brand, p.model, c.name, p.tuningIntervalDays
      HAVING daysSinceLastService > 150
      ORDER BY daysSinceLastService DESC
      LIMIT 50
    `);

    const pianosData = (result as any)[0] || [];
    
    const predictions = pianosData.map((row: any) => {
      const days = Number(row.daysSinceLastService || 0);
      const interval = Number(row.tuningIntervalDays || 180);
      
      // Calcular urgencia
      let urgency: 'urgent' | 'soon' | 'normal' = 'normal';
      if (days > interval * 1.5) urgency = 'urgent';
      else if (days > interval * 1.2) urgency = 'soon';
      
      // Fecha predicha: último servicio + intervalo
      const lastServiceDate = new Date(row.lastService);
      const predictedDate = new Date(lastServiceDate);
      predictedDate.setDate(predictedDate.getDate() + interval);
      
      let reason = '';
      if (days > interval * 1.5) reason = `Mantenimiento urgente: ${days} días sin servicio`;
      else if (days > interval) reason = `Mantenimiento necesario pronto`;
      else reason = `Próximo mantenimiento en ${interval - days} días`;
      
      return {
        pianoId: Number(row.pianoId),
        clientName: String(row.clientName),
        brand: String(row.brand || 'Desconocido'),
        model: String(row.model || ''),
        daysSinceLastService: days,
        predictedDate: predictedDate.toISOString().slice(0, 10),
        urgency,
        reason
      };
    });

    return { predictions };
  } catch (error) {
    console.error('[predictMaintenance] Error:', error);
    return { predictions: [] };
  }
}

/**
 * 4. CARGA DE TRABAJO: Predicción de servicios por semana
 */
async function predictWorkload(partnerId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Obtener servicios de las últimas 8 semanas
    const result = await db.execute(sql`
      SELECT 
        YEARWEEK(date, 1) as week,
        COUNT(*) as count
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY YEARWEEK(date, 1)
      ORDER BY week ASC
    `);

    const weeklyData = (result as any)[0] || [];
    console.log('[predictWorkload] weeklyData length:', weeklyData.length);
    
    if (weeklyData.length === 0) {
      return {
        predictions: [{
          week: 'Próxima semana',
          scheduled: 0,
          estimated: 0,
          recommendation: 'Sin datos históricos suficientes'
        }]
      };
    }

    // Calcular promedio
    const counts = weeklyData.map((w: any) => Number(w.count || 0));
    const avg = counts.reduce((a: number, b: number) => a + b, 0) / counts.length;
    
    const predictions = [];
    
    // Predicción para próxima semana
    predictions.push({
      week: 'Próxima semana',
      scheduled: 0, // No tenemos datos de citas programadas en este servicio
      estimated: Math.round(avg),
      recommendation: `Se estiman ${Math.round(avg)} servicios basado en promedio histórico`
    });

    // Predicción para próximas 4 semanas
    for (let i = 2; i <= 4; i++) {
      predictions.push({
        week: `Semana +${i}`,
        scheduled: 0,
        estimated: Math.round(avg),
        recommendation: `Carga estimada: ${Math.round(avg)} servicios`
      });
    }

    return { predictions };
  } catch (error) {
    console.error('[predictWorkload] Error:', error);
    return { predictions: [] };
  }
}

/**
 * 5. INVENTARIO: Items con stock bajo
 */
async function predictInventory(partnerId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Obtener items con stock por debajo del mínimo
    const result = await db.execute(sql`
      SELECT 
        name as itemName,
        quantity as currentStock,
        minStock,
        (minStock - quantity) as deficit
      FROM inventory
      WHERE partnerId = ${partnerId}
        AND quantity < minStock
      ORDER BY (minStock - quantity) DESC
      LIMIT 20
    `);

    const inventoryData = (result as any)[0] || [];
    console.log('[predictInventory] inventoryData length:', inventoryData.length);
    
    const predictions = inventoryData.map((row: any) => {
      const deficit = Number(row.deficit || 0);
      const currentStock = Number(row.currentStock || 0);
      const minStock = Number(row.minStock || 0);
      
      return {
        itemName: String(row.itemName),
        currentStock,
        minStock,
        deficit,
        urgency: deficit > minStock * 0.5 ? 'urgent' : deficit > minStock * 0.3 ? 'soon' : 'normal',
        recommendation: `Reabastecer ${deficit} unidades`
      };
    });

    console.log('[predictInventory] Returning predictions:', predictions.length);
    return { predictions };
  } catch (error) {
    console.error('[predictInventory] Error:', error);
    return { predictions: [] };
  }
}
