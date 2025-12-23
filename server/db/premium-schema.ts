/**
 * Esquema de Base de Datos para Sistema Premium
 * 
 * Este archivo define las extensiones al esquema de BD para soportar
 * el sistema de cuentas Premium basado en compra mínima.
 */

import { pgTable, pgEnum, varchar, decimal, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const accountTierEnum = pgEnum('account_tier', ['trial', 'basic', 'premium']);

// ============================================
// TABLA: distributors (extensión)
// ============================================

export const distributorPremiumConfig = pgTable('distributor_premium_config', {
  id: varchar('id', { length: 36 }).primaryKey(),
  distributorId: varchar('distributor_id', { length: 36 }).notNull().unique(),
  
  // Configuración de WooCommerce
  woocommerceUrl: varchar('woocommerce_url', { length: 255 }),
  woocommerceApiKey: varchar('woocommerce_api_key', { length: 255 }),
  woocommerceApiSecret: varchar('woocommerce_api_secret', { length: 255 }),
  woocommerceEnabled: boolean('woocommerce_enabled').default(false),
  
  // Configuración del sistema Premium
  minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 10, scale: 2 }).default('100.00'),
  trialPeriodDays: integer('trial_period_days').default(30),
  gracePeriodDays: integer('grace_period_days').default(7), // Días extra antes de pasar a Básico
  
  // Configuración de comunicación
  whatsappEnabled: boolean('whatsapp_enabled').default(true),
  portalEnabled: boolean('portal_enabled').default(true),
  autoRemindersEnabled: boolean('auto_reminders_enabled').default(true),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABLA: technician_account_status
// ============================================

export const technicianAccountStatus = pgTable('technician_account_status', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull().unique(),
  distributorId: varchar('distributor_id', { length: 36 }).notNull(),
  
  // Estado de la cuenta
  accountTier: accountTierEnum('account_tier').default('trial'),
  tierExpiresAt: timestamp('tier_expires_at'), // Fin del periodo de prueba o gracia
  
  // Datos de compras
  purchasesLast30Days: decimal('purchases_last_30_days', { precision: 10, scale: 2 }).default('0.00'),
  purchasesCurrentMonth: decimal('purchases_current_month', { precision: 10, scale: 2 }).default('0.00'),
  totalPurchasesAllTime: decimal('total_purchases_all_time', { precision: 10, scale: 2 }).default('0.00'),
  lastPurchaseDate: timestamp('last_purchase_date'),
  lastPurchaseCheck: timestamp('last_purchase_check'),
  
  // Vinculación con WooCommerce
  woocommerceCustomerId: varchar('woocommerce_customer_id', { length: 100 }),
  woocommerceCustomerEmail: varchar('woocommerce_customer_email', { length: 255 }),
  
  // Historial
  tierChangedAt: timestamp('tier_changed_at'),
  previousTier: accountTierEnum('previous_tier'),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TABLA: purchase_verification_log
// ============================================

export const purchaseVerificationLog = pgTable('purchase_verification_log', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull(),
  
  // Resultado de la verificación
  verificationDate: timestamp('verification_date').defaultNow(),
  purchasesFound: decimal('purchases_found', { precision: 10, scale: 2 }).notNull(),
  minimumRequired: decimal('minimum_required', { precision: 10, scale: 2 }).notNull(),
  meetsMinimum: boolean('meets_minimum').notNull(),
  
  // Cambio de tier (si hubo)
  previousTier: accountTierEnum('previous_tier'),
  newTier: accountTierEnum('new_tier'),
  tierChanged: boolean('tier_changed').default(false),
  
  // Detalles de órdenes
  ordersCount: integer('orders_count').default(0),
  ordersData: text('orders_data'), // JSON con detalles de las órdenes
  
  // Estado de la verificación
  status: varchar('status', { length: 20 }).default('success'), // success, error, skipped
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// TABLA: premium_feature_usage
// ============================================

export const premiumFeatureUsage = pgTable('premium_feature_usage', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull(),
  
  // Uso de funcionalidades
  feature: varchar('feature', { length: 50 }).notNull(), // whatsapp, portal, reminders, notifications
  action: varchar('action', { length: 50 }).notNull(), // send_message, access_portal, schedule_reminder
  
  // Resultado
  allowed: boolean('allowed').notNull(),
  blockedReason: varchar('blocked_reason', { length: 100 }), // not_premium, trial_expired, etc.
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  metadata: text('metadata'), // JSON con datos adicionales
});

// ============================================
// TIPOS TypeScript
// ============================================

export type AccountTier = 'trial' | 'basic' | 'premium';

export interface DistributorPremiumConfig {
  id: string;
  distributorId: string;
  woocommerceUrl: string | null;
  woocommerceApiKey: string | null;
  woocommerceApiSecret: string | null;
  woocommerceEnabled: boolean;
  minimumPurchaseAmount: number;
  trialPeriodDays: number;
  gracePeriodDays: number;
  whatsappEnabled: boolean;
  portalEnabled: boolean;
  autoRemindersEnabled: boolean;
}

export interface TechnicianAccountStatus {
  id: string;
  technicianId: string;
  distributorId: string;
  accountTier: AccountTier;
  tierExpiresAt: Date | null;
  purchasesLast30Days: number;
  purchasesCurrentMonth: number;
  totalPurchasesAllTime: number;
  lastPurchaseDate: Date | null;
  lastPurchaseCheck: Date | null;
  woocommerceCustomerId: string | null;
  woocommerceCustomerEmail: string | null;
}

export interface PurchaseVerificationResult {
  technicianId: string;
  purchasesFound: number;
  minimumRequired: number;
  meetsMinimum: boolean;
  previousTier: AccountTier;
  newTier: AccountTier;
  tierChanged: boolean;
  ordersCount: number;
}
