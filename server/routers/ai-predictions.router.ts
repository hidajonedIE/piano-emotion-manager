/**
 * AI Predictions Router (ACTUALIZADO)
 * Endpoints para predicciones inteligentes del dashboard
 * Ahora usa el sistema robusto de predicciones
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { collectAllPredictionsData } from '../services/predictions/predictions-data.service.js';
import { generateAllPredictions } from '../services/predictions/gemini-predictions.service.js';

export const aiPredictionsRouter = router({
  /**
   * Obtiene predicciones IA para el dashboard
   * Ahora usa el sistema robusto y unificado
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
        // 1. Recopilar todos los datos disponibles usando el nuevo servicio robusto
        const data = await collectAllPredictionsData(ctx.organizationId);
        
        console.log('[getDashboardPredictions] Datos recopilados:', {
          revenue: data.revenue.current,
          clients: data.clients.total,
          pianos: data.pianos.total,
          hasInventory: !!data.inventory,
          hasAppointments: !!data.appointments,
        });
        
        // 2. Generar todas las predicciones
        const predictions = await generateAllPredictions(data);
        
        console.log('[getDashboardPredictions] Predicciones generadas exitosamente');
        
        // 3. Adaptar el formato para el dashboard (mantener compatibilidad con el frontend)
        return {
          success: true,
          predictions: {
            // Predicción de ingresos del próximo mes
            revenueGrowth: predictions.revenue.months[0]?.estimated 
              ? `${Math.round(predictions.revenue.months[0].estimated)} €`
              : 'N/A',
            
            // Número de clientes en riesgo
            clientsAtRisk: predictions.churnRisk.totalAtRisk,
            
            // Número de pianos que necesitan mantenimiento
            pianosNeedingMaintenance: predictions.maintenance.totalNeeded,
          },
          dataUsed: {
            revenue: data.revenue,
            clients: data.clients,
            pianos: data.pianos,
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
