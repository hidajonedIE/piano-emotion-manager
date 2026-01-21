/**
 * Microsoft Graph (Outlook Calendar) API Integration
 */

import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { getAccessToken, isTokenExpired, refreshAccessToken } from './oauth-microsoft.js';
import type { CalendarConnection, ExternalCalendar, ExternalEvent, WebhookSubscription } from './types.js';
import { updateConnection } from './getDb().js';

const WEBHOOK_URL = process.env.CALENDAR_WEBHOOK_URL || 'https://piano-emotion.com/api/calendar/webhook/microsoft';

/**
 * Get Graph client with auto-refresh
 */
async function getGraphClient(connection: CalendarConnection): Promise<Client> {
  // Check if token needs refresh
  if (isTokenExpired(connection.expiresAt)) {
    console.log('🔄 Refreshing Microsoft access token...');
    const newTokens = await refreshAccessToken(connection.refreshToken);
    
    // Update connection with new tokens
    await updateConnection(connection.id, {
      accessToken: newTokens.accessToken,
      expiresAt: newTokens.expiresAt,
    });
    
    connection.accessToken = newTokens.accessToken;
    connection.expiresAt = newTokens.expiresAt;
  }
  
  const accessToken = getAccessToken(connection.accessToken);
  
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * List user's calendars
 */
export async function listCalendars(connection: CalendarConnection): Promise<ExternalCalendar[]> {
  try {
    const client = await getGraphClient(connection);
    
    const response = await client.api('/me/calendars').get();
    
    return (response.value || []).map((calendar: any) => ({
      id: calendar.id,
      name: calendar.name || 'Unnamed Calendar',
      description: calendar.description,
      timeZone: calendar.timeZone,
      primary: calendar.isDefaultCalendar,
    }));
  } catch (error) {
    console.error('❌ Error listing Microsoft calendars:', error);
    throw new Error('Failed to list calendars');
  }
}

/**
 * Create an event in Microsoft Calendar
 */
export async function createEvent(
  connection: CalendarConnection,
  eventData: Omit<ExternalEvent, 'id' | 'created' | 'updated'>
): Promise<string> {
  try {
    const client = await getGraphClient(connection);
    
    const calendarId = connection.calendarId || 'calendar';
    
    const event = {
      subject: eventData.summary,
      body: {
        contentType: 'Text',
        content: eventData.description || '',
      },
      location: {
        displayName: eventData.location || '',
      },
      start: {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'UTC',
      },
      attendees: eventData.attendees?.map(a => ({
        emailAddress: {
          address: a.email,
          name: a.displayName,
        },
        type: 'required',
      })),
    };
    
    const response = await client.api(`/me/calendars/${calendarId}/events`).post(event);
    
    if (!response.id) {
      throw new Error('No event ID returned');
    }
    
    console.log('✅ Created Microsoft Calendar event:', response.id);
    return response.id;
  } catch (error) {
    console.error('❌ Error creating Microsoft Calendar event:', error);
    throw new Error('Failed to create event');
  }
}

/**
 * Update an event in Microsoft Calendar
 */
export async function updateEvent(
  connection: CalendarConnection,
  eventId: string,
  eventData: Partial<Omit<ExternalEvent, 'id' | 'created' | 'updated'>>
): Promise<void> {
  try {
    const client = await getGraphClient(connection);
    
    const updates: any = {};
    
    if (eventData.summary) updates.subject = eventData.summary;
    if (eventData.description) {
      updates.body = {
        contentType: 'Text',
        content: eventData.description,
      };
    }
    if (eventData.location) {
      updates.location = {
        displayName: eventData.location,
      };
    }
    if (eventData.start) {
      updates.start = {
        dateTime: eventData.start.dateTime,
        timeZone: eventData.start.timeZone || 'UTC',
      };
    }
    if (eventData.end) {
      updates.end = {
        dateTime: eventData.end.dateTime,
        timeZone: eventData.end.timeZone || 'UTC',
      };
    }
    if (eventData.attendees) {
      updates.attendees = eventData.attendees.map(a => ({
        emailAddress: {
          address: a.email,
          name: a.displayName,
        },
        type: 'required',
      }));
    }
    
    await client.api(`/me/events/${eventId}`).patch(updates);
    
    console.log('✅ Updated Microsoft Calendar event:', eventId);
  } catch (error) {
    console.error('❌ Error updating Microsoft Calendar event:', error);
    throw new Error('Failed to update event');
  }
}

/**
 * Delete an event from Microsoft Calendar
 */
export async function deleteEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<void> {
  try {
    const client = await getGraphClient(connection);
    
    await client.api(`/me/events/${eventId}`).delete();
    
    console.log('✅ Deleted Microsoft Calendar event:', eventId);
  } catch (error) {
    console.error('❌ Error deleting Microsoft Calendar event:', error);
    throw new Error('Failed to delete event');
  }
}

/**
 * Get an event from Microsoft Calendar
 */
export async function getEvent(
  connection: CalendarConnection,
  eventId: string
): Promise<ExternalEvent | null> {
  try {
    const client = await getGraphClient(connection);
    
    const event = await client.api(`/me/events/${eventId}`).get();
    
    if (!event.id) return null;
    
    return {
      id: event.id,
      summary: event.subject || '',
      description: event.body?.content,
      location: event.location?.displayName,
      start: {
        dateTime: event.start?.dateTime || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map((a: any) => ({
        email: a.emailAddress?.address || '',
        displayName: a.emailAddress?.name,
        responseStatus: a.status?.response,
      })),
      status: event.isCancelled ? 'cancelled' : 'confirmed',
      created: event.createdDateTime,
      updated: event.lastModifiedDateTime,
    };
  } catch (error) {
    console.error('❌ Error getting Microsoft Calendar event:', error);
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
    const client = await getGraphClient(connection);
    
    const calendarId = connection.calendarId || 'calendar';
    let query = client.api(`/me/calendars/${calendarId}/events`);
    
    // Build filter query
    const filters: string[] = [];
    if (options?.timeMin) {
      filters.push(`start/dateTime ge '${options.timeMin.toISOString()}'`);
    }
    if (options?.timeMax) {
      filters.push(`end/dateTime le '${options.timeMax.toISOString()}'`);
    }
    
    if (filters.length > 0) {
      query = query.filter(filters.join(' and '));
    }
    
    if (options?.maxResults) {
      query = query.top(options.maxResults);
    }
    
    query = query.orderby('start/dateTime');
    
    const response = await query.get();
    
    return (response.value || []).map((event: any) => ({
      id: event.id,
      summary: event.subject || '',
      description: event.body?.content,
      location: event.location?.displayName,
      start: {
        dateTime: event.start?.dateTime || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map((a: any) => ({
        email: a.emailAddress?.address || '',
        displayName: a.emailAddress?.name,
        responseStatus: a.status?.response,
      })),
      status: event.isCancelled ? 'cancelled' : 'confirmed',
      created: event.createdDateTime,
      updated: event.lastModifiedDateTime,
    }));
  } catch (error) {
    console.error('❌ Error listing Microsoft Calendar events:', error);
    throw new Error('Failed to list events');
  }
}

/**
 * Get incremental changes using delta query
 */
export async function getIncrementalChanges(
  connection: CalendarConnection
): Promise<{ events: ExternalEvent[]; nextDeltaLink: string }> {
  try {
    const client = await getGraphClient(connection);
    
    let url: string;
    
    if (connection.lastDeltaLink) {
      // Incremental sync
      url = connection.lastDeltaLink;
    } else {
      // Initial sync
      const calendarId = connection.calendarId || 'calendar';
      url = `/me/calendars/${calendarId}/events/delta`;
    }
    
    const response = await client.api(url).get();
    
    const events = (response.value || []).map((event: any) => ({
      id: event.id,
      summary: event.subject || '',
      description: event.body?.content,
      location: event.location?.displayName,
      start: {
        dateTime: event.start?.dateTime || '',
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime || '',
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map((a: any) => ({
        email: a.emailAddress?.address || '',
        displayName: a.emailAddress?.name,
        responseStatus: a.status?.response,
      })),
      status: event.isCancelled ? 'cancelled' : 'confirmed',
      created: event.createdDateTime,
      updated: event.lastModifiedDateTime,
    }));
    
    return {
      events,
      nextDeltaLink: response['@odata.deltaLink'] || connection.lastDeltaLink || '',
    };
  } catch (error) {
    console.error('❌ Error getting incremental changes:', error);
    throw new Error('Failed to get incremental changes');
  }
}

/**
 * Create change notification subscription
 */
export async function createWebhookSubscription(
  connection: CalendarConnection
): Promise<WebhookSubscription> {
  try {
    const client = await getGraphClient(connection);
    
    const expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days (max for user resources)
    
    const subscription = {
      changeType: 'created,updated,deleted',
      notificationUrl: WEBHOOK_URL,
      resource: '/me/events',
      expirationDateTime: expiration.toISOString(),
      clientState: connection.id, // For identifying the connection
    };
    
    const response = await client.api('/subscriptions').post(subscription);
    
    console.log('✅ Created Microsoft webhook subscription:', response.id);
    
    return {
      id: response.id,
      expiration: new Date(response.expirationDateTime),
      notificationUrl: WEBHOOK_URL,
    };
  } catch (error) {
    console.error('❌ Error creating webhook subscription:', error);
    throw new Error('Failed to create webhook subscription');
  }
}

/**
 * Renew change notification subscription
 */
export async function renewWebhookSubscription(
  connection: CalendarConnection
): Promise<WebhookSubscription> {
  try {
    if (!connection.webhookId) {
      throw new Error('No webhook ID to renew');
    }
    
    const client = await getGraphClient(connection);
    
    const expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    
    const response = await client.api(`/subscriptions/${connection.webhookId}`).patch({
      expirationDateTime: expiration.toISOString(),
    });
    
    console.log('✅ Renewed Microsoft webhook subscription');
    
    return {
      id: response.id,
      expiration: new Date(response.expirationDateTime),
      notificationUrl: WEBHOOK_URL,
    };
  } catch (error) {
    console.error('❌ Error renewing webhook subscription:', error);
    throw new Error('Failed to renew webhook subscription');
  }
}

/**
 * Stop change notification subscription
 */
export async function stopWebhookSubscription(
  connection: CalendarConnection
): Promise<void> {
  try {
    if (!connection.webhookId) {
      console.log('ℹ️  No webhook to stop');
      return;
    }
    
    const client = await getGraphClient(connection);
    
    await client.api(`/subscriptions/${connection.webhookId}`).delete();
    
    console.log('✅ Stopped Microsoft webhook subscription');
  } catch (error) {
    console.error('❌ Error stopping webhook subscription:', error);
    // Don't throw error, as webhook might already be expired
  }
}
