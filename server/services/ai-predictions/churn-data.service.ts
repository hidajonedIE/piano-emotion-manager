/**
 * Churn Risk Data Service - Nuevo desde cero
 * Compatible 100% con esquema actual de TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services, clients } from '../../../drizzle/schema.js';
import { sql, desc, eq } from 'drizzle-orm';

export interface ChurnRiskData {
  clients: {
    id: number;
    name: string;
    lastServiceDate: string | null;
    daysSinceLastService: number;
    totalServices: number;
    totalSpent: number;
  }[];
  totalAtRisk: number;
}

/**
 * Obtiene clientes en riesgo (sin servicios en 6+ meses)
 */
export async function getChurnRiskData(organizationId?: number): Promise<ChurnRiskData> {
  const db = await getDb();
  
  // Fecha de hace 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Query compatible con sql_mode=only_full_group_by
  // Agrupar por clients.id y clients.name (ambos deben estar en GROUP BY)
  const clientsWithStats = await db
    .select({
      id: clients.id,
      name: clients.name,
      lastServiceDate: sql<string | null>`MAX(${services.date})`,
      totalServices: sql<number>`COUNT(${services.id})`,
      totalSpent: sql<number>`COALESCE(SUM(${services.cost}), 0)`
    })
    .from(clients)
    .leftJoin(services, eq(clients.id, services.clientId))
    .groupBy(clients.id, clients.name)
    .orderBy(desc(sql`MAX(${services.date})`));

  // Filtrar clientes en riesgo y calcular días
  const now = new Date();
  const atRiskClients = clientsWithStats
    .map(client => {
      const lastDate = client.lastServiceDate ? new Date(client.lastServiceDate) : null;
      const daysSince = lastDate 
        ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 9999;

      return {
        id: client.id,
        name: client.name,
        lastServiceDate: client.lastServiceDate,
        daysSinceLastService: daysSince,
        totalServices: Number(client.totalServices || 0),
        totalSpent: Number(client.totalSpent || 0)
      };
    })
    .filter(client => client.daysSinceLastService >= 180) // 6 meses
    .sort((a, b) => b.totalSpent - a.totalSpent) // Ordenar por valor (más importantes primero)
    .slice(0, 10); // Top 10

  return {
    clients: atRiskClients,
    totalAtRisk: atRiskClients.length
  };
}
