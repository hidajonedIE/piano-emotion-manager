/**
 * Predicciones Matemáticas Simples
 * Basadas ÚNICAMENTE en tablas y columnas que existen en el schema
 */

import { db } from '../../db.js';
import { sql } from 'drizzle-orm';

export interface SimplePredictions {
  revenue: {
    predicted: string;
    confidence: 'high' | 'medium' | 'low';
    trend: 'up' | 'down' | 'stable';
  };
  clientChurn: {
    atRisk: number;
    clients: Array<{ id: number; name: string; daysSince: number }>;
  };
  maintenance: {
    needed: number;
    pianos: Array<{ id: number; brand: string; model: string; daysSince: number }>;
  };
  workload: {
    avgPerWeek: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * Genera predicciones matemáticas simples
 */
export async function generateSimplePredictions(partnerId: number): Promise<SimplePredictions> {
  console.log('[generateSimplePredictions] Iniciando para partnerId:', partnerId);

  // 1. INGRESOS: Promedio de los últimos 3 meses
  const revenueResult = await db.execute(sql`
    SELECT 
      COALESCE(SUM(cost), 0) as total,
      COUNT(*) as count
    FROM services
    WHERE partnerId = ${partnerId}
      AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      AND cost IS NOT NULL
  `);
  
  const totalRevenue = Number(revenueResult[0]?.total || 0);
  const avgMonthly = totalRevenue / 3;
  const predicted = avgMonthly > 1000 
    ? `${(avgMonthly / 1000).toFixed(1)}k€`
    : `${Math.round(avgMonthly)}€`;

  // 2. CLIENTES EN RIESGO: Sin servicios en más de 180 días
  const churnResult = await db.execute(sql`
    SELECT 
      c.id,
      c.name,
      DATEDIFF(NOW(), MAX(s.date)) as daysSince
    FROM clients c
    INNER JOIN pianos p ON p.clientId = c.id
    INNER JOIN services s ON s.pianoId = p.id
    WHERE c.partnerId = ${partnerId}
    GROUP BY c.id, c.name
    HAVING daysSince > 180
    ORDER BY daysSince DESC
    LIMIT 20
  `);

  const clientsAtRisk = churnResult.map((row: any) => ({
    id: row.id,
    name: row.name,
    daysSince: row.daysSince
  }));

  // 3. MANTENIMIENTO: Pianos sin servicio en más de 150 días
  const maintenanceResult = await db.execute(sql`
    SELECT 
      p.id,
      p.brand,
      p.model,
      DATEDIFF(NOW(), MAX(s.date)) as daysSince
    FROM pianos p
    INNER JOIN services s ON s.pianoId = p.id
    INNER JOIN clients c ON c.id = p.clientId
    WHERE c.partnerId = ${partnerId}
    GROUP BY p.id, p.brand, p.model
    HAVING daysSince > 150
    ORDER BY daysSince DESC
    LIMIT 20
  `);

  const pianosNeedingMaintenance = maintenanceResult.map((row: any) => ({
    id: row.id,
    brand: row.brand || 'Desconocido',
    model: row.model || '',
    daysSince: row.daysSince
  }));

  // 4. CARGA DE TRABAJO: Promedio de servicios por semana (últimas 8 semanas)
  const workloadResult = await db.execute(sql`
    SELECT 
      COUNT(*) as total
    FROM services
    WHERE partnerId = ${partnerId}
      AND date >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
  `);

  const totalServices = Number(workloadResult[0]?.total || 0);
  const avgPerWeek = totalServices / 8;

  console.log('[generateSimplePredictions] Predicciones generadas:', {
    revenue: predicted,
    clientsAtRisk: clientsAtRisk.length,
    pianosNeedingMaintenance: pianosNeedingMaintenance.length,
    avgPerWeek
  });

  return {
    revenue: {
      predicted,
      confidence: totalRevenue > 0 ? 'high' : 'low',
      trend: 'stable'
    },
    clientChurn: {
      atRisk: clientsAtRisk.length,
      clients: clientsAtRisk
    },
    maintenance: {
      needed: pianosNeedingMaintenance.length,
      pianos: pianosNeedingMaintenance
    },
    workload: {
      avgPerWeek: Math.round(avgPerWeek * 10) / 10,
      trend: 'stable'
    }
  };
}
