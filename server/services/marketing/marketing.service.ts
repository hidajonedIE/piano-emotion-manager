import { db } from '../../db.js';

interface RecipientFilters {
  tags?: string[];
  status?: string[];
  lastServiceBefore?: Date;
  lastServiceAfter?: Date;
}
import { eq, and, desc, sql, lt, gt, inArray, isNull } from 'drizzle-orm';
import { 
  messageTemplates, 
  marketingCampaigns, 
  campaignRecipients, 
  messageHistory,
  MessageTemplateType,
  CampaignStatus 
} from '../../../drizzle/schema.js.js';
import { clients, pianos, services } from '../../../drizzle/schema.js.js';

/**
 * Variables disponibles para cada tipo de plantilla
 */
export const templateVariables: Record<MessageTemplateType, string[]> = {
  appointment_reminder: [
    '{{cliente_nombre}}',
    '{{cliente_nombre_completo}}',
    '{{fecha_cita}}',
    '{{hora_cita}}',
    '{{direccion}}',
    '{{tipo_servicio}}',
    '{{nombre_negocio}}',
    '{{telefono_negocio}}',
  ],
  service_completed: [
    '{{cliente_nombre}}',
    '{{fecha_servicio}}',
    '{{tipo_servicio}}',
    '{{importe}}',
    '{{notas}}',
    '{{nombre_negocio}}',
  ],
  maintenance_reminder: [
    '{{cliente_nombre}}',
    '{{piano_marca}}',
    '{{piano_modelo}}',
    '{{ultimo_servicio}}',
    '{{meses_desde_servicio}}',
    '{{nombre_negocio}}',
  ],
  invoice_sent: [
    '{{cliente_nombre}}',
    '{{numero_factura}}',
    '{{importe}}',
    '{{fecha_factura}}',
    '{{nombre_negocio}}',
  ],
  welcome: [
    '{{cliente_nombre}}',
    '{{nombre_negocio}}',
    '{{telefono_negocio}}',
    '{{email_negocio}}',
  ],
  birthday: [
    '{{cliente_nombre}}',
    '{{nombre_negocio}}',
  ],
  promotion: [
    '{{cliente_nombre}}',
    '{{nombre_promocion}}',
    '{{descuento}}',
    '{{fecha_validez}}',
    '{{nombre_negocio}}',
  ],
  follow_up: [
    '{{cliente_nombre}}',
    '{{tipo_servicio}}',
    '{{fecha_servicio}}',
    '{{dias_desde_servicio}}',
    '{{nombre_negocio}}',
  ],
  reactivation: [
    '{{cliente_nombre}}',
    '{{ultimo_servicio}}',
    '{{meses_inactivo}}',
    '{{nombre_negocio}}',
  ],
  custom: [
    '{{cliente_nombre}}',
    '{{cliente_nombre_completo}}',
    '{{nombre_negocio}}',
  ],
};

/**
 * Plantillas por defecto para cada tipo
 */
