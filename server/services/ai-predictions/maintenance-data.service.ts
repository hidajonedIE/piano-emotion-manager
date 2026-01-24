/**
 * Maintenance Data Service - Nuevo desde cero
 * Compatible 100% con esquema actual de TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { services, pianos, clients } from '../../../drizzle/schema.js';
import { sql, desc, eq, or } from 'drizzle-orm';

export interface MaintenanceData {
  pianos: {
    id: number;
    brand: string;
    model: string | null;
    serialNumber: string | null;
    clientId: number;
    clientName: string;
    lastMaintenanceDate: string | null;
    daysSinceLastMaintenance: number;
    totalMaintenances: number;
  }[];
  totalNeeded: number;
}

/**
 * Obtiene pianos que necesitan mantenimiento (12+ meses sin servicio de mantenimiento)
 */
export async function getMaintenanceData(organizationId?: number): Promise<MaintenanceData> {
  const db = await getDb();

  // Query compatible con sql_mode=only_full_group_by
  // Agrupar por todas las columnas no agregadas
  const pianosWithStats = await db
    .select({
      id: pianos.id,
      brand: pianos.brand,
      model: pianos.model,
      serialNumber: pianos.serialNumber,
      clientId: pianos.clientId,
      clientName: clients.name,
      // Usar CASE para filtrar solo servicios de mantenimiento en MAX
      lastMaintenanceDate: sql<string | null>`MAX(CASE 
        WHEN ${services.serviceType} IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN ${services.date} 
        END)`,
      totalMaintenances: sql<number>`COUNT(CASE 
        WHEN ${services.serviceType} IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN 1 
        END)`
    })
    .from(pianos)
    .leftJoin(clients, eq(pianos.clientId, clients.id))
    .leftJoin(services, eq(pianos.id, services.pianoId))
    .groupBy(pianos.id, pianos.brand, pianos.model, pianos.serialNumber, pianos.clientId, clients.name)
    .orderBy(desc(sql`MAX(CASE 
      WHEN ${services.serviceType} IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
      THEN ${services.date} 
      END)`));

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
        brand: piano.brand,
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
