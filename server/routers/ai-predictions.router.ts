/**
 * AI Predictions Router (OPTIMIZADO)
 * Endpoints para predicciones inteligentes del dashboard
 * Usa servicios optimizados que terminan en < 5s
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';


export const aiPredictionsRouter = router({
  /**
   * Obtiene predicciones IA para el dashboard
   * TEMPORALMENTE DESHABILITADO - Retorna valores vacíos
   */
  getDashboardPredictions: protectedProcedure
    .input(
      z.object({
        currentMonth: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log('[getDashboardPredictions] Temporalmente deshabilitado');
      
      return {
        success: false,
        predictions: {
          revenueGrowth: 'N/A',
          clientsAtRisk: 0,
          pianosNeedingMaintenance: 0,
        },
        error: 'Predicciones temporalmente deshabilitadas',
      };
    }),
});
