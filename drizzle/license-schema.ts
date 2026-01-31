/**
 * Esquema de Licencias
 * Piano Emotion Manager
 * 
 * Sistema de licencias para gestionar el acceso de técnicos
 * tanto individuales como clientes de distribuidores.
 */

import { mysqlTable, int, varchar, text, boolean, datetime, decimal, json, mysqlEnum, index, unique } from 'drizzle-orm/mysql-core';
import { users } from './schema.js';
import { distributors } from './distributor-schema.js';

// ============================================================================
// Enums
// ============================================================================

/**
 * Tipos de licencia
 */
export const licenseTypeValues = ['trial', 'free', 'starter', 'professional', 'enterprise'] as const;
export type LicenseType = typeof licenseTypeValues[number];

/**
 * Estados de licencia
 */
export const licenseStatusValues = ['available', 'active', 'expired', 'revoked', 'suspended'] as const;
export type LicenseStatus = typeof licenseStatusValues[number];

// ============================================================================
// Platform Admins
// ============================================================================

/**
 * Administradores de la plataforma Piano Emotion
 * Solo estos usuarios pueden acceder al panel de administración
 */
export const platformAdmins = mysqlTable('platform_admins', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  role: mysqlEnum('role', ['super_admin', 'admin', 'support']).default('admin'),
  permissions: json('permissions').$type<string[]>(), // Permisos específicos
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('platform_admins_user_id_idx').on(table.userId),
}));

// ============================================================================
// License Templates
// ============================================================================

/**
 * Plantillas de licencia predefinidas
 * Facilitan la creación de licencias con configuraciones comunes
 */
export const licenseTemplates = mysqlTable('license_templates', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  
  // Duración
  durationDays: int('duration_days'), // null = sin expiración
  
  // Configuración de módulos incluidos
  moduleConfig: json('module_config').$type<{
    // Módulos de Negocio
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    // Módulos Premium
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    // Configuración de Tienda
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Límites
  maxUsers: int('max_users').default(1), // Para licencias de equipo
  maxClients: int('max_clients'), // Límite de clientes
  maxPianos: int('max_pianos'), // Límite de pianos
  
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// Licenses
// ============================================================================

/**
 * Licencias generadas
 * Cada licencia tiene un código único que el técnico usa para activar
 */
export const licenses = mysqlTable('licenses', {
  id: int('id').primaryKey().autoincrement(),
  
  // Código único de activación (ej: PE-XXXX-XXXX-XXXX)
  code: varchar('code', { length: 50 }).notNull().unique(),
  
  // Tipo y estado
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  status: mysqlEnum('status', licenseStatusValues).default('available'),
  
  // Asociación (opcional)
  distributorId: int('distributor_id').references(() => distributors.id, { onDelete: 'set null' }),
  templateId: int('template_id').references(() => licenseTemplates.id, { onDelete: 'set null' }),
  
  // Usuario que activó la licencia (null si no está activada)
  activatedByUserId: int('activated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  activatedAt: datetime('activated_at'),
  
  // Configuración de módulos (puede sobrescribir la del distribuidor)
  moduleConfig: json('module_config').$type<{
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Límites específicos de esta licencia
  maxUsers: int('max_users').default(1),
  maxClients: int('max_clients'),
  maxPianos: int('max_pianos'),
  
  // Fechas
  validFrom: datetime('valid_from').$defaultFn(() => new Date()),
  validUntil: datetime('valid_until'), // null = sin expiración
  
  // Metadatos
  notes: text('notes'), // Notas internas del admin
  metadata: json('metadata').$type<Record<string, any>>(), // Datos adicionales
  
  // Quién creó la licencia
  createdByAdminId: int('created_by_admin_id').references(() => platformAdmins.id),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  codeIdx: index('licenses_code_idx').on(table.code),
  statusIdx: index('licenses_status_idx').on(table.status),
  distributorIdx: index('licenses_distributor_idx').on(table.distributorId),
  activatedByIdx: index('licenses_activated_by_idx').on(table.activatedByUserId),
}));

// ============================================================================
// License Batches
// ============================================================================

/**
 * Lotes de licencias
 * Para generar múltiples licencias de una vez para un distribuidor
 */
export const licenseBatches = mysqlTable('license_batches', {
  id: int('id').primaryKey().autoincrement(),
  
  // Identificador del lote
  batchCode: varchar('batch_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Asociación
  distributorId: int('distributor_id').references(() => distributors.id, { onDelete: 'set null' }),
  templateId: int('template_id').references(() => licenseTemplates.id),
  
  // Cantidad
  totalLicenses: int('total_licenses').notNull(),
  activatedLicenses: int('activated_licenses').default(0),
  
  // Configuración común para todas las licencias del lote
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  moduleConfig: json('module_config').$type<{
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Duración de las licencias
  durationDays: int('duration_days'),
  
  // Quién creó el lote
  createdByAdminId: int('created_by_admin_id').references(() => platformAdmins.id),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  batchCodeIdx: index('license_batches_code_idx').on(table.batchCode),
  distributorIdx: index('license_batches_distributor_idx').on(table.distributorId),
}));

// ============================================================================
// License History
// ============================================================================

/**
 * Historial de cambios en licencias
 * Para auditoría y seguimiento
 */
export const licenseHistory = mysqlTable('license_history', {
  id: int('id').primaryKey().autoincrement(),
  licenseId: int('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  
  action: mysqlEnum('action', [
    'created',
    'activated', 
    'deactivated',
    'expired',
    'revoked',
    'suspended',
    'reactivated',
    'transferred',
    'config_changed',
  ]).notNull(),
  
  previousStatus: mysqlEnum('previous_status', licenseStatusValues),
  newStatus: mysqlEnum('new_status', licenseStatusValues),
  
  // Quién realizó la acción
  performedByAdminId: int('performed_by_admin_id').references(() => platformAdmins.id),
  performedByUserId: int('performed_by_user_id').references(() => users.id),
  
  // Detalles adicionales
  details: json('details').$type<Record<string, any>>(),
  notes: text('notes'),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  licenseIdx: index('license_history_license_idx').on(table.licenseId),
  actionIdx: index('license_history_action_idx').on(table.action),
}));

// ============================================================================
// Types
// ============================================================================

export type PlatformAdmin = typeof platformAdmins.$inferSelect;
export type InsertPlatformAdmin = typeof platformAdmins.$inferInsert;

export type LicenseTemplate = typeof licenseTemplates.$inferSelect;
export type InsertLicenseTemplate = typeof licenseTemplates.$inferInsert;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = typeof licenses.$inferInsert;

export type LicenseBatch = typeof licenseBatches.$inferSelect;
export type InsertLicenseBatch = typeof licenseBatches.$inferInsert;

export type LicenseHistoryEntry = typeof licenseHistory.$inferSelect;
export type InsertLicenseHistoryEntry = typeof licenseHistory.$inferInsert;
