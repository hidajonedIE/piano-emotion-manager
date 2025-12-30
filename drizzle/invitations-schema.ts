import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  invitedBy: text('invited_by').notNull(), // Email del admin que invitó
  token: text('token').notNull().unique(), // Token único para la invitación
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(), // Invitaciones expiran en 7 días
});

// Lista blanca de emails de administradores que siempre tienen acceso
export const ADMIN_EMAILS = [
  'jnavarrete@inboundemotion.com',
];
