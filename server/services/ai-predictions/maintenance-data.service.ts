/**
 * Maintenance Data Service - SQL raw para compatibilidad total con TiDB
 * Piano Emotion Manager
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

export interface MaintenanceData {
  totalNeeded: number;
  monthlyHistory: { month: string; count: number }[];
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
}

/**
 * Identifica pianos que necesitan mantenimiento (12+ meses sin mantenimiento)
 */
export async function getMaintenanceData(organizationId?: number): Promise<MaintenanceData> {
  const db = await getDb();
  
  // Calcular fecha de hace 12 meses
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const dateParam = twelveMonthsAgo.toISOString().split('T')[0];

  // Query SQL raw - Pianos con último mantenimiento hace más de 12 meses
  const query = sql`
    SELECT 
      p.id,
      p.brand,
      p.model,
      p.serialNumber,
      p.clientId,
      c.name as clientName,
      MAX(CASE 
        WHEN s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN s.date 
      END) as lastMaintenanceDate,
      DATEDIFF(CURDATE(), MAX(CASE 
        WHEN s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN s.date 
      END)) as daysSinceLastMaintenance,
      COUNT(CASE 
        WHEN s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN 1 
      END) as totalMaintenances
    FROM pianos p
    LEFT JOIN clients c ON p.clientId = c.id
    LEFT JOIN services s ON p.id = s.pianoId
    GROUP BY p.id, p.brand, p.model, p.serialNumber, p.clientId, c.name
    HAVING MAX(CASE 
        WHEN s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN s.date 
      END) < ${dateParam} 
      OR MAX(CASE 
        WHEN s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium') 
        THEN s.date 
      END) IS NULL
    ORDER BY daysSinceLastMaintenance DESC
    LIMIT 10
  `;

  const result = await db.execute(query);
  const rows = result[0] as any[];

  // Query para histórico mensual de mantenimientos (últimos 12 meses)
  const historyQuery = sql`
    SELECT 
      DATE_FORMAT(s.date, '%Y-%m') as month,
      COUNT(*) as count
    FROM services s
    WHERE s.serviceType IN ('maintenance_basic', 'maintenance_complete', 'maintenance_premium')
      AND s.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(s.date, '%Y-%m')
    ORDER BY month ASC
  `;
  
  const historyResult = await db.execute(historyQuery);
  const historyRows = historyResult[0] as any[];
  
  const monthlyHistory = historyRows.map(row => ({
    month: row.month,
    count: Number(row.count)
  }));

  // Procesar resultados
  const pianos = rows.map(row => ({
    id: row.id,
    brand: row.brand || 'Desconocido',
    model: row.model || 'Desconocido',
    serialNumber: row.serialNumber || 'N/A',
    clientId: row.clientId,
    clientName: row.clientName || 'Sin cliente',
    lastMaintenanceDate: row.lastMaintenanceDate,
    daysSinceLastMaintenance: Number(row.daysSinceLastMaintenance || 9999),
    totalMaintenances: Number(row.totalMaintenances || 0)
  }));

  return {
    totalNeeded: pianos.length,
    monthlyHistory,
    pianos
  };
}
