/**
 * Client Portal Database Functions
 */

import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as auth from './auth.js';

// ============================================================================
// Types
// ============================================================================

export interface ClientPortalUser {
  id: string;
  clientId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPortalSession {
  id: string;
  clientPortalUserId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ClientPortalInvitation {
  id: string;
  clientId: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface ClientMessage {
  id: string;
  clientId: string;
  fromUserId: string | null;
  fromClientPortalUserId: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface PasswordReset {
  id: string;
  clientPortalUserId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// ============================================================================
// Portal Users
// ============================================================================

export async function createPortalUser(data: {
  clientId: string;
  email: string;
  password: string;
}): Promise<ClientPortalUser> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const id = nanoid();
  const passwordHash = await auth.hashPassword(data.password);
  
  await db.execute(sql`
    INSERT INTO client_portal_users (id, clientId, email, passwordHash, isActive)
    VALUES (${id}, ${data.clientId}, ${data.email}, ${passwordHash}, TRUE)
  `);
  
  const user = await getPortalUserById(id);
  if (!user) throw new Error('Failed to create portal user');
  return user;
}

export async function getPortalUserById(id: string): Promise<ClientPortalUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_users WHERE id = ${id}
  `);
  
  return (result.rows[0] as ClientPortalUser) || null;
}

export async function getPortalUserByEmail(email: string): Promise<ClientPortalUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_users WHERE email = ${email}
  `);
  
  return (result.rows[0] as ClientPortalUser) || null;
}

export async function getPortalUserByClientId(clientId: string): Promise<ClientPortalUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_users WHERE clientId = ${clientId} LIMIT 1
  `);
  
  return (result.rows[0] as ClientPortalUser) || null;
}

export async function updatePortalUser(
  id: string,
  data: Partial<Pick<ClientPortalUser, 'email' | 'passwordHash' | 'isActive' | 'lastLoginAt'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }
  if (data.passwordHash !== undefined) {
    updates.push('passwordHash = ?');
    values.push(data.passwordHash);
  }
  if (data.isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(data.isActive);
  }
  if (data.lastLoginAt !== undefined) {
    updates.push('lastLoginAt = ?');
    values.push(data.lastLoginAt);
  }
  
  if (updates.length === 0) return;
  
  updates.push('updatedAt = NOW()');
  values.push(id);
  
  const query = `UPDATE client_portal_users SET ${updates.join(', ')} WHERE id = ?`;
  await db.execute(sql.raw(query, values));
}

export async function deletePortalUser(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM client_portal_users WHERE id = ${id}
  `);
}

// ============================================================================
// Sessions
// ============================================================================

export async function createSession(data: {
  clientPortalUserId: string;
  token: string;
  expiresAt: Date;
}): Promise<ClientPortalSession> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const id = nanoid();
  
  await db.execute(sql`
    INSERT INTO client_portal_sessions (id, clientPortalUserId, token, expiresAt)
    VALUES (${id}, ${data.clientPortalUserId}, ${data.token}, ${data.expiresAt})
  `);
  
  const session = await getSessionById(id);
  if (!session) throw new Error('Failed to create session');
  return session;
}

export async function getSessionById(id: string): Promise<ClientPortalSession | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_sessions WHERE id = ${id}
  `);
  
  return (result.rows[0] as ClientPortalSession) || null;
}

export async function getSessionByToken(token: string): Promise<ClientPortalSession | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_sessions WHERE token = ${token}
  `);
  
  return (result.rows[0] as ClientPortalSession) || null;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM client_portal_sessions WHERE id = ${id}
  `);
}

export async function deleteExpiredSessions(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM client_portal_sessions WHERE expiresAt < NOW()
  `);
}

// ============================================================================
// Invitations
// ============================================================================

