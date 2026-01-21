/**
 * Google Calendar Webhook
 * Piano Emotion Manager
 * 
 * Recibe notificaciones push de Google Calendar cuando hay cambios
 */
import * as db from '../../server/db.js';
import { calendarConnections } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Verificar headers de Google
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceId = request.headers.get('x-goog-resource-id');

    console.log('[GoogleWebhook] Received notification:', {
      channelId,
      resourceState,
      resourceId,
    });

    // Ignorar notificaciones de sincronización inicial
    if (resourceState === 'sync') {
      return new Response(JSON.stringify({ success: true, message: 'Sync notification ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validar que tenemos el channelId
    if (!channelId) {
      return new Response(JSON.stringify({ error: 'Missing channel ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buscar la conexión correspondiente
    const database = await db.getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const connection = await database.query.calendarConnections.findFirst({
      where: eq(calendarConnections.webhookId, channelId),
    });

    if (!connection) {
      console.warn('[GoogleWebhook] Connection not found for channel:', channelId);
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aquí iría la lógica para sincronizar cambios incrementales
    // Por ahora solo registramos la notificación
    console.log('📥 [GoogleWebhook] Notification processed for user:', connection.userId);

    // TODO: Implementar sincronización incremental usando sync tokens
    // 1. Obtener eventos modificados desde lastSyncToken
    // 2. Actualizar base de datos local
    // 3. Actualizar lastSyncToken

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed',
        channelId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GoogleWebhook] Error:', error);
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
