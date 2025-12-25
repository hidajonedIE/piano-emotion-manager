/**
 * Esquema de Distribuidor
 * Piano Emotion Manager
 * 
 * Define las tablas para la configuración del distribuidor y gestión de técnicos.
 */

import { mysqlTable, int, varchar, text, boolean, datetime, decimal, json, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { users } from './schema';

// ============================================================================
// Distributor Configuration
// ============================================================================

export const distributors = mysqlTable('distributors', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// WooCommerce Configuration
// ============================================================================

export const distributorWooCommerceConfig = mysqlTable('distributor_woocommerce_config', {
  id: int('id').primaryKey().autoincrement(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }).unique(),
  url: varchar('url', { length: 500 }).notNull(),
  consumerKey: varchar('consumer_key', { length: 255 }).notNull(),
  consumerSecret: varchar('consumer_secret', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(false),
  connectionStatus: mysqlEnum('connection_status', ['connected', 'disconnected', 'error', 'testing']).default('disconnected'),
  lastTestDate: datetime('last_test_date'),
  errorMessage: text('error_message'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  distributorIdIdx: index('wc_config_distributor_id_idx').on(table.distributorId),
}));

// ============================================================================
// Premium Configuration
// ============================================================================

export const distributorPremiumConfig = mysqlTable('distributor_premium_config', {
  id: int('id').primaryKey().autoincrement(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }).unique(),
  minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 10, scale: 2 }).default('100.00'),
  trialPeriodDays: int('trial_period_days').default(30),
  gracePeriodDays: int('grace_period_days').default(7),
  whatsappEnabled: boolean('whatsapp_enabled').default(true),
  portalEnabled: boolean('portal_enabled').default(true),
  autoRemindersEnabled: boolean('auto_reminders_enabled').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  distributorIdIdx: index('premium_config_distributor_id_idx').on(table.distributorId),
}));

// ============================================================================
// Technician Account Status
// ============================================================================

export const technicianAccountStatus = mysqlTable('technician_account_status', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }),
  accountTier: mysqlEnum('account_tier', ['trial', 'basic', 'premium']).default('trial'),
  trialEndsAt: datetime('trial_ends_at'),
  purchasesLast30Days: decimal('purchases_last_30_days', { precision: 10, scale: 2 }).default('0.00'),
  lastPurchaseCheck: datetime('last_purchase_check'),
  lastPurchaseDate: datetime('last_purchase_date'),
  tierChangedAt: datetime('tier_changed_at'),
  previousTier: mysqlEnum('previous_tier', ['trial', 'basic', 'premium']),
  gracePeriodEndsAt: datetime('grace_period_ends_at'),
  manualOverride: boolean('manual_override').default(false),
  manualOverrideReason: text('manual_override_reason'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('tech_status_user_id_idx').on(table.userId),
  distributorIdIdx: index('tech_status_distributor_id_idx').on(table.distributorId),
  tierIdx: index('tech_status_tier_idx').on(table.accountTier),
}));

// ============================================================================
// Purchase Verification Logs
// ============================================================================

export const purchaseVerificationLogs = mysqlTable('purchase_verification_logs', {
  id: int('id').primaryKey().autoincrement(),
  logId: varchar('log_id', { length: 36 }).notNull().unique(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }),
  verificationDate: datetime('verification_date').notNull(),
  purchasesFound: decimal('purchases_found', { precision: 10, scale: 2 }).notNull(),
  minimumRequired: decimal('minimum_required', { precision: 10, scale: 2 }).notNull(),
  meetsMinimum: boolean('meets_minimum').notNull(),
  previousTier: mysqlEnum('previous_tier', ['trial', 'basic', 'premium']),
  newTier: mysqlEnum('new_tier', ['trial', 'basic', 'premium']),
  tierChanged: boolean('tier_changed').default(false),
  ordersCount: int('orders_count').default(0),
  status: mysqlEnum('status', ['success', 'error', 'skipped']).default('success'),
  errorMessage: text('error_message'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('verification_log_user_id_idx').on(table.userId),
  distributorIdIdx: index('verification_log_distributor_id_idx').on(table.distributorId),
  verificationDateIdx: index('verification_log_date_idx').on(table.verificationDate),
}));

// ============================================================================
// Types
// ============================================================================

export type Distributor = typeof distributors.$inferSelect;
export type InsertDistributor = typeof distributors.$inferInsert;

export type DistributorWooCommerceConfig = typeof distributorWooCommerceConfig.$inferSelect;
export type InsertDistributorWooCommerceConfig = typeof distributorWooCommerceConfig.$inferInsert;

export type DistributorPremiumConfig = typeof distributorPremiumConfig.$inferSelect;
export type InsertDistributorPremiumConfig = typeof distributorPremiumConfig.$inferInsert;

export type TechnicianAccountStatus = typeof technicianAccountStatus.$inferSelect;
export type InsertTechnicianAccountStatus = typeof technicianAccountStatus.$inferInsert;

export type PurchaseVerificationLog = typeof purchaseVerificationLogs.$inferSelect;
export type InsertPurchaseVerificationLog = typeof purchaseVerificationLogs.$inferInsert;
