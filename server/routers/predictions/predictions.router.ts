/**
 * Predictions Router (OPTIMIZADO - Sin Timeouts)
 * Endpoints separados con consultas optimizadas
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../_core/trpc.js';
import { getRevenueData } from '../../services/predictions/revenue-data.service.js';
import { getChurnRiskData } from '../../services/predictions/churn-data.service.js';
import { getMaintenanceData } from '../../services/predictions/maintenance-data.service.js';
import { generateRevenuePrediction } from '../../services/predictions/revenue-prediction.service.js';
import { generateChurnRiskPrediction } from '../../services/predictions/churn-prediction.service.js';
import { generateMaintenancePrediction } from '../../services/predictions/maintenance-prediction.service.js';

export const predictionsRouter = router({
  /**
   * Obtiene predicción de ingresos
   * Tiempo estimado: < 5s
   */
  getRevenue: protectedProcedure.query(async ({ ctx }) => {
    console.log('[predictions.getRevenue] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      // 1. Recopilar datos (optimizado: 1 consulta)
      const data = await getRevenueData(ctx.organizationId);
      console.log('[predictions.getRevenue] Datos recopilados:', {
        months: data.historical.length,
        current: data.current,
        trend: data.trend
      });

      // 2. Generar predicción con Gemini
      const prediction = await generateRevenuePrediction(data);
      console.log('[predictions.getRevenue] Predicción generada exitosamente');

      return {
        success: true,
        data: prediction
      };

    } catch (error) {
      console.error('[predictions.getRevenue] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }),

  /**
   * Obtiene predicción de clientes en riesgo
   * Tiempo estimado: < 5s
   */
  getChurnRisk: protectedProcedure.query(async ({ ctx }) => {
    console.log('[predictions.getChurnRisk] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      // 1. Recopilar datos (optimizado: 1 consulta con JOIN)
      const data = await getChurnRiskData(ctx.organizationId);
      console.log('[predictions.getChurnRisk] Datos recopilados:', {
        totalAtRisk: data.totalAtRisk
      });

      // 2. Generar predicción con Gemini
      const prediction = await generateChurnRiskPrediction(data);
      console.log('[predictions.getChurnRisk] Predicción generada exitosamente');

      return {
        success: true,
        data: prediction
      };

    } catch (error) {
      console.error('[predictions.getChurnRisk] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }),

  /**
   * Obtiene predicción de mantenimiento
   * Tiempo estimado: < 5s
   */
  getMaintenance: protectedProcedure.query(async ({ ctx }) => {
    console.log('[predictions.getMaintenance] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      // 1. Recopilar datos (optimizado: 1 consulta con JOINs)
      const data = await getMaintenanceData(ctx.organizationId);
      console.log('[predictions.getMaintenance] Datos recopilados:', {
        totalNeeded: data.totalNeeded
      });

      // 2. Generar predicción con Gemini
      const prediction = await generateMaintenancePrediction(data);
      console.log('[predictions.getMaintenance] Predicción generada exitosamente');

      return {
        success: true,
        data: prediction
      };

    } catch (error) {
      console.error('[predictions.getMaintenance] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }),
});

export type PredictionsRouter = typeof predictionsRouter;
