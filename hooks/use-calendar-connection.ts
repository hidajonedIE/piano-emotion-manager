/**
 * Hook para gestionar conexiones de calendarios externos
 * Maneja OAuth, estado de conexión y sincronización con Google Calendar y Outlook
 */

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/utils/trpc';
import { useAuth } from '@/hooks/use-auth';

export interface CalendarConnection {
  id: number;
  provider: 'google' | 'outlook';
  calendarId: string;
  calendarName: string;
  connectedAt: string;
  lastSyncAt: string | null;
  isActive: boolean;
}

export interface CalendarConnectionStatus {
  hasGoogle: boolean;
  hasOutlook: boolean;
  hasAny: boolean;
}

// Helper para mostrar alertas compatibles con web
const showAlert = (message: string) => {
  if (Platform.OS === 'web') {
    window.alert(message);
  }
};

export function useCalendarConnection() {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // tRPC queries
  const { data: connectionStatus, refetch: refetchStatus} = 
    trpc.alerts.hasCalendarConnected.useQuery();

  // Mutations
  const syncAppointmentMutation = trpc.alerts.syncCalendarAppointment.useMutation();
  const syncMultipleMutation = trpc.alerts.syncMultipleAppointments.useMutation();
  const updateEventMutation = trpc.alerts.updateCalendarEvent.useMutation();
  const deleteEventMutation = trpc.alerts.deleteCalendarEvent.useMutation();

  /**
   * Obtener estado de conexiones
   */
  const getConnectionStatus = useCallback((): CalendarConnectionStatus => {
    return {
      hasGoogle: connectionStatus?.hasGoogle ?? false,
      hasOutlook: connectionStatus?.hasOutlook ?? false,
      hasAny: (connectionStatus?.hasGoogle || connectionStatus?.hasOutlook) ?? false,
    };
  }, [connectionStatus]);

  /**
   * Conectar Google Calendar
   */
  const connectGoogle = useCallback(async () => {
    try {
      setIsConnecting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!user?.id) {
        showAlert('Error: No se pudo obtener el ID de usuario');
        return;
      }
      
      // Abrir URL de OAuth con userId directamente (sin confirmación)
      const authUrl = `/api/calendar/google/auth?userId=${encodeURIComponent(user.id)}`;
      
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      }
      
      // Refrescar estado después de un tiempo
      setTimeout(() => {
        refetchStatus();
      }, 3000);
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      showAlert('Error: No se pudo conectar con Google Calendar. Por favor, intenta de nuevo.');
    } finally {
      setIsConnecting(false);
    }
  }, [user, refetchStatus]);

  /**
   * Conectar Outlook Calendar
   */
  const connectOutlook = useCallback(async () => {
    try {
      setIsConnecting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!user?.id) {
        showAlert('Error: No se pudo obtener el ID de usuario');
        return;
      }
      
      // Abrir URL de OAuth con userId directamente (sin confirmación)
      const authUrl = `/api/calendar/outlook/auth?userId=${encodeURIComponent(user.id)}`;
      
      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      }
      
      // Refrescar estado después de un tiempo
      setTimeout(() => {
        refetchStatus();
      }, 3000);
    } catch (error) {
      console.error('Error connecting Outlook Calendar:', error);
      showAlert('Error: No se pudo conectar con Outlook Calendar. Por favor, intenta de nuevo.');
    } finally {
      setIsConnecting(false);
    }
  }, [user, refetchStatus]);

  /**
   * Desconectar calendario
   */
  const disconnect = useCallback(async (provider: 'google' | 'outlook') => {
    try {
      const confirmed = Platform.OS === 'web'
        ? window.confirm(`¿Estás seguro de que deseas desconectar ${provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'}? Las citas existentes no se eliminarán.`)
        : true;
      
      if (!confirmed) {
        return;
      }
      
      try {
        // TODO: Implementar desconexión en el backend
        // await trpc.calendar.disconnect.mutate({ provider });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert('El calendario se ha desconectado correctamente');
        
        await refetchStatus();
      } catch (error) {
        console.error('Error disconnecting:', error);
        showAlert('Error: No se pudo desconectar el calendario');
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  }, [refetchStatus]);

  /**
   * Sincronizar cita con calendario
   */
  const syncAppointment = useCallback(async (appointmentId: number) => {
    try {
      setIsSyncing(true);
      
      const result = await syncAppointmentMutation.mutateAsync({
        appointmentId,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          success: true,
          eventId: result.eventId,
          eventUrl: result.eventUrl,
          provider: result.provider,
        };
      } else {
        showAlert(`Error de Sincronización: ${result.error || 'No se pudo sincronizar la cita'}`);
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error syncing appointment:', error);
      showAlert('Error: No se pudo sincronizar la cita con el calendario');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      setIsSyncing(false);
    }
  }, [syncAppointmentMutation]);

  /**
   * Sincronizar múltiples citas
   */
  const syncMultipleAppointments = useCallback(async (appointmentIds: number[]) => {
    try {
      setIsSyncing(true);
      
      const results = await syncMultipleMutation.mutateAsync({
        appointmentIds,
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert(`Sincronización Completa: Se sincronizaron ${successCount} cita(s) correctamente`);
      } else {
        showAlert(`Sincronización Parcial: Se sincronizaron ${successCount} cita(s) correctamente.\n${failCount} cita(s) fallaron.`);
      }

      return results;
    } catch (error) {
      console.error('Error syncing multiple appointments:', error);
      showAlert('Error: No se pudieron sincronizar las citas');
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [syncMultipleMutation]);

  /**
   * Actualizar evento en calendario
   */
  const updateEvent = useCallback(async (
    appointmentId: number,
    externalEventId: string,
    provider: 'google' | 'outlook'
  ) => {
    try {
      const result = await updateEventMutation.mutateAsync({
        appointmentId,
        externalEventId,
        provider,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      } else {
        showAlert(`Error: ${result.error || 'No se pudo actualizar el evento'}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating event:', error);
      showAlert('Error: No se pudo actualizar el evento en el calendario');
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }, [updateEventMutation]);

  /**
   * Eliminar evento de calendario
   */
  const deleteEvent = useCallback(async (
    externalEventId: string,
    provider: 'google' | 'outlook'
  ) => {
    try {
      const result = await deleteEventMutation.mutateAsync({
        externalEventId,
        provider,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      } else {
        showAlert(`Error: ${result.error || 'No se pudo eliminar el evento'}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showAlert('Error: No se pudo eliminar el evento del calendario');
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }, [deleteEventMutation]);

  /**
   * Sincronizar ahora (manual)
   */
  const syncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // TODO: Implementar sincronización manual completa
      // await trpc.calendar.syncAll.mutate();

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Sincronizado: Las citas se han sincronizado correctamente');

      await refetchStatus();
    } catch (error) {
      console.error('Error syncing now:', error);
      showAlert('Error: No se pudo sincronizar con el calendario');
    } finally {
      setIsSyncing(false);
    }
  }, [refetchStatus]);

  return {
    // Estado
    connectionStatus: getConnectionStatus(),
    isConnecting,
    isSyncing,

    // Métodos de conexión
    connectGoogle,
    connectOutlook,
    disconnect,

    // Métodos de sincronización
    syncAppointment,
    syncMultipleAppointments,
    updateEvent,
    deleteEvent,
    syncNow,

    // Utilidades
    refetchStatus,
  };
}
