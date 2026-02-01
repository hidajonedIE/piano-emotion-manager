/**
 * Dashboard Router
 * Endpoints para métricas y estadísticas del dashboard
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { clients, pianos, services, invoices } from "../../drizzle/schema.js";
import { and, gte, lt, eq, sql, sum } from "drizzle-orm";
import { filterByPartner } from "../utils/multi-tenant.js";

export const dashboardRouter = router({
  /**
   * Obtener métricas mensuales
   * Retorna clientes, pianos, servicios e ingresos del mes especificado
   */
  getMonthlyMetrics: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12), // 1 = enero, 12 = diciembre
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = getDb();
        const partnerId = ctx.user.partnerId;

        console.log('[Dashboard] getMonthlyMetrics called with:', { year: input.year, month: input.month, partnerId });

        // Calcular rango de fechas del mes
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 1);

        // Convertir a formato ISO string (compatible con MySQL)
        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();

        console.log('[Dashboard] Date range:', { startDateStr, endDateStr });

        // Contar clientes creados en el mes
        console.log('[Dashboard] Querying clients...');
        const clientsQuery = db
          .select({ count: sql<number>`COUNT(*)` })
          .from(clients)
          .where(
            and(
              eq(clients.partnerId, partnerId),
              gte(clients.createdAt, startDateStr),
              lt(clients.createdAt, endDateStr)
            )
          );
        console.log('[Dashboard] Clients SQL:', clientsQuery.toSQL());
        const clientsResult = await clientsQuery;
        console.log('[Dashboard] Clients result RAW:', JSON.stringify(clientsResult));
        console.log('[Dashboard] Clients count:', clientsResult[0]);

        // Contar pianos creados en el mes
        console.log('[Dashboard] Querying pianos...');
        const pianosQuery = db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pianos)
          .where(
            and(
              eq(pianos.partnerId, partnerId),
              gte(pianos.createdAt, startDateStr),
              lt(pianos.createdAt, endDateStr)
            )
          );
        console.log('[Dashboard] Pianos SQL:', pianosQuery.toSQL());
        const pianosResult = await pianosQuery;
        console.log('[Dashboard] Pianos result RAW:', JSON.stringify(pianosResult));
        console.log('[Dashboard] Pianos count:', pianosResult[0]);

        // Contar servicios del mes (por fecha de servicio, no createdAt)
        console.log('[Dashboard] Querying services...');
        const servicesQuery = db
          .select({ count: sql<number>`COUNT(*)` })
          .from(services)
          .where(
            and(
              eq(services.partnerId, partnerId),
              gte(services.date, startDateStr),
              lt(services.date, endDateStr)
            )
          );
        console.log('[Dashboard] Services SQL:', servicesQuery.toSQL());
        const servicesResult = await servicesQuery;
        console.log('[Dashboard] Services result RAW:', JSON.stringify(servicesResult));
        console.log('[Dashboard] Services count:', servicesResult[0]);

        // Calcular ingresos del mes (suma de cost de servicios)
        console.log('[Dashboard] Querying revenue...');
        const revenueQuery = db
          .select({ total: sql<number>`COALESCE(SUM(${services.cost}), 0)` })
          .from(services)
          .where(
            and(
              eq(services.partnerId, partnerId),
              gte(services.date, startDateStr),
              lt(services.date, endDateStr)
            )
          );
        console.log('[Dashboard] Revenue SQL:', revenueQuery.toSQL());
        const revenueResult = await revenueQuery;
        console.log('[Dashboard] Revenue result RAW:', JSON.stringify(revenueResult));
        console.log('[Dashboard] Revenue total:', revenueResult[0]);

        console.log('[Dashboard] Converting results to numbers...');
        console.log('[Dashboard] clientsResult[0]?.count type:', typeof clientsResult[0]?.count, 'value:', clientsResult[0]?.count);
        console.log('[Dashboard] pianosResult[0]?.count type:', typeof pianosResult[0]?.count, 'value:', pianosResult[0]?.count);
        console.log('[Dashboard] servicesResult[0]?.count type:', typeof servicesResult[0]?.count, 'value:', servicesResult[0]?.count);
        console.log('[Dashboard] revenueResult[0]?.total type:', typeof revenueResult[0]?.total, 'value:', revenueResult[0]?.total);

        const result = {
          clients: Number(clientsResult[0]?.count || 0),
          pianos: Number(pianosResult[0]?.count || 0),
          services: Number(servicesResult[0]?.count || 0),
          revenue: Number(revenueResult[0]?.total || 0),
        };

        console.log('[Dashboard] Final result:', JSON.stringify(result));

        return result;
      } catch (error) {
        console.error('[Dashboard] ERROR in getMonthlyMetrics:', {
          error: error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          input: input
        });
        throw error;
      }
    }),
});
