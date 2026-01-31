/**
 * Esquema de base de datos para el Portal del Cliente
 * Extiende el esquema existente con tablas para usuarios del portal,
 * solicitudes de citas, valoraciones y mensajes.
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const appointmentRequestStatusEnum = pgEnum('appointment_request_status', [
  'pending',
  'approved',
  'rejected',
]);

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'file',
]);

// ==========================================
// USUARIOS DEL PORTAL (CLIENTES)
// ==========================================

export const clientUsers = pgTable('client_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(), // Referencia a la tabla clients existente
  email: varchar('email', { length: 255 }).notNull().unique(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// MAGIC LINKS PARA AUTENTICACIÓN
// ==========================================

export const magicLinks = pgTable('magic_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientUserId: uuid('client_user_id').references(() => clientUsers.id),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// INVITACIONES AL PORTAL
// ==========================================

export const clientInvitations = pgTable('client_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull(), // Cliente a invitar
  technicianId: uuid('technician_id').notNull(), // Técnico que invita
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// SOLICITUDES DE CITAS
// ==========================================

export const appointmentRequests = pgTable('appointment_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientUserId: uuid('client_user_id').references(() => clientUsers.id).notNull(),
  clientId: uuid('client_id').notNull(),
  pianoId: uuid('piano_id').notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  preferredDates: text('preferred_dates').notNull(), // JSON array de fechas
  preferredTimeSlot: varchar('preferred_time_slot', { length: 20 }).notNull(),
  notes: text('notes'),
  status: appointmentRequestStatusEnum('status').default('pending'),
  technicianNotes: text('technician_notes'),
  appointmentId: uuid('appointment_id'), // Si se aprueba, referencia a la cita creada
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// VALORACIONES DE SERVICIOS
// ==========================================

export const serviceRatings = pgTable('service_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull(), // Referencia a la tabla services existente
  clientUserId: uuid('client_user_id').references(() => clientUsers.id).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  technicianResponse: text('technician_response'),
  technicianRespondedAt: timestamp('technician_responded_at'),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// CONVERSACIONES
// ==========================================

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientUserId: uuid('client_user_id').references(() => clientUsers.id).notNull(),
  technicianId: uuid('technician_id').notNull(),
  lastMessageAt: timestamp('last_message_at'),
  clientUnreadCount: integer('client_unread_count').default(0),
  technicianUnreadCount: integer('technician_unread_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// MENSAJES
// ==========================================

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  senderId: uuid('sender_id').notNull(),
  senderType: varchar('sender_type', { length: 20 }).notNull(), // 'client' | 'technician'
  messageType: messageTypeEnum('message_type').default('text'),
  content: text('content').notNull(),
  attachmentUrl: text('attachment_url'),
  attachmentName: varchar('attachment_name', { length: 255 }),
  read: boolean('read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// NOTIFICACIONES DEL PORTAL
// ==========================================

export const portalNotifications = pgTable('portal_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientUserId: uuid('client_user_id').references(() => clientUsers.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // appointment_confirmed, message_received, etc.
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  data: text('data'), // JSON con datos adicionales
  read: boolean('read').default(false),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ==========================================
// PREFERENCIAS DEL USUARIO DEL PORTAL
// ==========================================

export const clientUserPreferences = pgTable('client_user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientUserId: uuid('client_user_id').references(() => clientUsers.id).notNull().unique(),
  emailNotifications: boolean('email_notifications').default(true),
  appointmentReminders: boolean('appointment_reminders').default(true),
  marketingEmails: boolean('marketing_emails').default(false),
  language: varchar('language', { length: 5 }).default('es'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// TIPOS TYPESCRIPT
// ==========================================

export type ClientUser = typeof clientUsers.$inferSelect;
export type NewClientUser = typeof clientUsers.$inferInsert;

export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert;

export type ClientInvitation = typeof clientInvitations.$inferSelect;
export type NewClientInvitation = typeof clientInvitations.$inferInsert;

export type AppointmentRequest = typeof appointmentRequests.$inferSelect;
export type NewAppointmentRequest = typeof appointmentRequests.$inferInsert;

export type ServiceRating = typeof serviceRatings.$inferSelect;
export type NewServiceRating = typeof serviceRatings.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type PortalNotification = typeof portalNotifications.$inferSelect;
export type NewPortalNotification = typeof portalNotifications.$inferInsert;

export type ClientUserPreferences = typeof clientUserPreferences.$inferSelect;
export type NewClientUserPreferences = typeof clientUserPreferences.$inferInsert;
