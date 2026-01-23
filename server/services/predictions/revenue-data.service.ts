/**
 * Revenue Data Service
 * Recopila datos de ingresos de forma optimizada
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services } from '../../../drizzle/schema.js';
import { gte, sql, sum, count } from 'drizzle-orm';

export interface RevenueData {
  historical: {
    month: string;
    total: number;
  }[];
  current: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Obtiene datos de ingresos de los últimos 12 meses
 * Optimizado: 1 consulta en lugar de 12
 */
export async function getRevenueData(organizationId: string): Promise<RevenueData> {
  const db = await getDb();
  
  // Calcular fecha de hace 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // UNA consulta que obtiene todos los ingresos agrupados por mes
  const monthlyRevenues = await db
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
  const historical = monthlyRevenues.map(row => ({
    month: row.month,
    total: Number(row.total || 0)
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
