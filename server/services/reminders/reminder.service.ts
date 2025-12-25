/**
 * Servicio de Recordatorios Automáticos Avanzados
 * 
 * Gestiona la creación, programación y envío de recordatorios automáticos
 * basados en reglas configurables.
 */

import { eq, and, lte, gte, isNull, sql } from 'drizzle-orm';

// Tipos de eventos que pueden disparar recordatorios
export type TriggerEvent = 
  | 'service_completed'
  | 'last_service'
  | 'warranty_end'
  | 'appointment_scheduled'
  | 'invoice_created'
  | 'invoice_due'
  | 'contract_renewal'
  | 'piano_registered';

// Interfaz para condiciones de disparo
export interface TriggerCondition {
  event: TriggerEvent;
  daysAfter?: number;
  daysBefore?: number;
  daysSince?: number;
  customCondition?: string;
}

// Interfaz para plantilla de mensaje
export interface MessageTemplate {
  title: string;
  body: string;
  variables: string[];
  ctaText?: string;
  ctaUrl?: string;
}

// Interfaz para regla de recordatorio
export interface ReminderRuleConfig {
  name: string;
  description?: string;
  type: 'maintenance' | 'follow_up' | 'warranty_expiry' | 'appointment' | 'payment_due' | 'contract_renewal' | 'custom';
  enabled: boolean;
  triggerCondition: TriggerCondition;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'custom';
  customFrequencyDays?: number;
  daysOffset: number;
  timeOfDay: string;
  channels: ('push' | 'email' | 'sms' | 'whatsapp')[];
  messageTemplate: MessageTemplate;
  clientTypes?: string[];
  serviceTypes?: string[];
  pianoCategories?: string[];
}

