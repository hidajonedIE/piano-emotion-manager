/**
 * Calendar Sync Service
 * Sincroniza citas programadas con Google Calendar y Outlook
 */
import * as db from '../getDb().js';
import { appointments, users, calendarConnections } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { createEvent, updateEvent, deleteEvent } from '../_core/calendar/google-calendar.js';
import { isTokenExpired, refreshAccessToken } from '../_core/calendar/oauth-google.js';
import { createEvent as createMsEvent, updateEvent as updateMsEvent, deleteEvent as deleteMsEvent } from '../_core/calendar/microsoft-calendar.js';
import { isTokenExpired as isMsTokenExpired, refreshAccessToken as refreshMsAccessToken } from '../_core/calendar/oauth-microsoft.js';

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
    const database = await getDb().getDb();
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
      const googleResult = await this.syncWithGoogleCalendar(event, userId);
      if (googleResult.success) {
        return googleResult;
      }

      // Si falla Google, intentar con Outlook
      const outlookResult = await this.syncWithOutlookCalendar(event, userId);
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
   * Sincronizar con Google Calendar usando core services
   */
  private static async syncWithGoogleCalendar(event: CalendarEvent, userId: string): Promise<SyncResult> {
    try {
      // 1. Obtener conexión de Google Calendar del usuario
      const database = await getDb().getDb();
      if (!database) {
        return {
          success: false,
          provider: 'google',
          error: 'Database not available',
        };
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'google')
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'google',
          error: 'Google Calendar no está conectado. Por favor, conecta tu cuenta en Configuración.',
        };
      }

      // 2. Verificar si el token está expirado y refrescarlo si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isTokenExpired(connection.expiresAt ? new Date(connection.expiresAt) : null)) {
        console.log('🔄 [GoogleCalendar] Token expired, refreshing...');
        const newTokens = await refreshAccessToken(connection.refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        // Actualizar tokens en BD
        await database
          .update(calendarConnections)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Crear evento en Google Calendar
      const createdEvent = await createEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        {
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
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 día antes
              { method: 'popup', minutes: 60 }, // 1 hora antes
            ],
          },
        }
      );

      console.log('✅ [GoogleCalendar] Event created:', createdEvent.id);
      
      return {
        success: true,
        provider: 'google',
        eventId: createdEvent.id,
        eventUrl: createdEvent.htmlLink,
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
  private static async syncWithOutlookCalendar(event: CalendarEvent, userId: string): Promise<SyncResult> {
    const database = await getDb().getDb();
    if (!database) {
      return {
        success: false,
        provider: 'outlook',
        error: 'Database not available',
      };
    }

    try {
      // 1. Buscar conexión activa de Outlook para este usuario
      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'outlook'),
          eq(calendarConnections.syncEnabled, 1)
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'outlook',
          error: 'No hay conexión activa con Outlook Calendar',
        };
      }

      // 2. Verificar y refrescar token si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isMsTokenExpired(connection.expiresAt)) {
        console.log('⏳ [OutlookCalendar] Token expired, refreshing...');
        const newTokens = await refreshMsAccessToken(refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        // Actualizar tokens en BD
        await database
          .update(calendarConnections)
          .set({
            accessToken,
            refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Crear evento en Outlook Calendar
      const createdEvent = await createMsEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        {
          subject: event.title,
          body: {
            contentType: 'text',
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
        }
      );

      console.log('✅ [OutlookCalendar] Event created:', createdEvent.id);
      
      return {
        success: true,
        provider: 'outlook',
        eventId: createdEvent.id,
        eventUrl: createdEvent.webLink,
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
    const database = await getDb().getDb();
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
        return await this.updateGoogleCalendarEvent(externalEventId, event, userId);
      } else {
        return await this.updateOutlookCalendarEvent(externalEventId, event, userId);
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
   * Actualizar evento en Google Calendar usando core services
   */
  private static async updateGoogleCalendarEvent(
    eventId: string,
    event: CalendarEvent,
    userId: string
  ): Promise<SyncResult> {
    try {
      // 1. Obtener conexión de Google Calendar del usuario
      const database = await getDb().getDb();
      if (!database) {
        return {
          success: false,
          provider: 'google',
          error: 'Database not available',
        };
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'google')
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'google',
          error: 'Google Calendar no está conectado',
        };
      }

      // 2. Verificar y refrescar token si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isTokenExpired(connection.expiresAt ? new Date(connection.expiresAt) : null)) {
        const newTokens = await refreshAccessToken(connection.refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        await database
          .update(calendarConnections)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Actualizar evento en Google Calendar
      const updatedEvent = await updateEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        eventId,
        {
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
        }
      );

      console.log('✅ [GoogleCalendar] Event updated:', updatedEvent.id);
      
      return {
        success: true,
        provider: 'google',
        eventId: updatedEvent.id,
        eventUrl: updatedEvent.htmlLink,
      };
    } catch (error) {
      console.error('[GoogleCalendar] Error updating:', error);
      return {
        success: false,
        provider: 'google',
        error: error instanceof Error ? error.message : 'Error al actualizar evento en Google Calendar',
      };
    }
  }

  /**
   * Actualizar evento en Outlook Calendar usando core services
   */
  private static async updateOutlookCalendarEvent(
    eventId: string,
    event: CalendarEvent,
    userId: string
  ): Promise<SyncResult> {
    try {
      // 1. Obtener conexión de Outlook Calendar del usuario
      const database = await getDb().getDb();
      if (!database) {
        return {
          success: false,
          provider: 'outlook',
          error: 'Database not available',
        };
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'outlook')
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'outlook',
          error: 'Outlook Calendar no está conectado',
        };
      }

      // 2. Verificar y refrescar token si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isMsTokenExpired(connection.expiresAt ? new Date(connection.expiresAt) : null)) {
        const newTokens = await refreshMsAccessToken(connection.refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        await database
          .update(calendarConnections)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Actualizar evento en Outlook Calendar
      const updatedEvent = await updateMsEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        eventId,
        {
          subject: event.title,
          body: {
            contentType: 'text',
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
        }
      );

      console.log('✅ [OutlookCalendar] Event updated:', updatedEvent.id);

      return {
        success: true,
        provider: 'outlook',
        eventId: updatedEvent.id,
        eventUrl: updatedEvent.webLink,
      };
    } catch (error) {
      console.error('[OutlookCalendar] Error updating:', error);
      return {
        success: false,
        provider: 'outlook',
        error: error instanceof Error ? error.message : 'Error al actualizar evento en Outlook Calendar',
      };
    }
  }

  /**
   * Eliminar evento de calendario externo
   */
  static async deleteCalendarEvent(
    userId: string,
    externalEventId: string,
    provider: 'google' | 'outlook'
  ): Promise<SyncResult> {
    try {
      if (provider === 'google') {
        return await this.deleteGoogleCalendarEvent(externalEventId, userId);
      } else {
        return await this.deleteOutlookCalendarEvent(externalEventId, userId);
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
   * Eliminar evento de Google Calendar usando core services
   */
  private static async deleteGoogleCalendarEvent(
    eventId: string,
    userId: string
  ): Promise<SyncResult> {
    try {
      // 1. Obtener conexión de Google Calendar del usuario
      const database = await getDb().getDb();
      if (!database) {
        return {
          success: false,
          provider: 'google',
          error: 'Database not available',
        };
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'google')
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'google',
          error: 'Google Calendar no está conectado',
        };
      }

      // 2. Verificar y refrescar token si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isTokenExpired(connection.expiresAt ? new Date(connection.expiresAt) : null)) {
        const newTokens = await refreshAccessToken(connection.refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        await database
          .update(calendarConnections)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Eliminar evento de Google Calendar
      await deleteEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        eventId
      );

      console.log('✅ [GoogleCalendar] Event deleted:', eventId);
      
      return {
        success: true,
        provider: 'google',
      };
    } catch (error) {
      console.error('[GoogleCalendar] Error deleting:', error);
      return {
        success: false,
        provider: 'google',
        error: error instanceof Error ? error.message : 'Error al eliminar evento de Google Calendar',
      };
    }
  }

  /**
   * Eliminar evento de Outlook Calendar usando core services
   */
  private static async deleteOutlookCalendarEvent(
    eventId: string,
    userId: string
  ): Promise<SyncResult> {
    try {
      // 1. Obtener conexión de Outlook Calendar del usuario
      const database = await getDb().getDb();
      if (!database) {
        return {
          success: false,
          provider: 'outlook',
          error: 'Database not available',
        };
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'outlook')
        ),
      });

      if (!connection) {
        return {
          success: false,
          provider: 'outlook',
          error: 'Outlook Calendar no está conectado',
        };
      }

      // 2. Verificar y refrescar token si es necesario
      let accessToken = connection.accessToken;
      let refreshToken = connection.refreshToken;

      if (isMsTokenExpired(connection.expiresAt ? new Date(connection.expiresAt) : null)) {
        const newTokens = await refreshMsAccessToken(connection.refreshToken);
        accessToken = newTokens.accessToken;
        refreshToken = newTokens.refreshToken;

        await database
          .update(calendarConnections)
          .set({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt: newTokens.expiresAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
      }

      // 3. Eliminar evento de Outlook Calendar
      await deleteMsEvent(
        accessToken,
        refreshToken,
        connection.calendarId,
        eventId
      );

      console.log('✅ [OutlookCalendar] Event deleted:', eventId);

      return {
        success: true,
        provider: 'outlook',
      };
    } catch (error) {
      console.error('[OutlookCalendar] Error deleting:', error);
      return {
        success: false,
        provider: 'outlook',
        error: error instanceof Error ? error.message : 'Error al eliminar evento de Outlook Calendar',
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
      const database = await getDb().getDb();
      if (!database) {
        return {
          hasGoogle: false,
          hasOutlook: false,
        };
      }

      // Verificar Google Calendar
      const googleConnection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'google')
        ),
      });

      // Verificar Outlook Calendar
      const outlookConnection = await database.query.calendarConnections.findFirst({
        where: and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, 'outlook')
        ),
      });

      return {
        hasGoogle: !!googleConnection,
        hasOutlook: !!outlookConnection,
      };
    } catch (error) {
      console.error('[CalendarSync] Error checking connections:', error);
      return {
        hasGoogle: false,
        hasOutlook: false,
      };
    }
  }
}
