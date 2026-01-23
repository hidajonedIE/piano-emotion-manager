/**
 * AI Predictions Router (OPTIMIZADO)
 * Endpoints para predicciones inteligentes del dashboard
 * Usa servicios optimizados que terminan en < 5s
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { getRevenueData } from '../services/predictions/revenue-data.service.js';
import { getChurnRiskData } from '../services/predictions/churn-data.service.js';
import { getMaintenanceData } from '../services/predictions/maintenance-data.service.js';
import { generateRevenuePrediction } from '../services/predictions/revenue-prediction.service.js';
import { generateChurnRiskPrediction } from '../services/predictions/churn-prediction.service.js';
import { generateMaintenancePrediction } from '../services/predictions/maintenance-prediction.service.js';

export const aiPredictionsRouter = router({
  /**
   * Obtiene predicciones IA para el dashboard
   * Optimizado para terminar en < 8s (3 predicciones en paralelo)
   */
  getDashboardPredictions: protectedProcedure
    .input(
      z.object({
        currentMonth: z.string(), // ISO date string del mes actual (no se usa pero se mantiene por compatibilidad)
      })
    )
    .query(async ({ ctx, input }) => {
      console.log('[getDashboardPredictions] Iniciando con organizationId:', ctx.organizationId);
      
      try {
        // Ejecutar las 3 recopilaciones de datos en PARALELO
        const [revenueData, churnData, maintenanceData] = await Promise.all([
          getRevenueData(ctx.organizationId),
          getChurnRiskData(ctx.organizationId),
          getMaintenanceData(ctx.organizationId),
        ]);
        
        console.log('[getDashboardPredictions] Datos recopilados:', {
          revenue: revenueData.current,
          clientsAtRisk: churnData.totalAtRisk,
          pianosNeeded: maintenanceData.totalNeeded,
        });
        
        // Generar las 3 predicciones en PARALELO
        const [revenuePred, churnPred, maintenancePred] = await Promise.all([
          generateRevenuePrediction(revenueData),
          generateChurnRiskPrediction(churnData),
          generateMaintenancePrediction(maintenanceData),
        ]);
        
        console.log('[getDashboardPredictions] Predicciones generadas exitosamente');
        
        // Adaptar el formato para el dashboard (mantener compatibilidad con el frontend)
        return {
          success: true,
          predictions: {
            // Predicción de ingresos del próximo mes
            revenueGrowth: revenuePred.nextMonth?.estimated 
              ? `${Math.round(revenuePred.nextMonth.estimated)} €`
              : 'N/A',
            
            // Número de clientes en riesgo
            clientsAtRisk: churnPred.totalAtRisk,
            
            // Número de pianos que necesitan mantenimiento
            pianosNeedingMaintenance: maintenancePred.totalNeeded,
          },
          dataUsed: {
            revenue: revenueData,
            clients: churnData,
            pianos: maintenanceData,
          },
        };
      } catch (error) {
        console.error('[getDashboardPredictions] Error:', error);
        
        // Si falla, retornar valores por defecto en lugar de romper el dashboard
        return {
          success: false,
          predictions: {
            revenueGrowth: 'N/A',
            clientsAtRisk: 0,
            pianosNeedingMaintenance: 0,
          },
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    }),
});
