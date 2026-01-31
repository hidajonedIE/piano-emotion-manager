import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Enum para tipo de contrato
export const contractTypeEnum = pgEnum('contract_type', [
  'basic',           // Mantenimiento básico (1-2 afinaciones/año)
  'standard',        // Mantenimiento estándar (2-4 afinaciones/año)
  'premium',         // Mantenimiento premium (4+ afinaciones + reparaciones menores)
  'professional',    // Para profesionales (mantenimiento ilimitado)
  'institutional',   // Para instituciones (múltiples pianos)
  'custom'           // Personalizado
]);

// Enum para estado del contrato
export const contractStatusEnum = pgEnum('contract_status', [
  'draft',           // Borrador
  'pending',         // Pendiente de firma
  'active',          // Activo
  'suspended',       // Suspendido (por impago, etc.)
  'expired',         // Expirado
  'cancelled',       // Cancelado
  'renewed'          // Renovado (histórico)
]);

// Enum para frecuencia de facturación
export const billingFrequencyEnum = pgEnum('billing_frequency', [
  'monthly',         // Mensual
  'quarterly',       // Trimestral
  'semiannual',      // Semestral
  'annual',          // Anual
  'one_time'         // Pago único
]);

// Enum para estado de pago
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'overdue',
  'failed',
  'refunded'
]);

// Tabla de plantillas de contrato
export const contractTemplates = pgTable('contract_templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull(),
  
  // Información básica
  name: text('name').notNull(),
  description: text('description'),
  type: contractTypeEnum('type').notNull(),
  
  // Servicios incluidos
  includedServices: jsonb('included_services').notNull(),
  // Ejemplo: [
  //   { "serviceType": "tuning", "quantity": 2, "description": "Afinaciones anuales" },
  //   { "serviceType": "regulation", "quantity": 1, "description": "Regulación anual" },
  //   { "serviceType": "minor_repair", "unlimited": true, "description": "Reparaciones menores ilimitadas" }
  // ]
  
  // Descuentos en servicios adicionales
  additionalServicesDiscount: integer('additional_services_discount').default(0), // Porcentaje
  
  // Precio y facturación
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  billingFrequency: billingFrequencyEnum('billing_frequency').default('annual'),
  
  // Duración
  durationMonths: integer('duration_months').default(12),
  autoRenew: boolean('auto_renew').default(true),
  renewalNoticeDays: integer('renewal_notice_days').default(30),
  
  // Términos y condiciones
  termsAndConditions: text('terms_and_conditions'),
  cancellationPolicy: text('cancellation_policy'),
  
  // Configuración
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabla de contratos
export const maintenanceContracts = pgTable('maintenance_contracts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull(),
  
  // Número de contrato
  contractNumber: text('contract_number').notNull(),
  
  // Relaciones
  clientId: text('client_id').notNull(),
  pianoId: text('piano_id'), // Puede ser null para contratos multi-piano
  templateId: text('template_id').references(() => contractTemplates.id),
  
  // Información del contrato
  name: text('name').notNull(),
  description: text('description'),
  type: contractTypeEnum('type').notNull(),
  status: contractStatusEnum('status').default('draft'),
  
  // Servicios incluidos
  includedServices: jsonb('included_services').notNull(),
  servicesUsed: jsonb('services_used').default([]),
  // Ejemplo: [
  //   { "serviceType": "tuning", "usedCount": 1, "lastUsed": "2024-01-15" }
  // ]
  
  // Descuentos
  additionalServicesDiscount: integer('additional_services_discount').default(0),
  
  // Precio y facturación
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  billingFrequency: billingFrequencyEnum('billing_frequency').default('annual'),
  nextBillingDate: timestamp('next_billing_date'),
  
  // Fechas
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  signedAt: timestamp('signed_at'),
  cancelledAt: timestamp('cancelled_at'),
  
  // Renovación
  autoRenew: boolean('auto_renew').default(true),
  renewalNoticeDays: integer('renewal_notice_days').default(30),
  renewalNotificationSent: boolean('renewal_notification_sent').default(false),
  
  // Firma digital
  signatureClientId: text('signature_client_id'),
  signatureData: text('signature_data'),
  signedDocumentUrl: text('signed_document_url'),
  
  // Términos
  termsAndConditions: text('terms_and_conditions'),
  cancellationPolicy: text('cancellation_policy'),
  cancellationReason: text('cancellation_reason'),
  
  // Notas
  notes: text('notes'),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by')
});

// Tabla de pagos de contrato
export const contractPayments = pgTable('contract_payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  contractId: text('contract_id').references(() => maintenanceContracts.id).notNull(),
  organizationId: text('organization_id').notNull(),
  
  // Información del pago
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('EUR'),
  status: paymentStatusEnum('status').default('pending'),
  
  // Período facturado
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Factura asociada
  invoiceId: text('invoice_id'),
  
  // Método de pago
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  
  // Fechas
  dueDate: timestamp('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  
  // Reintentos (para pagos automáticos)
  retryCount: integer('retry_count').default(0),
  lastRetryAt: timestamp('last_retry_at'),
  failureReason: text('failure_reason'),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow()
});

