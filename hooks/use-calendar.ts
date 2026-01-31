import { useState, useEffect, useCallback } from 'react';
import { calendarService, CalendarSettings, CalendarEvent } from '@/services/calendar-service';

/**
 * Hook para integración con calendarios en webapp
 */
export function useCalendar() {
  const [settings, setSettings] = useState<CalendarSettings>(calendarService.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setIsLoading(true);
    try {
      await calendarService.initialize();
      setSettings(calendarService.getSettings());
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualizar configuración
   */
  const updateSettings = useCallback(async (newSettings: Partial<CalendarSettings>): Promise<void> => {
    await calendarService.saveSettings(newSettings);
    setSettings(calendarService.getSettings());
  }, []);

  /**
   * Añadir cita al calendario
   */
  const addAppointment = useCallback((appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: Date;
    duration: number;
    location?: string;
    notes?: string;
  }): void => {
    calendarService.addAppointmentToCalendar(appointment);
  }, []);

  /**
   * Añadir mantenimiento al calendario
   */
  const addMaintenance = useCallback((maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    dueDate: Date;
    notes?: string;
  }): void => {
    calendarService.addMaintenanceToCalendar(maintenance);
  }, []);

  /**
   * Abrir evento en calendario
   */
  const openInCalendar = useCallback((event: CalendarEvent): void => {
    calendarService.openInCalendar(event);
  }, []);

  /**
   * Descargar archivo ICS
   */
  const downloadICS = useCallback((event: CalendarEvent, filename?: string): void => {
    calendarService.downloadICS(event, filename);
  }, []);

  /**
   * Generar URL de Google Calendar
   */
  const getGoogleCalendarUrl = useCallback((event: CalendarEvent): string => {
    return calendarService.generateGoogleCalendarUrl(event);
  }, []);

  /**
   * Generar URL de Outlook Calendar
   */
  const getOutlookCalendarUrl = useCallback((event: CalendarEvent): string => {
    return calendarService.generateOutlookCalendarUrl(event);
  }, []);

  return {
    // Estado
    settings,
    isLoading,

    // Acciones
    updateSettings,
    addAppointment,
    addMaintenance,
    openInCalendar,
    downloadICS,
    getGoogleCalendarUrl,
    getOutlookCalendarUrl,
  };
}

export default useCalendar;
