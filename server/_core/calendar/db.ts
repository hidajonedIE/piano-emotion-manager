/**
 * Database functions for Calendar Sync
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';
import type {
  CalendarConnection,
  CalendarSyncEvent,
  CalendarSyncLog,
  CalendarProvider,
  SyncStatus,
  SyncAction,
  SyncDirection
} from './types.js';

// ============================================================================
// Calendar Connections
// ============================================================================

export async function createConnection(data: Omit<CalendarConnection, 'createdAt' | 'updatedAt'>): Promise<CalendarConnection> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    INSERT INTO calendar_connections (
      id, userId, provider, calendarId, calendarName,
      accessToken, refreshToken, expiresAt,
      webhookId, webhookExpiration,
      lastSyncToken, lastDeltaLink,
      syncEnabled, lastSyncAt
    ) VALUES (
      ${data.id}, ${data.userId}, ${data.provider}, ${data.calendarId}, ${data.calendarName},
      ${data.accessToken}, ${data.refreshToken}, ${data.expiresAt},
      ${data.webhookId}, ${data.webhookExpiration},
      ${data.lastSyncToken}, ${data.lastDeltaLink},
      ${data.syncEnabled}, ${data.lastSyncAt}
    )
  `);
  
  const result = await getConnectionById(data.id);
  if (!result) throw new Error('Failed to create connection');
  return result;
}

export async function getConnectionById(id: string): Promise<CalendarConnection | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_connections WHERE id = ${id}
  `);
  
  return (result.rows[0] as CalendarConnection) || null;
}

export async function getConnectionsByUserId(userId: string): Promise<CalendarConnection[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_connections WHERE userId = ${userId} ORDER BY createdAt DESC
  `);
  
  return result.rows as CalendarConnection[];
}

export async function getConnectionByUserAndProvider(
  userId: string,
  provider: CalendarProvider
): Promise<CalendarConnection | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_connections 
    WHERE userId = ${userId} AND provider = ${provider}
    LIMIT 1
  `);
  
  return (result.rows[0] as CalendarConnection) || null;
}

export async function updateConnection(
  id: string,
  data: Partial<Omit<CalendarConnection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.accessToken !== undefined) {
    updates.push('accessToken = ?');
    values.push(data.accessToken);
  }
  if (data.refreshToken !== undefined) {
    updates.push('refreshToken = ?');
    values.push(data.refreshToken);
  }
  if (data.expiresAt !== undefined) {
    updates.push('expiresAt = ?');
    values.push(data.expiresAt);
  }
  if (data.webhookId !== undefined) {
    updates.push('webhookId = ?');
    values.push(data.webhookId);
  }
  if (data.webhookExpiration !== undefined) {
    updates.push('webhookExpiration = ?');
    values.push(data.webhookExpiration);
  }
  if (data.lastSyncToken !== undefined) {
    updates.push('lastSyncToken = ?');
    values.push(data.lastSyncToken);
  }
  if (data.lastDeltaLink !== undefined) {
    updates.push('lastDeltaLink = ?');
    values.push(data.lastDeltaLink);
  }
  if (data.syncEnabled !== undefined) {
    updates.push('syncEnabled = ?');
    values.push(data.syncEnabled);
  }
  if (data.lastSyncAt !== undefined) {
    updates.push('lastSyncAt = ?');
    values.push(data.lastSyncAt);
  }
  
  if (updates.length === 0) return;
  
  updates.push('updatedAt = NOW()');
  values.push(id);
  
  const query = `UPDATE calendar_connections SET ${updates.join(', ')} WHERE id = ?`;
  
  await db.execute(sql.raw(query, values));
}

export async function deleteConnection(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM calendar_connections WHERE id = ${id}
  `);
}

export async function getExpiringSoonWebhooks(hoursThreshold: number): Promise<CalendarConnection[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_connections 
    WHERE webhookExpiration IS NOT NULL 
    AND webhookExpiration < DATE_ADD(NOW(), INTERVAL ${hoursThreshold} HOUR)
    AND syncEnabled = 1
  `);
  
  return result.rows as CalendarConnection[];
}

// ============================================================================
// Sync Events
// ============================================================================

export async function createSyncEvent(data: CalendarSyncEvent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    INSERT INTO calendar_sync_events (
      id, connectionId, appointmentId, externalEventId,
      provider, syncStatus, lastSyncedAt, errorMessage, metadata
    ) VALUES (
      ${data.id}, ${data.connectionId}, ${data.appointmentId}, ${data.externalEventId},
      ${data.provider}, ${data.syncStatus}, ${data.lastSyncedAt}, 
      ${data.errorMessage}, ${data.metadata ? JSON.stringify(data.metadata) : null}
    )
  `);
}

export async function getSyncEventByAppointmentAndConnection(
  appointmentId: string,
  connectionId: string
): Promise<CalendarSyncEvent | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_sync_events 
    WHERE appointmentId = ${appointmentId} AND connectionId = ${connectionId}
    LIMIT 1
  `);
  
  return (result.rows[0] as CalendarSyncEvent) || null;
}

export async function getSyncEventByExternalId(
  externalEventId: string,
  connectionId: string
): Promise<CalendarSyncEvent | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_sync_events 
    WHERE externalEventId = ${externalEventId} AND connectionId = ${connectionId}
    LIMIT 1
  `);
  
  return (result.rows[0] as CalendarSyncEvent) || null;
}

export async function updateSyncEvent(
  id: string,
  data: Partial<Omit<CalendarSyncEvent, 'id' | 'connectionId' | 'createdAt'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.syncStatus !== undefined) {
    updates.push('syncStatus = ?');
    values.push(data.syncStatus);
  }
  if (data.lastSyncedAt !== undefined) {
    updates.push('lastSyncedAt = ?');
    values.push(data.lastSyncedAt);
  }
  if (data.errorMessage !== undefined) {
    updates.push('errorMessage = ?');
    values.push(data.errorMessage);
  }
  if (data.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(data.metadata ? JSON.stringify(data.metadata) : null);
  }
  
  if (updates.length === 0) return;
  
  updates.push('updatedAt = NOW()');
  values.push(id);
  
  const query = `UPDATE calendar_sync_events SET ${updates.join(', ')} WHERE id = ?`;
  
  await db.execute(sql.raw(query, values));
}

export async function deleteSyncEvent(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM calendar_sync_events WHERE id = ${id}
  `);
}

// ============================================================================
// Sync Logs
// ============================================================================

export async function createSyncLog(data: Omit<CalendarSyncLog, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    INSERT INTO calendar_sync_log (
      connectionId, action, direction, appointmentId,
      externalEventId, status, errorMessage, details
    ) VALUES (
      ${data.connectionId}, ${data.action}, ${data.direction}, ${data.appointmentId},
      ${data.externalEventId}, ${data.status}, ${data.errorMessage},
      ${data.details ? JSON.stringify(data.details) : null}
    )
  `);
}

export async function getSyncLogsByConnection(
  connectionId: string,
  limit: number = 50
): Promise<CalendarSyncLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM calendar_sync_log 
    WHERE connectionId = ${connectionId}
    ORDER BY createdAt DESC
    LIMIT ${limit}
  `);
  
  return result.rows as CalendarSyncLog[];
}

export type { CalendarConnection, CalendarSyncEvent, CalendarSyncLog };
