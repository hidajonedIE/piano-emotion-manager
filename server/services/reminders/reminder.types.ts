/**
 * Tipos para el servicio de Recordatorios
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

export interface NotificationServiceInterface {
  sendPushNotification(options: {
    userId?: string;
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

export interface SMSServiceInterface {
  sendSms(options: {
    to: string;
    message: string;
  }): Promise<{ messageId?: string }>;
}

export interface WhatsAppServiceInterface {
  sendMessage(options: {
    to: string;
    template?: string;
    parameters?: Record<string, string>;
    message?: string;
  }): Promise<{ messageId?: string }>;
}

// ============================================================================
// Tipos de Dependencias del Servicio
// ============================================================================

export interface ReminderServiceDependencies {
  db: DatabaseConnection;
  notificationService: NotificationServiceInterface;
  emailService: EmailServiceInterface;
  smsService?: SMSServiceInterface;
  whatsappService?: WhatsAppServiceInterface;
}

// ============================================================================
// Tipos de Cliente
// ============================================================================

export interface ClientInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userId?: string;
}

// ============================================================================
// Tipos de Candidatos para Recordatorios
// ============================================================================

export interface ReminderCandidate {
  clientId?: string;
  pianoId?: string;
  serviceId?: string;
  appointmentId?: string;
  invoiceId?: string;
  contractId?: string;
  clientName?: string;
  pianoModel?: string;
  serviceType?: string;
  serviceDate?: Date | string;
  lastServiceDate?: Date | string;
  appointmentDate?: Date | string;
  appointmentTime?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  dueDate?: Date | string;
  warrantyEndDate?: Date | string;
  contractEndDate?: Date | string;
  technicianName?: string;
  technicianPhone?: string;
}

// ============================================================================
// Tipos de Reglas de Recordatorio
// ============================================================================

export interface ReminderRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ReminderType;
  enabled: boolean;
  triggerCondition: TriggerCondition;
  frequency: ReminderFrequency;
  customFrequencyDays?: number;
  daysOffset: number;
  timeOfDay: string;
  channels: ReminderChannel[];
  messageTemplate: MessageTemplate;
  clientTypes?: string[];
  serviceTypes?: string[];
  pianoCategories?: string[];
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReminderType = 
  | 'maintenance'
  | 'follow_up'
  | 'warranty_expiry'
  | 'appointment'
  | 'payment_due'
  | 'contract_renewal'
  | 'custom';

export type ReminderFrequency = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual'
  | 'custom';

export type ReminderChannel = 'push' | 'email' | 'sms' | 'whatsapp';

// ============================================================================
// Tipos de Trigger
// ============================================================================

export type TriggerEvent = 
  | 'service_completed'
  | 'last_service'
  | 'warranty_end'
  | 'appointment_scheduled'
  | 'invoice_created'
  | 'invoice_due'
  | 'contract_renewal'
  | 'piano_registered';

export interface TriggerCondition {
  event: TriggerEvent;
  daysAfter?: number;
  daysBefore?: number;
  daysSince?: number;
  customCondition?: string;
}

// ============================================================================
// Tipos de Plantilla de Mensaje
// ============================================================================

export interface MessageTemplate {
  title: string;
  body: string;
  variables: string[];
  ctaText?: string;
  ctaUrl?: string;
}

// ============================================================================
// Tipos de Recordatorio Programado
// ============================================================================

export type ReminderStatus = 
  | 'pending'
  | 'sent'
  | 'snoozed'
  | 'acknowledged'
  | 'cancelled'
  | 'failed';

export interface ScheduledReminder {
  id: string;
  organizationId: string;
  ruleId?: string;
  type: string;
  clientId?: string;
  pianoId?: string;
  serviceId?: string;
  appointmentId?: string;
  invoiceId?: string;
  contractId?: string;
  scheduledFor: Date;
  channels: ReminderChannel[];
  title: string;
  body: string;
  data?: ReminderData;
  status: ReminderStatus;
  snoozedUntil?: Date;
  sentAt?: Date;
  acknowledgedAt?: Date;
  sendResults?: SendResults;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReminderData {
  ctaText?: string;
  ctaUrl?: string;
  [key: string]: unknown;
}

// ============================================================================
// Tipos de Parámetros de Programación
// ============================================================================

export interface ScheduleReminderParams {
  organizationId: string;
  ruleId?: string;
  type: string;
  clientId?: string;
  pianoId?: string;
  serviceId?: string;
  appointmentId?: string;
  invoiceId?: string;
  contractId?: string;
  scheduledFor: Date;
  channels: ReminderChannel[];
  title: string;
  body: string;
  data?: ReminderData;
}

// ============================================================================
// Tipos de Resultados de Envío
// ============================================================================

export interface ChannelSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface SendResults {
  push?: ChannelSendResult;
  email?: ChannelSendResult;
  sms?: ChannelSendResult;
  whatsapp?: ChannelSendResult;
  [channel: string]: ChannelSendResult | undefined;
}

export interface ProcessingResult {
  id: string;
  success: boolean;
  sendResults?: SendResults;
  error?: string;
}

// ============================================================================
// Tipos de Preferencias de Cliente
// ============================================================================

export interface ClientReminderPreferences {
  id?: string;
  clientId: string;
  organizationId: string;
  enabledChannels?: ReminderChannel[];
  enabledTypes?: ReminderType[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
  frequency?: ReminderFrequency;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Tipos de Historial
// ============================================================================

export interface ReminderHistoryEntry {
  id?: string;
  organizationId: string;
  reminderId: string;
  channel: ReminderChannel;
  recipientId?: string;
  success: boolean;
  errorMessage?: string;
  externalId?: string;
  sentAt: Date;
}

// ============================================================================
// Tipos de Estadísticas
// ============================================================================

export interface ScheduledCount {
  total: number;
  byType: Record<string, number>;
}

// ============================================================================
// Helper para obtener mensaje de error
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}
