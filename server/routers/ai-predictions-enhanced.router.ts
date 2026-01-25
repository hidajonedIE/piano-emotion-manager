/**
 * Enhanced AI Predictions Router
 * Endpoints para predicciones matemáticas verificadas
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { generateMathPredictions } from '../services/ai/math-predictions-verified.service.js';

export const aiPredictionsEnhancedRouter = router({
  /**
   * GET REVENUE - Predicciones de ingresos
   */
  getRevenue: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional().default(6) }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[getRevenue] 🚀 Llamando a generateMathPredictions');
        const predictions = await generateMathPredictions(ctx.user.partnerId);
        console.log('[getRevenue] ✅ Predicciones generadas');
        return predictions.revenue.predictions || [];
      } catch (error) {
        console.error('[getRevenue] ❌ Error:', error);
        return [];
      }
    }),

  /**
   * GET CHURN RISK - Clientes en riesgo
   */
  getChurnRisk: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(30),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[getChurnRisk] 🚀 Llamando a generateMathPredictions');
        const predictions = await generateMathPredictions(ctx.user.partnerId);
        
        const allClients = predictions.clientChurn.topRiskClients || [];
        const total = allClients.length;
        const totalPages = Math.ceil(total / input.limit);
        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;
        const paginatedData = allClients.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
          },
        };
      } catch (error) {
        console.error('[getChurnRisk] ❌ Error:', error);
        return {
          data: [],
          pagination: { page: 1, limit: input.limit, total: 0, totalPages: 0 },
        };
      }
    }),

  /**
   * GET MAINTENANCE - Mantenimientos previstos
   */
  getMaintenance: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[getMaintenance] 🚀 Llamando a generateMathPredictions');
        const predictions = await generateMathPredictions(ctx.user.partnerId);
        
        const allMaintenance = predictions.maintenance.predictions || [];
        const total = allMaintenance.length;
        const totalPages = Math.ceil(total / input.limit);
        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;
        const paginatedData = allMaintenance.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
          },
        };
      } catch (error) {
        console.error('[getMaintenance] ❌ Error:', error);
        return {
          data: [],
          pagination: { page: 1, limit: input.limit, total: 0, totalPages: 0 },
        };
      }
    }),

  /**
   * GET WORKLOAD - Carga de trabajo prevista
   */
  getWorkload: protectedProcedure
    .input(z.object({ weeks: z.number().min(1).max(12).optional().default(8) }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[getWorkload] 🚀 Llamando a generateMathPredictions');
        const predictions = await generateMathPredictions(ctx.user.partnerId);
        return predictions.workload.predictions || [];
      } catch (error) {
        console.error('[getWorkload] ❌ Error:', error);
        return [];
      }
    }),

  /**
   * GET INVENTORY DEMAND - Demanda de inventario
   */
  getInventoryDemand: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(6),
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('[getInventoryDemand] 🚀 Llamando a generateMathPredictions');
        const predictions = await generateMathPredictions(ctx.user.partnerId);
        
        const allInventory = predictions.inventory.predictions || [];
        const total = allInventory.length;
        const totalPages = Math.ceil(total / input.limit);
        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;
        const paginatedData = allInventory.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages,
          },
        };
      } catch (error) {
        console.error('[getInventoryDemand] ❌ Error:', error);
        return {
          data: [],
          pagination: { page: 1, limit: input.limit, total: 0, totalPages: 0 },
        };
      }
    }),

  /**
   * GET COMPLETE PREDICTIONS - Todas las predicciones
   */
  getCompletePredictions: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('[getCompletePredictions] 🚀 Llamando a generateMathPredictions');
      const predictions = await generateMathPredictions(ctx.user.partnerId);
      
      return {
        success: true,
        predictions,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[getCompletePredictions] ❌ Error:', error);
      throw new Error('Error generando predicciones');
    }
  }),
});
