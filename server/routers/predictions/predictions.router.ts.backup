/**
 * Router de Predicciones
 * Piano Emotion Manager
 * 
 * Endpoints para el servicio de predicciones basado en IA
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../_core/trpc.js';
import { collectBusinessData, generateEnhancedPredictions } from '../../services/ai/enhanced-predictions.service.js';

export const predictionsRouter = router({
  getRevenue: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional().default(6) }))
    .query(async ({ ctx }) => {
      const businessData = await collectBusinessData(ctx.partnerId || 0);
      const predictions = await generateEnhancedPredictions(businessData);
      return {
        predictions: [
          { period: predictions.revenue.nextMonth.period, value: predictions.revenue.nextMonth.value, confidence: predictions.revenue.nextMonth.confidence, trend: predictions.revenue.trend },
          { period: predictions.revenue.nextQuarter.period, value: predictions.revenue.nextQuarter.value, confidence: predictions.revenue.nextQuarter.confidence, trend: predictions.revenue.trend },
        ],
        currentRevenue: businessData.revenue.current,
      };
    }),
  getChurnRisk: protectedProcedure
    .input(z.object({ page: z.number().optional().default(1), limit: z.number().optional().default(30) }))
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.partnerId || 0);
      const predictions = await generateEnhancedPredictions(businessData);
      const clients = predictions.clientChurn.atRiskClients || [];
      const total = clients.length;
      const start = (input.page - 1) * input.limit;
      return { data: clients.slice(start, start + input.limit), pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit), hasMore: input.page < Math.ceil(total / input.limit) } };
    }),
  getMaintenance: protectedProcedure
    .input(z.object({ page: z.number().optional().default(1), limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.partnerId || 0);
      const predictions = await generateEnhancedPredictions(businessData);
      const pianos = predictions.maintenance.upcomingMaintenance || [];
      const total = pianos.length;
      const start = (input.page - 1) * input.limit;
      return { data: pianos.slice(start, start + input.limit), pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit), hasMore: input.page < Math.ceil(total / input.limit) } };
    }),
  getWorkload: protectedProcedure
    .input(z.object({ weeks: z.number().optional().default(4) }))
    .query(async ({ ctx }) => {
      const businessData = await collectBusinessData(ctx.partnerId || 0);
      const predictions = await generateEnhancedPredictions(businessData);
      return { predictions: [{ period: predictions.workload.nextWeek.period, value: predictions.workload.nextWeek.value, confidence: predictions.workload.nextWeek.confidence }, { period: predictions.workload.nextMonth.period, value: predictions.workload.nextMonth.value, confidence: predictions.workload.nextMonth.confidence }] };
    }),
  getInventoryDemand: protectedProcedure
    .input(z.object({ page: z.number().optional().default(1), limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.partnerId || 0);
      const predictions = await generateEnhancedPredictions(businessData);
      const items = predictions.inventory.topDemandItems || [];
      const total = items.length;
      const start = (input.page - 1) * input.limit;
      return { data: items.slice(start, start + input.limit), pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit), hasMore: input.page < Math.ceil(total / input.limit) } };
    }),
});

export type PredictionsRouter = typeof predictionsRouter;
