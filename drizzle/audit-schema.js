/**
 * Esquema de Auditoría de Seguridad
 * Piano Emotion Manager
 *
 * Registra cambios en credenciales y accesos sensibles
 */
import { pgTable, text, timestamp, uuid, pgEnum, inet } from 'drizzle-orm/pg-core';
// Enum para tipos de acción
export const auditActionEnum = pgEnum('audit_action', [
    'configure',
    'update',
    'delete',
    'view',
    'export'
]);
// Enum para tipos de recurso
export const auditResourceEnum = pgEnum('audit_resource', [
    'stripe',
    'paypal',
    'whatsapp',
    'smtp',
    'google_calendar',
    'outlook_calendar',
    'woocommerce',
    'verifactu'
]);
/**
 * Tabla de auditoría de cambios en credenciales
 */
export const credentialAuditLog = pgTable('credential_audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id').notNull(),
    gateway: text('gateway').notNull(), // stripe, paypal, whatsapp, etc.
    action: text('action').notNull(), // configure, delete, view
    userId: text('user_id').notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    details: text('details'), // Información adicional (sin datos sensibles)
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
/**
 * Tabla de intentos de acceso a configuraciones sensibles
 */
export const securityAccessLog = pgTable('security_access_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id'),
    userId: text('user_id'),
    resource: text('resource').notNull(), // Recurso accedido
    action: text('action').notNull(), // Acción intentada
    success: text('success').notNull().default('true'), // Si fue exitoso
    reason: text('reason'), // Razón de denegación si aplica
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
