/**
 * Calendar Sync Service
 * Sincroniza citas programadas con Google Calendar y Outlook
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as db from '../db.js';
import { appointments, users } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

const execAsync = promisify(exec);

interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
  attendees?: string[]; // emails
}

interface SyncResult {
  success: boolean;
  provider: 'google' | 'outlook' | 'none';
  eventId?: string;
  eventUrl?: string;
  error?: string;
}

export class CalendarSyncService {
  /**
   * Sincronizar cita con calendario externo (Google o Outlook)
   */
  static async syncAppointment(
    userId: string,
    appointmentId: number
  ): Promise<SyncResult> {
    const database = await db.getDb();
    if (!database) {
      return {
        success: false,
        provider: 'none',
        error: 'Database not available',
      };
    }

    try {
      // Obtener la cita
      const appointment = await database.query.appointments.findFirst({
        where: and(
          eq(appointments.id, appointmentId),
          eq(appointments.odId, userId)
        ),
        with: {
          piano: true,
          client: true,
        },
      });

      if (!appointment) {
        return {
          success: false,
          provider: 'none',
          error: 'Cita no encontrada',
        };
      }

      // Obtener usuario para ver qué calendario tiene configurado
      const user = await database.query.users.findFirst({
        where: eq(users.openId, userId),
      });

      if (!user) {
        return {
          success: false,
          provider: 'none',
          error: 'Usuario no encontrado',
        };
      }

      // Preparar datos del evento
      const event = this.prepareCalendarEvent(appointment);

      // Intentar sincronizar con Google Calendar primero
      const googleResult = await this.syncWithGoogleCalendar(event);
      if (googleResult.success) {
        return googleResult;
      }

      // Si falla Google, intentar con Outlook
      const outlookResult = await this.syncWithOutlookCalendar(event);
      if (outlookResult.success) {
        return outlookResult;
      }

      // Si ambos fallan, retornar error
      return {
        success: false,
        provider: 'none',
        error: 'No se pudo sincronizar con ningún calendario. Verifica que tengas Google Calendar o Outlook conectado.',
      };
    } catch (error) {
      console.error('[CalendarSync] Error:', error);
      return {
        success: false,
        provider: 'none',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Preparar datos del evento para calendario
   */
  private static prepareCalendarEvent(appointment: any): CalendarEvent {
    const piano = appointment.piano;
    const client = appointment.client;

    // Construir título
    const serviceType = this.getServiceTypeName(appointment.type);
    const title = `${serviceType} - ${piano.brand} ${piano.model}`;

    // Construir descripción
    const description = [
      `Cliente: ${client.name}`,
      `Piano: ${piano.brand} ${piano.model}`,
      piano.serialNumber ? `Número de serie: ${piano.serialNumber}` : '',
      `Tipo de servicio: ${serviceType}`,
      appointment.notes ? `\nNotas: ${appointment.notes}` : '',
    ].filter(Boolean).join('\n');

    // Calcular fechas de inicio y fin
    const startDateTime = this.combineDateTime(appointment.date, appointment.time || '09:00');
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + (appointment.duration || 60));

    // Preparar ubicación
    const location = client.address || undefined;

    // Preparar asistentes
    const attendees: string[] = [];
    if (client.email) {
      attendees.push(client.email);
    }

    return {
      title,
      description,
      location,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      attendees: attendees.length > 0 ? attendees : undefined,
    };
  }

  /**
   * Sincronizar con Google Calendar usando MCP
   */
  private static async syncWithGoogleCalendar(event: CalendarEvent): Promise<SyncResult> {
    try {
      // Preparar comando para MCP de Google Calendar
      const eventData = JSON.stringify({
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'Europe/Madrid', // Ajustar según zona horaria del usuario
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'Europe/Madrid',
        },
        attendees: event.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 día antes
            { method: 'popup', minutes: 60 }, // 1 hora antes
          ],
        },
      });

      // Llamar a MCP de Google Calendar
      const command = `manus-mcp-cli tool call create_event --server google-calendar --input '${eventData.replace(/'/g, "\\'")}'`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error('[GoogleCalendar] Error:', stderr);
        return {
          success: false,
          provider: 'google',
          error: stderr,
        };
      }

      // Parsear respuesta
      const response = JSON.parse(stdout);
      
      return {
        success: true,
        provider: 'google',
        eventId: response.id,
        eventUrl: response.htmlLink,
      };
    } catch (error) {
      console.error('[GoogleCalendar] Error:', error);
      return {
        success: false,
        provider: 'google',
        error: error instanceof Error ? error.message : 'Error al sincronizar con Google Calendar',
      };
    }
  }

  /**
   * Sincronizar con Outlook Calendar usando Microsoft Graph API
   */
  private static async syncWithOutlookCalendar(event: CalendarEvent): Promise<SyncResult> {
    try {
      // Preparar datos del evento para Outlook
      const eventData = JSON.stringify({
        subject: event.title,
        body: {
          contentType: 'Text',
          content: event.description,
        },
        start: {
          dateTime: event.startDateTime,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'Europe/Madrid',
        },
        location: event.location ? {
          displayName: event.location,
        } : undefined,
        attendees: event.attendees?.map(email => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        })),
        isReminderOn: true,
        reminderMinutesBeforeStart: 60,
      });

      // Aquí iría la llamada a Microsoft Graph API
      // Por ahora, retornamos error ya que no está implementado
      return {
        success: false,
        provider: 'outlook',
        error: 'Sincronización con Outlook no disponible aún',
      };
    } catch (error) {
      console.error('[OutlookCalendar] Error:', error);
      return {
        success: false,
        provider: 'outlook',
        error: error instanceof Error ? error.message : 'Error al sincronizar con Outlook',
      };
    }
  }

  /**
   * Sincronizar múltiples citas
   */
  static async syncMultipleAppointments(
    userId: string,
    appointmentIds: number[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const appointmentId of appointmentIds) {
      const result = await this.syncAppointment(userId, appointmentId);
      results.push(result);

      // Pequeña pausa entre sincronizaciones
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Actualizar evento en calendario externo
   */
  static async updateCalendarEvent(
    userId: string,
    appointmentId: number,
    externalEventId: string,
    provider: 'google' | 'outlook'
  ): Promise<SyncResult> {
    const database = await db.getDb();
    if (!database) {
      return {
        success: false,
        provider,
        error: 'Database not available',
      };
    }

    try {
      // Obtener la cita actualizada
      const appointment = await database.query.appointments.findFirst({
        where: and(
          eq(appointments.id, appointmentId),
          eq(appointments.odId, userId)
        ),
        with: {
          piano: true,
          client: true,
        },
      });

      if (!appointment) {
        return {
          success: false,
          provider,
          error: 'Cita no encontrada',
        };
      }

      // Preparar datos del evento
      const event = this.prepareCalendarEvent(appointment);

      if (provider === 'google') {
        return await this.updateGoogleCalendarEvent(externalEventId, event);
      } else {
        return await this.updateOutlookCalendarEvent(externalEventId, event);
      }
    } catch (error) {
      console.error('[CalendarSync] Error updating:', error);
      return {
        success: false,
        provider,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Actualizar evento en Google Calendar
   */
  private static async updateGoogleCalendarEvent(
    eventId: string,
    event: CalendarEvent
  ): Promise<SyncResult> {
    try {
      const eventData = JSON.stringify({
        eventId,
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'Europe/Madrid',
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'Europe/Madrid',
        },
        attendees: event.attendees?.map(email => ({ email })),
      });

      const command = `manus-mcp-cli tool call update_event --server google-calendar --input '${eventData.replace(/'/g, "\\'")}'`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        return {
          success: false,
          provider: 'google',
          error: stderr,
        };
      }

      const response = JSON.parse(stdout);
      
      return {
        success: true,
        provider: 'google',
        eventId: response.id,
        eventUrl: response.htmlLink,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'google',
        error: error instanceof Error ? error.message : 'Error al actualizar evento en Google Calendar',
      };
    }
  }

  /**
   * Actualizar evento en Outlook Calendar
   */
  private static async updateOutlookCalendarEvent(
    eventId: string,
    event: CalendarEvent
  ): Promise<SyncResult> {
    // Por implementar
    return {
      success: false,
      provider: 'outlook',
      error: 'Actualización de eventos en Outlook no disponible aún',
    };
  }

  /**
   * Eliminar evento de calendario externo
   */
  static async deleteCalendarEvent(
    externalEventId: string,
    provider: 'google' | 'outlook'
  ): Promise<SyncResult> {
    try {
      if (provider === 'google') {
        const command = `manus-mcp-cli tool call delete_event --server google-calendar --input '{"eventId":"${externalEventId}"}'`;
        const { stderr } = await execAsync(command);

        if (stderr) {
          return {
            success: false,
            provider: 'google',
            error: stderr,
          };
        }

        return {
          success: true,
          provider: 'google',
        };
      } else {
        return {
          success: false,
          provider: 'outlook',
          error: 'Eliminación de eventos en Outlook no disponible aún',
        };
      }
    } catch (error) {
      return {
        success: false,
        provider,
        error: error instanceof Error ? error.message : 'Error al eliminar evento',
      };
    }
  }

  /**
   * Combinar fecha y hora
   */
  private static combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  /**
   * Obtener nombre del tipo de servicio
   */
  private static getServiceTypeName(serviceType: string): string {
    switch (serviceType) {
      case 'tuning':
        return 'Afinación';
      case 'regulation':
        return 'Regulación';
      case 'repair':
        return 'Reparación';
      default:
        return 'Servicio';
    }
  }

  /**
   * Verificar si el usuario tiene calendario conectado
   */
  static async hasCalendarConnected(userId: string): Promise<{
    hasGoogle: boolean;
    hasOutlook: boolean;
  }> {
    try {
      // Verificar Google Calendar
      const googleCommand = 'manus-mcp-cli tool call list_calendars --server google-calendar --input \'{}\'';
      let hasGoogle = false;
      try {
        const { stderr: googleError } = await execAsync(googleCommand);
        hasGoogle = !googleError;
      } catch {
        hasGoogle = false;
      }

      // Verificar Outlook (por implementar)
      const hasOutlook = false;

      return {
        hasGoogle,
        hasOutlook,
      };
    } catch (error) {
      return {
        hasGoogle: false,
        hasOutlook: false,
      };
    }
  }
}
