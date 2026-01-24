/**
 * Revenue Data Service - SQL raw para compatibilidad total con TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

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
  const dateParam = twelveMonthsAgo.toISOString().split('T')[0]; // Solo fecha YYYY-MM-DD

  // Query SQL raw - 100% compatible con sql_mode=only_full_group_by
  // Usar la MISMA expresión en SELECT y GROUP BY
  const query = sql`
    SELECT 
      DATE_FORMAT(date, '%Y-%m') as month,
      SUM(cost) as total,
      COUNT(*) as count
    FROM services
    WHERE date >= ${dateParam}
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY DATE_FORMAT(date, '%Y-%m') ASC
  `;

  const result = await db.execute(query);
  const rows = result[0] as any[];

  // Procesar resultados
  const historical = rows.map(row => ({
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
