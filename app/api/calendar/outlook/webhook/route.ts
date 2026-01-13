/**
 * Outlook Calendar Webhook Route
 * Receives push notifications from Microsoft Graph when calendar events change
 * 
 * Microsoft Graph sends notifications to this endpoint when:
 * - Events are created, updated, or deleted
 * - Calendar settings change
 * - Subscription expires
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../server/db';
import { calendarConnections, calendarSyncEvents } from '../../../../../drizzle/schema';
import { getIncrementalChanges } from '../../../../../server/_core/calendar/microsoft-calendar';
import { eq, and } from 'drizzle-orm';

/**
 * POST handler for Microsoft Graph webhooks
 * 
 * Microsoft Graph sends POST requests with these headers:
 * - clientState: The client state we provided when creating the subscription
 * 
 * Body contains:
 * - value: Array of notification objects
 *   - subscriptionId: The subscription ID
 *   - changeType: created, updated, deleted
 *   - resource: The resource path (e.g., /users/{userId}/events/{eventId})
 *   - resourceData: Additional data about the resource
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar validación de suscripción (Microsoft envía esto al crear el webhook)
    const validationToken = request.nextUrl.searchParams.get('validationToken');
    
    if (validationToken) {
      // Microsoft está validando el endpoint
      console.log('✅ [OutlookWebhook] Validation token received');
      return new NextResponse(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 2. Obtener el cuerpo de la notificación
    const body = await request.json();
    const notifications = body.value || [];

    console.log('📥 [OutlookWebhook] Received notifications:', notifications.length);

    if (notifications.length === 0) {
      return NextResponse.json({ success: true, message: 'No notifications' });
    }

    // 3. Obtener base de datos
    const database = await getDb();
    if (!database) {
      console.error('❌ [OutlookWebhook] Database not available');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // 4. Procesar cada notificación
    for (const notification of notifications) {
      try {
        const { subscriptionId, changeType, resource, clientState } = notification;

        console.log('🔄 [OutlookWebhook] Processing notification:', {
          subscriptionId,
          changeType,
          resource,
        });

        // 5. Buscar conexión por webhook ID (subscriptionId)
        const connection = await database.query.calendarConnections.findFirst({
          where: eq(calendarConnections.webhookId, subscriptionId),
        });

        if (!connection) {
          console.error('❌ [OutlookWebhook] Connection not found for subscription:', subscriptionId);
          continue; // Continuar con la siguiente notificación
        }

        console.log('🔄 [OutlookWebhook] Processing changes for user:', connection.userId);

        // 6. Obtener cambios incrementales desde la última sincronización
        try {
          const changes = await getIncrementalChanges(
            connection.accessToken,
            connection.refreshToken,
            connection.calendarId,
            connection.lastSyncToken || undefined
          );

          console.log(`📊 [OutlookWebhook] Found ${changes.events.length} changes`);

          // 7. Procesar cada evento cambiado
          for (const event of changes.events) {
            await processEventChange(
              database,
              connection.id,
              connection.userId,
              event,
              changeType
            );
          }

          // 8. Actualizar sync token para la próxima sincronización
          if (changes.deltaLink) {
            await database
              .update(calendarConnections)
              .set({
                lastSyncToken: changes.deltaLink,
                lastSyncAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .where(eq(calendarConnections.id, connection.id));

            console.log('✅ [OutlookWebhook] Delta link updated');
          }
        } catch (syncError) {
          console.error('❌ [OutlookWebhook] Error processing changes:', syncError);
          
          // Si el delta link es inválido, limpiar para forzar full sync en próxima vez
          if (syncError instanceof Error && syncError.message.includes('delta')) {
            await database
              .update(calendarConnections)
              .set({
                lastSyncToken: null,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(calendarConnections.id, connection.id));
            
            console.log('🔄 [OutlookWebhook] Delta link cleared, will do full sync next time');
          }
        }
      } catch (notificationError) {
        console.error('❌ [OutlookWebhook] Error processing notification:', notificationError);
        // Continuar con la siguiente notificación
      }
    }

    return NextResponse.json({
      success: true,
      processed: notifications.length,
    });
  } catch (error) {
    console.error('❌ [OutlookWebhook] Webhook error:', error);
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
  event: any,
  changeType: string
) {
  try {
    // Si el evento fue eliminado
    if (changeType === 'deleted' || event.isCancelled) {
      console.log(`🗑️ [OutlookWebhook] Event deleted: ${event.id}`);
      
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
    console.log(`📝 [OutlookWebhook] Event ${event.id}: ${event.subject}`);

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
      console.log('ℹ️ [OutlookWebhook] External event, skipping insert');
    }
  } catch (error) {
    console.error('❌ [OutlookWebhook] Error processing event:', error);
    // No lanzar error para no interrumpir el procesamiento de otros eventos
  }
}
