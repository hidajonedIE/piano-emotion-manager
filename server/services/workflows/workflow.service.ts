/**
 * Servicio de Workflows Automatizados
 * 
 * Permite crear automatizaciones del tipo "Si X entonces Y" con un editor visual.
 * Soporta múltiples triggers, condiciones y acciones encadenadas.
 */

import { eq, and, lte } from 'drizzle-orm';
import type {
  DatabaseConnection,
  EmailServiceInterface,
  SMSServiceInterface,
  WhatsAppServiceInterface,
  NotificationServiceInterface,
  WorkflowServiceDependencies,
  TriggerType,
  TriggerTypeDefinition,
  ActionType,
  ActionTypeDefinition,
  WorkflowAction,
  TriggerConditions,
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowContext,
  ExecutionStatus,
  StepResult,
  WorkflowExecution,
  ActionResult,
  WorkflowStats,
  ActionLog,
  WorkflowTemplate,
  EmailActionConfig,
  SMSActionConfig,
  WhatsAppActionConfig,
  PushActionConfig,
  TaskActionConfig,
  ReminderActionConfig,
  UpdateFieldActionConfig,
  WebhookActionConfig,
  DelayActionConfig,
  ConditionActionConfig,
} from './workflow.types.js';

// Re-exportar tipos para uso externo
export type {
  TriggerType,
  ActionType,
  WorkflowAction,
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowContext,
  WorkflowExecution,
  WorkflowStats,
  WorkflowTemplate,
};

// Tipos de trigger disponibles
export const TRIGGER_TYPES: Record<TriggerType, TriggerTypeDefinition> = {
  service_created: {
    name: 'Servicio Creado',
    description: 'Se dispara cuando se crea un nuevo servicio',
    icon: 'construct-outline',
    variables: ['service', 'client', 'piano', 'technician']
  },
  service_completed: {
    name: 'Servicio Completado',
    description: 'Se dispara cuando se marca un servicio como completado',
    icon: 'checkmark-circle-outline',
    variables: ['service', 'client', 'piano', 'technician']
  },
  client_created: {
    name: 'Cliente Creado',
    description: 'Se dispara cuando se registra un nuevo cliente',
    icon: 'person-add-outline',
    variables: ['client']
  },
  piano_registered: {
    name: 'Piano Registrado',
    description: 'Se dispara cuando se registra un nuevo piano',
    icon: 'musical-notes-outline',
    variables: ['piano', 'client']
  },
  appointment_scheduled: {
    name: 'Cita Programada',
    description: 'Se dispara cuando se programa una nueva cita',
    icon: 'calendar-outline',
    variables: ['appointment', 'client', 'piano']
  },
  invoice_created: {
    name: 'Factura Creada',
    description: 'Se dispara cuando se crea una nueva factura',
    icon: 'document-text-outline',
    variables: ['invoice', 'client', 'service']
  },
  invoice_paid: {
    name: 'Factura Pagada',
    description: 'Se dispara cuando se marca una factura como pagada',
    icon: 'card-outline',
    variables: ['invoice', 'client', 'service']
  },
  invoice_overdue: {
    name: 'Factura Vencida',
    description: 'Se dispara cuando una factura supera su fecha de vencimiento',
    icon: 'alert-circle-outline',
    variables: ['invoice', 'client']
  },
  quote_accepted: {
    name: 'Presupuesto Aceptado',
    description: 'Se dispara cuando un cliente acepta un presupuesto',
    icon: 'thumbs-up-outline',
    variables: ['quote', 'client', 'piano']
  },
  quote_rejected: {
    name: 'Presupuesto Rechazado',
    description: 'Se dispara cuando un cliente rechaza un presupuesto',
    icon: 'thumbs-down-outline',
    variables: ['quote', 'client', 'piano']
  },
  warranty_expiring: {
    name: 'Garantía por Expirar',
    description: 'Se dispara X días antes de que expire una garantía',
    icon: 'shield-outline',
    variables: ['warranty', 'client', 'piano', 'service']
  },
  contract_expiring: {
    name: 'Contrato por Expirar',
    description: 'Se dispara X días antes de que expire un contrato',
    icon: 'document-outline',
    variables: ['contract', 'client']
  }
};

