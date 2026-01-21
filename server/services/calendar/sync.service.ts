/**
 * Servicio de Sincronización con Calendarios Externos
 * Piano Emotion Manager
 * 
 * Soporta Google Calendar, Outlook y CalDAV
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and } from 'drizzle-orm';
import {
  calendarConnections,
  externalCalendars,
  calendarEvents,
  type CalendarProvider,
} from '../../../drizzle/calendar-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ExternalEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  status?: string;
  etag?: string;
}

export interface SyncResult {
  imported: number;
  exported: number;
  updated: number;
  deleted: number;
  errors: string[];
}

// ============================================================================
// Calendar Sync Service
// ============================================================================

export class CalendarSyncService {
  private userId: number;
  private organizationId: number;

  constructor(userId: number, organizationId: number) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Inicia conexión OAuth con proveedor
   */
  async initiateOAuthConnection(provider: CalendarProvider): Promise<string> {
    // URLs de autorización por proveedor
    const authUrls: Record<CalendarProvider, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      apple: '', // Apple usa Sign in with Apple
      caldav: '', // CalDAV no usa OAuth
    };

    const clientIds: Record<CalendarProvider, string> = {
      google: process.env.GOOGLE_CLIENT_ID || '',
      outlook: process.env.OUTLOOK_CLIENT_ID || '',
      apple: '',
      caldav: '',
    };

    const scopes: Record<CalendarProvider, string> = {
      google: 'https://www.googleapis.com/auth/calendar',
      outlook: 'https://graph.microsoft.com/Calendars.ReadWrite',
      apple: '',
      caldav: '',
    };

    const redirectUri = `${process.env.APP_URL}/api/calendar/oauth/callback`;

    const params = new URLSearchParams({
      client_id: clientIds[provider],
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes[provider],
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ userId: this.userId, provider }),
    });

    return `${authUrls[provider]}?${params.toString()}`;
  }

  /**
   * Completa conexión OAuth
   */
  async completeOAuthConnection(
    provider: CalendarProvider,
    code: string
  ): Promise<typeof calendarConnections.$inferSelect> {
    // Intercambiar código por tokens
    const tokens = await this.exchangeCodeForTokens(provider, code);

    // Obtener información de la cuenta
    const accountInfo = await this.getAccountInfo(provider, tokens.accessToken);

    // Guardar conexión
    const [connection] = await getDb().insert(calendarConnections).values({
      userId: this.userId,
      organizationId: this.organizationId,
      provider,
      accountEmail: accountInfo.email,
      accountName: accountInfo.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    }).returning();

    // Obtener calendarios disponibles
    await this.fetchExternalCalendars(connection.id, provider, tokens.accessToken);

    return connection;
  }

  /**
   * Conecta calendario CalDAV
   */
  async connectCalDAV(
    url: string,
    username: string,
    password: string
  ): Promise<typeof calendarConnections.$inferSelect> {
    // Verificar conexión
    const isValid = await this.verifyCalDAVConnection(url, username, password);
    if (!isValid) {
      throw new Error('No se pudo conectar al servidor CalDAV');
    }

    const [connection] = await getDb().insert(calendarConnections).values({
      userId: this.userId,
      organizationId: this.organizationId,
      provider: 'caldav',
      accountEmail: username,
      caldavUrl: url,
      caldavUsername: username,
      caldavPassword: password, // En producción, encriptar
    }).returning();

    return connection;
  }

  /**
   * Desconecta un calendario
   */
  async disconnectCalendar(connectionId: number): Promise<void> {
    // Eliminar calendarios externos
    await db
      .delete(externalCalendars)
      .where(eq(externalCalendars.connectionId, connectionId));

    // Eliminar conexión
    await db
      .delete(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.userId, this.userId)
        )
      );
  }

  /**
   * Obtiene conexiones del usuario
   */
  async getConnections(): Promise<Array<typeof calendarConnections.$inferSelect>> {
    return getDb().query.calendarConnections.findMany({
      where: eq(calendarConnections.userId, this.userId),
    });
  }

  // ============================================================================
  // Synchronization
  // ============================================================================

  /**
   * Sincroniza todos los calendarios conectados
   */
  async syncAll(): Promise<SyncResult> {
    const connections = await this.getConnections();
    const result: SyncResult = {
      imported: 0,
      exported: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    for (const connection of connections) {
      if (!connection.syncEnabled) continue;

      try {
        const syncResult = await this.syncConnection(connection);
        result.imported += syncResult.imported;
        result.exported += syncResult.exported;
        result.updated += syncResult.updated;
        result.deleted += syncResult.deleted;
      } catch (error: unknown) {
        result.errors.push(`${connection.provider}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Sincroniza una conexión específica
   */
  async syncConnection(
    connection: typeof calendarConnections.$inferSelect
  ): Promise<SyncResult> {
    const result: SyncResult = {
      imported: 0,
      exported: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    // Refrescar token si es necesario
    const accessToken = await this.ensureValidToken(connection);

    // Obtener calendarios seleccionados
    const calendars = await getDb().query.externalCalendars.findMany({
      where: and(
        eq(externalCalendars.connectionId, connection.id),
        eq(externalCalendars.isSelected, true)
      ),
    });

    for (const calendar of calendars) {
      try {
        // Importar eventos externos
        if (connection.syncDirection !== 'export') {
          const imported = await this.importEvents(
            connection.provider,
            accessToken,
            calendar.externalId
          );
          result.imported += imported;
        }

        // Exportar eventos locales
        if (connection.syncDirection !== 'import') {
          const exported = await this.exportEvents(
            connection.provider,
            accessToken,
            calendar.externalId
          );
          result.exported += exported;
        }
      } catch (error: unknown) {
        result.errors.push(`Calendar ${calendar.name}: ${error.message}`);
      }
    }

    // Actualizar última sincronización
    await db
      .update(calendarConnections)
      .set({
        lastSyncAt: new Date(),
        syncErrors: result.errors.length > 0 ? result.errors : null,
      })
      .where(eq(calendarConnections.id, connection.id));

    return result;
  }

  /**
   * Importa eventos de un calendario externo
   */
  private async importEvents(
    provider: CalendarProvider,
    accessToken: string,
    calendarId: string
  ): Promise<number> {
    // Obtener eventos del calendario externo
    const externalEvents = await this.fetchExternalEvents(provider, accessToken, calendarId);
    let imported = 0;

    for (const extEvent of externalEvents) {
      // Verificar si ya existe
      const existing = await getDb().query.calendarEvents.findFirst({
        where: and(
          eq(calendarEvents.externalId, extEvent.id),
          eq(calendarEvents.organizationId, this.organizationId)
        ),
      });

      if (existing) {
        // Actualizar si cambió
        if (existing.externalEtag !== extEvent.etag) {
          await this.updateEventFromExternal(existing.id, extEvent);
        }
      } else {
        // Crear nuevo
        await this.createEventFromExternal(extEvent, calendarId);
        imported++;
      }
    }

    return imported;
  }

  /**
   * Exporta eventos locales a calendario externo
   */
  private async exportEvents(
    provider: CalendarProvider,
    accessToken: string,
    calendarId: string
  ): Promise<number> {
    // Obtener eventos locales sin sincronizar
    const localEvents = await getDb().query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.organizationId, this.organizationId),
        eq(calendarEvents.userId, this.userId)
      ),
    });

    let exported = 0;

    for (const event of localEvents) {
      if (!event.externalId) {
        // Crear en calendario externo
        const externalId = await this.createExternalEvent(provider, accessToken, calendarId, event);
        
        await db
          .update(calendarEvents)
          .set({ externalId, lastSyncedAt: new Date() })
          .where(eq(calendarEvents.id, event.id));
        
        exported++;
      }
    }

    return exported;
  }

  // ============================================================================
  // Provider-Specific Methods
  // ============================================================================

  private async exchangeCodeForTokens(
    provider: CalendarProvider,
    code: string
  ): Promise<OAuthTokens> {
    // Implementación específica por proveedor
    // En producción, hacer llamadas reales a las APIs
    return {
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600000),
    };
  }

  private async getAccountInfo(
    provider: CalendarProvider,
    accessToken: string
  ): Promise<{ email: string; name: string }> {
    // Implementación específica por proveedor
    return {
      email: 'user@example.com',
      name: 'Usuario',
    };
  }

  private async fetchExternalCalendars(
    connectionId: number,
    provider: CalendarProvider,
    accessToken: string
  ): Promise<void> {
    // Implementación específica por proveedor
    // Guardar calendarios disponibles
  }

  private async fetchExternalEvents(
    provider: CalendarProvider,
    accessToken: string,
    calendarId: string
  ): Promise<ExternalEvent[]> {
    // Implementación específica por proveedor
    return [];
  }

  private async createExternalEvent(
    provider: CalendarProvider,
    accessToken: string,
    calendarId: string,
    event: typeof calendarEvents.$inferSelect
  ): Promise<string> {
    // Implementación específica por proveedor
    return `external_${event.id}`;
  }

  private async createEventFromExternal(
    extEvent: ExternalEvent,
    calendarId: string
  ): Promise<void> {
    const startDate = extEvent.start.date || extEvent.start.dateTime?.split('T')[0];
    const endDate = extEvent.end.date || extEvent.end.dateTime?.split('T')[0];
    const startTime = extEvent.start.dateTime?.split('T')[1]?.substring(0, 5);
    const endTime = extEvent.end.dateTime?.split('T')[1]?.substring(0, 5);

    await getDb().insert(calendarEvents).values({
      organizationId: this.organizationId,
      userId: this.userId,
      type: 'appointment',
      status: 'confirmed',
      title: extEvent.title,
      description: extEvent.description,
      location: extEvent.location,
      startDate: startDate!,
      endDate: endDate!,
      startTime,
      endTime,
      isAllDay: !extEvent.start.dateTime,
      externalId: extEvent.id,
      externalEtag: extEvent.etag,
      lastSyncedAt: new Date(),
    });
  }

  private async updateEventFromExternal(
    eventId: number,
    extEvent: ExternalEvent
  ): Promise<void> {
    await db
      .update(calendarEvents)
      .set({
        title: extEvent.title,
        description: extEvent.description,
        location: extEvent.location,
        externalEtag: extEvent.etag,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, eventId));
  }

  private async ensureValidToken(
    connection: typeof calendarConnections.$inferSelect
  ): Promise<string> {
    if (!connection.tokenExpiresAt || connection.tokenExpiresAt > new Date()) {
      return connection.accessToken || '';
    }

    // Refrescar token
    const newTokens = await this.refreshAccessToken(
      connection.provider,
      connection.refreshToken || ''
    );

    await db
      .update(calendarConnections)
      .set({
        accessToken: newTokens.accessToken,
        tokenExpiresAt: newTokens.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connection.id));

    return newTokens.accessToken;
  }

  private async refreshAccessToken(
    provider: CalendarProvider,
    refreshToken: string
  ): Promise<OAuthTokens> {
    // Implementación específica por proveedor
    return {
      accessToken: 'new_access_token',
      refreshToken,
      expiresAt: new Date(Date.now() + 3600000),
    };
  }

  private async verifyCalDAVConnection(
    url: string,
    username: string,
    password: string
  ): Promise<boolean> {
    // Verificar conexión CalDAV
    return true;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCalendarSyncService(userId: number, organizationId: number): CalendarSyncService {
  return new CalendarSyncService(userId, organizationId);
}
