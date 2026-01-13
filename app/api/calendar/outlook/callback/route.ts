/**
 * Outlook Calendar OAuth Callback Route
 * Handles the OAuth callback from Microsoft after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '../../../../../server/db';
import { calendarConnections } from '../../../../../drizzle/schema';
import { exchangeCodeForTokens } from '../../../../../server/_core/calendar/oauth-microsoft';
import { listCalendars } from '../../../../../server/_core/calendar/microsoft-calendar';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in?error=unauthorized', request.url)
      );
    }

    // 2. Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');

    // 3. Manejar errores de autorización
    if (error) {
      console.error('❌ [OutlookCalendar] Authorization error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/settings/calendar-settings?error=${error}`, request.url)
      );
    }

    // 4. Verificar que tenemos el código de autorización
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings/calendar-settings?error=missing_code', request.url)
      );
    }

    // 5. Intercambiar código por tokens
    console.log('🔄 [OutlookCalendar] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken || !tokens.refreshToken) {
      console.error('❌ [OutlookCalendar] Missing tokens');
      return NextResponse.redirect(
        new URL('/settings/calendar-settings?error=token_exchange_failed', request.url)
      );
    }

    // 6. Obtener lista de calendarios del usuario
    console.log('🔄 [OutlookCalendar] Fetching user calendars...');
    const calendars = await listCalendars(
      tokens.accessToken,
      tokens.refreshToken
    );

    if (!calendars || calendars.length === 0) {
      console.error('❌ [OutlookCalendar] No calendars found');
      return NextResponse.redirect(
        new URL('/settings/calendar-settings?error=no_calendars', request.url)
      );
    }

    // 7. Usar el calendario principal (isDefaultCalendar)
    const primaryCalendar = calendars.find(cal => cal.isDefaultCalendar) || calendars[0];

    // 8. Guardar conexión en la base de datos
    const database = await getDb();
    if (!database) {
      console.error('❌ [OutlookCalendar] Database not available');
      return NextResponse.redirect(
        new URL('/settings/calendar-settings?error=database_error', request.url)
      );
    }

    // 9. Verificar si ya existe una conexión para este usuario y proveedor
    const existingConnection = await database.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.provider, 'outlook')
      ),
    });

    const connectionId = existingConnection?.id || nanoid();

    // 10. Insertar o actualizar conexión
    if (existingConnection) {
      console.log('🔄 [OutlookCalendar] Updating existing connection...');
      await database
        .update(calendarConnections)
        .set({
          calendarId: primaryCalendar.id,
          calendarName: primaryCalendar.name,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          syncEnabled: 1,
          lastSyncAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(calendarConnections.id, existingConnection.id));
    } else {
      console.log('🔄 [OutlookCalendar] Creating new connection...');
      await database.insert(calendarConnections).values({
        id: connectionId,
        userId,
        provider: 'outlook',
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.name,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        syncEnabled: 1,
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log('✅ [OutlookCalendar] Connection saved successfully');

    // 11. Redirigir a página de éxito
    return NextResponse.redirect(
      new URL('/settings/calendar-settings?success=outlook_connected', request.url)
    );
  } catch (error) {
    console.error('❌ [OutlookCalendar] Callback error:', error);
    
    // Redirigir con error genérico
    return NextResponse.redirect(
      new URL(
        `/settings/calendar-settings?error=${
          error instanceof Error ? error.message : 'unknown_error'
        }`,
        request.url
      )
    );
  }
}