// Tipos de acción disponibles
export const ACTION_TYPES: Record<ActionType, ActionTypeDefinition> = {
  send_email: {
    name: 'Enviar Email',
    description: 'Envía un email al destinatario especificado',
    icon: 'mail-outline',
    configFields: ['to', 'subject', 'body', 'templateId']
  },
  send_sms: {
    name: 'Enviar SMS',
    description: 'Envía un SMS al número especificado',
    icon: 'chatbox-outline',
    configFields: ['to', 'message']
  },
  send_whatsapp: {
    name: 'Enviar WhatsApp',
    description: 'Envía un mensaje de WhatsApp',
    icon: 'logo-whatsapp',
    configFields: ['to', 'template', 'parameters']
  },
  send_push: {
    name: 'Enviar Notificación Push',
    description: 'Envía una notificación push al usuario',
    icon: 'notifications-outline',
    configFields: ['title', 'body', 'data']
  },
  create_task: {
    name: 'Crear Tarea',
    description: 'Crea una tarea para el equipo',
    icon: 'checkbox-outline',
    configFields: ['title', 'description', 'assignTo', 'dueInDays']
  },
  create_reminder: {
    name: 'Crear Recordatorio',
    description: 'Programa un recordatorio',
    icon: 'alarm-outline',
    configFields: ['type', 'scheduledFor', 'channels', 'title', 'body']
  },
  update_field: {
    name: 'Actualizar Campo',
    description: 'Actualiza un campo de la entidad',
    icon: 'create-outline',
    configFields: ['entityType', 'field', 'value']
  },
  add_tag: {
    name: 'Añadir Etiqueta',
    description: 'Añade una etiqueta a la entidad',
    icon: 'pricetag-outline',
    configFields: ['entityType', 'tag']
  },
  webhook: {
    name: 'Llamar Webhook',
    description: 'Realiza una llamada HTTP a un endpoint externo',
    icon: 'globe-outline',
    configFields: ['url', 'method', 'headers', 'body']
  },
  delay: {
    name: 'Esperar',
    description: 'Espera un tiempo antes de continuar',
    icon: 'time-outline',
    configFields: ['minutes', 'hours', 'days']
  },
  condition: {
    name: 'Condición',
    description: 'Ejecuta acciones basadas en una condición',
    icon: 'git-branch-outline',
    configFields: ['condition', 'then', 'else']
  }
};

// Plantillas de workflow predefinidas
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome_client',
    name: 'Bienvenida a Nuevo Cliente',
    description: 'Envía un email de bienvenida cuando se registra un nuevo cliente',
    category: 'Clientes',
    triggerType: 'client_created',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Bienvenido a {{organization.name}}',
          body: 'Estimado/a {{client.firstName}},\n\nGracias por confiar en nosotros para el cuidado de su piano.\n\nSaludos,\n{{organization.name}}'
        } as EmailActionConfig
      }
    ]
  },
  {
    id: 'service_completed_feedback',
    name: 'Solicitar Feedback tras Servicio',
    description: 'Envía una solicitud de valoración al completar un servicio',
    category: 'Servicios',
    triggerType: 'service_completed',
    actions: [
      {
        type: 'delay',
        config: {
          days: 1
        } as DelayActionConfig
      },
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: '¿Cómo fue su experiencia con nuestro servicio?',
          body: 'Estimado/a {{client.firstName}},\n\nEsperamos que el servicio de {{service.type}} haya sido de su satisfacción.\n\n¿Podría dedicarnos un momento para valorar su experiencia?\n\nGracias,\n{{organization.name}}'
        } as EmailActionConfig
      }
    ]
  },
  {
    id: 'invoice_reminder',
    name: 'Recordatorio de Factura Vencida',
    description: 'Envía un recordatorio cuando una factura está vencida',
    category: 'Facturación',
    triggerType: 'invoice_overdue',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Recordatorio: Factura {{invoice.number}} pendiente de pago',
          body: 'Estimado/a {{client.firstName}},\n\nLe recordamos que la factura {{invoice.number}} por importe de {{invoice.amount}}€ se encuentra pendiente de pago.\n\nSi ya ha realizado el pago, ignore este mensaje.\n\nSaludos,\n{{organization.name}}'
        } as EmailActionConfig
      }
    ]
  },
  {
    id: 'appointment_confirmation',
    name: 'Confirmación de Cita',
    description: 'Envía confirmación por email y SMS al programar una cita',
    category: 'Citas',
    triggerType: 'appointment_scheduled',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Confirmación de cita - {{appointment.date}}',
          body: 'Estimado/a {{client.firstName}},\n\nSu cita ha sido confirmada para el {{appointment.date}} a las {{appointment.time}}.\n\nSaludos,\n{{organization.name}}'
        } as EmailActionConfig
      },
      {
        type: 'send_sms',
        config: {
          to: '{{client.phone}}',
          message: 'Cita confirmada para {{appointment.date}} a las {{appointment.time}}. {{organization.name}}'
        } as SMSActionConfig
      }
    ]
  }
];

