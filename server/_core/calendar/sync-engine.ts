/**
 * Calendar Sync Engine
 * 
 * Handles bidirectional synchronization between Piano Emotion Manager
 * and external calendars (Google Calendar, Microsoft Calendar)
 */

import * as googleCalendar from './google-calendar.js';
import { getDb } from "../../db.js";
import * as microsoftCalendar from './microsoft-calendar.js';
import * as db from './db.js';
import type { CalendarConnection, ExternalEvent, SyncResult } from './types.js';
import { nanoid } from 'nanoid';

/**
 * Sync an appointment from Piano to external calendar
 */
export async function syncAppointmentToExternal(
  appointment: any, // Type from your appointments schema
  connection: CalendarConnection
): Promise<SyncResult> {
  try {
    // Check if already synced
    const existingSync = await getDb().getSyncEventByAppointmentAndConnection(
      appointment.id,
      connection.id
    );
    
    const eventData: Omit<ExternalEvent, 'id' | 'created' | 'updated'> = {
      summary: `Cita: ${appointment.clientName || 'Cliente'}`,
      description: formatAppointmentDescription(appointment),
      location: appointment.address || '',
      start: {
        dateTime: appointment.startTime,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'Europe/Madrid',
      },
    };
    
    let externalEventId: string;
    
    if (existingSync) {
      // Update existing event
      if (connection.provider === 'google') {
        await googleCalendar.updateEvent(connection, existingSync.externalEventId, eventData);
        externalEventId = existingSync.externalEventId;
      } else {
        await microsoftCalendar.updateEvent(connection, existingSync.externalEventId, eventData);
        externalEventId = existingSync.externalEventId;
      }
      
      // Update sync event
      await getDb().updateSyncEvent(existingSync.id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        errorMessage: null,
      });
    } else {
      // Create new event
      if (connection.provider === 'google') {
        externalEventId = await googleCalendar.createEvent(connection, eventData);
      } else {
        externalEventId = await microsoftCalendar.createEvent(connection, eventData);
      }
      
      // Create sync event record
      await getDb().createSyncEvent({
        id: nanoid(),
        connectionId: connection.id,
        appointmentId: appointment.id,
        externalEventId,
        provider: connection.provider,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        errorMessage: null,
        metadata: null,
      });
    }
    
    // Log success
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: existingSync ? 'update' : 'create',
      direction: 'to_external',
      appointmentId: appointment.id,
      externalEventId,
      status: 'success',
      errorMessage: null,
      details: null,
    });
    
    return {
      success: true,
      externalEventId,
    };
  } catch (error: any) {
    console.error('❌ Error syncing appointment to external:', error);
    
    // Log error
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: 'create',
      direction: 'to_external',
      appointmentId: appointment.id,
      externalEventId: null,
      status: 'error',
      errorMessage: error.message,
      details: null,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete appointment from external calendar
 */
export async function deleteAppointmentFromExternal(
  appointmentId: string,
  connection: CalendarConnection
): Promise<SyncResult> {
  try {
    const syncEvent = await getDb().getSyncEventByAppointmentAndConnection(
      appointmentId,
      connection.id
    );
    
    if (!syncEvent) {
      return { success: true }; // Already not synced
    }
    
    // Delete from external calendar
    if (connection.provider === 'google') {
      await googleCalendar.deleteEvent(connection, syncEvent.externalEventId);
    } else {
      await microsoftCalendar.deleteEvent(connection, syncEvent.externalEventId);
    }
    
    // Delete sync event record
    await getDb().deleteSyncEvent(syncEvent.id);
    
    // Log success
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: 'delete',
      direction: 'to_external',
      appointmentId,
      externalEventId: syncEvent.externalEventId,
      status: 'success',
      errorMessage: null,
      details: null,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting appointment from external:', error);
    
    // Log error
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: 'delete',
      direction: 'to_external',
      appointmentId,
      externalEventId: null,
      status: 'error',
      errorMessage: error.message,
      details: null,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync external event to Piano appointment
 * (Called when webhook receives notification)
 */
export async function syncExternalEventToPiano(
  externalEvent: ExternalEvent,
  connection: CalendarConnection
): Promise<SyncResult> {
  try {
    // Check if event is already synced
    const existingSync = await getDb().getSyncEventByExternalId(
      externalEvent.id,
      connection.id
    );
    
    if (existingSync && existingSync.appointmentId) {
      // Event was created by Piano, update it
      if (externalEvent.status === 'cancelled') {
        // Delete appointment in Piano
        // TODO: Call your appointment deletion function
        console.log('📅 Appointment deleted in external calendar:', existingSync.appointmentId);
        await getDb().deleteSyncEvent(existingSync.id);
      } else {
        // Update appointment in Piano
        // TODO: Call your appointment update function
        console.log('📅 Appointment updated in external calendar:', existingSync.appointmentId);
        
        await getDb().updateSyncEvent(existingSync.id, {
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
        });
      }
    } else if (!existingSync) {
      // New event created in external calendar, create appointment in Piano
      // TODO: Call your appointment creation function
      console.log('📅 New event in external calendar:', externalEvent.id);
      
      // For now, just log it (you'll need to implement appointment creation)
      await getDb().createSyncEvent({
        id: nanoid(),
        connectionId: connection.id,
        appointmentId: null, // Will be set when appointment is created
        externalEventId: externalEvent.id,
        provider: connection.provider,
        syncStatus: 'pending',
        lastSyncedAt: new Date(),
        errorMessage: null,
        metadata: { externalEvent },
      });
    }
    
    // Log success
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: existingSync ? 'update' : 'create',
      direction: 'from_external',
      appointmentId: existingSync?.appointmentId || null,
      externalEventId: externalEvent.id,
      status: 'success',
      errorMessage: null,
      details: null,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error syncing external event to Piano:', error);
    
    // Log error
    await getDb().createSyncLog({
      connectionId: connection.id,
      action: 'create',
      direction: 'from_external',
      appointmentId: null,
      externalEventId: externalEvent.id,
      status: 'error',
      errorMessage: error.message,
      details: null,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Perform full sync (manual sync button)
 */
export async function performFullSync(connection: CalendarConnection): Promise<{
  success: boolean;
  synced: number;
  errors: number;
}> {
  try {
    console.log('🔄 Starting full sync for connection:', connection.id);
    
    let events: ExternalEvent[];
    let nextToken: string;
    
    // Get incremental changes
    if (connection.provider === 'google') {
      const result = await googleCalendar.getIncrementalChanges(connection);
      events = result.events;
      nextToken = result.nextSyncToken;
      
      // Update sync token
      await getDb().updateConnection(connection.id, {
        lastSyncToken: nextToken,
        lastSyncAt: new Date(),
      });
    } else {
      const result = await microsoftCalendar.getIncrementalChanges(connection);
      events = result.events;
      nextToken = result.nextDeltaLink;
      
      // Update delta link
      await getDb().updateConnection(connection.id, {
        lastDeltaLink: nextToken,
        lastSyncAt: new Date(),
      });
    }
    
    let synced = 0;
    let errors = 0;
    
    // Process each event
    for (const event of events) {
      const result = await syncExternalEventToPiano(event, connection);
      if (result.success) {
        synced++;
      } else {
        errors++;
      }
    }
    
    console.log(`✅ Full sync completed: ${synced} synced, ${errors} errors`);
    
    return {
      success: true,
      synced,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Error performing full sync:', error);
    return {
      success: false,
      synced: 0,
      errors: 1,
    };
  }
}

/**
 * Sync all appointments for a user
 */
export async function syncAllAppointmentsForUser(
  userId: string,
  appointments: any[] // Type from your appointments schema
): Promise<void> {
  const connections = await getDb().getConnectionsByUserId(userId);
  
  for (const connection of connections) {
    if (!connection.syncEnabled) continue;
    
    for (const appointment of appointments) {
      await syncAppointmentToExternal(appointment, connection);
    }
  }
}

/**
 * Format appointment description for external calendar
 */
function formatAppointmentDescription(appointment: any): string {
  const parts: string[] = [];
  
  if (appointment.pianoModel) {
    parts.push(`Piano: ${appointment.pianoModel}`);
  }
  
  if (appointment.serviceType) {
    parts.push(`Servicio: ${appointment.serviceType}`);
  }
  
  if (appointment.notes) {
    parts.push(`\nNotas: ${appointment.notes}`);
  }
  
  return parts.join('\n');
}

/**
 * Detect conflicts with existing events
 */
export async function detectConflicts(
  connection: CalendarConnection,
  startTime: Date,
  endTime: Date
): Promise<ExternalEvent[]> {
  try {
    let events: ExternalEvent[];
    
    if (connection.provider === 'google') {
      events = await googleCalendar.listEvents(connection, {
        timeMin: startTime,
        timeMax: endTime,
      });
    } else {
      events = await microsoftCalendar.listEvents(connection, {
        timeMin: startTime,
        timeMax: endTime,
      });
    }
    
    // Filter events that overlap with the given time range
    return events.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      return (
        (eventStart >= startTime && eventStart < endTime) ||
        (eventEnd > startTime && eventEnd <= endTime) ||
        (eventStart <= startTime && eventEnd >= endTime)
      );
    });
  } catch (error) {
    console.error('❌ Error detecting conflicts:', error);
    return [];
  }
}
