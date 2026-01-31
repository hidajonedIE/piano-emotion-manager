import { mysqlTable, timestamp, boolean, varchar, index } from 'drizzle-orm/mysql-core';
export const invitations = mysqlTable('invitations', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: varchar('email', { length: 320 }).notNull(),
    invitedBy: varchar('invited_by', { length: 320 }).notNull(), // Email del admin que invitó
    token: varchar('token', { length: 255 }).notNull().unique(), // Token único para la invitación
    used: boolean('used').notNull().default(false),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(), // Invitaciones expiran en 7 días
}, (table) => ({
    // Índice compuesto para validación de invitaciones (email + used)
    emailUsedIdx: index('email_used_idx').on(table.email, table.used),
    // Índice para búsqueda por token
    tokenIdx: index('token_idx').on(table.token),
    // Índice para expiración (útil para limpieza de invitaciones expiradas)
    expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
}));
// Lista blanca de emails de administradores que siempre tienen acceso
export const ADMIN_EMAILS = [
    'jnavarrete@inboundemotion.com',
];
