/**
 * AI Predictions Router
 * Endpoints para predicciones inteligentes del dashboard
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { generatePredictions, type PredictionsData } from '../services/ai/predictions.service.js';
import { getDb } from '../db.js';
import { services, clients, pianos } from '../../drizzle/schema.js';
import { and, gte, lte, count, sum } from 'drizzle-orm';

export const aiPredictionsRouter = router({
  /**
   * Obtiene predicciones IA para el dashboard
   */
  getDashboardPredictions: protectedProcedure
    .input(
      z.object({
        currentMonth: z.string(), // ISO date string del mes actual
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const currentMonthDate = new Date(input.currentMonth);
      
      // Calcular fechas
      const currentMonthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
      
      const previousMonthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 0);
      
      const sixMonthsAgo = new Date(currentMonthDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const twelveMonthsAgo = new Date(currentMonthDate);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      // Obtener ingresos del mes actual
      const currentMonthRevenueResult = await db
        .select({ total: sum(services.cost) })
        .from(services)
        .where(
          and(
            gte(services.date, currentMonthStart.toISOString()),
            lte(services.date, currentMonthEnd.toISOString())
          )
        );
      
      const currentMonthRevenue = Number(currentMonthRevenueResult[0]?.total || 0);
      
      // Obtener ingresos del mes anterior
      const previousMonthRevenueResult = await db
        .select({ total: sum(services.cost) })
        .from(services)
        .where(
          and(
            gte(services.date, previousMonthStart.toISOString()),
            lte(services.date, previousMonthEnd.toISOString())
          )
        );
      
      const previousMonthRevenue = Number(previousMonthRevenueResult[0]?.total || 0);
      
      // Obtener ingresos de los últimos 6 meses
      const last6MonthsRevenue: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
        const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i + 1, 0);
        
        const monthRevenueResult = await db
          .select({ total: sum(services.cost) })
          .from(services)
          .where(
            and(
              gte(services.date, monthStart.toISOString()),
              lte(services.date, monthEnd.toISOString())
            )
          );
        
        last6MonthsRevenue.push(Number(monthRevenueResult[0]?.total || 0));
      }
      
      // Obtener total de clientes
      const totalClientsResult = await db.select({ count: count() }).from(clients);
      const totalClients = Number(totalClientsResult[0]?.count || 0);
      
      // Obtener clientes sin servicios recientes (6+ meses)
      const recentClientIds = new Set(
        (await db
          .select({ clientId: services.clientId })
          .from(services)
          .where(gte(services.date, sixMonthsAgo.toISOString())))
          .map(s => s.clientId)
          .filter(id => id !== null)
      );
      
      const clientsWithoutRecentServices = totalClients - recentClientIds.size;
      
      // Obtener nuevos clientes de los últimos 6 meses
      const clientsLast6Months: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
        const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i + 1, 0);
        
        const newClientsResult = await db
          .select({ count: count() })
          .from(clients)
          .where(
            and(
              gte(clients.createdAt, monthStart.toISOString()),
              lte(clients.createdAt, monthEnd.toISOString())
            )
          );
        
        clientsLast6Months.push(Number(newClientsResult[0]?.count || 0));
      }
      
      // Obtener total de pianos
      const totalPianosResult = await db.select({ count: count() }).from(pianos);
      const totalPianos = Number(totalPianosResult[0]?.count || 0);
      
      // Obtener pianos sin mantenimiento reciente (12+ meses)
      const recentPianoIds = new Set(
        (await db
          .select({ pianoId: services.pianoId })
          .from(services)
          .where(gte(services.date, twelveMonthsAgo.toISOString())))
          .map(s => s.pianoId)
          .filter(id => id !== null)
      );
      
      const pianosWithoutRecentMaintenance = totalPianos - recentPianoIds.size;
      
      // Obtener servicios de los últimos 12 meses
      const servicesLast12Months: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i, 1);
        const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - i + 1, 0);
        
        const monthServicesResult = await db
          .select({ count: count() })
          .from(services)
          .where(
            and(
              gte(services.date, monthStart.toISOString()),
              lte(services.date, monthEnd.toISOString())
            )
          );
        
        servicesLast12Months.push(Number(monthServicesResult[0]?.count || 0));
      }
      
      // Preparar datos para Gemini
      const predictionsData: PredictionsData = {
        currentMonthRevenue,
        previousMonthRevenue,
        last6MonthsRevenue,
        totalClients,
        clientsWithoutRecentServices,
        clientsLast6Months,
        totalPianos,
        pianosWithoutRecentMaintenance,
        servicesLast12Months,
      };
      
      // Generar predicciones con Gemini
      const predictions = await generatePredictions(predictionsData);
      
      return {
        success: true,
        predictions,
        dataUsed: predictionsData, // Para debugging
      };
    }),
});
