/**
 * Tipos para el servicio de Pasarelas de Pago
 * Piano Emotion Manager
 */

import type { MySql2Database } from 'drizzle-orm/mysql2';

// ============================================================================
// Tipos de Base de Datos
// ============================================================================

export type DatabaseConnection = MySql2Database<Record<string, never>>;

export interface DatabaseQueryResult<T = unknown> {
  rows?: T[];
}

export interface DatabaseRow {
  [key: string]: unknown;
}

export interface GatewayConfigRow {
  gateway: PaymentGateway;
  config: string;
}

// ============================================================================
// Tipos de Pasarela
// ============================================================================

export type PaymentGateway = 'stripe' | 'paypal';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

// ============================================================================
// Configuración de Stripe
// ============================================================================

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_intent?: string;
  receipt_url?: string;
  metadata?: Record<string, string>;
  error?: {
    message: string;
  };
}

export interface StripePaymentIntent {
  id: string;
  status: string;
  last_payment_error?: {
    message: string;
  };
}

export interface StripeCharge {
  id: string;
  payment_intent: string;
}

export interface StripeProduct {
  id: string;
}

export interface StripePrice {
  id: string;
}

export interface StripePaymentLink {
  id: string;
  url: string;
}

export interface StripeLink {
  rel: string;
  href: string;
}

// ============================================================================
// Configuración de PayPal
// ============================================================================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  webhookId: string;
}

export interface PayPalOrder {
  id: string;
  status: string;
  links: PayPalLink[];
  error?: string;
  error_description?: string;
  message?: string;
  purchase_units?: PayPalPurchaseUnit[];
}

export interface PayPalLink {
  rel: string;
  href: string;
}

export interface PayPalPurchaseUnit {
  payments?: {
    captures?: PayPalCapture[];
  };
}

export interface PayPalCapture {
  id: string;
  custom_id?: string;
  supplementary_data?: {
    related_ids?: {
      order_id?: string;
    };
  };
}

export interface PayPalWebhookEvent {
  event_type: string;
  resource: PayPalCapture;
}

export interface PayPalTokenResponse {
  access_token: string;
}

// ============================================================================
// Registro de Pago
// ============================================================================

export interface PaymentRecord {
  id: string;
  organizationId: string;
  clientId: string;
  invoiceId?: string;
  quoteId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayCustomerId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreatePaymentRecordInput {
  organizationId: string;
  clientId: string;
  invoiceId?: string;
  quoteId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayCustomerId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentUpdateData {
  completedAt?: Date;
  receiptUrl?: string;
  errorMessage?: string;
  gatewayPaymentId?: string;
}

// ============================================================================
// Enlace de Pago
// ============================================================================

export interface PaymentLink {
  id: string;
  url: string;
  expiresAt: Date;
  amount: number;
  currency: string;
}

// ============================================================================
// Datos de Checkout
// ============================================================================

export interface StripeCheckoutData {
  clientId: string;
  clientEmail: string;
  invoiceId?: string;
  quoteId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderData {
  clientId: string;
  invoiceId?: string;
  quoteId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentLinkData {
  amount: number;
  currency: string;
  description: string;
}

// ============================================================================
// Estadísticas
// ============================================================================

export interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalAmount: number;
  byGateway: Record<string, { count: number; amount: number }>;
}

export interface PaymentStatsRow {
  total: string;
  completed: string;
  pending: string;
  failed: string;
  total_amount: string;
}

export interface GatewayStatsRow {
  gateway: PaymentGateway;
  count: string;
  amount: string;
}

// ============================================================================
// Factura
// ============================================================================

export interface InvoiceWithClient {
  id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  invoice_number: string;
  total: string;
  currency?: string;
}

// ============================================================================
// Resultados
// ============================================================================

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PayPalOrderResult {
  orderId: string;
  approvalUrl: string;
}

// ============================================================================
// Configuración Enmascarada
// ============================================================================

export interface MaskedStripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isConfigured: boolean;
}

export interface MaskedPayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  webhookId: string;
  isConfigured: boolean;
}

export type MaskedGatewayConfig = MaskedStripeConfig | MaskedPayPalConfig | null;

// ============================================================================
// Valores de Actualización SQL
// ============================================================================

export type SqlParameterValue = string | number | Date | null | undefined;