export const defaultTemplates: Record<MessageTemplateType, { name: string; content: string }> = {
  appointment_reminder: {
    name: 'Recordatorio de Cita',
    content: `Hola {{cliente_nombre}},

Le recordamos su cita programada:

📅 *Fecha:* {{fecha_cita}}
⏰ *Hora:* {{hora_cita}}
📍 *Dirección:* {{direccion}}
🔧 *Servicio:* {{tipo_servicio}}

Si necesita modificar o cancelar la cita, por favor contáctenos con antelación.

Un saludo,
{{nombre_negocio}}`,
  },
  service_completed: {
    name: 'Servicio Completado',
    content: `Hola {{cliente_nombre}},

Le confirmamos que el servicio ha sido completado satisfactoriamente:

📅 *Fecha:* {{fecha_servicio}}
🔧 *Tipo:* {{tipo_servicio}}
💰 *Importe:* {{importe}}

{{notas}}

Gracias por confiar en nosotros.

Un saludo,
{{nombre_negocio}}`,
  },
  maintenance_reminder: {
    name: 'Recordatorio de Mantenimiento',
    content: `Hola {{cliente_nombre}},

Le recordamos que su piano *{{piano_marca}} {{piano_modelo}}* podría necesitar mantenimiento.

📅 *Último servicio:* {{ultimo_servicio}}
⏰ *Hace:* {{meses_desde_servicio}} meses

Para mantener su piano en óptimas condiciones, recomendamos una afinación cada 6-12 meses.

¿Le gustaría programar una cita? Responda a este mensaje y le ayudaremos.

Un saludo,
{{nombre_negocio}}`,
  },
  invoice_sent: {
    name: 'Factura Enviada',
    content: `Hola {{cliente_nombre}},

Le enviamos la factura correspondiente:

📄 *Factura:* {{numero_factura}}
💰 *Importe:* {{importe}}
📅 *Fecha:* {{fecha_factura}}

Puede descargar la factura desde su correo electrónico.

Gracias por su confianza.

Un saludo,
{{nombre_negocio}}`,
  },
  welcome: {
    name: 'Bienvenida',
    content: `Hola {{cliente_nombre}},

¡Bienvenido/a a {{nombre_negocio}}!

Estamos encantados de tenerle como cliente. A partir de ahora, cuidaremos de su piano con la máxima profesionalidad.

Si tiene alguna pregunta, no dude en contactarnos:
📞 {{telefono_negocio}}
📧 {{email_negocio}}

Un saludo,
{{nombre_negocio}}`,
  },
  birthday: {
    name: 'Felicitación de Cumpleaños',
    content: `¡Feliz cumpleaños, {{cliente_nombre}}! 🎂

Desde {{nombre_negocio}} le deseamos un día muy especial.

¡Que cumpla muchos más!`,
  },
  promotion: {
    name: 'Promoción',
    content: `Hola {{cliente_nombre}},

¡Tenemos una oferta especial para usted!

🎉 *{{nombre_promocion}}*
💰 *Descuento:* {{descuento}}
📅 *Válido hasta:* {{fecha_validez}}

No deje pasar esta oportunidad. Contáctenos para más información.

Un saludo,
{{nombre_negocio}}`,
  },
  follow_up: {
    name: 'Seguimiento Post-Servicio',
    content: `Hola {{cliente_nombre}},

Han pasado {{dias_desde_servicio}} días desde que realizamos el servicio de {{tipo_servicio}} en su piano.

¿Cómo va todo? ¿Está satisfecho/a con el resultado?

Si tiene alguna pregunta o necesita algo más, estamos a su disposición.

Un saludo,
{{nombre_negocio}}`,
  },
  reactivation: {
    name: 'Reactivación de Cliente',
    content: `Hola {{cliente_nombre}},

¡Le echamos de menos! Han pasado {{meses_inactivo}} meses desde su último servicio.

Su piano podría necesitar una revisión. ¿Le gustaría que programemos una visita?

Contáctenos y le atenderemos con mucho gusto.

Un saludo,
{{nombre_negocio}}`,
  },
  custom: {
    name: 'Mensaje Personalizado',
    content: `Hola {{cliente_nombre}},

[Escriba aquí su mensaje personalizado]

Un saludo,
{{nombre_negocio}}`,
  },
};

/**
 * Servicio de Marketing
 */
export class MarketingService {
  
  // ==================== PLANTILLAS ====================
  
