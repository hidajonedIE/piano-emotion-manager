/**
 * Esquema de Base de Datos para CRM
 * Piano Emotion Manager
 * 
 * Gestión avanzada de clientes, segmentación y comunicaciones
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  pgEnum,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

export const clientStatusEnum = pgEnum('client_status', [
  'lead',           // Prospecto
  'active',         // Cliente activo
  'inactive',       // Cliente inactivo
  'vip',            // Cliente VIP
  'churned',        // Cliente perdido
]);

export const clientSourceEnum = pgEnum('client_source', [
  'referral',       // Referido
  'website',        // Sitio web
  'social_media',   // Redes sociales
  'advertising',    // Publicidad
  'cold_call',      // Llamada en frío
  'event',          // Evento
  'partner',        // Socio/Distribuidor
  'other',          // Otro
]);

export const communicationTypeEnum = pgEnum('communication_type', [
  'email',
  'phone',
  'sms',
  'whatsapp',
  'in_person',
  'video_call',
  'note',
]);

export const communicationDirectionEnum = pgEnum('communication_direction', [
  'inbound',        // Entrante
  'outbound',       // Saliente
]);

export const taskStatusEnum = pgEnum('crm_task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

export const taskPriorityEnum = pgEnum('crm_task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled',
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'email',
  'sms',
  'whatsapp',
  'mixed',
]);

// ============================================================================
// Tables
// ============================================================================

/**
 * Etiquetas para segmentación de clientes
 */
export const clientTags = pgTable('client_tags', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgNameIdx: uniqueIndex('client_tags_org_name_idx').on(table.organizationId, table.name),
}));

/**
 * Relación cliente-etiqueta
 */
export const clientTagAssignments = pgTable('client_tag_assignments', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull(),
  tagId: integer('tag_id').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: integer('assigned_by'),
}, (table) => ({
  clientTagIdx: uniqueIndex('client_tag_idx').on(table.clientId, table.tagId),
}));

/**
 * Información extendida de clientes (CRM)
 */
export const clientProfiles = pgTable('client_profiles', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().unique(),
  organizationId: integer('organization_id').notNull(),
  
  // Estado y origen
  status: clientStatusEnum('status').default('active').notNull(),
  source: clientSourceEnum('source'),
  sourceDetails: text('source_details'),
  
  // Puntuación y valor
  score: integer('score').default(0), // Lead scoring
  lifetimeValue: decimal('lifetime_value', { precision: 12, scale: 2 }).default('0'),
  averageTicket: decimal('average_ticket', { precision: 10, scale: 2 }).default('0'),
  totalServices: integer('total_services').default(0),
  
  // Preferencias
  preferredContactMethod: communicationTypeEnum('preferred_contact_method').default('email'),
  preferredContactTime: varchar('preferred_contact_time', { length: 50 }),
  language: varchar('language', { length: 5 }).default('es'),
  
  // Fechas importantes
  firstContactDate: date('first_contact_date'),
  firstServiceDate: date('first_service_date'),
  lastServiceDate: date('last_service_date'),
  lastContactDate: date('last_contact_date'),
  nextScheduledContact: date('next_scheduled_contact'),
  
  // Notas y observaciones
  internalNotes: text('internal_notes'),
  specialRequirements: text('special_requirements'),
  
  // Marketing
  marketingConsent: boolean('marketing_consent').default(false),
  marketingConsentDate: timestamp('marketing_consent_date'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  
  // Referidos
  referredBy: integer('referred_by'), // ID de otro cliente
  referralCount: integer('referral_count').default(0),
  
  // Metadatos
  customFields: json('custom_fields').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('client_profiles_org_idx').on(table.organizationId),
  statusIdx: index('client_profiles_status_idx').on(table.status),
  scoreIdx: index('client_profiles_score_idx').on(table.score),
}));

/**
 * Historial de comunicaciones
 */
export const communications = pgTable('communications', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  clientId: integer('client_id').notNull(),
  userId: integer('user_id'), // Quién realizó la comunicación
  
  type: communicationTypeEnum('type').notNull(),
  direction: communicationDirectionEnum('direction').notNull(),
  
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  summary: text('summary'), // Resumen de la conversación
  
  // Para emails
  emailFrom: varchar('email_from', { length: 255 }),
  emailTo: varchar('email_to', { length: 255 }),
  emailCc: text('email_cc'),
  
  // Para llamadas
  phoneNumber: varchar('phone_number', { length: 20 }),
  callDuration: integer('call_duration'), // En segundos
  callRecordingUrl: text('call_recording_url'),
  
  // Estado
  isRead: boolean('is_read').default(false),
  isImportant: boolean('is_important').default(false),
  
  // Seguimiento
  requiresFollowUp: boolean('requires_follow_up').default(false),
  followUpDate: date('follow_up_date'),
  followUpNotes: text('follow_up_notes'),
  
  // Metadatos
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgClientIdx: index('communications_org_client_idx').on(table.organizationId, table.clientId),
  typeIdx: index('communications_type_idx').on(table.type),
  dateIdx: index('communications_date_idx').on(table.createdAt),
}));

