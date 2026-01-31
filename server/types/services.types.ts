/**
 * Tipos compartidos para servicios del servidor
 * Piano Emotion Manager
 */

import type { MySql2Database } from 'drizzle-orm/mysql2';

// Tipo base para la base de datos
export type DatabaseConnection = MySql2Database<Record<string, never>> | null;

// Tipos para servicios de comunicación
export interface EmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendTemplateEmail?(templateId: string, to: string, data: Record<string, unknown>): Promise<boolean>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SMSService {
  sendSMS(to: string, message: string): Promise<boolean>;
}

export interface WhatsAppService {
  sendMessage(to: string, message: string): Promise<boolean>;
  sendTemplate?(to: string, templateName: string, params: Record<string, string>): Promise<boolean>;
}

export interface NotificationService {
  sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean>;
  sendInAppNotification(userId: string, notification: InAppNotification): Promise<boolean>;
}

export interface InAppNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
}

// Tipos para workflows
export interface WorkflowTriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | boolean | string[];
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'send_whatsapp' | 'send_notification' | 'update_record' | 'create_task' | 'webhook';
  config: Record<string, unknown>;
  order: number;
}

export interface WorkflowContext {
  organizationId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  context: WorkflowContext;
  results?: WorkflowStepResult[];
  error?: string;
}

export interface WorkflowStepResult {
  actionId: string;
  status: 'success' | 'failed' | 'skipped';
  output?: Record<string, unknown>;
  error?: string;
  executedAt: Date;
}

// Tipos para contratos
export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  variables: ContractVariable[];
}

export interface ContractVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
}

// Tipos para recordatorios
export interface ReminderConfig {
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  scheduledAt: Date;
  message: string;
  recipientId: string;
  metadata?: Record<string, unknown>;
}

// Tipos para pagos
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'paypal' | 'stripe';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// Tipos para dashboard
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stat' | 'table' | 'list' | 'calendar';
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  period?: string;
}

// Tipos para analytics y predicciones
export interface PredictionResult {
  type: string;
  value: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

// Tipos genéricos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Tipo para errores con mensaje
export interface ErrorWithMessage {
  message: string;
  code?: string;
  stack?: string;
}

// Helper para extraer mensaje de error
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as ErrorWithMessage).message);
  }
  return 'Unknown error';
}