// Plantillas predefinidas de recordatorios
export const PREDEFINED_REMINDER_TEMPLATES: Record<string, ReminderRuleConfig> = {
  maintenance_6_months: {
    name: 'Recordatorio de Afinación (6 meses)',
    description: 'Recuerda al cliente que han pasado 6 meses desde la última afinación',
    type: 'maintenance',
    enabled: true,
    triggerCondition: {
      event: 'last_service',
      daysSince: 180
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '10:00',
    channels: ['email', 'push'],
    messageTemplate: {
      title: '¿Es hora de afinar tu piano?',
      body: 'Hola {{clientName}}, han pasado 6 meses desde la última afinación de tu {{pianoModel}}. Te recomendamos programar una nueva afinación para mantener tu piano en óptimas condiciones.',
      variables: ['clientName', 'pianoModel', 'lastServiceDate'],
      ctaText: 'Programar cita',
      ctaUrl: '/appointments/new'
    },
    serviceTypes: ['tuning']
  },
  
  maintenance_12_months: {
    name: 'Recordatorio de Mantenimiento Anual',
    description: 'Recuerda al cliente el mantenimiento anual recomendado',
    type: 'maintenance',
    enabled: true,
    triggerCondition: {
      event: 'last_service',
      daysSince: 365
    },
    frequency: 'annual',
    daysOffset: 0,
    timeOfDay: '10:00',
    channels: ['email', 'push'],
    messageTemplate: {
      title: 'Mantenimiento anual de tu piano',
      body: 'Hola {{clientName}}, ha pasado un año desde el último servicio de tu {{pianoModel}}. El mantenimiento anual es esencial para preservar la calidad de sonido y el valor de tu instrumento.',
      variables: ['clientName', 'pianoModel', 'lastServiceDate'],
      ctaText: 'Solicitar presupuesto',
      ctaUrl: '/quotes/new'
    }
  },
  
  follow_up_7_days: {
    name: 'Seguimiento Post-Servicio (7 días)',
    description: 'Contacta al cliente una semana después del servicio para verificar satisfacción',
    type: 'follow_up',
    enabled: true,
    triggerCondition: {
      event: 'service_completed',
      daysAfter: 7
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '11:00',
    channels: ['email'],
    messageTemplate: {
      title: '¿Cómo está tu piano después del servicio?',
      body: 'Hola {{clientName}}, hace una semana realizamos {{serviceType}} en tu {{pianoModel}}. Nos gustaría saber si todo está funcionando correctamente. ¿Tienes alguna pregunta o comentario?',
      variables: ['clientName', 'serviceType', 'pianoModel', 'serviceDate'],
      ctaText: 'Dejar valoración',
      ctaUrl: '/feedback'
    }
  },
  
  warranty_expiry_30_days: {
    name: 'Aviso de Vencimiento de Garantía (30 días)',
    description: 'Notifica al cliente que su garantía expira en 30 días',
    type: 'warranty_expiry',
    enabled: true,
    triggerCondition: {
      event: 'warranty_end',
      daysBefore: 30
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '10:00',
    channels: ['email', 'push'],
    messageTemplate: {
      title: 'Tu garantía expira pronto',
      body: 'Hola {{clientName}}, la garantía de tu {{pianoModel}} expira el {{warrantyEndDate}}. Te recomendamos realizar una revisión antes de esa fecha para detectar cualquier problema cubierto por la garantía.',
      variables: ['clientName', 'pianoModel', 'warrantyEndDate'],
      ctaText: 'Programar revisión',
      ctaUrl: '/appointments/new'
    }
  },
  
  appointment_reminder_24h: {
    name: 'Recordatorio de Cita (24 horas)',
    description: 'Recuerda al cliente su cita programada para mañana',
    type: 'appointment',
    enabled: true,
    triggerCondition: {
      event: 'appointment_scheduled',
      daysBefore: 1
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '18:00',
    channels: ['push', 'email', 'sms'],
    messageTemplate: {
      title: 'Recordatorio: Cita mañana',
      body: 'Hola {{clientName}}, te recordamos que mañana {{appointmentDate}} a las {{appointmentTime}} tienes programada una cita para {{serviceType}} de tu {{pianoModel}}.',
      variables: ['clientName', 'appointmentDate', 'appointmentTime', 'serviceType', 'pianoModel', 'technicianName'],
      ctaText: 'Ver detalles',
      ctaUrl: '/appointments/{{appointmentId}}'
    }
  },
  
  appointment_reminder_2h: {
    name: 'Recordatorio de Cita (2 horas)',
    description: 'Recuerda al cliente su cita en 2 horas',
    type: 'appointment',
    enabled: true,
    triggerCondition: {
      event: 'appointment_scheduled',
      daysBefore: 0
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '{{appointmentTime - 2h}}',
    channels: ['push', 'sms'],
    messageTemplate: {
      title: 'Tu cita es en 2 horas',
      body: '{{clientName}}, tu técnico {{technicianName}} llegará en aproximadamente 2 horas para {{serviceType}}.',
      variables: ['clientName', 'technicianName', 'serviceType'],
      ctaText: 'Contactar',
      ctaUrl: 'tel:{{technicianPhone}}'
    }
  },
  
  payment_reminder_7_days: {
    name: 'Recordatorio de Pago (7 días)',
    description: 'Recuerda al cliente que tiene una factura pendiente de pago',
    type: 'payment_due',
    enabled: true,
    triggerCondition: {
      event: 'invoice_due',
      daysAfter: 7
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '10:00',
    channels: ['email'],
    messageTemplate: {
      title: 'Factura pendiente de pago',
      body: 'Hola {{clientName}}, te recordamos que la factura {{invoiceNumber}} por importe de {{invoiceAmount}} está pendiente de pago desde hace 7 días.',
      variables: ['clientName', 'invoiceNumber', 'invoiceAmount', 'invoiceDate', 'dueDate'],
      ctaText: 'Pagar ahora',
      ctaUrl: '/invoices/{{invoiceId}}/pay'
    }
  },
  
  contract_renewal_30_days: {
    name: 'Renovación de Contrato (30 días)',
    description: 'Notifica al cliente que su contrato de mantenimiento expira en 30 días',
    type: 'contract_renewal',
    enabled: true,
    triggerCondition: {
      event: 'contract_renewal',
      daysBefore: 30
    },
    frequency: 'once',
    daysOffset: 0,
    timeOfDay: '10:00',
    channels: ['email', 'push'],
    messageTemplate: {
      title: 'Tu contrato de mantenimiento expira pronto',
      body: 'Hola {{clientName}}, tu contrato de mantenimiento para {{pianoModel}} expira el {{contractEndDate}}. Renuévalo ahora para seguir disfrutando de todos los beneficios.',
      variables: ['clientName', 'pianoModel', 'contractEndDate', 'contractType'],
      ctaText: 'Renovar contrato',
      ctaUrl: '/contracts/{{contractId}}/renew'
    }
  }
};

/**
 * Clase principal del servicio de recordatorios
 */
export class ReminderService {
  private db: any;
  private notificationService: any;
  private emailService: any;
  private smsService: any;
  private whatsappService: any;

  constructor(dependencies: {
    db: any;
    notificationService: any;
    emailService: any;
    smsService?: any;
    whatsappService?: any;
  }) {
    this.db = dependencies.db;
    this.notificationService = dependencies.notificationService;
    this.emailService = dependencies.emailService;
    this.smsService = dependencies.smsService;
    this.whatsappService = dependencies.whatsappService;
  }

  /**
   * Crea una nueva regla de recordatorio
   */
  async createRule(organizationId: string, config: ReminderRuleConfig, createdBy: string) {
    const rule = {
      organizationId,
      name: config.name,
      description: config.description,
      type: config.type,
      enabled: config.enabled,
      triggerCondition: config.triggerCondition,
      frequency: config.frequency,
      customFrequencyDays: config.customFrequencyDays,
      daysOffset: config.daysOffset,
      timeOfDay: config.timeOfDay,
      channels: config.channels,
      messageTemplate: config.messageTemplate,
      clientTypes: config.clientTypes,
      serviceTypes: config.serviceTypes,
      pianoCategories: config.pianoCategories,
      createdBy
    };

    // Insertar en la base de datos
    const result = await this.db.insert('reminderRules').values(rule).returning();
    return result[0];
  }

  /**
   * Obtiene todas las reglas de una organización
   */
  async getRules(organizationId: string) {
    return await this.db
      .select()
      .from('reminderRules')
      .where(eq('organizationId', organizationId));
  }

  /**
   * Activa o desactiva una regla
   */
  async toggleRule(ruleId: string, enabled: boolean) {
    return await this.db
      .update('reminderRules')
      .set({ enabled, updatedAt: new Date() })
      .where(eq('id', ruleId));
  }

  /**
   * Programa un recordatorio
   */
  async scheduleReminder(params: {
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
    channels: string[];
    title: string;
    body: string;
    data?: any;
  }) {
    const reminder = {
      ...params,
      status: 'pending',
      createdAt: new Date()
    };

    const result = await this.db.insert('scheduledReminders').values(reminder).returning();
    return result[0];
  }

  /**
   * Procesa y envía recordatorios pendientes
   * Este método debería ejecutarse periódicamente (cron job)
   */
  async processScheduledReminders() {
    const now = new Date();
    
    // Obtener recordatorios pendientes que deben enviarse
    const pendingReminders = await this.db
      .select()
      .from('scheduledReminders')
      .where(
        and(
          eq('status', 'pending'),
          lte('scheduledFor', now),
          isNull('snoozedUntil')
        )
      );

    const results = [];

    for (const reminder of pendingReminders) {
      try {
        const sendResults = await this.sendReminder(reminder);
        
        // Actualizar estado del recordatorio
        await this.db
          .update('scheduledReminders')
          .set({
            status: 'sent',
            sentAt: new Date(),
            sendResults,
            updatedAt: new Date()
          })
          .where(eq('id', reminder.id));

        results.push({ id: reminder.id, success: true, sendResults });
      } catch (error) {
        results.push({ id: reminder.id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Envía un recordatorio por todos los canales configurados
   */
  private async sendReminder(reminder: any) {
    const results: Record<string, any> = {};
    const channels = reminder.channels || [];

    // Obtener información del cliente
    const client = reminder.clientId 
      ? await this.getClientInfo(reminder.clientId)
      : null;

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'push':
            results.push = await this.sendPushNotification(reminder, client);
            break;
          case 'email':
            results.email = await this.sendEmailNotification(reminder, client);
            break;
          case 'sms':
            results.sms = await this.sendSmsNotification(reminder, client);
            break;
          case 'whatsapp':
            results.whatsapp = await this.sendWhatsAppNotification(reminder, client);
            break;
        }
      } catch (error) {
        results[channel] = { success: false, error: error.message };
      }
    }

    // Registrar en historial
    await this.logReminderHistory(reminder, results);

    return results;
  }

  /**
   * Envía notificación push
   */
  private async sendPushNotification(reminder: any, client: any) {
    if (!this.notificationService) {
      return { success: false, error: 'Push notification service not configured' };
    }

    await this.notificationService.sendPushNotification({
      userId: client?.userId,
      title: reminder.title,
      body: reminder.body,
      data: reminder.data
    });

    return { success: true };
  }

  /**
   * Envía notificación por email
   */
  private async sendEmailNotification(reminder: any, client: any) {
    if (!this.emailService || !client?.email) {
      return { success: false, error: 'Email service not configured or client email missing' };
    }

    const result = await this.emailService.sendEmail({
      to: client.email,
      subject: reminder.title,
      html: this.generateEmailHtml(reminder),
      text: reminder.body
    });

    return { success: true, messageId: result.messageId };
  }

  /**
   * Envía notificación por SMS
   */
  private async sendSmsNotification(reminder: any, client: any) {
    if (!this.smsService || !client?.phone) {
      return { success: false, error: 'SMS service not configured or client phone missing' };
    }

    const result = await this.smsService.sendSms({
      to: client.phone,
      message: `${reminder.title}\n\n${reminder.body}`
    });

    return { success: true, messageId: result.messageId };
  }

  /**
   * Envía notificación por WhatsApp
   */
  private async sendWhatsAppNotification(reminder: any, client: any) {
    if (!this.whatsappService || !client?.phone) {
      return { success: false, error: 'WhatsApp service not configured or client phone missing' };
    }

    const result = await this.whatsappService.sendMessage({
      to: client.phone,
      template: 'reminder',
      parameters: {
        title: reminder.title,
        body: reminder.body
      }
    });

    return { success: true, messageId: result.messageId };
  }

  /**
   * Genera HTML para email
   */
  private generateEmailHtml(reminder: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .cta { display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${reminder.title}</h1>
            </div>
            <div class="content">
              <p>${reminder.body.replace(/\n/g, '<br>')}</p>
              ${reminder.data?.ctaUrl ? `<a href="${reminder.data.ctaUrl}" class="cta">${reminder.data.ctaText || 'Ver más'}</a>` : ''}
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de Piano Emotion Manager.</p>
              <p>Si no deseas recibir estos recordatorios, puedes configurar tus preferencias en la app.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Obtiene información del cliente
   */
  private async getClientInfo(clientId: string) {
    const result = await this.db
      .select()
      .from('clients')
      .where(eq('id', clientId))
      .limit(1);
    return result[0];
  }

  /**
   * Registra el envío en el historial
   */
  private async logReminderHistory(reminder: any, results: Record<string, any>) {
    for (const [channel, result] of Object.entries(results)) {
      await this.db.insert('reminderHistory').values({
        organizationId: reminder.organizationId,
        reminderId: reminder.id,
        channel,
        recipientId: reminder.clientId,
        success: result.success,
        errorMessage: result.error,
        externalId: result.messageId,
        sentAt: new Date()
      });
    }
  }

  /**
   * Pospone un recordatorio
   */
  async snoozeReminder(reminderId: string, snoozeUntil: Date) {
    return await this.db
      .update('scheduledReminders')
      .set({
        status: 'snoozed',
        snoozedUntil: snoozeUntil,
        updatedAt: new Date()
      })
      .where(eq('id', reminderId));
  }

  /**
   * Marca un recordatorio como reconocido
   */
  async acknowledgeReminder(reminderId: string) {
    return await this.db
      .update('scheduledReminders')
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq('id', reminderId));
  }

  /**
   * Cancela un recordatorio
   */
  async cancelReminder(reminderId: string) {
    return await this.db
      .update('scheduledReminders')
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq('id', reminderId));
  }

  /**
   * Obtiene las preferencias de recordatorio de un cliente
   */
  async getClientPreferences(clientId: string, organizationId: string) {
    const result = await this.db
      .select()
      .from('clientReminderPreferences')
      .where(
        and(
          eq('clientId', clientId),
          eq('organizationId', organizationId)
        )
      )
      .limit(1);
    return result[0];
  }

  /**
   * Actualiza las preferencias de recordatorio de un cliente
   */
  async updateClientPreferences(clientId: string, organizationId: string, preferences: any) {
    const existing = await this.getClientPreferences(clientId, organizationId);
    
    if (existing) {
      return await this.db
        .update('clientReminderPreferences')
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq('id', existing.id));
    } else {
      return await this.db
        .insert('clientReminderPreferences')
        .values({
          clientId,
          organizationId,
          ...preferences
        });
    }
  }

  /**
   * Evalúa las reglas y programa recordatorios automáticamente
   * Este método debería ejecutarse diariamente
   */
  async evaluateRulesAndSchedule(organizationId: string) {
    // Obtener reglas activas
    const rules = await this.db
      .select()
      .from('reminderRules')
      .where(
        and(
          eq('organizationId', organizationId),
          eq('enabled', true)
        )
      );

    const scheduledCount = { total: 0, byType: {} as Record<string, number> };

    for (const rule of rules) {
      const candidates = await this.findCandidatesForRule(organizationId, rule);
      
      for (const candidate of candidates) {
        // Verificar que no exista ya un recordatorio programado
        const existing = await this.checkExistingReminder(rule.id, candidate);
        if (existing) continue;

        // Calcular fecha de envío
        const scheduledFor = this.calculateScheduledDate(rule, candidate);
        
        // Interpolar variables en el mensaje
        const { title, body } = this.interpolateMessage(rule.messageTemplate, candidate);

        // Programar el recordatorio
        await this.scheduleReminder({
          organizationId,
          ruleId: rule.id,
          type: rule.type,
          clientId: candidate.clientId,
          pianoId: candidate.pianoId,
          serviceId: candidate.serviceId,
          appointmentId: candidate.appointmentId,
          invoiceId: candidate.invoiceId,
          contractId: candidate.contractId,
          scheduledFor,
          channels: rule.channels,
          title,
          body,
          data: {
            ctaText: rule.messageTemplate.ctaText,
            ctaUrl: this.interpolateUrl(rule.messageTemplate.ctaUrl, candidate)
          }
        });

        scheduledCount.total++;
        scheduledCount.byType[rule.type] = (scheduledCount.byType[rule.type] || 0) + 1;
      }
    }

    return scheduledCount;
  }

  /**
   * Encuentra candidatos para una regla específica
   */
  private async findCandidatesForRule(organizationId: string, rule: any): Promise<any[]> {
    const condition = rule.triggerCondition;
    const candidates: any[] = [];

    switch (condition.event) {
      case 'last_service':
        // Buscar pianos cuyo último servicio fue hace X días
        const serviceThreshold = new Date();
        serviceThreshold.setDate(serviceThreshold.getDate() - (condition.daysSince || 180));
        
        // Query para encontrar pianos con último servicio antes de la fecha umbral
        // y que coincidan con los filtros de la regla
        const pianos = await this.db.execute(sql`
          SELECT p.id as piano_id, p.client_id, c.first_name, c.last_name, c.email,
                 p.brand, p.model, MAX(s.date) as last_service_date
          FROM pianos p
          JOIN clients c ON p.client_id = c.id
          LEFT JOIN services s ON s.piano_id = p.id AND s.status = 'completed'
          WHERE p.organization_id = ${organizationId}
          GROUP BY p.id, p.client_id, c.first_name, c.last_name, c.email, p.brand, p.model
          HAVING MAX(s.date) < ${serviceThreshold} OR MAX(s.date) IS NULL
        `);
        
        for (const piano of pianos) {
          candidates.push({
            clientId: piano.client_id,
            pianoId: piano.piano_id,
            clientName: `${piano.first_name} ${piano.last_name}`,
            pianoModel: `${piano.brand} ${piano.model}`,
            lastServiceDate: piano.last_service_date
          });
        }
        break;

      case 'service_completed':
        // Buscar servicios completados hace X días
        const completedThreshold = new Date();
        completedThreshold.setDate(completedThreshold.getDate() - (condition.daysAfter || 7));
        
        const services = await this.db.execute(sql`
          SELECT s.id as service_id, s.piano_id, s.client_id, s.type, s.date,
                 c.first_name, c.last_name, c.email,
                 p.brand, p.model
          FROM services s
          JOIN clients c ON s.client_id = c.id
          JOIN pianos p ON s.piano_id = p.id
          WHERE s.organization_id = ${organizationId}
            AND s.status = 'completed'
            AND s.date::date = ${completedThreshold}::date
        `);
        
        for (const service of services) {
          candidates.push({
            clientId: service.client_id,
            pianoId: service.piano_id,
            serviceId: service.service_id,
            clientName: `${service.first_name} ${service.last_name}`,
            pianoModel: `${service.brand} ${service.model}`,
            serviceType: service.type,
            serviceDate: service.date
          });
        }
        break;

      case 'warranty_end':
        // Buscar garantías que expiran en X días
        const warrantyThreshold = new Date();
        warrantyThreshold.setDate(warrantyThreshold.getDate() + (condition.daysBefore || 30));
        
        // Implementar query para garantías
        break;

      case 'appointment_scheduled':
        // Buscar citas programadas para dentro de X días
        const appointmentThreshold = new Date();
        appointmentThreshold.setDate(appointmentThreshold.getDate() + (condition.daysBefore || 1));
        
        const appointments = await this.db.execute(sql`
          SELECT a.id as appointment_id, a.client_id, a.piano_id, a.date, a.time, a.service_type,
                 c.first_name, c.last_name, c.email, c.phone,
                 p.brand, p.model
          FROM appointments a
          JOIN clients c ON a.client_id = c.id
          LEFT JOIN pianos p ON a.piano_id = p.id
          WHERE a.organization_id = ${organizationId}
            AND a.status IN ('scheduled', 'confirmed')
            AND a.date::date = ${appointmentThreshold}::date
        `);
        
        for (const apt of appointments) {
          candidates.push({
            clientId: apt.client_id,
            pianoId: apt.piano_id,
            appointmentId: apt.appointment_id,
            clientName: `${apt.first_name} ${apt.last_name}`,
            pianoModel: apt.brand ? `${apt.brand} ${apt.model}` : null,
            appointmentDate: apt.date,
            appointmentTime: apt.time,
            serviceType: apt.service_type
          });
        }
        break;

      case 'invoice_due':
        // Buscar facturas vencidas hace X días
        const invoiceThreshold = new Date();
        invoiceThreshold.setDate(invoiceThreshold.getDate() - (condition.daysAfter || 7));
        
        const invoices = await this.db.execute(sql`
          SELECT i.id as invoice_id, i.client_id, i.invoice_number, i.total, i.due_date,
                 c.first_name, c.last_name, c.email
          FROM invoices i
          JOIN clients c ON i.client_id = c.id
          WHERE i.organization_id = ${organizationId}
            AND i.status = 'sent'
            AND i.due_date::date = ${invoiceThreshold}::date
        `);
        
        for (const invoice of invoices) {
          candidates.push({
            clientId: invoice.client_id,
            invoiceId: invoice.invoice_id,
            clientName: `${invoice.first_name} ${invoice.last_name}`,
            invoiceNumber: invoice.invoice_number,
            invoiceAmount: invoice.total,
            dueDate: invoice.due_date
          });
        }
        break;
    }

    return candidates;
  }

  /**
   * Verifica si ya existe un recordatorio programado
   */
  private async checkExistingReminder(ruleId: string, candidate: any): Promise<boolean> {
    const existing = await this.db
      .select()
      .from('scheduledReminders')
      .where(
        and(
          eq('ruleId', ruleId),
          candidate.clientId ? eq('clientId', candidate.clientId) : sql`true`,
          candidate.pianoId ? eq('pianoId', candidate.pianoId) : sql`true`,
          candidate.serviceId ? eq('serviceId', candidate.serviceId) : sql`true`,
          candidate.appointmentId ? eq('appointmentId', candidate.appointmentId) : sql`true`,
          candidate.invoiceId ? eq('invoiceId', candidate.invoiceId) : sql`true`
        )
      )
      .limit(1);
    
    return existing.length > 0;
  }

  /**
   * Calcula la fecha de envío del recordatorio
   */
  private calculateScheduledDate(rule: any, candidate: any): Date {
    const [hours, minutes] = rule.timeOfDay.split(':').map(Number);
    const scheduledFor = new Date();
    scheduledFor.setHours(hours, minutes, 0, 0);
    scheduledFor.setDate(scheduledFor.getDate() + rule.daysOffset);
    return scheduledFor;
  }

  /**
   * Interpola variables en el mensaje
   */
  private interpolateMessage(template: MessageTemplate, data: any): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    for (const variable of template.variables) {
      const value = data[variable] || '';
      const regex = new RegExp(`{{${variable}}}`, 'g');
      title = title.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { title, body };
  }

  /**
   * Interpola variables en la URL
   */
  private interpolateUrl(url: string | undefined, data: any): string | undefined {
    if (!url) return undefined;
    
    let result = url;
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }
    return result;
  }
}

export default ReminderService;
