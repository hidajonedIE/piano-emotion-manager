/**
 * DEBUG ROUTER - TEMPORAL
 * Endpoint para diagnóstico de datos en BD
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const debugRouter = router({
  checkFebruaryData: publicProcedure
    .query(async () => {
      const database = await db.getDb();
      if (!database) return { error: "No database connection" };

      try {
        // Contar clientes creados en febrero 2026
        const clientsResult = await database.execute(`
          SELECT COUNT(*) as total
          FROM clients 
          WHERE partner_id = 1 
          AND created_at >= '2026-02-01 00:00:00'
          AND created_at < '2026-03-01 00:00:00'
        `);

        // Contar servicios con fecha en febrero 2026
        const servicesResult = await database.execute(`
          SELECT COUNT(*) as total
          FROM services 
          WHERE partner_id = 1 
          AND date >= '2026-02-01 00:00:00'
          AND date < '2026-03-01 00:00:00'
        `);

        // Contar pianos creados en febrero 2026
        const pianosResult = await database.execute(`
          SELECT COUNT(*) as total
          FROM pianos 
          WHERE partner_id = 1 
          AND created_at >= '2026-02-01 00:00:00'
          AND created_at < '2026-03-01 00:00:00'
        `);

        // Muestra de servicios de febrero
        const servicesSample = await database.execute(`
          SELECT id, client_id, piano_id, service_type, date, cost
          FROM services 
          WHERE partner_id = 1 
          AND date >= '2026-02-01 00:00:00'
          AND date < '2026-03-01 00:00:00'
          ORDER BY date DESC
          LIMIT 5
        `);

        return {
          success: true,
          data: {
            clientesFebreroCount: (clientsResult as any)[0]?.[0]?.total || 0,
            serviciosFebreroCount: (servicesResult as any)[0]?.[0]?.total || 0,
            pianosFebreroCount: (pianosResult as any)[0]?.[0]?.total || 0,
            serviciosSample: (servicesSample as any)[0] || []
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }),
});
