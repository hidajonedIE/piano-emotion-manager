/**
 * Router de Predicciones
 * Piano Emotion Manager
 * 
 * Endpoints para el servicio de predicciones basado en algoritmos locales
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc.js';
import { PredictionService } from '../../services/analytics/prediction.service.js';
import { getDb } from '../../db.js';

// Crear instancia del servicio de predicciones
const createPredictionService = async (organizationId: string) => {
  const db = await getDb();
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
    // ✅ VERIFICAR LÍMITES DE SUSCRIPCIÓN
    const { requireAIFeature, recordAIUsage } = await import('../../_core/subscription-middleware.js');
    await requireAIFeature(ctx.user.openId, 'prediction');
    
    const service = await createPredictionService(ctx.partnerId?.toString() || '');
    const result = await service.getPredictionsSummary(ctx.partnerId?.toString() || '');
    
    // ✅ REGISTRAR USO
    await recordAIUsage(ctx.user.openId, 'prediction');
    
    return result;
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
      const service = await createPredictionService(ctx.partnerId?.toString() || '');
      return service.predictRevenue(ctx.partnerId?.toString() || '', input.months);
    }),

  /**
   * Obtiene clientes en riesgo de pérdida (churn)
   */
  getChurnRisk: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = await createPredictionService(ctx.partnerId?.toString() || '');
      const allResults = await service.predictClientChurn(ctx.partnerId?.toString() || '');
      
      // Calcular paginación
      const total = allResults.length;
      const totalPages = Math.ceil(total / input.limit);
      const startIndex = (input.page - 1) * input.limit;
      const endIndex = startIndex + input.limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      
      return {
        data: paginatedResults,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
          hasMore: input.page < totalPages,
        },
      };
    }),

  /**
   * Obtiene predicciones de mantenimiento de pianos
   */
  getMaintenance: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = await createPredictionService(ctx.partnerId?.toString() || '');
      const allResults = await service.predictMaintenance(ctx.partnerId?.toString() || '');
      
      // Calcular paginación
      const total = allResults.length;
      const totalPages = Math.ceil(total / input.limit);
      const startIndex = (input.page - 1) * input.limit;
      const endIndex = startIndex + input.limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      
      return {
        data: paginatedResults,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
          hasMore: input.page < totalPages,
        },
      };
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
      const service = await createPredictionService(ctx.partnerId?.toString() || '');
      return service.predictWorkload(ctx.partnerId?.toString() || '', input.weeks);
    }),

  /**
   * Obtiene predicciones de demanda de inventario
   */
  getInventoryDemand: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = await createPredictionService(ctx.partnerId?.toString() || '');
      const allResults = await service.predictInventoryDemand(ctx.partnerId?.toString() || '');
      
      // Calcular paginación
      const total = allResults.length;
      const totalPages = Math.ceil(total / input.limit);
      const startIndex = (input.page - 1) * input.limit;
      const endIndex = startIndex + input.limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      
      return {
        data: paginatedResults,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
          hasMore: input.page < totalPages,
        },
      };
    }),
});

export type PredictionsRouter = typeof predictionsRouter;
