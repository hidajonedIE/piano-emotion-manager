/**
 * Outlook Calendar Webhook
 * Piano Emotion Manager
 * 
 * Recibe notificaciones de Microsoft Graph cuando hay cambios en el calendario
 */
import * as db from '../../server/db.js';
import { calendarConnections } from '../../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Microsoft Graph envía un array de notificaciones
    const notifications = body.value || [];

    console.log('[OutlookWebhook] Received notifications:', notifications.length);

    for (const notification of notifications) {
      const { subscriptionId, resource, changeType } = notification;

      console.log('[OutlookWebhook] Processing notification:', {
        subscriptionId,
        resource,
        changeType,
      });

      // Buscar la conexión correspondiente
      const database = await db.getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const connection = await database.query.calendarConnections.findFirst({
        where: eq(calendarConnections.webhookId, subscriptionId),
      });

      if (!connection) {
        console.warn('[OutlookWebhook] Connection not found for subscription:', subscriptionId);
        continue;
      }

      // Aquí iría la lógica para sincronizar cambios incrementales
      // Por ahora solo registramos la notificación
      console.log('📥 [OutlookWebhook] Notification processed for user:', connection.userId);

      // TODO: Implementar sincronización incremental usando delta links
      // 1. Obtener eventos modificados desde lastSyncToken (delta link)
      // 2. Actualizar base de datos local
      // 3. Actualizar lastSyncToken
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhooks processed',
        count: notifications.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OutlookWebhook] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Validación de subscripción (Microsoft Graph requirement)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const validationToken = url.searchParams.get('validationToken');

    if (validationToken) {
      // Microsoft Graph envía un token de validación al crear la subscripción
      // Debemos devolverlo en texto plano
      return new Response(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response(JSON.stringify({ error: 'Missing validation token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[OutlookWebhook] Validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
