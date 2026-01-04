/**
 * Servicio de WhatsApp Business API
 * 
 * Permite enviar mensajes automatizados a clientes vía WhatsApp Business API.
 * Soporta mensajes de plantilla, mensajes interactivos y notificaciones.
 */

import { eq, and, desc } from 'drizzle-orm';
import type { DatabaseConnection, TemplateComponent, TemplateParameter, InteractiveMessage, WebhookBody } from './whatsapp.types.js';

// Tipos de mensaje
export type WhatsAppMessageType = 
  | 'template'      // Mensajes de plantilla (aprobados por Meta)
  | 'text'          // Mensajes de texto simple
  | 'interactive'   // Mensajes con botones
  | 'document'      // Envío de documentos (facturas, presupuestos)
  | 'image';        // Envío de imágenes

// Plantillas predefinidas
export const MESSAGE_TEMPLATES = {
  // Confirmación de cita
  appointment_confirmation: {
    name: 'appointment_confirmation',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{serviceName}}' },
          { type: 'text', text: '{{date}}' },
          { type: 'text', text: '{{time}}' },
          { type: 'text', text: '{{address}}' }
        ]
      }
    ]
  },
  
  // Recordatorio de cita
  appointment_reminder: {
    name: 'appointment_reminder',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{serviceName}}' },
          { type: 'text', text: '{{date}}' },
          { type: 'text', text: '{{time}}' }
        ]
      }
    ]
  },
  
  // Presupuesto enviado
  quote_sent: {
    name: 'quote_sent',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{quoteNumber}}' },
          { type: 'text', text: '{{totalAmount}}' },
          { type: 'text', text: '{{validUntil}}' }
        ]
      }
    ]
  },
  
  // Factura enviada
  invoice_sent: {
    name: 'invoice_sent',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{invoiceNumber}}' },
          { type: 'text', text: '{{totalAmount}}' },
          { type: 'text', text: '{{dueDate}}' }
        ]
      }
    ]
  },
  
  // Recordatorio de pago
  payment_reminder: {
    name: 'payment_reminder',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{invoiceNumber}}' },
          { type: 'text', text: '{{totalAmount}}' },
          { type: 'text', text: '{{daysOverdue}}' }
        ]
      }
    ]
  },
  
  // Servicio completado
  service_completed: {
    name: 'service_completed',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{serviceName}}' },
          { type: 'text', text: '{{pianoName}}' }
        ]
      }
    ]
  },
  
  // Recordatorio de mantenimiento
  maintenance_reminder: {
    name: 'maintenance_reminder',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{pianoName}}' },
          { type: 'text', text: '{{lastServiceDate}}' },
          { type: 'text', text: '{{recommendedService}}' }
        ]
      }
    ]
  },
  
  // Solicitud de valoración
  review_request: {
    name: 'review_request',
    language: 'es',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '{{clientName}}' },
          { type: 'text', text: '{{serviceName}}' }
        ]
      }
    ]
  }
};

// Interfaz de configuración
interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

// Interfaz de mensaje
interface WhatsAppMessage {
  to: string;
  type: WhatsAppMessageType;
  template?: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
  text?: { body: string };
  interactive?: InteractiveMessage;
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
}

// Interfaz de log de mensaje
interface MessageLog {
  id: string;
  organizationId: string;
  clientId: string;
  phoneNumber: string;
  templateName?: string;
  messageType: WhatsAppMessageType;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappMessageId?: string;
  errorMessage?: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export class WhatsAppService {
  private db: DatabaseConnection;
  private config: WhatsAppConfig | null = null;
  private baseUrl = 'https://graph.facebook.com';

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Configura las credenciales de WhatsApp Business API
   */
  async configure(organizationId: string, config: WhatsAppConfig): Promise<void> {
    // Guardar configuración en la base de datos
    await this.db.execute(`
      INSERT INTO whatsapp_config (organization_id, phone_number_id, access_token, business_account_id, webhook_verify_token, api_version, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (organization_id) 
      DO UPDATE SET 
        phone_number_id = $2,
        access_token = $3,
        business_account_id = $4,
        webhook_verify_token = $5,
        api_version = $6,
        updated_at = NOW()
    `, [organizationId, config.phoneNumberId, config.accessToken, config.businessAccountId, config.webhookVerifyToken, config.apiVersion]);
  }

  /**
   * Obtiene la configuración de WhatsApp para una organización
   */
  async getConfig(organizationId: string): Promise<WhatsAppConfig | null> {
    const result = await this.db.execute(`
      SELECT phone_number_id, access_token, business_account_id, webhook_verify_token, api_version
      FROM whatsapp_config
      WHERE organization_id = $1
    `, [organizationId]);

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      return {
        phoneNumberId: row.phone_number_id,
        accessToken: row.access_token,
        businessAccountId: row.business_account_id,
        webhookVerifyToken: row.webhook_verify_token,
        apiVersion: row.api_version || 'v18.0'
      };
    }
    return null;
  }