/**
 * Helper para obtener mensaje de error de forma segura
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}

/**
 * Clase principal del servicio de workflows
 */
export class WorkflowService {
  private db: DatabaseConnection;
  private emailService: EmailServiceInterface | undefined;
  private smsService: SMSServiceInterface | undefined;
  private whatsappService: WhatsAppServiceInterface | undefined;
  private notificationService: NotificationServiceInterface | undefined;

  constructor(dependencies: WorkflowServiceDependencies) {
    this.db = dependencies.db;
    this.emailService = dependencies.emailService;
    this.smsService = dependencies.smsService;
    this.whatsappService = dependencies.whatsappService;
    this.notificationService = dependencies.notificationService;
  }

  /**
   * Crea un nuevo workflow
   */
  async createWorkflow(
    organizationId: string, 
    data: CreateWorkflowInput, 
    createdBy: string
  ): Promise<Workflow> {
    const workflow = {
      organizationId,
      name: data.name,
      description: data.description,
      triggerType: data.triggerType,
      triggerConditions: data.triggerConditions,
      actions: data.actions,
      enabled: data.enabled || false,
      status: data.enabled ? 'active' : 'draft',
      createdBy
    };

    const result = await this.getDb().insert('workflows' as never).values(workflow as never).returning();
    return result[0] as Workflow;
  }

  /**
   * Obtiene todos los workflows de una organización
   */
  async getWorkflows(organizationId: string): Promise<Workflow[]> {
    return await this.db
      .select()
      .from('workflows' as never)
      .where(eq('organizationId' as never, organizationId as never))
      .orderBy('createdAt' as never, 'desc' as never) as Workflow[];
  }

  /**
   * Obtiene un workflow por ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | undefined> {
    const result = await this.db
      .select()
      .from('workflows' as never)
      .where(eq('id' as never, workflowId as never))
      .limit(1) as Workflow[];
    return result[0];
  }

  /**
   * Actualiza un workflow
   */
  async updateWorkflow(workflowId: string, data: UpdateWorkflowInput): Promise<void> {
    await this.db
      .update('workflows' as never)
      .set({ ...data, updatedAt: new Date() } as never)
      .where(eq('id' as never, workflowId as never));
  }

