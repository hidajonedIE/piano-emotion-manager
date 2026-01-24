/**
 * Churn Data Service - SQL raw para compatibilidad total con TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

export interface ChurnRiskData {
  totalAtRisk: number;
  clients: {
    id: number;
    name: string;
    lastServiceDate: string | null;
    daysSinceLastService: number;
    totalServices: number;
    totalSpent: number;
  }[];
}

/**
 * Identifica clientes en riesgo (6+ meses sin servicio)
 */
export async function getChurnRiskData(organizationId?: number): Promise<ChurnRiskData> {
  const db = await getDb();
  
  // Calcular fecha de hace 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const dateParam = sixMonthsAgo.toISOString().split('T')[0];

  // Query SQL raw - Clientes con último servicio hace más de 6 meses
  const query = sql`
    SELECT 
      c.id,
      c.name,
      MAX(s.date) as lastServiceDate,
      DATEDIFF(CURDATE(), MAX(s.date)) as daysSinceLastService,
      COUNT(s.id) as totalServices,
      COALESCE(SUM(s.cost), 0) as totalSpent
    FROM clients c
    LEFT JOIN services s ON c.id = s.clientId
    GROUP BY c.id, c.name
    HAVING MAX(s.date) < ${dateParam} OR MAX(s.date) IS NULL
    ORDER BY totalSpent DESC
    LIMIT 10
  `;

  const result = await db.execute(query);
  const rows = result[0] as any[];

  // Procesar resultados
  const clients = rows.map(row => ({
    id: row.id,
    name: row.name,
    lastServiceDate: row.lastServiceDate,
    daysSinceLastService: Number(row.daysSinceLastService || 9999),
    totalServices: Number(row.totalServices || 0),
    totalSpent: Number(row.totalSpent || 0)
  }));

  return {
    totalAtRisk: clients.length,
    clients
  };
}
