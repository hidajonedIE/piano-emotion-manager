/**
 * Tipos para el servicio de Workflows
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

export interface EmailServiceInterface {
  sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<boolean>;
}

export interface SMSServiceInterface {
  sendSms(options: {
    to: string;
    message: string;
  }): Promise<boolean>;
}

export interface WhatsAppServiceInterface {
  sendMessage(options: {
    to: string;
    template?: string;
    parameters?: Record<string, string>;
    message?: string;
  }): Promise<boolean>;
}

export interface NotificationServiceInterface {
  sendPushNotification(options: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<boolean>;
}

// ============================================================================
// Tipos de Dependencias del Servicio
// ============================================================================

export interface WorkflowServiceDependencies {
  db: DatabaseConnection;
  emailService?: EmailServiceInterface;
  smsService?: SMSServiceInterface;
  whatsappService?: WhatsAppServiceInterface;
  notificationService?: NotificationServiceInterface;
}

// ============================================================================
// Tipos de Trigger
// ============================================================================

export type TriggerType = 
  | 'service_created'
  | 'service_completed'
  | 'client_created'
  | 'piano_registered'
  | 'appointment_scheduled'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'warranty_expiring'
  | 'contract_expiring';

export interface TriggerTypeDefinition {
  name: string;
  description: string;
  icon: string;
  variables: string[];
}

// ============================================================================
// Tipos de Acción
// ============================================================================

export type ActionType = 
  | 'send_email'
  | 'send_sms'
  | 'send_whatsapp'
  | 'send_push'
  | 'create_task'
  | 'create_reminder'
  | 'update_field'
  | 'add_tag'
  | 'webhook'
  | 'delay'
  | 'condition';

export interface ActionTypeDefinition {
  name: string;
  description: string;
  icon: string;
  configFields: string[];
}

// ============================================================================
// Configuraciones de Acciones
// ============================================================================

export interface EmailActionConfig {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
}

export interface SMSActionConfig {
  to: string;
  message: string;
}

export interface WhatsAppActionConfig {
  to: string;
  template?: string;
  parameters?: Record<string, string>;
  message?: string;
}

export interface PushActionConfig {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface TaskActionConfig {
  title: string;
  description?: string;
  assignTo?: string;
  dueInDays?: number;
}

export interface ReminderActionConfig {
  type?: string;
  title: string;
  body: string;
  scheduledFor?: string;
  channels?: string[];
}

export interface UpdateFieldActionConfig {
  entityType: string;
  field: string;
  value: string | number | boolean;
}

export interface TagActionConfig {
  entityType: string;
  tag: string;
}

export interface WebhookActionConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface DelayActionConfig {
  minutes?: number;
  hours?: number;
  days?: number;
}

export interface ConditionActionConfig {
  condition: string;
  then: WorkflowAction[];
  else?: WorkflowAction[];
}

export type ActionConfig = 
  | EmailActionConfig
  | SMSActionConfig
  | WhatsAppActionConfig
  | PushActionConfig
  | TaskActionConfig
  | ReminderActionConfig
  | UpdateFieldActionConfig
  | TagActionConfig
  | WebhookActionConfig
  | DelayActionConfig
  | ConditionActionConfig;

// ============================================================================
// Tipos de Workflow
// ============================================================================

export interface WorkflowAction {
  id?: string;
  type: ActionType;
  config: ActionConfig;
  order?: number;
}

export interface TriggerConditions {
  [key: string]: string | number | boolean;
}

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConditions?: TriggerConditions;
  actions: WorkflowAction[];
  enabled: boolean;
  status: 'draft' | 'active' | 'paused' | 'archived';
  runOnce?: boolean;
  executionCount?: number;
  lastExecutedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConditions?: TriggerConditions;
  actions: WorkflowAction[];
  enabled?: boolean;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  triggerConditions?: TriggerConditions;
  actions?: WorkflowAction[];
  enabled?: boolean;
  status?: 'draft' | 'active' | 'paused' | 'archived';
}

// ============================================================================
// Tipos de Contexto de Ejecución
// ============================================================================

export interface WorkflowContext {
  _organizationId: string;
  _entityType?: string;
  _entityId?: string;
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    userId?: string;
  };
  piano?: {
    id: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
  };
  service?: {
    id: string;
    type?: string;
    date?: string;
    cost?: number;
  };
  technician?: {
    id: string;
    name?: string;
    email?: string;
    userId?: string;
  };
  appointment?: {
    id: string;
    date?: string;
    time?: string;
  };
  invoice?: {
    id: string;
    number?: string;
    amount?: number;
    dueDate?: string;
  };
  quote?: {
    id: string;
    number?: string;
    amount?: number;
  };
  warranty?: {
    id: string;
    expirationDate?: string;
  };
  contract?: {
    id: string;
    expirationDate?: string;
  };
  organization?: {
    id: string;
    name?: string;
  };
  [key: string]: unknown;
}

// ============================================================================
// Tipos de Ejecución
// ============================================================================

export type ExecutionStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed';

export interface StepResult {
  step: number;
  action: ActionType;
  success: boolean;
  result?: unknown;
  error?: string;
  executedAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  organizationId: string;
  triggerEntityType: string;
  triggerEntityId: string;
  status: ExecutionStatus;
  currentStep: number;
  context: WorkflowContext;
  stepResults: StepResult[];
  scheduledFor?: Date;
  errorMessage?: string;
  errorStep?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// Tipos de Resultado de Acción
// ============================================================================

export interface ActionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  scheduledFor?: Date;
}

// ============================================================================
// Tipos de Estadísticas
// ============================================================================

export interface WorkflowStats {
  total: number;
  active: number;
  totalExecutions: number;
  byTrigger: Record<string, number>;
}

// ============================================================================
// Tipos de Log de Acción
// ============================================================================

export interface ActionLog {
  id?: string;
  executionId: string;
  stepIndex: number;
  actionType: ActionType;
  actionConfig: ActionConfig;
  success: boolean;
  result?: unknown;
  errorMessage?: string;
  completedAt: Date;
}

// ============================================================================
// Plantillas de Workflow
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: TriggerType;
  triggerConditions?: TriggerConditions;
  actions: WorkflowAction[];
}
