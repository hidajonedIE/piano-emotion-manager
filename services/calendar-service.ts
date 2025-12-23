import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_SETTINGS_KEY = '@piano_emotion_calendar_settings';
const SYNCED_EVENTS_KEY = '@piano_emotion_synced_events';

export interface CalendarSettings {
  enabled: boolean;
  calendarId: string | null;
  calendarName: string;
  syncAppointments: boolean;
  syncMaintenanceReminders: boolean;
  reminderMinutesBefore: number;
  colorCode: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  notes?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  alarms?: { relativeOffset: number }[];
  entityId: string;
  entityType: 'appointment' | 'maintenance';
}

interface SyncedEvent {
  localId: string;
  calendarEventId: string;
  entityId: string;
  entityType: string;
  lastSynced: string;
}

const DEFAULT_SETTINGS: CalendarSettings = {
  enabled: false,
  calendarId: null,
  calendarName: 'Piano Emotion',
  syncAppointments: true,
  syncMaintenanceReminders: true,
  reminderMinutesBefore: 60,
  colorCode: '#e94560',
};

/**
 * Servicio de integración con calendarios del dispositivo
 */
class CalendarService {
  private settings: CalendarSettings = DEFAULT_SETTINGS;
  private syncedEvents: Map<string, SyncedEvent> = new Map();
  private initialized = false;