export async function createInvitation(data: {
  clientId: string;
  email: string;
  createdBy: string;
}): Promise<ClientPortalInvitation> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const id = nanoid();
  const token = auth.generateInvitationToken();
  const expiresAt = auth.generateExpirationDate(7); // 7 days
  
  await db.execute(sql`
    INSERT INTO client_portal_invitations (id, clientId, email, token, expiresAt, createdBy)
    VALUES (${id}, ${data.clientId}, ${data.email}, ${token}, ${expiresAt}, ${data.createdBy})
  `);
  
  const invitation = await getInvitationById(id);
  if (!invitation) throw new Error('Failed to create invitation');
  return invitation;
}

export async function getInvitationById(id: string): Promise<ClientPortalInvitation | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_invitations WHERE id = ${id}
  `);
  
  return (result.rows[0] as ClientPortalInvitation) || null;
}

export async function getInvitationByToken(token: string): Promise<ClientPortalInvitation | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_invitations WHERE token = ${token}
  `);
  
  return (result.rows[0] as ClientPortalInvitation) || null;
}

export async function markInvitationAsUsed(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    UPDATE client_portal_invitations SET usedAt = NOW() WHERE id = ${id}
  `);
}

export async function deleteInvitation(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM client_portal_invitations WHERE id = ${id}
  `);
}

// ============================================================================
// Messages
// ============================================================================

export async function createMessage(data: {
  clientId: string;
  fromUserId?: string;
  fromClientPortalUserId?: string;
  message: string;
}): Promise<ClientMessage> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const id = nanoid();
  
  await db.execute(sql`
    INSERT INTO client_messages (id, clientId, fromUserId, fromClientPortalUserId, message, isRead)
    VALUES (
      ${id}, 
      ${data.clientId}, 
      ${data.fromUserId || null}, 
      ${data.fromClientPortalUserId || null}, 
      ${data.message}, 
      FALSE
    )
  `);
  
  const message = await getMessageById(id);
  if (!message) throw new Error('Failed to create message');
  return message;
}

export async function getMessageById(id: string): Promise<ClientMessage | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_messages WHERE id = ${id}
  `);
  
  return (result.rows[0] as ClientMessage) || null;
}

export async function getMessagesByClientId(
  clientId: string,
  limit: number = 50
): Promise<ClientMessage[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT * FROM client_messages 
    WHERE clientId = ${clientId}
    ORDER BY createdAt DESC
    LIMIT ${limit}
  `);
  
  return result.rows as ClientMessage[];
}

export async function markMessagesAsRead(ids: string[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  if (ids.length === 0) return;
  
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE client_messages SET isRead = TRUE WHERE id IN (${placeholders})`;
  
  await db.execute(sql.raw(query, ids));
}

export async function getUnreadMessageCount(clientId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM client_messages 
    WHERE clientId = ${clientId} AND isRead = FALSE
  `);
  
  return (result.rows[0] as any).count || 0;
}

// ============================================================================
// Password Resets
// ============================================================================

export async function createPasswordReset(
  clientPortalUserId: string
): Promise<PasswordReset> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const id = nanoid();
  const token = auth.generatePasswordResetToken();
  const expiresAt = auth.generateExpirationDate(1); // 1 day
  
  await db.execute(sql`
    INSERT INTO client_portal_password_resets (id, clientPortalUserId, token, expiresAt)
    VALUES (${id}, ${clientPortalUserId}, ${token}, ${expiresAt})
  `);
  
  const reset = await getPasswordResetById(id);
  if (!reset) throw new Error('Failed to create password reset');
  return reset;
}

export async function getPasswordResetById(id: string): Promise<PasswordReset | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_password_resets WHERE id = ${id}
  `);
  
  return (result.rows[0] as PasswordReset) || null;
}

export async function getPasswordResetByToken(token: string): Promise<PasswordReset | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.execute(sql`
    SELECT * FROM client_portal_password_resets WHERE token = ${token}
  `);
  
  return (result.rows[0] as PasswordReset) || null;
}

export async function markPasswordResetAsUsed(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    UPDATE client_portal_password_resets SET usedAt = NOW() WHERE id = ${id}
  `);
}

export async function deletePasswordReset(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.execute(sql`
    DELETE FROM client_portal_password_resets WHERE id = ${id}
  `);
}
