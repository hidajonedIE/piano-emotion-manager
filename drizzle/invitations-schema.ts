import { mysqlTable, text, timestamp, boolean, varchar } from 'drizzle-orm/mysql-core';

export const invitations = mysqlTable('invitations', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 320 }).notNull(),
  invitedBy: varchar('invited_by', { length: 320 }).notNull(), // Email del admin que invitó
  token: varchar('token', { length: 255 }).notNull().unique(), // Token único para la invitación
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(), // Invitaciones expiran en 7 días
});

// Lista blanca de emails de administradores que siempre tienen acceso
export const ADMIN_EMAILS = [
  'jnavarrete@inboundemotion.com',
];
