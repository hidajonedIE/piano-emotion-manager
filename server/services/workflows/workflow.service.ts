/**
 * Servicio de Workflows Automatizados
 * 
 * Permite crear automatizaciones del tipo "Si X entonces Y" con un editor visual.
 * Soporta múltiples triggers, condiciones y acciones encadenadas.
 */

import { eq, and, lte, isNull } from 'drizzle-orm';

// Tipos de trigger disponibles
export const TRIGGER_TYPES = {
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
export const ACTION_TYPES = {
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
    description: 'Envía una notificación push',
    icon: 'notifications-outline',
    configFields: ['title', 'body', 'data']
  },
  create_task: {
    name: 'Crear Tarea',
    description: 'Crea una tarea para el técnico',
    icon: 'checkbox-outline',
    configFields: ['title', 'description', 'assignTo', 'dueInDays']
  },
  create_reminder: {
    name: 'Crear Recordatorio',
    description: 'Programa un recordatorio',
    icon: 'alarm-outline',
    configFields: ['type', 'scheduledFor', 'channels']
  },
  update_field: {
    name: 'Actualizar Campo',
    description: 'Actualiza un campo de una entidad',
    icon: 'create-outline',
    configFields: ['entityType', 'field', 'value']
  },
  create_invoice: {
    name: 'Crear Factura',
    description: 'Crea una factura automáticamente',
    icon: 'receipt-outline',
    configFields: ['fromService', 'sendToClient']
  },
  add_tag: {
    name: 'Añadir Etiqueta',
    description: 'Añade una etiqueta a la entidad',
    icon: 'pricetag-outline',
    configFields: ['tag']
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
    description: 'Evalúa una condición y ejecuta acciones diferentes',
    icon: 'git-branch-outline',
    configFields: ['condition', 'then', 'else']
  }
};

// Plantillas de workflows predefinidos
export const WORKFLOW_TEMPLATES = [
  {
    id: 'welcome_new_client',
    name: 'Bienvenida a Nuevo Cliente',
    description: 'Envía un email de bienvenida cuando se registra un nuevo cliente',
    triggerType: 'client_created',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Bienvenido a {{organization.name}}',
          body: 'Hola {{client.firstName}},\n\nGracias por confiar en nosotros para el cuidado de tu piano.\n\nSaludos,\n{{organization.name}}'
        }
      }
    ]
  },
  {
    id: 'service_completed_followup',
    name: 'Seguimiento Post-Servicio',
    description: 'Envía un email de seguimiento 7 días después de completar un servicio',
    triggerType: 'service_completed',
    actions: [
      {
        type: 'delay',
        config: { days: 7 }
      },
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: '¿Cómo está tu piano después del servicio?',
          body: 'Hola {{client.firstName}},\n\nHace una semana realizamos {{service.type}} en tu {{piano.brand}} {{piano.model}}.\n\n¿Todo funciona correctamente? Si tienes alguna pregunta, no dudes en contactarnos.\n\nSaludos'
        }
      }
    ]
  },
  {
    id: 'invoice_reminder',
    name: 'Recordatorio de Pago',
    description: 'Envía recordatorios cuando una factura está vencida',
    triggerType: 'invoice_overdue',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Recordatorio: Factura {{invoice.number}} pendiente',
          body: 'Hola {{client.firstName}},\n\nTe recordamos que la factura {{invoice.number}} por {{invoice.total}}€ está pendiente de pago.\n\nPuedes realizar el pago a través de nuestro portal o contactarnos para más información.\n\nSaludos'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Seguimiento factura vencida - {{client.name}}',
          description: 'La factura {{invoice.number}} está vencida. Contactar al cliente.',
          dueInDays: 3
        }
      }
    ]
  },
  {
    id: 'quote_accepted_create_service',
    name: 'Presupuesto Aceptado → Crear Servicio',
    description: 'Cuando se acepta un presupuesto, crea automáticamente el servicio',
    triggerType: 'quote_accepted',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Presupuesto aceptado - Próximos pasos',
          body: 'Hola {{client.firstName}},\n\nGracias por aceptar nuestro presupuesto. Nos pondremos en contacto contigo para programar la cita.\n\nSaludos'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Programar cita - {{client.name}}',
          description: 'El cliente ha aceptado el presupuesto {{quote.number}}. Contactar para programar cita.',
          dueInDays: 1
        }
      }
    ]
  },
  {
    id: 'appointment_confirmation',
    name: 'Confirmación de Cita',
    description: 'Envía confirmación cuando se programa una cita',
    triggerType: 'appointment_scheduled',
    actions: [
      {
        type: 'send_email',
        config: {
          to: '{{client.email}}',
          subject: 'Cita confirmada - {{appointment.date}}',
          body: 'Hola {{client.firstName}},\n\nTu cita ha sido confirmada:\n\nFecha: {{appointment.date}}\nHora: {{appointment.time}}\nServicio: {{appointment.serviceType}}\n\nTe esperamos.\n\nSaludos'
        }
      },
      {
        type: 'send_sms',
        config: {
          to: '{{client.phone}}',
          message: 'Cita confirmada para {{appointment.date}} a las {{appointment.time}}. {{organization.name}}'
        }
      }
    ]
  }
];

