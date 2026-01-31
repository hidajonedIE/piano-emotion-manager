/**
 * Esquema de Notificaciones
 * Piano Emotion Manager
 * 
 * Define las tablas para el sistema de notificaciones push e in-app.
 */

import { mysqlTable, int, varchar, text, boolean, datetime, json, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { users } from './schema.js';

// ============================================================================
// Push Tokens
// ============================================================================

export const pushTokens = mysqlTable('push_tokens', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull(),
  platform: mysqlEnum('platform', ['ios', 'android', 'web']).notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  deviceName: varchar('device_name', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  lastUsedAt: datetime('last_used_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('push_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('push_tokens_token_idx').on(table.token),
}));

// ============================================================================
// Stored Notifications (In-App)
// ============================================================================

export const storedNotifications = mysqlTable('stored_notifications', {
  id: int('id').primaryKey().autoincrement(),
  notificationId: varchar('notification_id', { length: 36 }).notNull().unique(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: int('organization_id'),
  type: mysqlEnum('type', [
    'assignment_new',
    'assignment_accepted',
    'assignment_rejected',
    'assignment_started',
    'assignment_completed',
    'assignment_cancelled',
    'assignment_reassigned',
    'invitation_received',
    'invitation_accepted',
    'member_joined',
    'member_left',
    'reminder',
    'system',
    'message',
    'payment',
    'invoice',
    'quote',
    'warranty',
    'stock_alert',
  ]).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'),
  isRead: boolean('is_read').default(false),
  readAt: datetime('read_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('stored_notifications_user_id_idx').on(table.userId),
  orgIdIdx: index('stored_notifications_org_id_idx').on(table.organizationId),
  typeIdx: index('stored_notifications_type_idx').on(table.type),
  isReadIdx: index('stored_notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('stored_notifications_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// Notification Preferences
// ============================================================================

export const notificationPreferences = mysqlTable('notification_preferences', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Canales habilitados
  pushEnabled: boolean('push_enabled').default(true),
  emailEnabled: boolean('email_enabled').default(true),
  smsEnabled: boolean('sms_enabled').default(false),
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  
  // Tipos de notificación habilitados
  assignmentsEnabled: boolean('assignments_enabled').default(true),
  remindersEnabled: boolean('reminders_enabled').default(true),
  messagesEnabled: boolean('messages_enabled').default(true),
  paymentsEnabled: boolean('payments_enabled').default(true),
  systemEnabled: boolean('system_enabled').default(true),
  
  // Horarios de silencio
  quietHoursEnabled: boolean('quiet_hours_enabled').default(false),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // HH:MM
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // HH:MM
  
  // Frecuencia de resúmenes
  dailyDigestEnabled: boolean('daily_digest_enabled').default(false),
  dailyDigestTime: varchar('daily_digest_time', { length: 5 }), // HH:MM
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('notification_preferences_user_id_idx').on(table.userId),
}));

// ============================================================================
// Scheduled Notifications
// ============================================================================

export const scheduledNotifications = mysqlTable('scheduled_notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expoNotificationId: varchar('expo_notification_id', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'),
  scheduledFor: datetime('scheduled_for').notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'cancelled', 'failed']).default('pending'),
  sentAt: datetime('sent_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('scheduled_notifications_user_id_idx').on(table.userId),
  scheduledForIdx: index('scheduled_notifications_scheduled_for_idx').on(table.scheduledFor),
  statusIdx: index('scheduled_notifications_status_idx').on(table.status),
}));

// ============================================================================
// Types
// ============================================================================

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

export type StoredNotification = typeof storedNotifications.$inferSelect;
export type InsertStoredNotification = typeof storedNotifications.$inferInsert;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = typeof scheduledNotifications.$inferInsert;
