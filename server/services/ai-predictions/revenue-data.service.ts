/**
 * Revenue Data Service - Nuevo desde cero
 * Compatible 100% con esquema actual de TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services } from '../../../drizzle/schema.js';
import { gte, sql, sum, count, desc } from 'drizzle-orm';

export interface RevenueData {
  historical: {
    month: string;
    total: number;
    count: number;
  }[];
  current: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Obtiene datos de ingresos de los últimos 12 meses
 */
export async function getRevenueData(organizationId?: number): Promise<RevenueData> {
  const db = await getDb();
  
  // Calcular fecha de hace 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Query compatible con sql_mode=only_full_group_by
  // Usar una expresión derivada en el SELECT que coincida exactamente con el GROUP BY
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_FORMAT(${services.date}, '%Y-%m')`,
      total: sum(services.cost),
      count: count()
    })
    .from(services)
    .where(gte(services.date, twelveMonthsAgo.toISOString()))
    .groupBy(sql`DATE_FORMAT(${services.date}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${services.date}, '%Y-%m')`);

  // Procesar resultados
  const historical = monthlyData.map(row => ({
    month: row.month,
    total: Number(row.total || 0),
    count: Number(row.count || 0)
  }));

  // Calcular métricas
  const current = historical.length > 0 ? historical[historical.length - 1].total : 0;
  const average = historical.length > 0 
    ? historical.reduce((sum, m) => sum + m.total, 0) / historical.length 
    : 0;

  // Determinar tendencia (últimos 3 meses vs 3 meses anteriores)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (historical.length >= 6) {
    const last3 = historical.slice(-3).reduce((sum, m) => sum + m.total, 0) / 3;
    const prev3 = historical.slice(-6, -3).reduce((sum, m) => sum + m.total, 0) / 3;
    
    if (last3 > prev3 * 1.1) trend = 'up';
    else if (last3 < prev3 * 0.9) trend = 'down';
  }

  return {
    historical,
    current,
    average,
    trend
  };
}