  /**
   * Elimina un workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.db
      .delete('workflows' as never)
      .where(eq('id' as never, workflowId as never));
  }

  /**
   * Dispara workflows basados en un evento
   */
  async triggerWorkflows(
    organizationId: string, 
    triggerType: TriggerType, 
    context: WorkflowContext
  ): Promise<WorkflowExecution[]> {
    // Buscar workflows activos que coincidan con el trigger
    const workflows = await this.db
      .select()
      .from('workflows' as never)
      .where(
        and(
          eq('organizationId' as never, organizationId as never),
          eq('triggerType' as never, triggerType as never),
          eq('status' as never, 'active' as never),
          eq('enabled' as never, true as never)
        )
      ) as Workflow[];

    const executions: WorkflowExecution[] = [];

    for (const workflow of workflows) {
      // Verificar condiciones adicionales
      if (workflow.triggerConditions && !this.evaluateConditions(workflow.triggerConditions, context)) {
        continue;
      }

      // Verificar si ya se ejecutó (si runOnce está activo)
      if (workflow.runOnce) {
        const existingExecution = await this.checkExistingExecution(workflow.id, context);
        if (existingExecution) continue;
      }

      // Crear ejecución
      const execution = await this.createExecution(workflow, context);
      executions.push(execution);

      // Iniciar ejecución asíncrona
      this.executeWorkflow(execution.id).catch((err) => console.error('Error executing workflow:', err));
    }

    return executions;
  }

  /**
   * Crea una ejecución de workflow
   */
  private async createExecution(workflow: Workflow, context: WorkflowContext): Promise<WorkflowExecution> {
    const execution = {
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      triggerEntityType: context._entityType || 'unknown',
      triggerEntityId: context._entityId || 'unknown',
      status: 'pending' as ExecutionStatus,
      currentStep: 0,
      context,
      stepResults: [],
      createdAt: new Date()
    };

    const result = await this.getDb().insert('workflowExecutions' as never).values(execution as never).returning();
    return result[0] as WorkflowExecution;
  }

  /**
   * Ejecuta un workflow
   */
  async executeWorkflow(executionId: string): Promise<void> {
    const executionResult = await this.db
      .select()
      .from('workflowExecutions' as never)
      .where(eq('id' as never, executionId as never))
      .limit(1) as WorkflowExecution[];

    const execution = executionResult[0];

    if (!execution || execution.status !== 'pending') {
      return;
    }

    const workflow = await this.getWorkflow(execution.workflowId);
    if (!workflow) {
      await this.updateExecutionStatus(executionId, 'failed', 'Workflow not found');
      return;
    }

    // Marcar como en ejecución
    await this.db
      .update('workflowExecutions' as never)
      .set({ status: 'running', startedAt: new Date() } as never)
      .where(eq('id' as never, executionId as never));

    try {
      const actions = workflow.actions;
      const stepResults: StepResult[] = [];

      for (let i = execution.currentStep; i < actions.length; i++) {
        const action = actions[i];
        
        // Actualizar paso actual
        await this.db
          .update('workflowExecutions' as never)
          .set({ currentStep: i } as never)
          .where(eq('id' as never, executionId as never));

        // Ejecutar acción
        const result = await this.executeAction(action, execution.context, executionId);
        stepResults.push({ 
          step: i, 
          action: action.type, 
          success: result.success,
          result: result.result,
          error: result.error,
          executedAt: new Date()
        });

        // Guardar resultado
        await this.db
          .update('workflowExecutions' as never)
          .set({ stepResults } as never)
          .where(eq('id' as never, executionId as never));

        // Si es un delay, programar continuación
        if (action.type === 'delay' && result.scheduledFor) {
          await this.db
            .update('workflowExecutions' as never)
            .set({ 
              status: 'waiting',
              scheduledFor: result.scheduledFor,
              currentStep: i + 1
            } as never)
            .where(eq('id' as never, executionId as never));
          return;
        }

        // Si falló, detener
        if (!result.success) {
          await this.updateExecutionStatus(executionId, 'failed', result.error, i);
          return;
        }
      }

      // Completado exitosamente
      await this.db
        .update('workflowExecutions' as never)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          stepResults
        } as never)
        .where(eq('id' as never, executionId as never));

