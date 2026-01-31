/**
 * Hook para obtener predicciones del backend
 * Piano Emotion Manager
 */

import { trpc } from '@/lib/trpc';

/**
 * Hook para obtener el resumen de todas las predicciones
 */
export function usePredictionsSummary() {
  return trpc.advanced.predictions.getSummary.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener predicciones de ingresos
 */
export function useRevenuePredictions(months: number = 3) {
  return trpc.advanced.predictions.getRevenue.useQuery(
    { months },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook para obtener clientes en riesgo de pérdida
 */
export function useChurnRisk() {
  return trpc.advanced.predictions.getChurnRisk.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener predicciones de mantenimiento
 */
export function useMaintenancePredictions() {
  return trpc.advanced.predictions.getMaintenance.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para obtener predicciones de carga de trabajo
 */
export function useWorkloadPredictions(weeks: number = 4) {
  return trpc.advanced.predictions.getWorkload.useQuery(
    { weeks },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook para obtener predicciones de inventario
 */
export function useInventoryPredictions() {
  return trpc.advanced.predictions.getInventoryDemand.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
