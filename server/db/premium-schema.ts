/**
 * Esquema de Base de Datos para Sistema Premium
 * 
 * Este archivo define las extensiones al esquema de BD para soportar
 * el sistema de cuentas Premium basado en compra mínima.
 */

import { mysqlTable, mysqlEnum, varchar, decimal, int, timestamp, tinyint, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const accountTierEnum = mysqlEnum('account_tier', ['trial', 'basic', 'premium']);

// ============================================
// TABLA: distributors (extensión)
// ============================================

export const distributorPremiumConfig = mysqlTable('distributor_premium_config', {
  id: varchar('id', { length: 36 }).primaryKey(),
  distributorId: varchar('distributor_id', { length: 36 }).notNull().unique(),
  
  // Configuración de WooCommerce
  woocommerceUrl: varchar('woocommerce_url', { length: 255 }),
  woocommerceConsumerKey: varchar('woocommerce_consumer_key', { length: 255 }),
  woocommerceConsumerSecret: varchar('woocommerce_consumer_secret', { length: 255 }),
  woocommerceEnabled: tinyint('woocommerce_enabled').default(0),
  
  // Configuración del sistema Premium
  minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 10, scale: 2 }).default('100.00'),
  trialPeriodDays: int('trial_period_days').default(30),
  gracePeriodDays: int('grace_period_days').default(7), // Días extra antes de pasar a Básico
  
  // Configuración de comunicación
  whatsappEnabled: tinyint('whatsapp_enabled').default(1),
  portalEnabled: tinyint('portal_enabled').default(1),
  autoRemindersEnabled: tinyint('auto_reminders_enabled').default(1),
  
  // Metadatos
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
});

// ============================================
// TABLA: technician_account_status
// ============================================

export const technicianAccountStatus = mysqlTable('technician_account_status', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull().unique(),
  distributorId: varchar('distributor_id', { length: 36 }).notNull(),
  
  // Estado de la cuenta
  accountTier: accountTierEnum('account_tier').default('trial'),
  tierExpiresAt: timestamp('tier_expires_at', { mode: 'string' }), // Fin del periodo de prueba o gracia
  
  // Datos de compras
  purchasesLast30Days: decimal('purchases_last_30_days', { precision: 10, scale: 2 }).default('0.00'),
  purchasesCurrentMonth: decimal('purchases_current_month', { precision: 10, scale: 2 }).default('0.00'),
  totalPurchasesAllTime: decimal('total_purchases_all_time', { precision: 10, scale: 2 }).default('0.00'),
  lastPurchaseDate: timestamp('last_purchase_date', { mode: 'string' }),
  lastPurchaseCheck: timestamp('last_purchase_check', { mode: 'string' }),
  
  // Vinculación con WooCommerce
  woocommerceCustomerId: varchar('woocommerce_customer_id', { length: 100 }),
  woocommerceCustomerEmail: varchar('woocommerce_customer_email', { length: 255 }),
  
  // Historial
  tierChangedAt: timestamp('tier_changed_at', { mode: 'string' }),
  previousTier: accountTierEnum('previous_tier'),
  
  // Metadatos
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().onUpdateNow(),
});

// ============================================
// TABLA: purchase_verification_log
// ============================================

export const purchaseVerificationLog = mysqlTable('purchase_verification_log', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull(),
  
  // Resultado de la verificación
  verificationDate: timestamp('verification_date', { mode: 'string' }).defaultNow(),
  purchasesFound: decimal('purchases_found', { precision: 10, scale: 2 }).notNull(),
  minimumRequired: decimal('minimum_required', { precision: 10, scale: 2 }).notNull(),
  meetsMinimum: tinyint('meets_minimum').notNull(),
  
  // Cambio de tier (si hubo)
  previousTier: accountTierEnum('previous_tier'),
  newTier: accountTierEnum('new_tier'),
  tierChanged: tinyint('tier_changed').default(0),
  
  // Detalles de órdenes
  ordersCount: int('orders_count').default(0),
  ordersData: text('orders_data'), // JSON con detalles de las órdenes
  
  // Estado de la verificación
  status: varchar('status', { length: 20 }).default('success'), // success, error, skipped
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// ============================================
// TABLA: premium_feature_usage
// ============================================

export const premiumFeatureUsage = mysqlTable('premium_feature_usage', {
  id: varchar('id', { length: 36 }).primaryKey(),
  technicianId: varchar('technician_id', { length: 36 }).notNull(),
  
  // Uso de funcionalidades
  feature: varchar('feature', { length: 50 }).notNull(), // whatsapp, portal, reminders, notifications
  action: varchar('action', { length: 50 }).notNull(), // send_message, access_portal, schedule_reminder
  
  // Resultado
  allowed: tinyint('allowed').notNull(),
  blockedReason: varchar('blocked_reason', { length: 100 }), // not_premium, trial_expired, etc.
  
  // Metadatos
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
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
  woocommerceConsumerKey: string | null;
  woocommerceConsumerSecret: string | null;
  woocommerceEnabled: number;
  minimumPurchaseAmount: string;
  trialPeriodDays: number;
  gracePeriodDays: number;
  whatsappEnabled: number;
  portalEnabled: number;
  autoRemindersEnabled: number;
}

export interface TechnicianAccountStatus {
  id: string;
  technicianId: string;
  distributorId: string;
  accountTier: AccountTier;
  tierExpiresAt: string | null;
  purchasesLast30Days: string;
  purchasesCurrentMonth: string;
  totalPurchasesAllTime: string;
  lastPurchaseDate: string | null;
  lastPurchaseCheck: string | null;
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