/**
 * Clase principal del servicio de workflows
 */
export class WorkflowService {
  private db: any;
  private emailService: any;
  private smsService: any;
  private whatsappService: any;
  private notificationService: any;

  constructor(dependencies: {
    db: any;
    emailService?: any;
    smsService?: any;
    whatsappService?: any;
    notificationService?: any;
  }) {
    this.db = dependencies.db;
    this.emailService = dependencies.emailService;
    this.smsService = dependencies.smsService;
    this.whatsappService = dependencies.whatsappService;
    this.notificationService = dependencies.notificationService;
  }

  /**
   * Crea un nuevo workflow
   */
  async createWorkflow(organizationId: string, data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConditions?: any;
    actions: any[];
    enabled?: boolean;
  }, createdBy: string) {
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

    const result = await this.db.insert('workflows').values(workflow).returning();
    return result[0];
  }

  /**
   * Obtiene todos los workflows de una organización
   */
  async getWorkflows(organizationId: string) {
    return await this.db
      .select()
      .from('workflows')
      .where(eq('organizationId', organizationId))
      .orderBy('createdAt', 'desc');
  }

  /**
   * Obtiene un workflow por ID
   */
  async getWorkflow(workflowId: string) {
    const result = await this.db
      .select()
      .from('workflows')
      .where(eq('id', workflowId))
      .limit(1);
    return result[0];
  }

  /**
   * Actualiza un workflow
   */
  async updateWorkflow(workflowId: string, data: Partial<{
    name: string;
    description: string;
    triggerConditions: any;
    actions: any[];
    enabled: boolean;
    status: string;
  }>) {
    return await this.db
      .update('workflows')
      .set({ ...data, updatedAt: new Date() })
      .where(eq('id', workflowId));
  }

  /**
   * Elimina un workflow
   */
  async deleteWorkflow(workflowId: string) {
    return await this.db
      .delete('workflows')
      .where(eq('id', workflowId));
  }

  /**
   * Dispara workflows basados en un evento
   */
  async triggerWorkflows(organizationId: string, triggerType: string, context: any) {
    // Buscar workflows activos que coincidan con el trigger
    const workflows = await this.db
      .select()
      .from('workflows')
      .where(
        and(
          eq('organizationId', organizationId),
          eq('triggerType', triggerType),
          eq('status', 'active'),
          eq('enabled', true)
        )
      );

    const executions = [];

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
      this.executeWorkflow(execution.id).catch(console.error);
    }

    return executions;
  }

  /**
   * Crea una ejecución de workflow
   */
  private async createExecution(workflow: any, context: any) {
    const execution = {
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      triggerEntityType: context._entityType || 'unknown',
      triggerEntityId: context._entityId || 'unknown',
      status: 'pending',
      currentStep: 0,
      context,
      stepResults: [],
      createdAt: new Date()
    };

    const result = await this.db.insert('workflowExecutions').values(execution).returning();
    return result[0];
  }

  /**
   * Ejecuta un workflow
   */
  async executeWorkflow(executionId: string) {
    const execution = await this.db
      .select()
      .from('workflowExecutions')
      .where(eq('id', executionId))
      .limit(1)
      .then((r: any[]) => r[0]);

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
      .update('workflowExecutions')
      .set({ status: 'running', startedAt: new Date() })
      .where(eq('id', executionId));

    try {
      const actions = workflow.actions as any[];
      const stepResults: any[] = [];

      for (let i = execution.currentStep; i < actions.length; i++) {
        const action = actions[i];
        
        // Actualizar paso actual
        await this.db
          .update('workflowExecutions')
          .set({ currentStep: i })
          .where(eq('id', executionId));

        // Ejecutar acción
        const result = await this.executeAction(action, execution.context, executionId);
        stepResults.push({ step: i, action: action.type, ...result });

        // Guardar resultado
        await this.db
          .update('workflowExecutions')
          .set({ stepResults })
          .where(eq('id', executionId));

        // Si es un delay, programar continuación
        if (action.type === 'delay' && result.scheduledFor) {
          await this.db
            .update('workflowExecutions')
            .set({ 
              status: 'waiting',
              scheduledFor: result.scheduledFor,
              currentStep: i + 1
            })
            .where(eq('id', executionId));
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
        .update('workflowExecutions')
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          stepResults
        })
        .where(eq('id', executionId));

      // Actualizar contador del workflow
      await this.db.execute(`
        UPDATE workflows 
        SET execution_count = execution_count + 1, last_executed_at = NOW()
        WHERE id = '${workflow.id}'
      `);

    } catch (error: any) {
      await this.updateExecutionStatus(executionId, 'failed', error.message);
    }
  }

  /**
   * Ejecuta una acción individual
   */
  private async executeAction(action: any, context: any, executionId: string): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    scheduledFor?: Date;
  }> {
    const config = this.interpolateConfig(action.config, context);

    try {
      switch (action.type) {
        case 'send_email':
          return await this.executeSendEmail(config);
        
        case 'send_sms':
          return await this.executeSendSms(config);
        
        case 'send_whatsapp':
          return await this.executeSendWhatsApp(config);
        
        case 'send_push':
          return await this.executeSendPush(config, context);
        
        case 'create_task':
          return await this.executeCreateTask(config, context);
        
        case 'create_reminder':
          return await this.executeCreateReminder(config, context);
        
        case 'update_field':
          return await this.executeUpdateField(config, context);
        
        case 'add_tag':
          return await this.executeAddTag(config, context);
        
        case 'webhook':
          return await this.executeWebhook(config);
        
        case 'delay':
          return this.executeDelay(config);
        
        case 'condition':
          return await this.executeCondition(config, context, executionId);
        
        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error: any) {
      // Registrar log de acción
      await this.logAction(executionId, action, false, null, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía un email
   */
  private async executeSendEmail(config: any) {
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
  private async executeSendSms(config: any) {
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
  private async executeSendWhatsApp(config: any) {
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
  private async executeSendPush(config: any, context: any) {
    if (!this.notificationService) {
      return { success: false, error: 'Notification service not configured' };
    }

    await this.notificationService.sendPushNotification({
      userId: context.client?.userId || context.technician?.userId,
      title: config.title,
      body: config.body,
      data: config.data
    });

    return { success: true };
  }

  /**
   * Crea una tarea
   */
  private async executeCreateTask(config: any, context: any) {
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

    await this.db.insert('tasks').values(task);
    return { success: true, result: task };
  }

  /**
   * Crea un recordatorio
   */
  private async executeCreateReminder(config: any, context: any) {
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

    await this.db.insert('scheduledReminders').values(reminder);
    return { success: true, result: reminder };
  }

  /**
   * Actualiza un campo
   */
  private async executeUpdateField(config: any, context: any) {
    const entityId = context[config.entityType]?.id;
    if (!entityId) {
      return { success: false, error: `Entity ${config.entityType} not found in context` };
    }

    await this.db
      .update(config.entityType + 's') // Pluralizar nombre de tabla
      .set({ [config.field]: config.value })
      .where(eq('id', entityId));

    return { success: true };
  }

  /**
   * Añade una etiqueta
   */
  private async executeAddTag(config: any, context: any) {
    // Implementar lógica de tags
    return { success: true };
  }

  /**
   * Ejecuta un webhook
   */
  private async executeWebhook(config: any) {
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
  private executeDelay(config: any): { success: boolean; scheduledFor: Date } {
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
  private async executeCondition(config: any, context: any, executionId: string) {
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
  private evaluateConditions(conditions: any, context: any): boolean {
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
  private evaluateExpression(expression: string, context: any): boolean {
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
  private interpolateConfig(config: any, context: any): any {
    if (typeof config === 'string') {
      return this.interpolateString(config, context);
    }
    if (Array.isArray(config)) {
      return config.map(item => this.interpolateConfig(item, context));
    }
    if (typeof config === 'object' && config !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.interpolateConfig(value, context);
      }
      return result;
    }
    return config;
  }

  /**
   * Interpola variables en un string
   */
  private interpolateString(str: string, context: any): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Obtiene un valor anidado de un objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Verifica si ya existe una ejecución
   */
  private async checkExistingExecution(workflowId: string, context: any): Promise<boolean> {
    const result = await this.db
      .select()
      .from('workflowExecutions')
      .where(
        and(
          eq('workflowId', workflowId),
          eq('triggerEntityId', context._entityId)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  /**
   * Actualiza el estado de una ejecución
   */
  private async updateExecutionStatus(
    executionId: string, 
    status: string, 
    errorMessage?: string,
    errorStep?: number
  ) {
    await this.db
      .update('workflowExecutions')
      .set({ 
        status,
        errorMessage,
        errorStep,
        completedAt: new Date()
      })
      .where(eq('id', executionId));
  }

  /**
   * Registra una acción en el log
   */
  private async logAction(
    executionId: string,
    action: any,
    success: boolean,
    result?: any,
    errorMessage?: string
  ) {
    await this.db.insert('workflowActionLogs').values({
      executionId,
      stepIndex: 0, // Se actualizará
      actionType: action.type,
      actionConfig: action.config,
      success,
      result,
      errorMessage,
      completedAt: new Date()
    });
  }

  /**
   * Procesa ejecuciones en espera (para delays)
   * Este método debería ejecutarse periódicamente
   */
  async processWaitingExecutions() {
    const now = new Date();
    
    const waitingExecutions = await this.db
      .select()
      .from('workflowExecutions')
      .where(
        and(
          eq('status', 'waiting'),
          lte('scheduledFor', now)
        )
      );

    for (const execution of waitingExecutions) {
      // Cambiar estado a pending para continuar
      await this.db
        .update('workflowExecutions')
        .set({ status: 'pending', scheduledFor: null })
        .where(eq('id', execution.id));

      // Continuar ejecución
      this.executeWorkflow(execution.id).catch(console.error);
    }

    return waitingExecutions.length;
  }

  /**
   * Obtiene las ejecuciones de un workflow
   */
  async getWorkflowExecutions(workflowId: string, limit = 50) {
    return await this.db
      .select()
      .from('workflowExecutions')
      .where(eq('workflowId', workflowId))
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  /**
   * Obtiene estadísticas de workflows
   */
  async getWorkflowStats(organizationId: string) {
    const workflows = await this.getWorkflows(organizationId);
    
    const stats = {
      total: workflows.length,
      active: workflows.filter((w: any) => w.status === 'active').length,
      totalExecutions: workflows.reduce((sum: number, w: any) => sum + (w.executionCount || 0), 0),
      byTrigger: {} as Record<string, number>
    };

    for (const workflow of workflows) {
      const trigger = workflow.triggerType;
      stats.byTrigger[trigger] = (stats.byTrigger[trigger] || 0) + 1;
    }

    return stats;
  }
}

export default WorkflowService;