/**
 * Tareas de CRM
 */
export const crmTasks = pgTable('crm_tasks', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  clientId: integer('client_id'),
  assignedTo: integer('assigned_to'),
  createdBy: integer('created_by').notNull(),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Recordatorios
  reminderDate: timestamp('reminder_date'),
  reminderSent: boolean('reminder_sent').default(false),
  
  // Relación con otras entidades
  relatedType: varchar('related_type', { length: 50 }), // 'service', 'invoice', 'piano'
  relatedId: integer('related_id'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('crm_tasks_org_idx').on(table.organizationId),
  assignedIdx: index('crm_tasks_assigned_idx').on(table.assignedTo),
  statusIdx: index('crm_tasks_status_idx').on(table.status),
  dueDateIdx: index('crm_tasks_due_date_idx').on(table.dueDate),
}));

/**
 * Campañas de marketing
 */
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  createdBy: integer('created_by').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  
  // Contenido
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  templateId: integer('template_id'),
  
  // Segmentación
  targetTags: json('target_tags').$type<number[]>(),
  targetStatuses: json('target_statuses').$type<string[]>(),
  targetFilters: json('target_filters').$type<Record<string, any>>(),
  
  // Programación
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Métricas
  totalRecipients: integer('total_recipients').default(0),
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  openedCount: integer('opened_count').default(0),
  clickedCount: integer('clicked_count').default(0),
  bouncedCount: integer('bounced_count').default(0),
  unsubscribedCount: integer('unsubscribed_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('campaigns_org_idx').on(table.organizationId),
  statusIdx: index('campaigns_status_idx').on(table.status),
}));

/**
 * Destinatarios de campaña
 */
export const campaignRecipients = pgTable('campaign_recipients', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull(),
  clientId: integer('client_id').notNull(),
  
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Estado
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  bouncedAt: timestamp('bounced_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  
  // Errores
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  campaignClientIdx: uniqueIndex('campaign_client_idx').on(table.campaignId, table.clientId),
}));

/**
 * Plantillas de comunicación
 */
export const communicationTemplates = pgTable('communication_templates', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  type: communicationTypeEnum('type').notNull(),
  
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  
  // Variables disponibles
  variables: json('variables').$type<string[]>(),
  
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgTypeIdx: index('templates_org_type_idx').on(table.organizationId, table.type),
}));

/**
 * Segmentos de clientes guardados
 */
export const clientSegments = pgTable('client_segments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(),
  createdBy: integer('created_by').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Criterios de filtrado
  filters: json('filters').$type<{
    statuses?: string[];
    tags?: number[];
    minScore?: number;
    maxScore?: number;
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    lastServiceDays?: number;
    source?: string[];
    hasMarketingConsent?: boolean;
  }>().notNull(),
  
  // Conteo de clientes (actualizado periódicamente)
  clientCount: integer('client_count').default(0),
  lastCalculatedAt: timestamp('last_calculated_at'),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('segments_org_idx').on(table.organizationId),
}));

// ============================================================================
// Relations
// ============================================================================

export const clientTagsRelations = relations(clientTags, ({ many }) => ({
  assignments: many(clientTagAssignments),
}));

export const clientTagAssignmentsRelations = relations(clientTagAssignments, ({ one }) => ({
  tag: one(clientTags, {
    fields: [clientTagAssignments.tagId],
    references: [clientTags.id],
  }),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ many }) => ({
  communications: many(communications),
  tasks: many(crmTasks),
  tagAssignments: many(clientTagAssignments),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  profile: one(clientProfiles, {
    fields: [communications.clientId],
    references: [clientProfiles.clientId],
  }),
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  profile: one(clientProfiles, {
    fields: [crmTasks.clientId],
    references: [clientProfiles.clientId],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  recipients: many(campaignRecipients),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignRecipients.campaignId],
    references: [campaigns.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type ClientStatus = typeof clientStatusEnum.enumValues[number];
export type ClientSource = typeof clientSourceEnum.enumValues[number];
export type CommunicationType = typeof communicationTypeEnum.enumValues[number];
export type CommunicationDirection = typeof communicationDirectionEnum.enumValues[number];
export type CRMTaskStatus = typeof taskStatusEnum.enumValues[number];
export type CRMTaskPriority = typeof taskPriorityEnum.enumValues[number];
export type CampaignStatus = typeof campaignStatusEnum.enumValues[number];
export type CampaignType = typeof campaignTypeEnum.enumValues[number];

export type ClientTag = typeof clientTags.$inferSelect;
export type NewClientTag = typeof clientTags.$inferInsert;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type NewClientProfile = typeof clientProfiles.$inferInsert;
export type Communication = typeof communications.$inferSelect;
export type NewCommunication = typeof communications.$inferInsert;
export type CRMTask = typeof crmTasks.$inferSelect;
export type NewCRMTask = typeof crmTasks.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type ClientSegment = typeof clientSegments.$inferSelect;