      // Actualizar contador del workflow
      await this.getDb().execute(`
        UPDATE workflows 
        SET execution_count = execution_count + 1, last_executed_at = NOW()
        WHERE id = '${workflow.id}'
      `);

    } catch (error: unknown) {
      await this.updateExecutionStatus(executionId, 'failed', getErrorMessage(error));
    }
  }

  /**
   * Ejecuta una acción individual
   */
  private async executeAction(
    action: WorkflowAction, 
    context: WorkflowContext, 
    executionId: string
  ): Promise<ActionResult> {
    const config = this.interpolateConfig(action.config, context);

    try {
      switch (action.type) {
        case 'send_email':
          return await this.executeSendEmail(config as EmailActionConfig);
        
        case 'send_sms':
          return await this.executeSendSms(config as SMSActionConfig);
        
        case 'send_whatsapp':
          return await this.executeSendWhatsApp(config as WhatsAppActionConfig);
        
        case 'send_push':
          return await this.executeSendPush(config as PushActionConfig, context);
        
        case 'create_task':
          return await this.executeCreateTask(config as TaskActionConfig, context);
        
        case 'create_reminder':
          return await this.executeCreateReminder(config as ReminderActionConfig, context);
        
        case 'update_field':
          return await this.executeUpdateField(config as UpdateFieldActionConfig, context);
        
        case 'add_tag':
          return this.executeAddTag();
        
        case 'webhook':
          return await this.executeWebhook(config as WebhookActionConfig);
        
        case 'delay':
          return this.executeDelay(config as DelayActionConfig);
        
        case 'condition':
          return await this.executeCondition(config as ConditionActionConfig, context, executionId);
        
        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      // Registrar log de acción
      await this.logAction(executionId, action, false, undefined, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Envía un email
   */
  private async executeSendEmail(config: EmailActionConfig): Promise<ActionResult> {
    if (!this.emailService) {
      return { success: false, error: 'Email service not configured' };
    }

    const result = await this.emailService.sendEmail({
      to: config.to,
      subject: config.subject,
      html: config.body?.replace(/\n/g, '<br>'),
      text: config.body
    });

    return { success: true, result };
  }

  /**
   * Envía un SMS
   */
  private async executeSendSms(config: SMSActionConfig): Promise<ActionResult> {
    if (!this.smsService) {
      return { success: false, error: 'SMS service not configured' };
    }

    const result = await this.smsService.sendSms({
      to: config.to,
      message: config.message
    });

    return { success: true, result };
  }

  /**
   * Envía un mensaje de WhatsApp
   */
  private async executeSendWhatsApp(config: WhatsAppActionConfig): Promise<ActionResult> {
    if (!this.whatsappService) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const result = await this.whatsappService.sendMessage({
      to: config.to,
      template: config.template,
      parameters: config.parameters
    });

    return { success: true, result };
  }

  /**
   * Envía una notificación push
   */
  private async executeSendPush(config: PushActionConfig, context: WorkflowContext): Promise<ActionResult> {
    if (!this.notificationService) {
      return { success: false, error: 'Notification service not configured' };
    }

    const userId = context.client?.userId || context.technician?.userId;
    if (!userId) {
      return { success: false, error: 'No user ID found in context' };
    }

    await this.notificationService.sendPushNotification({
      userId,
      title: config.title,
      body: config.body,
      data: config.data
    });

    return { success: true };
  }

  /**
   * Crea una tarea
   */
  private async executeCreateTask(config: TaskActionConfig, context: WorkflowContext): Promise<ActionResult> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config.dueInDays || 1));

    const task = {
      organizationId: context._organizationId,
      title: config.title,
      description: config.description,
      assignedTo: config.assignTo || context.technician?.id,
      dueDate,
      status: 'pending',
      relatedEntityType: context._entityType,
      relatedEntityId: context._entityId,
      createdAt: new Date()
    };

    await this.getDb().insert('tasks' as never).values(task as never);
    return { success: true, result: task };
  }

  /**
   * Crea un recordatorio
   */
  private async executeCreateReminder(config: ReminderActionConfig, context: WorkflowContext): Promise<ActionResult> {
    const scheduledFor = new Date(config.scheduledFor || Date.now() + 86400000);

    const reminder = {
      organizationId: context._organizationId,
      type: config.type || 'custom',
      clientId: context.client?.id,
      scheduledFor,
      channels: config.channels || ['push'],
      title: config.title,
      body: config.body,
      status: 'pending'
    };

    await this.getDb().insert('scheduledReminders' as never).values(reminder as never);
    return { success: true, result: reminder };
  }

  /**
   * Actualiza un campo
   */
  private async executeUpdateField(config: UpdateFieldActionConfig, context: WorkflowContext): Promise<ActionResult> {
    const entity = context[config.entityType] as { id?: string } | undefined;
    const entityId = entity?.id;
    if (!entityId) {
      return { success: false, error: `Entity ${config.entityType} not found in context` };
    }

    await this.db
      .update((config.entityType + 's') as never) // Pluralizar nombre de tabla
      .set({ [config.field]: config.value } as never)
      .where(eq('id' as never, entityId as never));

    return { success: true };
  }

  /**
   * Añade una etiqueta
   */
  private executeAddTag(): ActionResult {
    // TODO: Implementar lógica de tags
    return { success: true };
  }

  /**
   * Ejecuta un webhook
   */
  private async executeWebhook(config: WebhookActionConfig): Promise<ActionResult> {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: config.body ? JSON.stringify(config.body) : undefined
    });

    if (!response.ok) {
      return { success: false, error: `Webhook failed: ${response.status}` };
    }

    const result = await response.json().catch(() => ({}));
    return { success: true, result };
  }

  /**
   * Ejecuta un delay
   */
  private executeDelay(config: DelayActionConfig): ActionResult {
    const delayMs = 
      (config.minutes || 0) * 60 * 1000 +
      (config.hours || 0) * 60 * 60 * 1000 +
      (config.days || 0) * 24 * 60 * 60 * 1000;

    const scheduledFor = new Date(Date.now() + delayMs);
    return { success: true, scheduledFor };
  }

  /**
   * Ejecuta una condición
   */
  private async executeCondition(
    config: ConditionActionConfig, 
    context: WorkflowContext, 
    executionId: string
  ): Promise<ActionResult> {
    const conditionMet = this.evaluateExpression(config.condition, context);
    const actionsToExecute = conditionMet ? config.then : (config.else || []);

    for (const action of actionsToExecute) {
      const result = await this.executeAction(action, context, executionId);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, result: { conditionMet } };
  }

  /**
   * Evalúa condiciones del trigger
   */
  private evaluateConditions(conditions: TriggerConditions, context: WorkflowContext): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = this.getNestedValue(context, key);
      if (contextValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evalúa una expresión
   */
  private evaluateExpression(expression: string, context: WorkflowContext): boolean {
    // Interpolar variables
    let interpolated = expression;
    const matches = expression.match(/\{\{([^}]+)\}\}/g) || [];
    
    for (const match of matches) {
      const path = match.slice(2, -2).trim();
      const value = this.getNestedValue(context, path);
      interpolated = interpolated.replace(match, JSON.stringify(value));
    }

    // Evaluar expresión simple
    try {
      // Solo permitir operadores seguros
      if (interpolated.includes('==')) {
        const [left, right] = interpolated.split('==').map(s => s.trim());
        return JSON.parse(left) === JSON.parse(right);
      }
      if (interpolated.includes('!=')) {
        const [left, right] = interpolated.split('!=').map(s => s.trim());
        return JSON.parse(left) !== JSON.parse(right);
      }
      if (interpolated.includes('>')) {
        const [left, right] = interpolated.split('>').map(s => s.trim());
        return Number(left) > Number(right);
      }
      if (interpolated.includes('<')) {
        const [left, right] = interpolated.split('<').map(s => s.trim());
        return Number(left) < Number(right);
      }
      return Boolean(interpolated);
    } catch {
      return false;
    }
  }

  /**
   * Interpola variables en la configuración
   */
  private interpolateConfig<T>(config: T, context: WorkflowContext): T {
    if (typeof config === 'string') {
      return this.interpolateString(config, context) as T;
    }
    if (Array.isArray(config)) {
      return config.map(item => this.interpolateConfig(item, context)) as T;
    }
    if (typeof config === 'object' && config !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.interpolateConfig(value, context);
      }
      return result as T;
    }
    return config;
  }

  /**
   * Interpola variables en un string
   */
  private interpolateString(str: string, context: WorkflowContext): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Obtiene un valor anidado de un objeto
   */
  private getNestedValue(obj: WorkflowContext, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Verifica si ya existe una ejecución
   */
  private async checkExistingExecution(workflowId: string, context: WorkflowContext): Promise<boolean> {
    const result = await this.db
      .select()
      .from('workflowExecutions' as never)
      .where(
        and(
          eq('workflowId' as never, workflowId as never),
          eq('triggerEntityId' as never, (context._entityId || '') as never)
        )
      )
      .limit(1) as WorkflowExecution[];
    return result.length > 0;
  }

  /**
   * Actualiza el estado de una ejecución
   */
  private async updateExecutionStatus(
    executionId: string, 
    status: ExecutionStatus, 
    errorMessage?: string,
    errorStep?: number
  ): Promise<void> {
    await this.db
      .update('workflowExecutions' as never)
      .set({ 
        status,
        errorMessage,
        errorStep,
        completedAt: new Date()
      } as never)
      .where(eq('id' as never, executionId as never));
  }

  /**
   * Registra una acción en el log
   */
  private async logAction(
    executionId: string,
    action: WorkflowAction,
    success: boolean,
    result?: unknown,
    errorMessage?: string
  ): Promise<void> {
    const log: ActionLog = {
      executionId,
      stepIndex: 0, // Se actualizará
      actionType: action.type,
      actionConfig: action.config,
      success,
      result,
      errorMessage,
      completedAt: new Date()
    };

    await this.getDb().insert('workflowActionLogs' as never).values(log as never);
  }

  /**
   * Procesa ejecuciones en espera (para delays)
   * Este método debería ejecutarse periódicamente
   */
  async processWaitingExecutions(): Promise<number> {
    const now = new Date();
    
    const waitingExecutions = await this.db
      .select()
      .from('workflowExecutions' as never)
      .where(
        and(
          eq('status' as never, 'waiting' as never),
          lte('scheduledFor' as never, now as never)
        )
      ) as WorkflowExecution[];

    for (const execution of waitingExecutions) {
      // Cambiar estado a pending para continuar
      await this.db
        .update('workflowExecutions' as never)
        .set({ status: 'pending', scheduledFor: null } as never)
        .where(eq('id' as never, execution.id as never));

      // Continuar ejecución
      this.executeWorkflow(execution.id).catch((err) => console.error('Error continuing workflow:', err));
    }

    return waitingExecutions.length;
  }

  /**
   * Obtiene las ejecuciones de un workflow
   */
  async getWorkflowExecutions(workflowId: string, limit = 50): Promise<WorkflowExecution[]> {
    return await this.db
      .select()
      .from('workflowExecutions' as never)
      .where(eq('workflowId' as never, workflowId as never))
      .orderBy('createdAt' as never, 'desc' as never)
      .limit(limit) as WorkflowExecution[];
  }

  /**
   * Obtiene estadísticas de workflows
   */
  async getWorkflowStats(organizationId: string): Promise<WorkflowStats> {
    const workflows = await this.getWorkflows(organizationId);
    
    const stats: WorkflowStats = {
      total: workflows.length,
      active: workflows.filter((w) => w.status === 'active').length,
      totalExecutions: workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0),
      byTrigger: {}
    };

    for (const workflow of workflows) {
      const trigger = workflow.triggerType;
      stats.byTrigger[trigger] = (stats.byTrigger[trigger] || 0) + 1;
    }

    return stats;
  }
}

export default WorkflowService;
