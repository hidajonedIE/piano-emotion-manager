/**
 * Servicio de integración con calendarios para webapp
 * - Google Calendar (vía URL)
 * - Archivos ICS para importar a cualquier calendario
 * - Outlook Calendar (vía URL)
 */

const CALENDAR_SETTINGS_KEY = 'piano_emotion_calendar_settings';

export interface CalendarSettings {
  enabled: boolean;
  defaultCalendar: 'google' | 'outlook' | 'ics';
  syncAppointments: boolean;
  syncMaintenanceReminders: boolean;
  reminderMinutesBefore: number;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  entityId: string;
  entityType: 'appointment' | 'maintenance';
}

const DEFAULT_SETTINGS: CalendarSettings = {
  enabled: true,
  defaultCalendar: 'google',
  syncAppointments: true,
  syncMaintenanceReminders: true,
  reminderMinutesBefore: 60,
};

/**
 * Servicio de calendario para webapp
 */
class WebCalendarService {
  private settings: CalendarSettings = DEFAULT_SETTINGS;
  private initialized = false;

  /**
   * Inicializar el servicio
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.loadSettings();
    this.initialized = true;
  }

  /**
   * Cargar configuración guardada
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(CALENDAR_SETTINGS_KEY);
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
      localStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(this.settings));
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
   * Formatear fecha para URL de calendario
   */
  private formatDateForUrl(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  }

  /**
   * Formatear fecha para ICS
   */
  private formatDateForICS(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
  }

  /**
   * Generar URL para Google Calendar
   */
  generateGoogleCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatDateForUrl(event.startDate)}/${this.formatDateForUrl(event.endDate)}`,
      details: event.description || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generar URL para Outlook Calendar
   */
  generateOutlookCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description || '',
      location: event.location || '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Generar contenido de archivo ICS
   */
  generateICS(event: CalendarEvent): string {
    const uid = `${event.entityId}-${event.entityType}@pianoemotion.app`;
    const now = this.formatDateForICS(new Date());
    const reminderMinutes = this.settings.reminderMinutesBefore;

    // Escapar caracteres especiales en texto
    const escapeText = (text: string) => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Piano Emotion//Piano Emotion Manager//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${this.formatDateForICS(event.startDate)}
DTEND:${this.formatDateForICS(event.endDate)}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description || '')}
LOCATION:${escapeText(event.location || '')}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT${reminderMinutes}M
ACTION:DISPLAY
DESCRIPTION:Recordatorio: ${escapeText(event.title)}
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Descargar archivo ICS
   */
  downloadICS(event: CalendarEvent, filename?: string): void {
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Abrir en el calendario configurado por defecto
   */
  openInCalendar(event: CalendarEvent): void {
    let url: string;

    switch (this.settings.defaultCalendar) {
      case 'outlook':
        url = this.generateOutlookCalendarUrl(event);
        window.open(url, '_blank');
        break;
      case 'ics':
        this.downloadICS(event);
        break;
      case 'google':
      default:
        url = this.generateGoogleCalendarUrl(event);
        window.open(url, '_blank');
        break;
    }
  }

  /**
   * Crear evento de cita
   */
  createAppointmentEvent(appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: Date;
    duration: number; // minutos
    location?: string;
    notes?: string;
  }): CalendarEvent {
    const endDate = new Date(appointment.date.getTime() + appointment.duration * 60 * 1000);

    return {
      title: `🎹 ${appointment.serviceName} - ${appointment.clientName}`,
      description: appointment.notes ? `Notas: ${appointment.notes}` : undefined,
      location: appointment.location,
      startDate: appointment.date,
      endDate,
      entityId: appointment.id,
      entityType: 'appointment',
    };
  }

  /**
   * Crear evento de mantenimiento
   */
  createMaintenanceEvent(maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    dueDate: Date;
    notes?: string;
  }): CalendarEvent {
    // Mantenimiento como evento de día completo
    const startDate = new Date(maintenance.dueDate);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(maintenance.dueDate);
    endDate.setHours(10, 0, 0, 0);

    return {
      title: `🔧 Mantenimiento: ${maintenance.pianoName}`,
      description: `Cliente: ${maintenance.clientName}${maintenance.notes ? `\nNotas: ${maintenance.notes}` : ''}`,
      startDate,
      endDate,
      allDay: true,
      entityId: maintenance.id,
      entityType: 'maintenance',
    };
  }

  /**
   * Añadir cita al calendario
   */
  addAppointmentToCalendar(appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    date: Date;
    duration: number;
    location?: string;
    notes?: string;
  }): void {
    if (!this.settings.enabled || !this.settings.syncAppointments) return;
    
    const event = this.createAppointmentEvent(appointment);
    this.openInCalendar(event);
  }

  /**
   * Añadir mantenimiento al calendario
   */
  addMaintenanceToCalendar(maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    dueDate: Date;
    notes?: string;
  }): void {
    if (!this.settings.enabled || !this.settings.syncMaintenanceReminders) return;
    
    const event = this.createMaintenanceEvent(maintenance);
    this.openInCalendar(event);
  }
}

// Exportar instancia singleton
export const calendarService = new WebCalendarService();

export default calendarService;