// Tabla de uso de servicios del contrato
export const contractServiceUsage = pgTable('contract_service_usage', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  contractId: text('contract_id').references(() => maintenanceContracts.id).notNull(),
  
  // Servicio utilizado
  serviceId: text('service_id').notNull(),
  serviceType: text('service_type').notNull(),
  
  // Información
  usedAt: timestamp('used_at').defaultNow(),
  notes: text('notes'),
  
  // Si fue cubierto por el contrato o adicional
  coveredByContract: boolean('covered_by_contract').default(true),
  additionalCharge: numeric('additional_charge', { precision: 10, scale: 2 }).default('0')
});

// Tabla de historial de renovaciones
export const contractRenewals = pgTable('contract_renewals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  originalContractId: text('original_contract_id').references(() => maintenanceContracts.id).notNull(),
  newContractId: text('new_contract_id').references(() => maintenanceContracts.id),
  
  // Información de renovación
  renewedAt: timestamp('renewed_at').defaultNow(),
  previousEndDate: timestamp('previous_end_date').notNull(),
  newEndDate: timestamp('new_end_date').notNull(),
  
  // Cambios en precio
  previousPrice: numeric('previous_price', { precision: 10, scale: 2 }),
  newPrice: numeric('new_price', { precision: 10, scale: 2 }),
  priceChangeReason: text('price_change_reason'),
  
  // Tipo de renovación
  renewalType: text('renewal_type').default('automatic'), // 'automatic', 'manual', 'upgraded', 'downgraded'
  
  notes: text('notes')
});

// Tipos TypeScript
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type NewContractTemplate = typeof contractTemplates.$inferInsert;
export type MaintenanceContract = typeof maintenanceContracts.$inferSelect;
export type NewMaintenanceContract = typeof maintenanceContracts.$inferInsert;
export type ContractPayment = typeof contractPayments.$inferSelect;
export type ContractServiceUsage = typeof contractServiceUsage.$inferSelect;
export type ContractRenewal = typeof contractRenewals.$inferSelect;

// Interfaces para servicios incluidos
export interface IncludedService {
  serviceType: string;
  quantity?: number;
  unlimited?: boolean;
  description: string;
}

export interface ServiceUsageRecord {
  serviceType: string;
  usedCount: number;
  lastUsed?: string;
}

// Plantillas predefinidas
export const DEFAULT_CONTRACT_TEMPLATES = [
  {
    name: 'Mantenimiento Básico',
    description: 'Ideal para pianos de uso doméstico ocasional',
    type: 'basic',
    includedServices: [
      { serviceType: 'tuning', quantity: 1, description: '1 afinación anual' }
    ],
    additionalServicesDiscount: 10,
    basePrice: 150,
    billingFrequency: 'annual',
    durationMonths: 12
  },
  {
    name: 'Mantenimiento Estándar',
    description: 'Recomendado para pianos de uso regular',
    type: 'standard',
    includedServices: [
      { serviceType: 'tuning', quantity: 2, description: '2 afinaciones anuales' },
      { serviceType: 'inspection', quantity: 1, description: '1 inspección anual' }
    ],
    additionalServicesDiscount: 15,
    basePrice: 280,
    billingFrequency: 'annual',
    durationMonths: 12
  },
  {
    name: 'Mantenimiento Premium',
    description: 'Para pianos de uso intensivo o de alta gama',
    type: 'premium',
    includedServices: [
      { serviceType: 'tuning', quantity: 4, description: '4 afinaciones anuales' },
      { serviceType: 'regulation', quantity: 1, description: '1 regulación anual' },
      { serviceType: 'minor_repair', unlimited: true, description: 'Reparaciones menores ilimitadas' }
    ],
    additionalServicesDiscount: 20,
    basePrice: 550,
    billingFrequency: 'annual',
    durationMonths: 12
  },
  {
    name: 'Mantenimiento Profesional',
    description: 'Para profesionales, escuelas de música y conservatorios',
    type: 'professional',
    includedServices: [
      { serviceType: 'tuning', unlimited: true, description: 'Afinaciones ilimitadas' },
      { serviceType: 'regulation', quantity: 2, description: '2 regulaciones anuales' },
      { serviceType: 'voicing', quantity: 1, description: '1 armonización anual' },
      { serviceType: 'minor_repair', unlimited: true, description: 'Reparaciones menores ilimitadas' },
      { serviceType: 'priority_support', unlimited: true, description: 'Soporte prioritario 24/7' }
    ],
    additionalServicesDiscount: 25,
    basePrice: 1200,
    billingFrequency: 'annual',
    durationMonths: 12
  }
];
