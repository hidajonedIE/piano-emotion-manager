/**
 * Churn Risk Data Service
 * Recopila datos de clientes en riesgo de forma optimizada
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { clients, services } from '../../../drizzle/schema.js';
import { sql, gte, desc } from 'drizzle-orm';

export interface ChurnRiskData {
  clients: {
    id: string;
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
 * Optimizado: 1 consulta con JOIN y agregaciones
 */
export async function getChurnRiskData(organizationId: string): Promise<ChurnRiskData> {
  const db = await getDb();
  
  // Fecha de hace 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // UNA consulta que obtiene clientes con su último servicio y estadísticas
  const clientsWithStats = await db
    .select({
      id: clients.id,
      name: clients.name,
      lastServiceDate: sql<string>`MAX(${services.date})`,
      totalServices: sql<number>`COUNT(${services.id})`,
      totalSpent: sql<number>`SUM(${services.cost})`
    })
    .from(clients)
    .leftJoin(services, sql`${clients.id} = ${services.clientId}`)
    .groupBy(clients.id, clients.name)
    .orderBy(sql`MAX(${services.date})`);

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
