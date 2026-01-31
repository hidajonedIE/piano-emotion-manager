/**
 * Esquema de Base de Datos para Módulos y Suscripciones
 * Piano Emotion Manager
 *
 * Sistema de activación/desactivación de módulos según plan
 */
import { mysqlTable, int, varchar, text, boolean, timestamp, decimal, mysqlEnum, json, index, } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
// ============================================================================
// Enums
// ============================================================================
export const moduleTypeEnum = mysqlEnum('type', [
    'free', // Módulo gratuito opcional
    'professional', // Módulo profesional (30€/año)
    'premium', // Módulo premium (requiere suscripción)
]);
export const subscriptionPlanEnum = mysqlEnum('plan_code', [
    'free', // Plan gratuito
    'professional', // Plan profesional
    'premium', // Plan premium (50€/año)
]);
export const subscriptionStatusEnum = mysqlEnum('status', [
    'active', // Activa
    'trial', // Período de prueba
    'past_due', // Pago pendiente
    'cancelled', // Cancelada
    'expired', // Expirada
]);
// ============================================================================
// Tables
// ============================================================================
/**
 * Catálogo de módulos disponibles
 */
export const modules = mysqlTable('modules', {
    id: int('id').autoincrement().primaryKey(),
    // Identificador único del módulo
    code: varchar('code', { length: 50 }).notNull().unique(),
    // Información del módulo
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }),
    // Tipo y disponibilidad
    type: mysqlEnum('type', ['free', 'professional', 'premium']).notNull(),
    // Planes que incluyen este módulo
    includedInPlans: json('includedInPlans').$type().default([]),
    // Precio para addon (si aplica)
    addonPrice: decimal('addonPrice', { precision: 10, scale: 2 }),
    addonPriceCurrency: varchar('addonPriceCurrency', { length: 3 }).default('EUR'),
    // Dependencias de otros módulos
    dependencies: json('dependencies').$type().default([]),
    // Configuración
    isActive: boolean('isActive').default(true),
    sortOrder: int('sortOrder').default(0),
    // Metadatos
    version: varchar('version', { length: 20 }),
    releaseNotes: text('releaseNotes'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
/**
 * Planes de suscripción
 */
export const subscriptionPlans = mysqlTable('subscription_plans', {
    id: int('id').autoincrement().primaryKey(),
    // Identificador del plan
    code: mysqlEnum('code', ['free', 'professional', 'premium']).notNull().unique(),
    // Información del plan
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    // Precios
    monthlyPrice: decimal('monthlyPrice', { precision: 10, scale: 2 }),
    yearlyPrice: decimal('yearlyPrice', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('EUR'),
    // Límites
    maxUsers: int('maxUsers'),
    maxClients: int('maxClients'),
    maxPianos: int('maxPianos'),
    maxInvoicesPerMonth: int('maxInvoicesPerMonth'),
    maxStorageMb: int('maxStorageMb'),
    // Características
    features: json('features').$type().default([]),
    // Configuración
    isActive: boolean('isActive').default(true),
    isPopular: boolean('isPopular').default(false),
    trialDays: int('trialDays').default(14),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
/**
 * Suscripciones de organizaciones
 */
export const subscriptions = mysqlTable('subscriptions', {
    id: int('id').autoincrement().primaryKey(),
    organizationId: int('organizationId').notNull(),
    // Plan actual
    planCode: mysqlEnum('planCode', ['free', 'professional', 'premium']).notNull(),
    // Estado
    status: mysqlEnum('status', ['active', 'trial', 'past_due', 'cancelled', 'expired']).notNull().default('trial'),
    // Fechas
    startDate: timestamp('startDate').notNull(),
    endDate: timestamp('endDate'),
    trialEndDate: timestamp('trialEndDate'),
    cancelledAt: timestamp('cancelledAt'),
    // Facturación
    billingCycle: varchar('billingCycle', { length: 20 }), // 'monthly' | 'yearly'
    nextBillingDate: timestamp('nextBillingDate'),
    // Proveedor de pago
    paymentProvider: varchar('paymentProvider', { length: 50 }), // 'stripe', 'paypal', etc.
    externalSubscriptionId: varchar('externalSubscriptionId', { length: 255 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    orgIdx: index('subscriptions_org_idx').on(table.organizationId),
}));
/**
 * Módulos activados por organización
 */
export const organizationModules = mysqlTable('organization_modules', {
    id: int('id').autoincrement().primaryKey(),
    organizationId: int('organizationId').notNull(),
    moduleCode: varchar('moduleCode', { length: 50 }).notNull(),
    // Estado
    isEnabled: boolean('isEnabled').default(true),
    // Tipo de acceso
    accessType: varchar('accessType', { length: 20 }).notNull(), // 'plan', 'addon', 'trial', 'custom'
    // Si es addon, fecha de compra
    purchasedAt: timestamp('purchasedAt'),
    expiresAt: timestamp('expiresAt'),
    // Configuración específica del módulo
    settings: json('settings').$type(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    orgModuleIdx: index('org_modules_idx').on(table.organizationId, table.moduleCode),
}));
/**
 * Historial de cambios de suscripción
 */
export const subscriptionHistory = mysqlTable('subscription_history', {
    id: int('id').autoincrement().primaryKey(),
    subscriptionId: int('subscriptionId').notNull(),
    // Cambio realizado
    action: varchar('action', { length: 50 }).notNull(), // 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed'
    // Plan anterior y nuevo
    fromPlan: varchar('fromPlan', { length: 50 }),
    toPlan: varchar('toPlan', { length: 50 }),
    // Detalles
    details: json('details').$type(),
    // Usuario que realizó el cambio
    changedBy: int('changedBy'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
});
/**
 * Uso de recursos por organización (para límites)
 */
export const resourceUsage = mysqlTable('resource_usage', {
    id: int('id').autoincrement().primaryKey(),
    organizationId: int('organizationId').notNull(),
    // Período
    periodStart: timestamp('periodStart').notNull(),
    periodEnd: timestamp('periodEnd').notNull(),
    // Contadores
    usersCount: int('usersCount').default(0),
    clientsCount: int('clientsCount').default(0),
    pianosCount: int('pianosCount').default(0),
    invoicesCount: int('invoicesCount').default(0),
    storageMb: int('storageMb').default(0),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
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
