/**
 * Esquema de Base de Datos para CRM
 * Piano Emotion Manager
 * 
 * Gestión avanzada de clientes, segmentación y comunicaciones
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  tinyint,
  timestamp,
  date,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums y Constantes
// ============================================================================

export const CLIENT_STATUSES = ['lead', 'prospect', 'active', 'inactive', 'churned'] as const;
export const CLIENT_SOURCES = ['website', 'referral', 'social_media', 'email', 'phone', 'event', 'other'] as const;
export const COMMUNICATION_TYPES = ['email', 'phone', 'sms', 'meeting', 'note'] as const;
export const CAMPAIGN_TYPES = ['email', 'sms', 'notification'] as const;
export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'running', 'completed', 'cancelled'] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];
export type ClientSource = typeof CLIENT_SOURCES[number];
export type CommunicationType = typeof COMMUNICATION_TYPES[number];
export type CampaignType = typeof CAMPAIGN_TYPES[number];
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

// ============================================================================
// Tablas
// ============================================================================

/**
 * Perfiles de Clientes
 */
export const clientProfiles = mysqlTable('client_profiles', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  userId: int('user_id'), // Vinculado a users si el cliente tiene cuenta
  
  // Información básica
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  
  // Estado y clasificación
  status: varchar('status', { length: 20 }).notNull().default('lead'),
  source: varchar('source', { length: 50 }),
  score: int('score').default(0), // Lead scoring
  
  // Métricas
  lifetimeValue: decimal('lifetime_value', { precision: 10, scale: 2 }).default('0.00'),
  totalOrders: int('total_orders').default(0),
  lastOrderDate: timestamp('last_order_date'),
  
  // Preferencias
  marketingConsent: tinyint('marketing_consent').default(0),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('es'),
  
  // Metadata
  notes: text('notes'),
  customFields: json('custom_fields'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('client_profiles_organization_idx').on(table.organizationId),
  emailIdx: index('client_profiles_email_idx').on(table.email),
  statusIdx: index('client_profiles_status_idx').on(table.status),
}));

/**
 * Etiquetas de Clientes
 */
export const clientTags = mysqlTable('client_tags', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('client_tags_organization_idx').on(table.organizationId),
}));

/**
 * Asignación de Etiquetas a Clientes
 */
export const clientTagAssignments = mysqlTable('client_tag_assignments', {
  id: int('id').primaryKey().autoincrement(),
  clientId: int('client_id').notNull(),
  tagId: int('tag_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  clientIdx: index('client_tag_assignments_client_idx').on(table.clientId),
  tagIdx: index('client_tag_assignments_tag_idx').on(table.tagId),
  uniqueAssignment: uniqueIndex('client_tag_unique').on(table.clientId, table.tagId),
}));

/**
 * Comunicaciones con Clientes
 */
export const communications = mysqlTable('communications', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  clientId: int('client_id').notNull(),
  userId: int('user_id').notNull(), // Usuario que registró la comunicación
  
  type: varchar('type', { length: 20 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  direction: varchar('direction', { length: 10 }).notNull(), // 'inbound' o 'outbound'
  
  // Metadata
  metadata: json('metadata'), // Datos adicionales según el tipo
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  clientIdx: index('communications_client_idx').on(table.clientId),
  organizationIdx: index('communications_organization_idx').on(table.organizationId),
  typeIdx: index('communications_type_idx').on(table.type),
}));

/**
 * Tareas de CRM
 */
export const crmTasks = mysqlTable('crm_tasks', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  clientId: int('client_id'),
  assignedTo: int('assigned_to').notNull(), // user_id
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'call', 'email', 'meeting', 'follow_up'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high'
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  clientIdx: index('crm_tasks_client_idx').on(table.clientId),
  assignedIdx: index('crm_tasks_assigned_idx').on(table.assignedTo),
  statusIdx: index('crm_tasks_status_idx').on(table.status),
  dueDateIdx: index('crm_tasks_due_date_idx').on(table.dueDate),
}));

/**
 * Segmentos de Clientes
 */
export const clientSegments = mysqlTable('client_segments', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Criterios de segmentación (JSON)
  criteria: json('criteria').notNull(),
  
  // Metadata
  clientCount: int('client_count').default(0),
  lastCalculated: timestamp('last_calculated'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('client_segments_organization_idx').on(table.organizationId),
}));

/**
 * Campañas de Marketing
 */
export const campaigns = mysqlTable('campaigns', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  createdBy: int('created_by').notNull(), // user_id
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  
  // Contenido
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  templateId: int('template_id'),
  
  // Programación
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Métricas
  totalRecipients: int('total_recipients').default(0),
  sentCount: int('sent_count').default(0),
  openedCount: int('opened_count').default(0),
  clickedCount: int('clicked_count').default(0),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('campaigns_organization_idx').on(table.organizationId),
  statusIdx: index('campaigns_status_idx').on(table.status),
}));

/**
 * Destinatarios de Campañas
 */
export const campaignRecipients = mysqlTable('campaign_recipients', {
  id: int('id').primaryKey().autoincrement(),
  campaignId: int('campaign_id').notNull(),
  clientId: int('client_id').notNull(),
  
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'sent', 'failed', 'bounced'
  
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index('campaign_recipients_campaign_idx').on(table.campaignId),
  clientIdx: index('campaign_recipients_client_idx').on(table.clientId),
  statusIdx: index('campaign_recipients_status_idx').on(table.status),
}));

/**
 * Plantillas de Comunicación
 */
export const communicationTemplates = mysqlTable('communication_templates', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'email', 'sms'
  
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  
  // Variables disponibles (JSON array)
  variables: json('variables'),
  
  isActive: tinyint('is_active').default(1),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index('communication_templates_organization_idx').on(table.organizationId),
  typeIdx: index('communication_templates_type_idx').on(table.type),
}));

// ============================================================================
// Relations
// ============================================================================

export const clientProfilesRelations = relations(clientProfiles, ({ many }) => ({
  tagAssignments: many(clientTagAssignments),
  communications: many(communications),
  tasks: many(crmTasks),
}));

export const clientTagsRelations = relations(clientTags, ({ many }) => ({
  assignments: many(clientTagAssignments),
}));

export const clientTagAssignmentsRelations = relations(clientTagAssignments, ({ one }) => ({
  client: one(clientProfiles, {
    fields: [clientTagAssignments.clientId],
    references: [clientProfiles.id],
  }),
  tag: one(clientTags, {
    fields: [clientTagAssignments.tagId],
    references: [clientTags.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  client: one(clientProfiles, {
    fields: [communications.clientId],
    references: [clientProfiles.id],
  }),
}));

export const crmTasksRelations = relations(crmTasks, ({ one }) => ({
  client: one(clientProfiles, {
    fields: [crmTasks.clientId],
    references: [clientProfiles.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  template: one(communicationTemplates, {
    fields: [campaigns.templateId],
    references: [communicationTemplates.id],
  }),
  recipients: many(campaignRecipients),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignRecipients.campaignId],
    references: [campaigns.id],
  }),
  client: one(clientProfiles, {
    fields: [campaignRecipients.clientId],
    references: [clientProfiles.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type NewClientProfile = typeof clientProfiles.$inferInsert;
export type ClientTag = typeof clientTags.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type CrmTask = typeof crmTasks.$inferSelect;
export type ClientSegment = typeof clientSegments.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