  /**
   * Inicializar el servicio
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadSettings();
    await this.loadSyncedEvents();
    this.initialized = true;
  }

  /**
   * Cargar configuración guardada
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CALENDAR_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[Calendar] Error loading settings:', error);
    }
  }

  /**
   * Guardar configuración
   */
  async saveSettings(settings: Partial<CalendarSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[Calendar] Error saving settings:', error);
    }
  }

  /**
   * Obtener configuración actual
   */
  getSettings(): CalendarSettings {
    return { ...this.settings };
  }

  /**
   * Cargar eventos sincronizados
   */
  private async loadSyncedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNCED_EVENTS_KEY);
      if (stored) {
        const events: SyncedEvent[] = JSON.parse(stored);
        this.syncedEvents = new Map(events.map(e => [e.localId, e]));
      }
    } catch (error) {
      console.error('[Calendar] Error loading synced events:', error);
    }
  }

  /**
   * Guardar eventos sincronizados
   */
  private async saveSyncedEvents(): Promise<void> {
    try {
      const events = Array.from(this.syncedEvents.values());
      await AsyncStorage.setItem(SYNCED_EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('[Calendar] Error saving synced events:', error);
    }
  }

  /**
   * Solicitar permisos de calendario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // En web no hay permisos de calendario nativo
        return false;
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[Calendar] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Verificar si tenemos permisos
   */
  async hasPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener calendarios disponibles
   */
  async getAvailableCalendars(): Promise<Calendar.Calendar[]> {
    try {
      if (Platform.OS === 'web') return [];
      
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) return [];

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Filtrar calendarios que permiten modificación
      return calendars.filter(cal => 
        cal.allowsModifications && 
        cal.source?.type !== 'birthdays'
      );
    } catch (error) {
      console.error('[Calendar] Error getting calendars:', error);
      return [];
    }
  }

  /**
   * Crear calendario dedicado para Piano Emotion
   */
  async createDedicatedCalendar(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return null;

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      // Obtener fuente de calendario por defecto
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendarSource = calendars.find(cal => 
        cal.source?.isLocalAccount || cal.source?.type === 'local'
      )?.source;

      if (!defaultCalendarSource && Platform.OS === 'ios') {
        // En iOS, buscar fuente de iCloud o local
        const sources = await Calendar.getSourcesAsync();
        const localSource = sources.find(s => s.type === 'local' || s.type === 'caldav');
        if (!localSource) {
          console.error('[Calendar] No suitable calendar source found');
          return null;
        }
      }

      const newCalendarId = await Calendar.createCalendarAsync({
        title: this.settings.calendarName,
        color: this.settings.colorCode,
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource?.id,
        source: defaultCalendarSource || {
          isLocalAccount: true,
          name: 'Piano Emotion',
          type: Platform.OS === 'ios' ? Calendar.SourceType.LOCAL : 'local',
        },
        name: this.settings.calendarName,
        ownerAccount: 'Piano Emotion',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      await this.saveSettings({ calendarId: newCalendarId, enabled: true });
      
      return newCalendarId;
    } catch (error) {
      console.error('[Calendar] Error creating calendar:', error);
      return null;
    }
  }

  /**
   * Seleccionar calendario existente
   */
  async selectCalendar(calendarId: string): Promise<boolean> {
    try {
      const calendars = await this.getAvailableCalendars();
      const calendar = calendars.find(c => c.id === calendarId);
      
      if (!calendar) {
        console.error('[Calendar] Calendar not found:', calendarId);
        return false;
      }

      await this.saveSettings({ 
        calendarId, 
        calendarName: calendar.title,
        enabled: true 
      });
      
      return true;
    } catch (error) {
      console.error('[Calendar] Error selecting calendar:', error);
      return false;
    }
  }

  /**
   * Añadir evento al calendario
   */
  async addEvent(event: CalendarEvent): Promise<string | null> {
    try {
      if (!this.settings.enabled || !this.settings.calendarId) {
        return null;
      }

      if (Platform.OS === 'web') {
        // En web, generar enlace para añadir a Google Calendar
        return this.generateGoogleCalendarUrl(event);
      }

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) return null;

      // Configurar alarmas
      const alarms = event.alarms || [
        { relativeOffset: -this.settings.reminderMinutesBefore }
      ];

      const eventId = await Calendar.createEventAsync(this.settings.calendarId, {
        title: event.title,
        notes: event.notes,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay || false,
        alarms,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Guardar referencia del evento sincronizado
      const localId = `${event.entityType}_${event.entityId}`;
      this.syncedEvents.set(localId, {
        localId,
        calendarEventId: eventId,
        entityId: event.entityId,
        entityType: event.entityType,
        lastSynced: new Date().toISOString(),
      });
      await this.saveSyncedEvents();

      return eventId;
    } catch (error) {
      console.error('[Calendar] Error adding event:', error);
      return null;
    }
  }

  /**
   * Actualizar evento en el calendario
   */
  async updateEvent(event: CalendarEvent): Promise<boolean> {
    try {
      if (!this.settings.enabled || !this.settings.calendarId) {
        return false;
      }

      if (Platform.OS === 'web') return false;

      const localId = `${event.entityType}_${event.entityId}`;
      const syncedEvent = this.syncedEvents.get(localId);

      if (!syncedEvent) {
        // Si no existe, crear nuevo
        await this.addEvent(event);
        return true;
      }

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) return false;

      await Calendar.updateEventAsync(syncedEvent.calendarEventId, {
        title: event.title,
        notes: event.notes,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay || false,
      });

      // Actualizar timestamp
      syncedEvent.lastSynced = new Date().toISOString();
      this.syncedEvents.set(localId, syncedEvent);
      await this.saveSyncedEvents();

      return true;
    } catch (error) {
      console.error('[Calendar] Error updating event:', error);
      return false;
    }
  }

  /**
   * Eliminar evento del calendario
   */
  async deleteEvent(entityId: string, entityType: 'appointment' | 'maintenance'): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;

      const localId = `${entityType}_${entityId}`;
      const syncedEvent = this.syncedEvents.get(localId);

      if (!syncedEvent) return true; // Ya no existe

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) return false;

      try {
        await Calendar.deleteEventAsync(syncedEvent.calendarEventId);
      } catch (e) {
        // El evento puede haber sido eliminado manualmente
        console.log('[Calendar] Event may have been deleted manually');
      }

      this.syncedEvents.delete(localId);
      await this.saveSyncedEvents();

      return true;
    } catch (error) {
      console.error('[Calendar] Error deleting event:', error);
      return false;
    }
  }

  /**
   * Sincronizar cita con el calendario
   */
  async syncAppointment(appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: Date;
    duration: number; // minutos
    location?: string;
    notes?: string;
  }): Promise<string | null> {
    if (!this.settings.syncAppointments) return null;

    const endDate = new Date(appointment.date.getTime() + appointment.duration * 60 * 1000);

    return this.addEvent({
      title: `${appointment.serviceName} - ${appointment.clientName}`,
      notes: appointment.notes,
      location: appointment.location,
      startDate: appointment.date,
      endDate,
      entityId: appointment.id,
      entityType: 'appointment',
    });
  }

  /**
   * Sincronizar recordatorio de mantenimiento
   */
  async syncMaintenanceReminder(maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    dueDate: Date;
    notes?: string;
  }): Promise<string | null> {
    if (!this.settings.syncMaintenanceReminders) return null;

    return this.addEvent({
      title: `🎹 Mantenimiento: ${maintenance.pianoName}`,
      notes: `Cliente: ${maintenance.clientName}\n${maintenance.notes || ''}`,
      startDate: maintenance.dueDate,
      endDate: new Date(maintenance.dueDate.getTime() + 60 * 60 * 1000), // 1 hora
      allDay: true,
      entityId: maintenance.id,
      entityType: 'maintenance',
    });
  }

  /**
   * Generar URL para Google Calendar (web)
   */
  private generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
      details: event.notes || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Abrir enlace de Google Calendar
   */
  async openGoogleCalendar(event: CalendarEvent): Promise<void> {
    const url = this.generateGoogleCalendarUrl(event);
    await Linking.openURL(url);
  }

  /**
   * Generar archivo ICS para importar
   */
  generateICS(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    };

    const uid = `${event.entityId}@pianoemotion.es`;
    const now = formatDate(new Date());

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Piano Emotion//Piano Emotion Manager//ES
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${(event.notes || '').replace(/\n/g, '\\n')}
LOCATION:${event.location || ''}
BEGIN:VALARM
TRIGGER:-PT${this.settings.reminderMinutesBefore}M
ACTION:DISPLAY
DESCRIPTION:Recordatorio
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Descargar archivo ICS
   */
  downloadICS(event: CalendarEvent, filename: string): void {
    if (Platform.OS !== 'web') return;

    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Verificar si un evento está sincronizado
   */
  isEventSynced(entityId: string, entityType: 'appointment' | 'maintenance'): boolean {
    const localId = `${entityType}_${entityId}`;
    return this.syncedEvents.has(localId);
  }

  /**
   * Obtener todos los eventos sincronizados
   */
  getSyncedEvents(): SyncedEvent[] {
    return Array.from(this.syncedEvents.values());
  }

  /**
   * Limpiar todos los eventos sincronizados
   */
  async clearSyncedEvents(): Promise<void> {
    if (Platform.OS !== 'web' && this.settings.calendarId) {
      const hasPermission = await this.hasPermissions();
      if (hasPermission) {
        for (const event of this.syncedEvents.values()) {
          try {
            await Calendar.deleteEventAsync(event.calendarEventId);
          } catch (e) {
            // Ignorar errores de eventos ya eliminados
          }
        }
      }
    }

    this.syncedEvents.clear();
    await this.saveSyncedEvents();
  }

  /**
   * Desactivar integración
   */
  async disable(): Promise<void> {
    await this.saveSettings({ enabled: false });
  }
}

// Exportar instancia singleton
export const calendarService = new CalendarService();

export default calendarService;
