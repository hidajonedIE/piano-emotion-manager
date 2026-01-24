/**
 * AI Predictions Router - Nuevo desde cero
 * Endpoints para predicciones con Gemini AI
 * Piano Emotion Manager
 */

import { router, protectedProcedure } from '../trpc.js';
import { getRevenueData } from '../services/ai-predictions/revenue-data.service.js';
import { getChurnRiskData } from '../services/ai-predictions/churn-data.service.js';
import { getMaintenanceData } from '../services/ai-predictions/maintenance-data.service.js';
import { predictRevenue, predictChurn, predictMaintenance } from '../services/ai-predictions/gemini-predictions.service.js';

export const aiPredictionsNewRouter = router({
  /**
   * Obtiene todas las predicciones para el dashboard
   */
  getDashboardPredictions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('[getDashboardPredictions] Iniciando...');

        // Obtener datos históricos en paralelo
        const [revenueData, churnData, maintenanceData] = await Promise.all([
          getRevenueData(),
          getChurnRiskData(),
          getMaintenanceData()
        ]);

        console.log('[getDashboardPredictions] Datos obtenidos:', {
          revenue: revenueData.historical.length,
          churn: churnData.totalAtRisk,
          maintenance: maintenanceData.totalNeeded
        });

        // Generar predicciones con Gemini AI en paralelo
        const [revenuePrediction, churnPrediction, maintenancePrediction] = await Promise.all([
          predictRevenue(revenueData),
          predictChurn(churnData),
          predictMaintenance(maintenanceData)
        ]);

        console.log('[getDashboardPredictions] Predicciones generadas exitosamente');

        // Formatear ingresos con formato compacto
        const predictedAmount = revenuePrediction.predictedAmount;
        let formattedRevenue: string;
        if (predictedAmount >= 10000) {
          const thousands = predictedAmount / 1000;
          formattedRevenue = `${thousands.toFixed(1)}k\u20ac`;
        } else {
          formattedRevenue = `${Math.round(predictedAmount)}\u20ac`;
        }

        return {
          revenue: {
            predicted: formattedRevenue,
            confidence: revenuePrediction.confidence,
            trend: revenueData.trend,
            reasoning: revenuePrediction.reasoning
          },
          churn: {
            atRisk: churnPrediction.affectedClients,
            riskLevel: churnPrediction.riskLevel,
            reasoning: churnPrediction.reasoning
          },
          maintenance: {
            needed: maintenancePrediction.urgentCount + maintenancePrediction.scheduledCount,
            urgent: maintenancePrediction.urgentCount,
            reasoning: maintenancePrediction.reasoning
          }
        };
      } catch (error) {
        console.error('[getDashboardPredictions] Error:', error);
        
        // Retornar valores por defecto en caso de error
        return {
          revenue: {
            predicted: 'N/A',
            confidence: 'low' as const,
            trend: 'stable' as const,
            reasoning: 'Error al generar predicción'
          },
          churn: {
            atRisk: 0,
            riskLevel: 'low' as const,
            reasoning: 'Error al generar predicción'
          },
          maintenance: {
            needed: 0,
            urgent: 0,
            reasoning: 'Error al generar predicción'
          }
        };
      }
    }),

  /**
   * Obtiene predicción detallada de ingresos
   */
  getRevenuePrediction: protectedProcedure
    .query(async ({ ctx }) => {
      const revenueData = await getRevenueData();
      const prediction = await predictRevenue(revenueData);
      
      return {
        ...prediction,
        historical: revenueData.historical,
        current: revenueData.current,
        average: revenueData.average,
        trend: revenueData.trend
      };
    }),

  /**
   * Obtiene predicción detallada de riesgo de clientes
   */
  getChurnPrediction: protectedProcedure
    .query(async ({ ctx }) => {
      const churnData = await getChurnRiskData();
      const prediction = await predictChurn(churnData);
      
      return {
        ...prediction,
        clients: churnData.clients
      };
    }),

  /**
   * Obtiene predicción detallada de mantenimientos
   */
  getMaintenancePrediction: protectedProcedure
    .query(async ({ ctx }) => {
      const maintenanceData = await getMaintenanceData();
      const prediction = await predictMaintenance(maintenanceData);
      
      return {
        ...prediction,
        pianos: maintenanceData.pianos
      };
    })
});