  /**
   * Verifica si WhatsApp está configurado para una organización
   */
  async isConfigured(organizationId: string): Promise<boolean> {
    const config = await this.getConfig(organizationId);
    return config !== null && !!config.accessToken && !!config.phoneNumberId;
  }

  /**
   * Envía un mensaje de plantilla
   */
  async sendTemplateMessage(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    templateName: keyof typeof MESSAGE_TEMPLATES,
    parameters: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      return { success: false, error: 'WhatsApp no está configurado' };
    }

    const template = MESSAGE_TEMPLATES[templateName];
    if (!template) {
      return { success: false, error: 'Plantilla no encontrada' };
    }

    // Reemplazar parámetros en la plantilla
    const components = template.components.map(comp => ({
      ...comp,
      parameters: comp.parameters.map((param: TemplateParameter) => ({
        ...param,
        text: param.text.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => parameters[key] || match)
      }))
    }));

    const message: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        components
      }
    };

    return await this.sendMessage(organizationId, clientId, message, config);
  }

  /**
   * Envía un mensaje de texto simple
   */
  async sendTextMessage(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      return { success: false, error: 'WhatsApp no está configurado' };
    }

    const message: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'text',
      text: { body: text }
    };

    return await this.sendMessage(organizationId, clientId, message, config);
  }

  /**
   * Envía un documento (factura, presupuesto, etc.)
   */
  async sendDocument(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      return { success: false, error: 'WhatsApp no está configurado' };
    }

    const message: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption
      }
    };

    return await this.sendMessage(organizationId, clientId, message, config);
  }

  /**
   * Envía un mensaje interactivo con botones
   */
  async sendInteractiveMessage(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    body: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      return { success: false, error: 'WhatsApp no está configurado' };
    }

    const message: WhatsAppMessage = {
      to: this.formatPhoneNumber(phoneNumber),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title.substring(0, 20) }
          }))
        }
      }
    };

    return await this.sendMessage(organizationId, clientId, message, config);
  }

  /**
   * Método interno para enviar mensajes
   */
  private async sendMessage(
    organizationId: string,
    clientId: string,
    message: WhatsAppMessage,
    config: WhatsAppConfig
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const url = `${this.baseUrl}/${config.apiVersion}/${config.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...message
        })
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages[0]) {
        const messageId = data.messages[0].id;
        
        // Registrar mensaje enviado
        await this.logMessage({
          organizationId,
          clientId,
          phoneNumber: message.to,
          templateName: message.template?.name,
          messageType: message.type,
          status: 'sent',
          whatsappMessageId: messageId,
          sentAt: new Date()
        });

        return { success: true, messageId };
      } else {
        const errorMessage = data.error?.message || 'Error desconocido';
        
        // Registrar error
        await this.logMessage({
          organizationId,
          clientId,
          phoneNumber: message.to,
          templateName: message.template?.name,
          messageType: message.type,
          status: 'failed',
          errorMessage,
          sentAt: new Date()
        });

        return { success: false, error: errorMessage };
      }
    } catch (error: unknown) {
      const errorMessage = error.message || 'Error de conexión';
      
      await this.logMessage({
        organizationId,
        clientId,
        phoneNumber: message.to,
        templateName: message.template?.name,
        messageType: message.type,
        status: 'failed',
        errorMessage,
        sentAt: new Date()
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Registra un mensaje en el historial
   */
  private async logMessage(log: Omit<MessageLog, 'id'>): Promise<void> {
    await this.db.execute(`
      INSERT INTO whatsapp_message_logs 
      (organization_id, client_id, phone_number, template_name, message_type, status, whatsapp_message_id, error_message, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      log.organizationId,
      log.clientId,
      log.phoneNumber,
      log.templateName,
      log.messageType,
      log.status,
      log.whatsappMessageId,
      log.errorMessage,
      log.sentAt
    ]);
  }

  /**
   * Actualiza el estado de un mensaje (webhook)
   */
  async updateMessageStatus(
    whatsappMessageId: string,
    status: 'delivered' | 'read' | 'failed',
    timestamp: Date
  ): Promise<void> {
    const field = status === 'delivered' ? 'delivered_at' : status === 'read' ? 'read_at' : null;
    
    if (field) {
      await this.db.execute(`
        UPDATE whatsapp_message_logs 
        SET status = $1, ${field} = $2
        WHERE whatsapp_message_id = $3
      `, [status, timestamp, whatsappMessageId]);
    } else {
      await this.db.execute(`
        UPDATE whatsapp_message_logs 
        SET status = $1
        WHERE whatsapp_message_id = $2
      `, [status, whatsappMessageId]);
    }
  }

  /**
   * Obtiene el historial de mensajes de un cliente
   */
  async getClientMessageHistory(organizationId: string, clientId: string): Promise<MessageLog[]> {
    const result = await this.db.execute(`
      SELECT * FROM whatsapp_message_logs
      WHERE organization_id = $1 AND client_id = $2
      ORDER BY sent_at DESC
      LIMIT 100
    `, [organizationId, clientId]);

    return result.rows || [];
  }

  /**
   * Obtiene estadísticas de mensajes
   */
  async getMessageStats(organizationId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    byTemplate: Record<string, number>;
  }> {
    const result = await this.db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM whatsapp_message_logs
      WHERE organization_id = $1 AND sent_at BETWEEN $2 AND $3
    `, [organizationId, startDate, endDate]);

    const templateResult = await this.db.execute(`
      SELECT template_name, COUNT(*) as count
      FROM whatsapp_message_logs
      WHERE organization_id = $1 AND sent_at BETWEEN $2 AND $3 AND template_name IS NOT NULL
      GROUP BY template_name
    `, [organizationId, startDate, endDate]);

    const stats = result.rows?.[0] || {};
    const byTemplate: Record<string, number> = {};
    
    for (const row of templateResult.rows || []) {
      byTemplate[row.template_name] = parseInt(row.count);
    }

    return {
      total: parseInt(stats.total) || 0,
      sent: parseInt(stats.sent) || 0,
      delivered: parseInt(stats.delivered) || 0,
      read: parseInt(stats.read) || 0,
      failed: parseInt(stats.failed) || 0,
      byTemplate
    };
  }

  /**
   * Formatea un número de teléfono para WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Eliminar espacios, guiones y paréntesis
    let formatted = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con +, eliminar el +
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    // Si empieza con 00, eliminar los 00
    if (formatted.startsWith('00')) {
      formatted = formatted.substring(2);
    }
    
    // Si es un número español sin código de país, añadir 34
    if (formatted.length === 9 && (formatted.startsWith('6') || formatted.startsWith('7') || formatted.startsWith('9'))) {
      formatted = '34' + formatted;
    }
    
    return formatted;
  }

  /**
   * Verifica el webhook de WhatsApp
   */
  verifyWebhook(mode: string, token: string, challenge: string, expectedToken: string): string | null {
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Procesa los eventos del webhook de WhatsApp
   */
  async processWebhook(body: WebhookBody): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        
        // Procesar actualizaciones de estado
        for (const status of value.statuses || []) {
          await this.updateMessageStatus(
            status.id,
            status.status,
            new Date(parseInt(status.timestamp) * 1000)
          );
        }

        // Procesar mensajes entrantes (respuestas de clientes)
        for (const message of value.messages || []) {
          // Aquí se podría implementar lógica para manejar respuestas
          // Por ejemplo, guardar el mensaje o notificar al técnico
        }
      }
    }
  }

  // ============================================
  // MÉTODOS DE CONVENIENCIA PARA CASOS COMUNES
  // ============================================

  /**
   * Envía confirmación de cita
   */
  async sendAppointmentConfirmation(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      address: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'appointment_confirmation',
      data
    );
  }

  /**
   * Envía recordatorio de cita
   */
  async sendAppointmentReminder(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'appointment_reminder',
      data
    );
  }

  /**
   * Envía presupuesto
   */
  async sendQuote(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      quoteNumber: string;
      totalAmount: string;
      validUntil: string;
    },
    pdfUrl?: string
  ) {
    // Enviar plantilla
    const result = await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'quote_sent',
      data
    );

    // Si hay PDF, enviarlo también
    if (result.success && pdfUrl) {
      await this.sendDocument(
        organizationId,
        clientId,
        phoneNumber,
        pdfUrl,
        `Presupuesto_${data.quoteNumber}.pdf`,
        `Presupuesto ${data.quoteNumber}`
      );
    }

    return result;
  }

  /**
   * Envía factura
   */
  async sendInvoice(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      invoiceNumber: string;
      totalAmount: string;
      dueDate: string;
    },
    pdfUrl?: string
  ) {
    const result = await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'invoice_sent',
      data
    );

    if (result.success && pdfUrl) {
      await this.sendDocument(
        organizationId,
        clientId,
        phoneNumber,
        pdfUrl,
        `Factura_${data.invoiceNumber}.pdf`,
        `Factura ${data.invoiceNumber}`
      );
    }

    return result;
  }

  /**
   * Envía recordatorio de pago
   */
  async sendPaymentReminder(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      invoiceNumber: string;
      totalAmount: string;
      daysOverdue: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'payment_reminder',
      data
    );
  }

  /**
   * Envía notificación de servicio completado
   */
  async sendServiceCompleted(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      serviceName: string;
      pianoName: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'service_completed',
      data
    );
  }

  /**
   * Envía recordatorio de mantenimiento
   */
  async sendMaintenanceReminder(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      pianoName: string;
      lastServiceDate: string;
      recommendedService: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'maintenance_reminder',
      data
    );
  }

  /**
   * Envía solicitud de valoración
   */
  async sendReviewRequest(
    organizationId: string,
    clientId: string,
    phoneNumber: string,
    data: {
      clientName: string;
      serviceName: string;
    }
  ) {
    return await this.sendTemplateMessage(
      organizationId,
      clientId,
      phoneNumber,
      'review_request',
      data
    );
  }
}

export default WhatsAppService;
