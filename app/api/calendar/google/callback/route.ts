/**
 * Google Calendar OAuth Callback Route
 * Handles the OAuth callback from Google after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '../../../../../server/db';
import { calendarConnections } from '../../../../../drizzle/schema';
import { exchangeCodeForTokens } from '../../../../../server/_core/calendar/oauth-google';
import { listCalendars } from '../../../../../server/_core/calendar/google-calendar';
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
    const state = searchParams.get('state');

    // 3. Manejar errores de autorización
    if (error) {
      console.error('❌ [GoogleCalendar] Authorization error:', error);
      return NextResponse.redirect(
        new URL(`/settings/calendars?error=${error}`, request.url)
      );
    }

    // 4. Verificar que tenemos el código de autorización
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings/calendars?error=missing_code', request.url)
      );
    }

    // 5. Intercambiar código por tokens
    console.log('🔄 [GoogleCalendar] Exchanging code for tokens...');
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.accessToken || !tokens.refreshToken) {
      console.error('❌ [GoogleCalendar] Missing tokens');
      return NextResponse.redirect(
        new URL('/settings/calendars?error=token_exchange_failed', request.url)
      );
    }

    // 6. Obtener lista de calendarios del usuario
    console.log('🔄 [GoogleCalendar] Fetching user calendars...');
    const calendars = await listCalendars(
      tokens.accessToken,
      tokens.refreshToken
    );

    if (!calendars || calendars.length === 0) {
      console.error('❌ [GoogleCalendar] No calendars found');
      return NextResponse.redirect(
        new URL('/settings/calendars?error=no_calendars', request.url)
      );
    }

    // 7. Usar el calendario principal (primary)
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];

    // 8. Guardar conexión en la base de datos
    const database = await getDb();
    if (!database) {
      console.error('❌ [GoogleCalendar] Database not available');
      return NextResponse.redirect(
        new URL('/settings/calendars?error=database_error', request.url)
      );
    }

    // 9. Verificar si ya existe una conexión para este usuario y proveedor
    const existingConnection = await database.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.provider, 'google')
      ),
    });

    const connectionId = existingConnection?.id || nanoid();

    // 10. Insertar o actualizar conexión
    if (existingConnection) {
      console.log('🔄 [GoogleCalendar] Updating existing connection...');
      await database
        .update(calendarConnections)
        .set({
          calendarId: primaryCalendar.id,
          calendarName: primaryCalendar.summary,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          syncEnabled: 1,
          lastSyncAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(calendarConnections.id, existingConnection.id));
    } else {
      console.log('🔄 [GoogleCalendar] Creating new connection...');
      await database.insert(calendarConnections).values({
        id: connectionId,
        userId,
        provider: 'google',
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.summary,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        syncEnabled: 1,
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log('✅ [GoogleCalendar] Connection saved successfully');

    // 11. Redirigir a página de éxito
    return NextResponse.redirect(
      new URL('/settings/calendars?success=google_connected', request.url)
    );
  } catch (error) {
    console.error('❌ [GoogleCalendar] Callback error:', error);
    
    // Redirigir con error genérico
    return NextResponse.redirect(
      new URL(
        `/settings/calendars?error=${
          error instanceof Error ? error.message : 'unknown_error'
        }`,
        request.url
      )
    );
  }
}
