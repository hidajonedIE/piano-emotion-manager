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
  type AIPredictionsEnhanced,
} from '../services/ai/enhanced-predictions.service.js';

export const aiPredictionsEnhancedRouter = router({
  /**
   * Obtiene predicciones completas del negocio usando IA
   */
  getCompletePredictions: protectedProcedure.query(async ({ ctx }) => {
    console.log('[AI Predictions Enhanced] Iniciando generación de predicciones completas');
    
    try {
      // 1. Recopilar todos los datos del negocio
      const businessData = await collectBusinessData(ctx.organizationId);
      console.log('[AI Predictions Enhanced] Datos del negocio recopilados:', {
        revenue: businessData.revenue.current,
        clients: businessData.clients.total,
        services: businessData.services.total,
      });
      
      // 2. Generar predicciones con Gemini
      const predictions = await generateEnhancedPredictions(businessData);
      console.log('[AI Predictions Enhanced] Predicciones generadas exitosamente');
      
      return {
        success: true,
        predictions,
        businessData, // Para debugging y transparencia
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[AI Predictions Enhanced] Error:', error);
      throw new Error('Error generando predicciones IA');
    }
  }),

  /**
   * Obtiene solo predicciones de ingresos con IA
   */
  getRevenuePredictions: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional().default(3) }))
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.organizationId);
      const predictions = await generateEnhancedPredictions(businessData);
      
      return {
        success: true,
        predictions: predictions.revenue,
        generatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Obtiene solo predicciones de clientes en riesgo con IA
   */
  getChurnPredictions: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    return {
      success: true,
      predictions: predictions.clientChurn,
      generatedAt: new Date().toISOString(),
    };
  }),

  /**
   * Obtiene solo predicciones de mantenimiento con IA
   */
  getMaintenancePredictions: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    return {
      success: true,
      predictions: predictions.maintenance,
      generatedAt: new Date().toISOString(),
    };
  }),

  /**
   * Obtiene solo predicciones de carga de trabajo con IA
   */
  getWorkloadPredictions: protectedProcedure
    .input(z.object({ weeks: z.number().min(1).max(12).optional().default(4) }))
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.organizationId);
      const predictions = await generateEnhancedPredictions(businessData);
      
      return {
        success: true,
        predictions: predictions.workload,
        generatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Obtiene solo predicciones de inventario con IA
   */
  getInventoryPredictions: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    return {
      success: true,
      predictions: predictions.inventory,
      generatedAt: new Date().toISOString(),
    };
  }),

  /**
   * Obtiene insights generales del negocio con IA
   */
  getBusinessInsights: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    return {
      success: true,
      insights: predictions.insights,
      generatedAt: new Date().toISOString(),
    };
  }),

  // ===== ALIASES PARA COMPATIBILIDAD CON WIDGETS =====
  /**
   * Alias de getRevenuePredictions para compatibilidad con widgets
   */
  getRevenue: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(12).optional().default(3) }))  
    .query(async ({ ctx, input }) => {
      const businessData = await collectBusinessData(ctx.organizationId);
      const predictions = await generateEnhancedPredictions(businessData);
      
      // Retornar en formato compatible con widget (array de predicciones)
      return predictions.revenue.predictions || [];
    }),

  /**
   * Alias de getChurnPredictions para compatibilidad con widgets
   */
  getChurnRisk: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    // Retornar array de clientes en riesgo
    return predictions.clientChurn.topRiskClients || [];
  }),

  /**
   * Alias de getMaintenancePredictions para compatibilidad con widgets
   */
  getMaintenance: protectedProcedure.query(async ({ ctx }) => {
    const businessData = await collectBusinessData(ctx.organizationId);
    const predictions = await generateEnhancedPredictions(businessData);
    
    // Retornar array de mantenimientos previstos
    return predictions.maintenance.predictions || [];
  }),
});
