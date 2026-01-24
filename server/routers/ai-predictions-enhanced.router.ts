/**
 * Enhanced AI Predictions Router
 * Endpoints para predicciones completas con Gemini
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import {
  collectBusinessData,
  generateEnhancedPredictions,
} from '../services/ai/enhanced-predictions.service.js';

export const aiPredictionsEnhancedRouter = router({
  /**
   * GET REVENUE - Predicciones de ingresos
   * Formato esperado por la página: array de { period, value, confidence, trend, factors }
   */
  getRevenue: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional().default(6) }))
    .query(async ({ ctx, input }) => {
      console.log('[getRevenue] 🚀 ENDPOINT LLAMADO');
      console.log('[getRevenue] Input:', input);
      console.log('[getRevenue] Partner ID:', ctx.user.partnerId);
      try {
        console.log('[getRevenue] 🚧 USANDO DATOS MOCK TEMPORALES');
        
        // Datos mock para testing
        const mockData = [
          {
            period: 'Febrero 2026',
            value: 12500,
            confidence: 85,
            trend: 'up' as const,
            factors: ['Aumento estacional', 'Nuevos clientes']
          },
          {
            period: 'Marzo 2026',
            value: 13200,
            confidence: 80,
            trend: 'up' as const,
            factors: ['Tendencia positiva', 'Servicios premium']
          },
          {
            period: 'Abril 2026',
            value: 11800,
            confidence: 75,
            trend: 'stable' as const,
            factors: ['Estabilización del mercado']
          }
        ];
        
        console.log('[getRevenue] Returning mock data:', JSON.stringify(mockData, null, 2));
        return mockData;
      } catch (error) {
        console.error('[getRevenue] ❌ ERROR CAPTURADO:');
        console.error('[getRevenue] Error type:', typeof error);
        console.error('[getRevenue] Error:', error);
        console.error('[getRevenue] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[getRevenue] Error stack:', error instanceof Error ? error.stack : 'No stack');
        return [];
      }
    }),

  /**
   * GET CHURN RISK - Clientes en riesgo
   * Formato esperado: { data: [...], pagination: { page, limit, total, totalPages } }
   */
  getChurnRisk: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(30),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const businessData = await collectBusinessData(ctx.user.partnerId);
        const predictions = await generateEnhancedPredictions(businessData);
        
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
        console.error('[getChurnRisk] Error:', error);
        return {
          data: [],
          pagination: { page: 1, limit: input.limit, total: 0, totalPages: 0 },
        };
      }
    }),

  /**
   * GET MAINTENANCE - Mantenimientos previstos
   * Formato esperado: { data: [...], pagination: { page, limit, total, totalPages } }
   */
  getMaintenance: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const businessData = await collectBusinessData(ctx.user.partnerId);
        const predictions = await generateEnhancedPredictions(businessData);
        
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
        console.error('[getMaintenance] Error:', error);
        return {
          data: [],
          pagination: { page: 1, limit: input.limit, total: 0, totalPages: 0 },
        };
      }
    }),

  /**
   * GET WORKLOAD - Carga de trabajo prevista
   * Formato esperado: array de { week, scheduled, estimated, recommendation }
   */
  getWorkload: protectedProcedure
    .input(z.object({ weeks: z.number().min(1).max(12).optional().default(8) }))
    .query(async ({ ctx, input }) => {
      try {
        const businessData = await collectBusinessData(ctx.user.partnerId);
        const predictions = await generateEnhancedPredictions(businessData);
        
        return predictions.workload.predictions || [];
      } catch (error) {
        console.error('[getWorkload] Error:', error);
        return [];
      }
    }),

  /**
   * GET INVENTORY DEMAND - Demanda de inventario
   * Formato esperado: { data: [...], pagination: { page, limit, total, totalPages } }
   */
  getInventoryDemand: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(6),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const businessData = await collectBusinessData(ctx.user.partnerId);
        const predictions = await generateEnhancedPredictions(businessData);
        
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
        console.error('[getInventoryDemand] Error:', error);
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
      const businessData = await collectBusinessData(ctx.user.partnerId);
      const predictions = await generateEnhancedPredictions(businessData);
      
      return {
        success: true,
        predictions,
        businessData,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[getCompletePredictions] Error:', error);
      throw new Error('Error generando predicciones IA');
    }
  }),
});
