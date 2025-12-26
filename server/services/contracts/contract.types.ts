/**
 * Tipos para el servicio de Contratos de Mantenimiento
 * Piano Emotion Manager
 */

import type { MySql2Database } from 'drizzle-orm/mysql2';

// ============================================================================
// Tipos de Base de Datos
// ============================================================================

export type DatabaseConnection = MySql2Database<Record<string, never>>;

// ============================================================================
// Tipos de Servicios Externos
// ============================================================================

export interface InvoiceServiceInterface {
  createInvoice(data: {
    organizationId: string;
    clientId: string;
    items: InvoiceItem[];
    notes?: string;
  }): Promise<{ id: string }>;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface NotificationServiceInterface {
  sendNotification(options: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void>;
}

export interface EmailServiceInterface {
  sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId?: string }>;
}

// ============================================================================
// Tipos de Dependencias del Servicio
// ============================================================================

export interface ContractServiceDependencies {
  db: DatabaseConnection;
  invoiceService?: InvoiceServiceInterface;
  notificationService?: NotificationServiceInterface;
  emailService?: EmailServiceInterface;
}

// ============================================================================
// Tipos de Servicio Incluido
// ============================================================================

export interface IncludedService {
  serviceType: string;
  quantity?: number;
  unlimited?: boolean;
  description?: string;
}

export interface ServiceUsageRecord {
  serviceType: string;
  usedCount: number;
  lastUsed: string;
}

// ============================================================================
// Tipos de Plantilla de Contrato
// ============================================================================

export interface ContractTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ContractType;
  includedServices: IncludedService[];
  additionalServicesDiscount?: number;
  basePrice: number;
  billingFrequency?: BillingFrequency;
  durationMonths?: number;
  autoRenew?: boolean;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  type: ContractType;
  includedServices: IncludedService[];
  additionalServicesDiscount?: number;
  basePrice: number;
  billingFrequency?: BillingFrequency;
  durationMonths?: number;
  autoRenew?: boolean;
  termsAndConditions?: string;
  cancellationPolicy?: string;
}

// ============================================================================
// Tipos de Contrato
// ============================================================================

export type ContractType = 
  | 'basic'
  | 'standard'
  | 'premium'
  | 'custom'
  | string;

export type ContractStatus = 
  | 'draft'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'cancelled'
  | 'expired';

export type BillingFrequency = 
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'one_time';

export interface MaintenanceContract {
  id: string;
  organizationId: string;
  contractNumber: string;
  clientId: string;
  pianoId?: string;
  templateId?: string;
  name: string;
  description?: string;
  type: ContractType;
  status: ContractStatus;
  includedServices: IncludedService[];
  servicesUsed: ServiceUsageRecord[];
  additionalServicesDiscount: number;
  basePrice: number;
  billingFrequency: BillingFrequency;
  nextBillingDate: Date;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  renewalNoticeDays: number;
  renewalNotificationSent?: boolean;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  notes?: string;
  signedAt?: Date;
  signatureClientId?: string;
  signatureData?: string;
  signedDocumentUrl?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractInput {
  clientId: string;
  pianoId?: string;
  templateId?: string;
  name: string;
  description?: string;
  type: ContractType;
  includedServices: IncludedService[];
  additionalServicesDiscount?: number;
  basePrice: number;
  billingFrequency?: BillingFrequency;
  startDate: Date;
  durationMonths?: number;
  autoRenew?: boolean;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  notes?: string;
}

export interface UpdateContractInput {
  name?: string;
  description?: string;
  includedServices?: IncludedService[];
  additionalServicesDiscount?: number;
  basePrice?: number;
  autoRenew?: boolean;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  notes?: string;
}

export interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
  type?: ContractType;
}

// ============================================================================
// Tipos de Firma
// ============================================================================

export interface SignatureData {
  signatureClientId: string;
  signatureData: string;
  signedDocumentUrl?: string;
}

// ============================================================================
// Tipos de Pago
// ============================================================================

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface ContractPayment {
  id: string;
  contractId: string;
  organizationId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Tipos de Uso de Servicio
// ============================================================================

export interface ContractServiceUsage {
  id: string;
  contractId: string;
  serviceId: string;
  serviceType: string;
  usedAt: Date;
  notes?: string;
  coveredByContract: boolean;
  additionalCharge: number;
}

// ============================================================================
// Tipos de Renovación
// ============================================================================

export interface ContractRenewal {
  id: string;
  originalContractId: string;
  renewedAt: Date;
  previousEndDate: Date;
  newEndDate: Date;
  previousPrice: number;
  newPrice: number;
  priceChangeReason?: string;
  renewalType: 'automatic' | 'manual';
}

export interface RenewalOptions {
  newPrice?: number;
  priceChangeReason?: string;
  durationMonths?: number;
}

// ============================================================================
// Tipos de Cobertura
// ============================================================================

export interface ServiceCoverageResult {
  covered: boolean;
  contractId?: string;
  remainingQuantity?: number;
  discount?: number;
}

export interface ServiceUsageResult {
  coveredByContract: boolean;
  additionalCharge: number;
}

// ============================================================================
// Tipos de Estadísticas
// ============================================================================

export interface ContractStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
  totalRevenue: number;
  byType: Record<string, number>;
  expiringThisMonth: number;
}

// ============================================================================
// Tipos de Resultados de Procesamiento
// ============================================================================

export interface PaymentProcessingResult {
  processed: number;
  invoicesCreated: number;
  errors: string[];
}

export interface RenewalProcessingResult {
  notificationsSent: number;
  renewed: number;
  expired: number;
}

// ============================================================================
// Helper para obtener mensaje de error
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}
