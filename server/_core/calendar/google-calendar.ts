/**
 * Google Calendar API Integration
 */

import { google } from 'googleapis';
import { getAuthenticatedClient, isTokenExpired, refreshAccessToken } from './oauth-google';
import type { CalendarConnection, ExternalCalendar, ExternalEvent, WebhookSubscription } from './types';
import { updateConnection } from './db';

const WEBHOOK_URL = process.env.CALENDAR_WEBHOOK_URL || 'https://piano-emotion.com/api/calendar/webhook/google';

/**
 * Get calendar client with auto-refresh
 */
async function getCalendarClient(connection: CalendarConnection) {
  // Check if token needs refresh
  if (isTokenExpired(connection.expiresAt)) {
    console.log('🔄 Refreshing Google access token...');
    const newTokens = await refreshAccessToken(connection.refreshToken);
    
    // Update connection with new tokens
    await updateConnection(connection.id, {
      accessToken: newTokens.accessToken,
      expiresAt: newTokens.expiresAt,
    });
    
    connection.accessToken = newTokens.accessToken;
    connection.expiresAt = newTokens.expiresAt;
  }
  
  const auth = getAuthenticatedClient(connection.accessToken, connection.refreshToken);
  return google.calendar({ version: 'v3', auth });
}

/**
 * List user's calendars
 */
export async function listCalendars(connection: CalendarConnection): Promise<ExternalCalendar[]> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const response = await calendar.calendarList.list();
    
    return (response.data.items || []).map(item => ({
      id: item.id!,
      name: item.summary || 'Unnamed Calendar',
      description: item.description,
      timeZone: item.timeZone,
      primary: item.primary,
    }));
  } catch (error) {
    console.error('❌ Error listing Google calendars:', error);
    throw new Error('Failed to list calendars');
  }
}

/**
 * Create an event in Google Calendar
 */
export async function createEvent(
  connection: CalendarConnection,
  eventData: Omit<ExternalEvent, 'id' | 'created' | 'updated'>
): Promise<string> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const response = await calendar.events.insert({
      calendarId: connection.calendarId || 'primary',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        status: eventData.status,
      },
    });
    
    if (!response.data.id) {
      throw new Error('No event ID returned');
    }
    
    console.log('✅ Created Google Calendar event:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creating Google Calendar event:', error);
    throw new Error('Failed to create event');
  }
}

/**
 * Update an event in Google Calendar
 */
export async function updateEvent(
  connection: CalendarConnection,
  eventId: string,
  eventData: Partial<Omit<ExternalEvent, 'id' | 'created' | 'updated'>>
): Promise<void> {
  try {
    const calendar = await getCalendarClient(connection);
    
    await calendar.events.patch({
      calendarId: connection.calendarId || 'primary',
      eventId,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        status: eventData.status,
      },
    });
    
    console.log('✅ Updated Google Calendar event:', eventId);
  } catch (error) {
    console.error('❌ Error updating Google Calendar event:', error);
    throw new Error('Failed to update event');
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<void> {
  try {
    const calendar = await getCalendarClient(connection);
    
    await calendar.events.delete({
      calendarId: connection.calendarId || 'primary',
      eventId,
    });
    
    console.log('✅ Deleted Google Calendar event:', eventId);
  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error);
    throw new Error('Failed to delete event');
  }
}

/**
 * Get an event from Google Calendar
 */
export async function getEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<ExternalEvent | null> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const response = await calendar.events.get({
      calendarId: connection.calendarId || 'primary',
      eventId,
    });
    
    const event = response.data;
    if (!event.id) return null;
    
    return {
      id: event.id,
      summary: event.summary || '',
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start?.dateTime || event.start?.date || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || event.end?.date || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map(a => ({
        email: a.email!,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      status: event.status as any,
      created: event.created,
      updated: event.updated,
    };
  } catch (error) {
    console.error('❌ Error getting Google Calendar event:', error);
    return null;
  }
}

/**
 * List events (with optional time range)
 */
export async function listEvents(
  connection: CalendarConnection,
  options?: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  }
): Promise<ExternalEvent[]> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const response = await calendar.events.list({
      calendarId: connection.calendarId || 'primary',
      timeMin: options?.timeMin?.toISOString(),
      timeMax: options?.timeMax?.toISOString(),
      maxResults: options?.maxResults || 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return (response.data.items || []).map(event => ({
      id: event.id!,
      summary: event.summary || '',
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start?.dateTime || event.start?.date || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || event.end?.date || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map(a => ({
        email: a.email!,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      status: event.status as any,
      created: event.created,
      updated: event.updated,
    }));
  } catch (error) {
    console.error('❌ Error listing Google Calendar events:', error);
    throw new Error('Failed to list events');
  }
}

/**
 * Get incremental changes using sync token
 */
export async function getIncrementalChanges(
  connection: CalendarConnection
): Promise<{ events: ExternalEvent[]; nextSyncToken: string }> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const params: any = {
      calendarId: connection.calendarId || 'primary',
      singleEvents: true,
    };
    
    if (connection.lastSyncToken) {
      // Incremental sync
      params.syncToken = connection.lastSyncToken;
    } else {
      // Initial sync (last 30 days)
      params.timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const response = await calendar.events.list(params);
    
    const events = (response.data.items || []).map(event => ({
      id: event.id!,
      summary: event.summary || '',
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start?.dateTime || event.start?.date || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || event.end?.date || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map(a => ({
        email: a.email!,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      status: event.status as any,
      created: event.created,
      updated: event.updated,
    }));
    
    return {
      events,
      nextSyncToken: response.data.nextSyncToken || connection.lastSyncToken || '',
    };
  } catch (error) {
    console.error('❌ Error getting incremental changes:', error);
    throw new Error('Failed to get incremental changes');
  }
}

/**
 * Create webhook subscription (push notifications)
 */
export async function createWebhookSubscription(
  connection: CalendarConnection
): Promise<WebhookSubscription> {
  try {
    const calendar = await getCalendarClient(connection);
    
    const channelId = `piano-${connection.id}-${Date.now()}`;
    const expiration = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    const response = await calendar.events.watch({
      calendarId: connection.calendarId || 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: WEBHOOK_URL,
        token: connection.id, // For identifying the connection
        expiration: expiration.toString(),
      },
    });
    
    console.log('✅ Created Google webhook subscription:', channelId);
    
    return {
      id: response.data.id!,
      resourceId: response.data.resourceId,
      expiration: new Date(parseInt(response.data.expiration!)),
      notificationUrl: WEBHOOK_URL,
    };
  } catch (error) {
    console.error('❌ Error creating webhook subscription:', error);
    throw new Error('Failed to create webhook subscription');
  }
}

/**
 * Stop webhook subscription
 */
export async function stopWebhookSubscription(
  connection: CalendarConnection
): Promise<void> {
  try {
    if (!connection.webhookId) {
      console.log('ℹ️  No webhook to stop');
      return;
    }
    
    const calendar = await getCalendarClient(connection);
    
    await calendar.channels.stop({
      requestBody: {
        id: connection.webhookId,
        resourceId: connection.webhookId, // Assuming resourceId is stored in webhookId
      },
    });
    
    console.log('✅ Stopped Google webhook subscription');
  } catch (error) {
    console.error('❌ Error stopping webhook subscription:', error);
    // Don't throw error, as webhook might already be expired
  }
}
