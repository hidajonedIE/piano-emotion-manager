/**
 * Router de Predicciones
 * Piano Emotion Manager
 * 
 * Endpoints para el servicio de predicciones basado en algoritmos locales
 */

import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { PredictionService } from '@/server/services/analytics/prediction.service';
import { db } from '@/server/db';

// Crear instancia del servicio de predicciones
const createPredictionService = (organizationId: string) => {
  return new PredictionService(db);
};

// ============================================================================
// Router de Predicciones
// ============================================================================

export const predictionsRouter = router({
  /**
   * Obtiene el resumen completo de todas las predicciones
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const service = createPredictionService(ctx.organizationId);
    return service.getPredictionsSummary(ctx.organizationId);
  }),

  /**
   * Obtiene predicciones de ingresos
   */
  getRevenue: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).optional().default(3),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createPredictionService(ctx.organizationId);
      return service.predictRevenue(ctx.organizationId, input.months);
    }),

  /**
   * Obtiene clientes en riesgo de pérdida (churn)
   */
  getChurnRisk: protectedProcedure.query(async ({ ctx }) => {
    const service = createPredictionService(ctx.organizationId);
    return service.predictClientChurn(ctx.organizationId);
  }),

  /**
   * Obtiene predicciones de mantenimiento de pianos
   */
  getMaintenance: protectedProcedure.query(async ({ ctx }) => {
    const service = createPredictionService(ctx.organizationId);
    return service.predictMaintenance(ctx.organizationId);
  }),

  /**
   * Obtiene predicciones de carga de trabajo
   */
  getWorkload: protectedProcedure
    .input(
      z.object({
        weeks: z.number().min(1).max(12).optional().default(4),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = createPredictionService(ctx.organizationId);
      return service.predictWorkload(ctx.organizationId, input.weeks);
    }),

  /**
   * Obtiene predicciones de demanda de inventario
   */
  getInventoryDemand: protectedProcedure.query(async ({ ctx }) => {
    const service = createPredictionService(ctx.organizationId);
    return service.predictInventoryDemand(ctx.organizationId);
  }),
});

export type PredictionsRouter = typeof predictionsRouter;