  /**
   * Obtener todas las plantillas de una organización
   */
  async getTemplates(organizationId: number) {
    return getDb().select()
      .from(messageTemplates)
      .where(eq(messageTemplates.organizationId, organizationId))
      .orderBy(messageTemplates.type, messageTemplates.name);
  }
  
  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(id: number, organizationId: number) {
    const [template] = await getDb().select()
      .from(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.organizationId, organizationId)
      ));
    return template;
  }
  
  /**
   * Obtener plantilla por defecto de un tipo
   */
  async getDefaultTemplate(organizationId: number, type: MessageTemplateType) {
    const [template] = await getDb().select()
      .from(messageTemplates)
      .where(and(
        eq(messageTemplates.organizationId, organizationId),
        eq(messageTemplates.type, type),
        eq(messageTemplates.isDefault, true)
      ));
    return template;
  }
  
  /**
   * Crear plantilla
   */
  async createTemplate(data: {
    organizationId: number;
    type: MessageTemplateType;
    name: string;
    content: string;
    isDefault?: boolean;
    createdBy?: number;
  }) {
    // Si es default, quitar el default de otras plantillas del mismo tipo
    if (data.isDefault) {
      await getDb().update(messageTemplates)
        .set({ isDefault: false })
        .where(and(
          eq(messageTemplates.organizationId, data.organizationId),
          eq(messageTemplates.type, data.type)
        ));
    }
    
    const [result] = await getDb().insert(messageTemplates).values({
      ...data,
      availableVariables: templateVariables[data.type],
    });
    
    return result.insertId;
  }
  
  /**
   * Actualizar plantilla
   */
  async updateTemplate(id: number, organizationId: number, data: {
    name?: string;
    content?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    // Si se establece como default, quitar el default de otras
    if (data.isDefault) {
      const [template] = await getDb().select()
        .from(messageTemplates)
        .where(eq(messageTemplates.id, id));
      
      if (template) {
        await getDb().update(messageTemplates)
          .set({ isDefault: false })
          .where(and(
            eq(messageTemplates.organizationId, organizationId),
            eq(messageTemplates.type, template.type)
          ));
      }
    }
    
    await getDb().update(messageTemplates)
      .set(data)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.organizationId, organizationId)
      ));
  }
  
  /**
   * Eliminar plantilla
   */
  async deleteTemplate(id: number, organizationId: number) {
    await getDb().delete(messageTemplates)
      .where(and(
        eq(messageTemplates.id, id),
        eq(messageTemplates.organizationId, organizationId)
      ));
  }
  
  /**
   * Inicializar plantillas por defecto para una organización
   */
  async initializeDefaultTemplates(organizationId: number, createdBy?: number) {
    const existingTemplates = await this.getTemplates(organizationId);
    
    if (existingTemplates.length === 0) {
      for (const [type, template] of Object.entries(defaultTemplates)) {
        await this.createTemplate({
          organizationId,
          type: type as MessageTemplateType,
          name: template.name,
          content: template.content,
          isDefault: true,
          createdBy,
        });
      }
    }
  }
  
  // ==================== CAMPAÑAS ====================
  
  /**
   * Obtener todas las campañas de una organización
   */
  async getCampaigns(organizationId: number) {
    return getDb().select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.organizationId, organizationId))
      .orderBy(desc(marketingCampaigns.createdAt));
  }
  
  /**
   * Obtener campaña por ID
   */
  async getCampaignById(id: number, organizationId: number) {
    const [campaign] = await getDb().select()
      .from(marketingCampaigns)
      .where(and(
        eq(marketingCampaigns.id, id),
        eq(marketingCampaigns.organizationId, organizationId)
      ));
    return campaign;
  }
  
  /**
   * Crear campaña
   */
  async createCampaign(data: {
    organizationId: number;
    name: string;
    description?: string;
    templateId: number;
    recipientFilters?: RecipientFilters;
    createdBy?: number;
  }) {
    const [result] = await getDb().insert(marketingCampaigns).values({
      ...data,
      status: 'draft',
    });
    
    return result.insertId;
  }
  
  /**
   * Actualizar campaña
   */
  async updateCampaign(id: number, organizationId: number, data: {
    name?: string;
    description?: string;
    templateId?: number;
    recipientFilters?: RecipientFilters;
    status?: CampaignStatus;
  }) {
    await getDb().update(marketingCampaigns)
      .set(data)
      .where(and(
        eq(marketingCampaigns.id, id),
        eq(marketingCampaigns.organizationId, organizationId)
      ));
  }
  
  /**
   * Obtener clientes que coinciden con los filtros de una campaña
   */
  async getFilteredClients(organizationId: number, filters: {
    lastServiceBefore?: string;
    lastServiceAfter?: string;
    pianoTypes?: string[];
    serviceTypes?: string[];
    tags?: string[];
    hasUpcomingAppointment?: boolean;
    isActive?: boolean;
  }) {
    // Consulta base de clientes
    let query = getDb().select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      phone: clients.phone,
      email: clients.email,
    })
    .from(clients)
    .where(and(
      eq(clients.organizationId, organizationId),
      clients.phone ? sql`${clients.phone} IS NOT NULL AND ${clients.phone} != ''` : sql`1=1`
    ));
    
    // TODO: Añadir más filtros según los parámetros
    // Por ahora retornamos todos los clientes con teléfono
    
    return query;
  }
  
  /**
   * Generar destinatarios para una campaña
   */
  async generateCampaignRecipients(campaignId: number, organizationId: number) {
    const campaign = await this.getCampaignById(campaignId, organizationId);
    if (!campaign) throw new Error('Campaña no encontrada');
    
    const template = await this.getTemplateById(campaign.templateId, organizationId);
    if (!template) throw new Error('Plantilla no encontrada');
    
    // Obtener clientes filtrados
    const filteredClients = await this.getFilteredClients(
      organizationId, 
      campaign.recipientFilters || {}
    );
    
    // Limpiar destinatarios anteriores
    await getDb().delete(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId));
    
    // Crear nuevos destinatarios
    let order = 0;
    for (const client of filteredClients) {
      if (!client.phone) continue;
      
      // Generar mensaje personalizado
      const message = this.replaceVariables(template.content, {
        cliente_nombre: client.firstName || '',
        cliente_nombre_completo: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        // TODO: Añadir más variables según el contexto
      });
      
      await getDb().insert(campaignRecipients).values({
        campaignId,
        clientId: client.id,
        generatedMessage: message,
        status: 'pending',
        queueOrder: order++,
      });
    }
    
    // Actualizar contador de destinatarios
    await getDb().update(marketingCampaigns)
      .set({ totalRecipients: order })
      .where(eq(marketingCampaigns.id, campaignId));
    
    return order;
  }
  
  /**
   * Obtener destinatarios de una campaña
   */
  async getCampaignRecipients(campaignId: number, status?: string) {
    let conditions = [eq(campaignRecipients.campaignId, campaignId)];
    
    if (status) {
      conditions.push(eq(campaignRecipients.status, status));
    }
    
    return getDb().select({
      recipient: campaignRecipients,
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        phone: clients.phone,
      }
    })
    .from(campaignRecipients)
    .innerJoin(clients, eq(campaignRecipients.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(campaignRecipients.queueOrder);
  }
  
  /**
   * Obtener siguiente destinatario pendiente
   */
  async getNextPendingRecipient(campaignId: number) {
    const [recipient] = await getDb().select({
      recipient: campaignRecipients,
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        phone: clients.phone,
      }
    })
    .from(campaignRecipients)
    .innerJoin(clients, eq(campaignRecipients.clientId, clients.id))
    .where(and(
      eq(campaignRecipients.campaignId, campaignId),
      eq(campaignRecipients.status, 'pending')
    ))
    .orderBy(campaignRecipients.queueOrder)
    .limit(1);
    
    return recipient;
  }
  
  /**
   * Marcar destinatario como enviado
   */
  async markRecipientAsSent(recipientId: number, sentBy: number) {
    await getDb().update(campaignRecipients)
      .set({
        status: 'sent',
        sentAt: new Date(),
        sentBy,
      })
      .where(eq(campaignRecipients.id, recipientId));
    
    // Actualizar contador de la campaña
    const [recipient] = await getDb().select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.id, recipientId));
    
    if (recipient) {
      await getDb().update(marketingCampaigns)
        .set({ sentCount: sql`sent_count + 1` })
        .where(eq(marketingCampaigns.id, recipient.campaignId));
    }
  }
  
  /**
   * Marcar destinatario como saltado
   */
  async markRecipientAsSkipped(recipientId: number, reason: string) {
    await getDb().update(campaignRecipients)
      .set({
        status: 'skipped',
        notes: reason,
      })
      .where(eq(campaignRecipients.id, recipientId));
  }
  
  /**
   * Reemplazar variables en un mensaje
   */
  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    // Limpiar variables no reemplazadas
    result = result.replace(/\{\{[^}]+\}\}/g, '');
    
    return result;
  }
  
  // ==================== HISTORIAL ====================
  
  /**
   * Registrar mensaje enviado
   */
  async logMessage(data: {
    organizationId: number;
    campaignId?: number;
    templateId?: number;
    clientId: number;
    messageType: string;
    content: string;
    recipientPhone: string;
    sentBy: number;
  }) {
    await getDb().insert(messageHistory).values({
      ...data,
      channel: 'whatsapp',
      status: 'sent',
    });
  }
  
  /**
   * Obtener historial de mensajes de un cliente
   */
  async getClientMessageHistory(clientId: number, organizationId: number) {
    return getDb().select()
      .from(messageHistory)
      .where(and(
        eq(messageHistory.clientId, clientId),
        eq(messageHistory.organizationId, organizationId)
      ))
      .orderBy(desc(messageHistory.sentAt));
  }
}

export const marketingService = new MarketingService();
