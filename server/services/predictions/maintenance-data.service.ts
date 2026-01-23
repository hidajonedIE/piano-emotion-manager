/**
 * Maintenance Data Service
 * Recopila datos de pianos que necesitan mantenimiento de forma optimizada
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { pianos, clients, services } from '../../../drizzle/schema.js';
import { sql, eq } from 'drizzle-orm';

export interface MaintenanceData {
  pianos: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
    clientId: string;
    clientName: string;
    lastMaintenanceDate: string | null;
    daysSinceLastMaintenance: number;
    totalMaintenances: number;
  }[];
  totalNeeded: number;
}

/**
 * Obtiene pianos que necesitan mantenimiento (12+ meses sin servicio)
 * Optimizado: 1 consulta con JOINs y agregaciones
 */
export async function getMaintenanceData(organizationId: string): Promise<MaintenanceData> {
  const db = await getDb();
  
  // UNA consulta que obtiene pianos con su último mantenimiento y cliente
  const pianosWithStats = await db
    .select({
      id: pianos.id,
      brand: pianos.brand,
      model: pianos.model,
      serialNumber: pianos.serialNumber,
      clientId: pianos.clientId,
      clientName: clients.name,
      lastMaintenanceDate: sql<string>`MAX(CASE WHEN ${services.type} = 'maintenance' THEN ${services.date} END)`,
      totalMaintenances: sql<number>`COUNT(CASE WHEN ${services.type} = 'maintenance' THEN 1 END)`
    })
    .from(pianos)
    .leftJoin(clients, eq(pianos.clientId, clients.id))
    .leftJoin(services, sql`${pianos.id} = ${services.pianoId}`)
    .groupBy(
      pianos.id, 
      pianos.brand, 
      pianos.model, 
      pianos.serialNumber, 
      pianos.clientId,
      clients.name
    );

  // Filtrar pianos que necesitan mantenimiento y calcular días
  const now = new Date();
  const needMaintenancePianos = pianosWithStats
    .map(piano => {
      const lastDate = piano.lastMaintenanceDate ? new Date(piano.lastMaintenanceDate) : null;
      const daysSince = lastDate 
        ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : 9999;

      return {
        id: piano.id,
        brand: piano.brand || 'Desconocido',
        model: piano.model || 'Desconocido',
        serialNumber: piano.serialNumber || 'N/A',
        clientId: piano.clientId,
        clientName: piano.clientName || 'Cliente desconocido',
        lastMaintenanceDate: piano.lastMaintenanceDate,
        daysSinceLastMaintenance: daysSince,
        totalMaintenances: Number(piano.totalMaintenances || 0)
      };
    })
    .filter(piano => piano.daysSinceLastMaintenance >= 365) // 12 meses
    .sort((a, b) => b.daysSinceLastMaintenance - a.daysSinceLastMaintenance) // Más urgentes primero
    .slice(0, 10); // Top 10

  return {
    pianos: needMaintenancePianos,
    totalNeeded: needMaintenancePianos.length
  };
}
