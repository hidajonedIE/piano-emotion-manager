/**
 * Hook Optimizado de Alertas
 * Piano Emotion Manager
 * 
 * Usa el endpoint consolidado alerts.getAll para cargar todas las alertas
 * en una sola llamada, reduciendo el tiempo de carga de 2-3s a <1s
 */

import { trpc } from '@/lib/trpc';

export interface Alert {
  id: string;
  type: 'piano' | 'appointment' | 'invoice' | 'quote' | 'reminder';
  priority: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  data?: any;
}

interface AlertStats {
  total: number;
  urgent: number;
  warning: number;
  info: number;
}

interface AlertsResult {
  alerts: Alert[];
  stats: AlertStats;
  isLoading: boolean;
  error: any;
}

/**
 * Hook optimizado que carga todas las alertas en una sola llamada
 */
export function useAlertsOptimized(): AlertsResult {
  const { data, isLoading, error } = trpc.alerts.getAll.useQuery();

  return {
    alerts: data?.alerts || [],
    stats: data?.stats || { total: 0, urgent: 0, warning: 0, info: 0 },
    isLoading,
    error,
  };
}
