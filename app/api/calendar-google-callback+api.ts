/**
 * Google Calendar OAuth Callback
 * Piano Emotion Manager
 */
import { exchangeCodeForTokens } from '../../server/_core/calendar/oauth-google.js';
import * as db from '../../server/db.js';
import { calendarConnections } from '../../drizzle/schema.js.js';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Manejar error de autorización
    if (error) {
      console.error('[GoogleCallback] Authorization error:', error);
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.pianoemotion.com'}/settings/calendar-settings?error=authorization_failed`,
        302
      );
    }

    // Validar parámetros
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtener usuario autenticado
    const { userId } = await auth();
    if (!userId) {
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.pianoemotion.com'}/sign-in?redirect=/settings/calendar-settings`,
        302
      );
    }

    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(code);

    // Obtener información del calendario principal
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary',
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      throw new Error('Failed to fetch calendar info');
    }

    const calendarInfo = await calendarResponse.json();

    // Guardar conexión en base de datos
    const database = await db.getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    // Verificar si ya existe una conexión
    const existingConnection = await database.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.userId, userId),
        eq(calendarConnections.provider, 'google')
      ),
    });

    const connectionData = {
      userId,
      provider: 'google' as const,
      calendarId: calendarInfo.id,
      calendarName: calendarInfo.summary || 'Google Calendar',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      syncEnabled: 1,
      updatedAt: new Date().toISOString(),
    };

    if (existingConnection) {
      // Actualizar conexión existente
      await database
        .update(calendarConnections)
        .set(connectionData)
        .where(eq(calendarConnections.id, existingConnection.id));
    } else {
      // Crear nueva conexión
      await database.insert(calendarConnections).values({
        id: `google_${userId}_${Date.now()}`,
        ...connectionData,
        createdAt: new Date().toISOString(),
      });
    }

    console.log('✅ [GoogleCallback] Calendar connected successfully');

    // Redirigir a página de configuración
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.pianoemotion.com'}/settings/calendar-settings?success=google_connected`,
      302
    );
  } catch (error) {
    console.error('[GoogleCallback] Error:', error);
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.pianoemotion.com'}/settings/calendar-settings?error=connection_failed`,
      302
    );
  }
}
