/**
 * Predictions Router (REESCRITO)
 * Router robusto para predicciones AI avanzadas
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../_core/trpc.js';
import { collectAllPredictionsData } from '../../services/predictions/predictions-data.service.js';
import {
  generateAllPredictions,
  generateRevenuePredictions,
  generateChurnRiskPredictions,
  generateMaintenancePredictions,
  generateWorkloadPredictions,
  generateInventoryPredictions,
} from '../../services/predictions/gemini-predictions.service.js';

export const predictionsRouter = router({
  /**
   * Obtiene TODAS las predicciones disponibles
   * Este es el endpoint principal que usa la página /predictions
   */
  getAllPredictions: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getAllPredictions] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      // 1. Recopilar todos los datos disponibles
      const data = await collectAllPredictionsData(ctx.organizationId);
      
      console.log('[getAllPredictions] Datos recopilados:', {
        hasRevenue: !!data.revenue,
        hasClients: !!data.clients,
        hasPianos: !!data.pianos,
        hasInventory: !!data.inventory,
        hasAppointments: !!data.appointments,
        hasServices: !!data.services,
      });
      
      // 2. Generar todas las predicciones
      const predictions = await generateAllPredictions(data);
      
      console.log('[getAllPredictions] Predicciones generadas exitosamente');
      
      return {
        success: true,
        predictions,
        dataAvailability: {
          revenue: true,
          clients: true,
          pianos: true,
          inventory: !!data.inventory,
          appointments: !!data.appointments,
          services: !!data.services,
        },
      };
    } catch (error) {
      console.error('[getAllPredictions] Error:', error);
      throw new Error(`Error al generar predicciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),

  /**
   * Obtiene solo predicciones de ingresos
   */
  getRevenue: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getRevenue] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      const data = await collectAllPredictionsData(ctx.organizationId);
      const prediction = await generateRevenuePredictions(data);
      
      return {
        success: true,
        prediction,
      };
    } catch (error) {
      console.error('[getRevenue] Error:', error);
      throw new Error(`Error al generar predicción de ingresos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),

  /**
   * Obtiene solo predicciones de clientes en riesgo
   */
  getChurnRisk: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getChurnRisk] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      const data = await collectAllPredictionsData(ctx.organizationId);
      const prediction = await generateChurnRiskPredictions(data);
      
      return {
        success: true,
        prediction,
      };
    } catch (error) {
      console.error('[getChurnRisk] Error:', error);
      throw new Error(`Error al generar predicción de riesgo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),

  /**
   * Obtiene solo predicciones de mantenimiento
   */
  getMaintenance: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getMaintenance] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      const data = await collectAllPredictionsData(ctx.organizationId);
      const prediction = await generateMaintenancePredictions(data);
      
      return {
        success: true,
        prediction,
      };
    } catch (error) {
      console.error('[getMaintenance] Error:', error);
      throw new Error(`Error al generar predicción de mantenimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),

  /**
   * Obtiene solo predicciones de carga de trabajo
   */
  getWorkload: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getWorkload] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      const data = await collectAllPredictionsData(ctx.organizationId);
      
      if (!data.appointments) {
        return {
          success: false,
          error: 'NO_APPOINTMENTS_DATA',
          message: 'No hay datos de citas disponibles. Programa citas para ver predicciones de carga de trabajo.',
        };
      }
      
      const prediction = await generateWorkloadPredictions(data);
      
      return {
        success: true,
        prediction,
      };
    } catch (error) {
      console.error('[getWorkload] Error:', error);
      
      if (error instanceof Error && error.message.includes('No hay datos de citas')) {
        return {
          success: false,
          error: 'NO_APPOINTMENTS_DATA',
          message: 'No hay datos de citas disponibles. Programa citas para ver predicciones de carga de trabajo.',
        };
      }
      
      throw new Error(`Error al generar predicción de carga: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),

  /**
   * Obtiene solo predicciones de inventario
   */
  getInventoryDemand: protectedProcedure.query(async ({ ctx }) => {
    console.log('[getInventoryDemand] Iniciando para organizationId:', ctx.organizationId);
    
    try {
      const data = await collectAllPredictionsData(ctx.organizationId);
      
      if (!data.inventory) {
        return {
          success: false,
          error: 'NO_INVENTORY_DATA',
          message: 'No hay datos de inventario disponibles. Configura tu inventario para ver predicciones de demanda.',
        };
      }
      
      const prediction = await generateInventoryPredictions(data);
      
      return {
        success: true,
        prediction,
      };
    } catch (error) {
      console.error('[getInventoryDemand] Error:', error);
      
      if (error instanceof Error && error.message.includes('No hay datos de inventario')) {
        return {
          success: false,
          error: 'NO_INVENTORY_DATA',
          message: 'No hay datos de inventario disponibles. Configura tu inventario para ver predicciones de demanda.',
        };
      }
      
      throw new Error(`Error al generar predicción de inventario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }),
});

export type PredictionsRouter = typeof predictionsRouter;
