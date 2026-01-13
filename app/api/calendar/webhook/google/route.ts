/**
 * Google Calendar Webhook Route
 * Receives push notifications from Google Calendar when events change
 * 
 * Google sends notifications to this endpoint when:
 * - Events are created, updated, or deleted
 * - Calendar settings change
 * - Sync token expires
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../server/db';
import { calendarConnections, calendarSyncEvents } from '../../../../../drizzle/schema';
import { getIncrementalChanges } from '../../../../../server/_core/calendar/google-calendar';
import { eq, and } from 'drizzle-orm';

/**
 * POST handler for Google Calendar webhooks
 * 
 * Google sends POST requests with these headers:
 * - X-Goog-Channel-ID: The channel ID we provided when creating the webhook
 * - X-Goog-Resource-ID: The resource ID Google assigned
 * - X-Goog-Resource-State: The state of the resource (sync, exists, not_exists)
 * - X-Goog-Resource-URI: The URI of the resource
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener headers de Google
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceUri = request.headers.get('x-goog-resource-uri');

    console.log('📥 [GoogleWebhook] Received notification:', {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
    });

    // 2. Verificar que tenemos los headers necesarios
    if (!channelId || !resourceState) {
      console.error('❌ [GoogleWebhook] Missing required headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // 3. Manejar diferentes estados
    if (resourceState === 'sync') {
      // Sync notification - Google confirma que el webhook está activo
      console.log('✅ [GoogleWebhook] Sync notification received');
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    // 4. Para cambios reales (exists, not_exists), buscar la conexión
    const database = await getDb();
    if (!database) {
      console.error('❌ [GoogleWebhook] Database not available');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // 5. Buscar conexión por webhook ID
    const connection = await database.query.calendarConnections.findFirst({
      where: eq(calendarConnections.webhookId, channelId),
    });

    if (!connection) {
      console.error('❌ [GoogleWebhook] Connection not found for channel:', channelId);
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    console.log('🔄 [GoogleWebhook] Processing changes for user:', connection.userId);

    // 6. Obtener cambios incrementales desde la última sincronización
    try {
      const changes = await getIncrementalChanges(
        connection.accessToken,
        connection.refreshToken,
        connection.calendarId,
        connection.lastSyncToken || undefined
      );

      console.log(`📊 [GoogleWebhook] Found ${changes.events.length} changes`);

      // 7. Procesar cada evento cambiado
      for (const event of changes.events) {
        await processEventChange(
          database,
          connection.id,
          connection.userId,
          event
        );
      }

      // 8. Actualizar sync token para la próxima sincronización
      if (changes.nextSyncToken) {
        await database
          .update(calendarConnections)
          .set({
            lastSyncToken: changes.nextSyncToken,
            lastSyncAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));

        console.log('✅ [GoogleWebhook] Sync token updated');
      }

      return NextResponse.json({
        success: true,
        processed: changes.events.length,
      });
    } catch (syncError) {
      console.error('❌ [GoogleWebhook] Error processing changes:', syncError);
      
      // Si el sync token es inválido, limpiar para forzar full sync en próxima vez
      if (syncError instanceof Error && syncError.message.includes('Sync token')) {
        await database
          .update(calendarConnections)
          .set({
            lastSyncToken: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(calendarConnections.id, connection.id));
        
        console.log('🔄 [GoogleWebhook] Sync token cleared, will do full sync next time');
      }

      return NextResponse.json(
        { error: 'Error processing changes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [GoogleWebhook] Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Procesar un evento cambiado
 */
async function processEventChange(
  database: any,
  connectionId: string,
  userId: string,
  event: any
) {
  try {
    // Si el evento fue cancelado/eliminado
    if (event.status === 'cancelled') {
      console.log(`🗑️ [GoogleWebhook] Event deleted: ${event.id}`);
      
      // Eliminar de nuestra BD
      await database
        .delete(calendarSyncEvents)
        .where(
          and(
            eq(calendarSyncEvents.connectionId, connectionId),
            eq(calendarSyncEvents.externalEventId, event.id)
          )
        );
      
      return;
    }

    // Si el evento es nuevo o fue actualizado
    console.log(`📝 [GoogleWebhook] Event ${event.id}: ${event.summary}`);

    // Verificar si ya existe en nuestra BD
    const existingEvent = await database.query.calendarSyncEvents.findFirst({
      where: and(
        eq(calendarSyncEvents.connectionId, connectionId),
        eq(calendarSyncEvents.externalEventId, event.id)
      ),
    });

    if (existingEvent) {
      // Actualizar evento existente
      await database
        .update(calendarSyncEvents)
        .set({
          // Aquí podrías actualizar campos adicionales si los tienes
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(calendarSyncEvents.connectionId, connectionId),
            eq(calendarSyncEvents.externalEventId, event.id)
          )
        );
    } else {
      // Insertar nuevo evento
      // Nota: Solo insertamos si el evento fue creado por nosotros
      // (tiene appointmentId asociado)
      // Los eventos externos no se sincronizan a nuestra BD por ahora
      console.log('ℹ️ [GoogleWebhook] External event, skipping insert');
    }
  } catch (error) {
    console.error('❌ [GoogleWebhook] Error processing event:', error);
    // No lanzar error para no interrumpir el procesamiento de otros eventos
  }
}
