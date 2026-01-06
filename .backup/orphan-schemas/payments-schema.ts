/**
 * Esquema de Base de Datos para Pasarelas de Pago
 * 
 * Define las tablas para gestionar pagos con Stripe y PayPal
 */

import { pgTable, text, timestamp, decimal, jsonb, uuid, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

// Enum para pasarelas de pago
export const paymentGatewayEnum = pgEnum('payment_gateway', ['stripe', 'paypal']);

// Enum para estados de pago
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
]);

// Tabla de configuración de pasarelas de pago
export const paymentGatewayConfig = pgTable('payment_gateway_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  config: jsonb('config').notNull(), // Configuración encriptada
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabla de pagos
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  clientId: text('client_id').notNull(),
  
  // Referencias opcionales
  invoiceId: text('invoice_id'),
  quoteId: text('quote_id'),
  contractId: text('contract_id'),
  
  // Datos del pago
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  gateway: paymentGatewayEnum('gateway').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  
  // Referencias de la pasarela
  gatewayPaymentId: text('gateway_payment_id'),
  gatewayCustomerId: text('gateway_customer_id'),
  paymentMethod: text('payment_method'), // card, bank_transfer, etc.
  
  // Información adicional
  receiptUrl: text('receipt_url'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Tabla de enlaces de pago
export const paymentLinks = pgTable('payment_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  
  // Datos del enlace
  gateway: paymentGatewayEnum('gateway').notNull(),
  gatewayLinkId: text('gateway_link_id').notNull(),
  url: text('url').notNull(),
  
  // Datos del pago
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  description: text('description'),
  
  // Referencias opcionales
  invoiceId: text('invoice_id'),
  quoteId: text('quote_id'),
  contractId: text('contract_id'),
  
  // Estado
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  maxUsages: integer('max_usages'), // null = ilimitado
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// Tabla de reembolsos
export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  
  // Datos del reembolso
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // pending, completed, failed
  
  // Referencias de la pasarela
  gatewayRefundId: text('gateway_refund_id'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Tabla de clientes de Stripe (para guardar customer_id)
export const stripeCustomers = pgTable('stripe_customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  clientId: text('client_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  defaultPaymentMethodId: text('default_payment_method_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de métodos de pago guardados
export const savedPaymentMethods = pgTable('saved_payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id').notNull(),
  clientId: text('client_id').notNull(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  
  // Datos del método
  gatewayMethodId: text('gateway_method_id').notNull(),
  type: text('type').notNull(), // card, bank_account, etc.
  last4: text('last4'), // Últimos 4 dígitos
  brand: text('brand'), // visa, mastercard, etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  
  // Estado
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabla de webhooks recibidos (para idempotencia)
export const paymentWebhooks = pgTable('payment_webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  eventId: text('event_id').notNull(), // ID único del evento de la pasarela
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tipos exportados
export type PaymentGatewayConfig = typeof paymentGatewayConfig.$inferSelect;
export type NewPaymentGatewayConfig = typeof paymentGatewayConfig.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentLink = typeof paymentLinks.$inferSelect;
export type NewPaymentLink = typeof paymentLinks.$inferInsert;
export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;
export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type SavedPaymentMethod = typeof savedPaymentMethods.$inferSelect;
