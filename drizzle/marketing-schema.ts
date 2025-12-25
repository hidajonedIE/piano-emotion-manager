import { mysqlTable, varchar, text, int, boolean, timestamp, json, mysqlEnum } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { organizations } from './schema';

/**
 * Tipos de plantillas de mensajes disponibles
 */
export const messageTemplateTypes = [
  'appointment_reminder',      // Recordatorio de cita
  'service_completed',         // Servicio completado
  'maintenance_reminder',      // Recordatorio de mantenimiento
  'invoice_sent',              // Factura enviada
  'welcome',                   // Bienvenida a nuevo cliente
  'birthday',                  // Felicitación de cumpleaños
  'promotion',                 // Promoción/Oferta
  'follow_up',                 // Seguimiento post-servicio
  'reactivation',              // Reactivación de cliente inactivo
  'custom',                    // Mensaje personalizado
] as const;

export type MessageTemplateType = typeof messageTemplateTypes[number];

/**
 * Canales de comunicación disponibles
 */
export const messageChannels = ['whatsapp', 'email', 'both'] as const;
export type MessageChannel = typeof messageChannels[number];

/**
 * Plantillas de mensajes configurables por el usuario
 */
export const messageTemplates = mysqlTable('message_templates', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Tipo de plantilla
  type: varchar('type', { length: 50 }).notNull(),
  
  // Canal: whatsapp, email, o both (ambos)
  channel: varchar('channel', { length: 20 }).default('whatsapp'),
  
  // Nombre descriptivo de la plantilla
  name: varchar('name', { length: 100 }).notNull(),
  
  // Asunto del email (solo para canal email)
  emailSubject: varchar('email_subject', { length: 200 }),
  
  // Contenido del mensaje con variables {{variable}}
  content: text('content').notNull(),
  
  // Contenido HTML para email (opcional, si no se usa content como texto plano)
  htmlContent: text('html_content'),
  
  // Variables disponibles para esta plantilla (JSON array)
  availableVariables: json('available_variables').$type<string[]>(),
  
  // Si es la plantilla por defecto para este tipo y canal
  isDefault: boolean('is_default').default(false),
  
  // Si está activa
  isActive: boolean('is_active').default(true),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdBy: int('created_by'),
});

/**
 * Estados de una campaña de marketing
 */
export const campaignStatuses = [
  'draft',        // Borrador
  'scheduled',    // Programada
  'in_progress',  // En progreso (enviando)
  'paused',       // Pausada
  'completed',    // Completada
  'cancelled',    // Cancelada
] as const;

export type CampaignStatus = typeof campaignStatuses[number];

/**
 * Campañas de marketing
 */
export const marketingCampaigns = mysqlTable('marketing_campaigns', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Información básica
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Plantilla a usar
  templateId: int('template_id').notNull(),
  
  // Estado de la campaña
  status: varchar('status', { length: 20 }).default('draft'),
  
  // Filtros para seleccionar destinatarios (JSON)
  recipientFilters: json('recipient_filters').$type<{
    lastServiceBefore?: string;      // Último servicio antes de esta fecha
    lastServiceAfter?: string;       // Último servicio después de esta fecha
    pianoTypes?: string[];           // Tipos de piano
    serviceTypes?: string[];         // Tipos de servicio realizados
    tags?: string[];                 // Etiquetas de cliente
    hasUpcomingAppointment?: boolean; // Tiene cita próxima
    isActive?: boolean;              // Cliente activo
  }>(),
  
  // Estadísticas
  totalRecipients: int('total_recipients').default(0),
  sentCount: int('sent_count').default(0),
  
  // Fechas
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdBy: int('created_by'),
});

/**
 * Destinatarios de una campaña (cola de envío)
 */
export const campaignRecipients = mysqlTable('campaign_recipients', {
  id: int('id').primaryKey().autoincrement(),
  campaignId: int('campaign_id').notNull(),
  clientId: int('client_id').notNull(),
  
  // Mensaje personalizado generado para este cliente
  generatedMessage: text('generated_message'),
  
  // Estado del envío
  status: varchar('status', { length: 20 }).default('pending'), // pending, sent, skipped, failed
  
  // Información del envío
  sentAt: timestamp('sent_at'),
  sentBy: int('sent_by'),
  
  // Notas (por qué se saltó, error, etc.)
  notes: text('notes'),
  
  // Orden en la cola
  queueOrder: int('queue_order'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Historial de mensajes enviados (para auditoría y seguimiento)
 */
export const messageHistory = mysqlTable('message_history', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Relaciones opcionales
  campaignId: int('campaign_id'),
  templateId: int('template_id'),
  clientId: int('client_id').notNull(),
  
  // Tipo de mensaje
  messageType: varchar('message_type', { length: 50 }).notNull(),
  
  // Contenido enviado
  content: text('content').notNull(),
  
  // Canal de envío
  channel: varchar('channel', { length: 20 }).default('whatsapp'), // whatsapp, email, sms
  
  // Número de teléfono al que se envió
  recipientPhone: varchar('recipient_phone', { length: 20 }),
  
  // Estado
  status: varchar('status', { length: 20 }).default('sent'), // sent, delivered, read, failed
  
  // Metadatos
  sentAt: timestamp('sent_at').defaultNow(),
  sentBy: int('sent_by'),
});

// Relaciones
export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [messageTemplates.organizationId],
    references: [organizations.id],
  }),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [marketingCampaigns.organizationId],
    references: [organizations.id],
  }),
  template: one(messageTemplates, {
    fields: [marketingCampaigns.templateId],
    references: [messageTemplates.id],
  }),
  recipients: many(campaignRecipients),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignRecipients.campaignId],
    references: [marketingCampaigns.id],
  }),
}));
