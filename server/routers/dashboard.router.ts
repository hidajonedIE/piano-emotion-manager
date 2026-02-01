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
      const db = await getDb();
      const partnerId = ctx.user.partnerId;

      // Calcular rango de fechas del mes
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 1);

      // Convertir a formato ISO string (compatible con MySQL)
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Contar clientes creados en el mes
      const clientsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(clients)
        .where(
          and(
            eq(clients.partnerId, partnerId),
            gte(clients.createdAt, startDateStr),
            lt(clients.createdAt, endDateStr)
          )
        );

      // Contar pianos creados en el mes
      const pianosResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(pianos)
        .where(
          and(
            eq(pianos.partnerId, partnerId),
            gte(pianos.createdAt, startDateStr),
            lt(pianos.createdAt, endDateStr)
          )
        );

      // Contar servicios del mes (por fecha de servicio, no createdAt)
      const servicesResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(services)
        .where(
          and(
            eq(services.partnerId, partnerId),
            gte(services.date, startDateStr),
            lt(services.date, endDateStr)
          )
        );

      // Calcular ingresos del mes (suma de cost de servicios)
      const revenueResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${services.cost}), 0)` })
        .from(services)
        .where(
          and(
            eq(services.partnerId, partnerId),
            gte(services.date, startDateStr),
            lt(services.date, endDateStr)
          )
        );

      return {
        clients: Number(clientsResult[0]?.count || 0),
        pianos: Number(pianosResult[0]?.count || 0),
        services: Number(servicesResult[0]?.count || 0),
        revenue: Number(revenueResult[0]?.total || 0),
      };
    }),
});
