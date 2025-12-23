import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { calendarService, CalendarSettings, CalendarEvent } from '@/services/calendar-service';

/**
 * Hook para integración con calendarios
 */
export function useCalendar() {
  const [settings, setSettings] = useState<CalendarSettings>(calendarService.getSettings());
  const [availableCalendars, setAvailableCalendars] = useState<Calendar.Calendar[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setIsLoading(true);
    try {
      await calendarService.initialize();
      setSettings(calendarService.getSettings());
      
      if (Platform.OS !== 'web') {
        const permission = await calendarService.hasPermissions();
        setHasPermission(permission);
        
        if (permission) {
          const calendars = await calendarService.getAvailableCalendars();
          setAvailableCalendars(calendars);
        }
      }
    } catch (err) {
      console.error('Error initializing calendar:', err);
      setError('Error al inicializar el calendario');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicitar permisos de calendario
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await calendarService.requestPermissions();
      setHasPermission(granted);
      
      if (granted) {
        const calendars = await calendarService.getAvailableCalendars();
        setAvailableCalendars(calendars);
      }
      
      return granted;
    } catch (err) {
      setError('Error al solicitar permisos');
      return false;
    }
  }, []);

  /**
   * Crear calendario dedicado
   */
  const createCalendar = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const calendarId = await calendarService.createDedicatedCalendar();
      
      if (calendarId) {
        setSettings(calendarService.getSettings());
        return true;
      }
      
      setError('No se pudo crear el calendario');
      return false;
    } catch (err) {
      setError('Error al crear el calendario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Seleccionar calendario existente
   */
  const selectCalendar = useCallback(async (calendarId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await calendarService.selectCalendar(calendarId);
      
      if (success) {
        setSettings(calendarService.getSettings());
      } else {
        setError('No se pudo seleccionar el calendario');
      }
      
      return success;
    } catch (err) {
      setError('Error al seleccionar el calendario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualizar configuración
   */
  const updateSettings = useCallback(async (newSettings: Partial<CalendarSettings>): Promise<void> => {
    try {
      await calendarService.saveSettings(newSettings);
      setSettings(calendarService.getSettings());
    } catch (err) {
      setError('Error al guardar la configuración');
    }
  }, []);

  /**
   * Sincronizar cita con calendario
   */
  const syncAppointment = useCallback(async (appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: Date;
    duration: number;
    location?: string;
    notes?: string;
  }): Promise<string | null> => {
    try {
      return await calendarService.syncAppointment(appointment);
    } catch (err) {
      console.error('Error syncing appointment:', err);
      return null;
    }
  }, []);

  /**
   * Sincronizar recordatorio de mantenimiento
   */
  const syncMaintenance = useCallback(async (maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    dueDate: Date;
    notes?: string;
  }): Promise<string | null> => {
    try {
      return await calendarService.syncMaintenanceReminder(maintenance);
    } catch (err) {
      console.error('Error syncing maintenance:', err);
      return null;
    }
  }, []);

  /**
   * Eliminar evento del calendario
   */
  const deleteEvent = useCallback(async (
    entityId: string, 
    entityType: 'appointment' | 'maintenance'
  ): Promise<boolean> => {
    try {
      return await calendarService.deleteEvent(entityId, entityType);
    } catch (err) {
      console.error('Error deleting event:', err);
      return false;
    }
  }, []);

  /**
   * Abrir en Google Calendar (web)
   */
  const openInGoogleCalendar = useCallback(async (event: CalendarEvent): Promise<void> => {
    await calendarService.openGoogleCalendar(event);
  }, []);

  /**
   * Descargar archivo ICS
   */
  const downloadICS = useCallback((event: CalendarEvent, filename: string): void => {
    calendarService.downloadICS(event, filename);
  }, []);

  /**
   * Verificar si un evento está sincronizado
   */
  const isEventSynced = useCallback((
    entityId: string, 
    entityType: 'appointment' | 'maintenance'
  ): boolean => {
    return calendarService.isEventSynced(entityId, entityType);
  }, []);

  /**
   * Desactivar integración
   */
  const disable = useCallback(async (): Promise<void> => {
    await calendarService.disable();
    setSettings(calendarService.getSettings());
  }, []);

  /**
   * Limpiar eventos sincronizados
   */
  const clearSyncedEvents = useCallback(async (): Promise<void> => {
    await calendarService.clearSyncedEvents();
  }, []);

  return {
    // Estado
    settings,
    availableCalendars,
    hasPermission,
    isLoading,
    error,
    isWeb: Platform.OS === 'web',
    
    // Acciones
    requestPermission,
    createCalendar,
    selectCalendar,
    updateSettings,
    syncAppointment,
    syncMaintenance,
    deleteEvent,
    openInGoogleCalendar,
    downloadICS,
    isEventSynced,
    disable,
    clearSyncedEvents,
    refresh: initialize,
  };
}

export default useCalendar;
