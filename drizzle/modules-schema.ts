/**
 * Esquema de Base de Datos para Módulos y Suscripciones
 * Piano Emotion Manager
 * 
 * Sistema de activación/desactivación de módulos según plan
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  pgEnum,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

export const moduleTypeEnum = pgEnum('module_type', [
  'core',        // Módulo básico incluido en todos los planes
  'free',        // Módulo gratuito opcional
  'premium',     // Módulo premium (requiere suscripción)
  'addon',       // Complemento de pago único
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',        // Plan gratuito
  'starter',     // Plan inicial
  'professional', // Plan profesional
  'enterprise',  // Plan empresarial
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',      // Activa
  'trial',       // Período de prueba
  'past_due',    // Pago pendiente
  'cancelled',   // Cancelada
  'expired',     // Expirada
]);

// ============================================================================
// Tables
// ============================================================================

/**
 * Catálogo de módulos disponibles
 */
export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  
  // Identificador único del módulo
  code: varchar('code', { length: 50 }).notNull().unique(),
  
  // Información del módulo
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  
  // Tipo y disponibilidad
  type: moduleTypeEnum('type').notNull(),
  
  // Planes que incluyen este módulo
  includedInPlans: json('included_in_plans').$type<string[]>().default([]),
  
  // Precio para addon (si aplica)
  addonPrice: decimal('addon_price', { precision: 10, scale: 2 }),
  addonPriceCurrency: varchar('addon_price_currency', { length: 3 }).default('EUR'),
  
  // Dependencias de otros módulos
  dependencies: json('dependencies').$type<string[]>().default([]),
  
  // Configuración
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  
  // Metadatos
  version: varchar('version', { length: 20 }),
  releaseNotes: text('release_notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Planes de suscripción
 */
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  
  // Identificador del plan
  code: subscriptionPlanEnum('code').notNull().unique(),
  
  // Información del plan
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Precios
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }),
  yearlyPrice: decimal('yearly_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Límites
  maxUsers: integer('max_users'),
  maxClients: integer('max_clients'),
  maxPianos: integer('max_pianos'),
  maxInvoicesPerMonth: integer('max_invoices_per_month'),
  maxStorageMb: integer('max_storage_mb'),
  
  // Características
  features: json('features').$type<string[]>().default([]),
  
  // Configuración
  isActive: boolean('is_active').default(true),
  isPopular: boolean('is_popular').default(false),
  trialDays: integer('trial_days').default(14),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Suscripciones de organizaciones
 */
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  // Plan actual
  planCode: subscriptionPlanEnum('plan_code').notNull(),
  
  // Estado
  status: subscriptionStatusEnum('status').notNull().default('trial'),
  
  // Fechas
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  trialEndDate: timestamp('trial_end_date'),
  cancelledAt: timestamp('cancelled_at'),
  
  // Facturación
  billingCycle: varchar('billing_cycle', { length: 20 }), // 'monthly' | 'yearly'
  nextBillingDate: timestamp('next_billing_date'),
  
  // Proveedor de pago
  paymentProvider: varchar('payment_provider', { length: 50 }), // 'stripe', 'paypal', etc.
  externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('subscriptions_org_idx').on(table.organizationId),
}));

/**
 * Módulos activados por organización
 */
export const organizationModules = pgTable('organization_modules', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  moduleCode: varchar('module_code', { length: 50 }).notNull(),
  
  // Estado
  isEnabled: boolean('is_enabled').default(true),
  
  // Tipo de acceso
  accessType: varchar('access_type', { length: 20 }).notNull(), // 'plan', 'addon', 'trial', 'custom'
  
  // Si es addon, fecha de compra
  purchasedAt: timestamp('purchased_at'),
  expiresAt: timestamp('expires_at'),
  
  // Configuración específica del módulo
  settings: json('settings').$type<Record<string, any>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgModuleIdx: index('org_modules_idx').on(table.organizationId, table.moduleCode),
}));

/**
 * Historial de cambios de suscripción
 */
export const subscriptionHistory = pgTable('subscription_history', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').notNull(),
  
  // Cambio realizado
  action: varchar('action', { length: 50 }).notNull(), // 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
  
  // Plan anterior y nuevo
  fromPlan: varchar('from_plan', { length: 50 }),
  toPlan: varchar('to_plan', { length: 50 }),
  
  // Detalles
  details: json('details').$type<Record<string, any>>(),
  
  // Usuario que realizó el cambio
  changedBy: integer('changed_by'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Uso de recursos por organización (para límites)
 */
export const resourceUsage = pgTable('resource_usage', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  // Período
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Contadores
  usersCount: integer('users_count').default(0),
  clientsCount: integer('clients_count').default(0),
  pianosCount: integer('pianos_count').default(0),
  invoicesCount: integer('invoices_count').default(0),
  storageMb: integer('storage_mb').default(0),
  
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgPeriodIdx: index('resource_usage_org_period_idx').on(table.organizationId, table.periodStart),
}));

// ============================================================================
// Relations
// ============================================================================

export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  history: many(subscriptionHistory),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionHistory.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type ModuleType = typeof moduleTypeEnum.enumValues[number];
export type SubscriptionPlan = typeof subscriptionPlanEnum.enumValues[number];
export type SubscriptionStatus = typeof subscriptionStatusEnum.enumValues[number];

export type Module = typeof modules.$inferSelect;
export type SubscriptionPlanRecord = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type OrganizationModule = typeof organizationModules.$inferSelect;
