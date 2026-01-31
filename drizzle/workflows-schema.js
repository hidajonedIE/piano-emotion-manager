import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
// Enum para tipos de trigger
export const workflowTriggerTypeEnum = pgEnum('workflow_trigger_type', [
    'service_created',
    'service_completed',
    'service_cancelled',
    'client_created',
    'piano_registered',
    'appointment_scheduled',
    'appointment_confirmed',
    'appointment_cancelled',
    'invoice_created',
    'invoice_sent',
    'invoice_paid',
    'invoice_overdue',
    'quote_created',
    'quote_accepted',
    'quote_rejected',
    'warranty_expiring',
    'contract_expiring',
    'manual'
]);
// Enum para tipos de acción
export const workflowActionTypeEnum = pgEnum('workflow_action_type', [
    'send_email',
    'send_sms',
    'send_whatsapp',
    'send_push',
    'create_task',
    'create_reminder',
    'update_field',
    'create_invoice',
    'create_quote',
    'assign_technician',
    'add_tag',
    'remove_tag',
    'webhook',
    'delay',
    'condition'
]);
// Enum para estado del workflow
export const workflowStatusEnum = pgEnum('workflow_status', [
    'active',
    'paused',
    'draft',
    'archived'
]);
// Enum para estado de ejecución
export const workflowExecutionStatusEnum = pgEnum('workflow_execution_status', [
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'waiting'
]);
// Tabla de definición de workflows
export const workflows = pgTable('workflows', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull(),
    // Información básica
    name: text('name').notNull(),
    description: text('description'),
    status: workflowStatusEnum('status').default('draft'),
    // Trigger (evento que inicia el workflow)
    triggerType: workflowTriggerTypeEnum('trigger_type').notNull(),
    triggerConditions: jsonb('trigger_conditions'), // Condiciones adicionales
    // Ejemplo: { "serviceType": "tuning", "clientType": "professional" }
    // Acciones del workflow (array ordenado)
    actions: jsonb('actions').notNull(),
    // Ejemplo: [
    //   { "type": "delay", "config": { "hours": 24 } },
    //   { "type": "send_email", "config": { "templateId": "...", "to": "{{client.email}}" } },
    //   { "type": "condition", "config": { "if": "{{invoice.status}} == 'unpaid'", "then": [...], "else": [...] } }
    // ]
    // Configuración
    enabled: boolean('enabled').default(false),
    runOnce: boolean('run_once').default(false), // Solo ejecutar una vez por entidad
    maxExecutions: integer('max_executions'), // Límite de ejecuciones
    // Estadísticas
    executionCount: integer('execution_count').default(0),
    lastExecutedAt: timestamp('last_executed_at'),
    // Metadatos
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: text('created_by')
});
// Tabla de ejecuciones de workflow
export const workflowExecutions = pgTable('workflow_executions', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    workflowId: text('workflow_id').references(() => workflows.id).notNull(),
    organizationId: text('organization_id').notNull(),
    // Entidad que disparó el workflow
    triggerEntityType: text('trigger_entity_type').notNull(), // 'service', 'client', 'invoice', etc.
    triggerEntityId: text('trigger_entity_id').notNull(),
    // Estado de ejecución
    status: workflowExecutionStatusEnum('status').default('pending'),
    currentStep: integer('current_step').default(0),
    // Contexto de ejecución (variables disponibles)
    context: jsonb('context').notNull(),
    // { "client": {...}, "service": {...}, "piano": {...} }
    // Resultados de cada paso
    stepResults: jsonb('step_results').default([]),
    // [{ "step": 0, "action": "send_email", "success": true, "result": {...} }, ...]
    // Programación (para delays)
    scheduledFor: timestamp('scheduled_for'),
    // Errores
    errorMessage: text('error_message'),
    errorStep: integer('error_step'),
    // Timestamps
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow()
});
// Tabla de plantillas de email para workflows
export const workflowEmailTemplates = pgTable('workflow_email_templates', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull(),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    bodyHtml: text('body_html').notNull(),
    bodyText: text('body_text'),
    // Variables disponibles
    availableVariables: jsonb('available_variables').default([]),
    // ["client.name", "client.email", "service.type", "invoice.total"]
    // Metadatos
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Tabla de logs de acciones de workflow
export const workflowActionLogs = pgTable('workflow_action_logs', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    executionId: text('execution_id').references(() => workflowExecutions.id).notNull(),
    // Información de la acción
    stepIndex: integer('step_index').notNull(),
    actionType: workflowActionTypeEnum('action_type').notNull(),
    actionConfig: jsonb('action_config'),
    // Resultado
    success: boolean('success').notNull(),
    result: jsonb('result'),
    errorMessage: text('error_message'),
    // Timestamps
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: timestamp('completed_at')
});
