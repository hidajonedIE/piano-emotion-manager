import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
// Enum para tipos de recordatorio
export const reminderTypeEnum = pgEnum('reminder_type', [
    'maintenance', // Recordatorio de mantenimiento periódico
    'follow_up', // Seguimiento post-servicio
    'warranty_expiry', // Vencimiento de garantía
    'appointment', // Recordatorio de cita
    'payment_due', // Pago pendiente
    'contract_renewal', // Renovación de contrato
    'custom' // Personalizado
]);
// Enum para canales de notificación
export const reminderChannelEnum = pgEnum('reminder_channel', [
    'push',
    'email',
    'sms',
    'whatsapp'
]);
// Enum para estado del recordatorio
export const reminderStatusEnum = pgEnum('reminder_status', [
    'pending',
    'sent',
    'acknowledged',
    'snoozed',
    'cancelled'
]);
// Enum para frecuencia de recordatorios recurrentes
export const reminderFrequencyEnum = pgEnum('reminder_frequency', [
    'once',
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'biannual',
    'annual',
    'custom'
]);
// Tabla de reglas de recordatorios automáticos
export const reminderRules = pgTable('reminder_rules', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull(),
    // Configuración de la regla
    name: text('name').notNull(),
    description: text('description'),
    type: reminderTypeEnum('type').notNull(),
    enabled: boolean('enabled').default(true),
    // Condiciones de disparo
    triggerCondition: jsonb('trigger_condition').notNull(),
    // Ejemplo: { "event": "service_completed", "daysAfter": 7 }
    // Ejemplo: { "event": "last_service", "daysSince": 180 }
    // Ejemplo: { "event": "warranty_end", "daysBefore": 30 }
    // Configuración de timing
    frequency: reminderFrequencyEnum('frequency').default('once'),
    customFrequencyDays: integer('custom_frequency_days'),
    daysOffset: integer('days_offset').default(0), // Días antes (-) o después (+) del evento
    timeOfDay: text('time_of_day').default('09:00'), // Hora de envío
    // Canales de notificación
    channels: jsonb('channels').default(['push', 'email']),
    // Plantilla del mensaje
    messageTemplate: jsonb('message_template').notNull(),
    // { "title": "...", "body": "...", "variables": ["clientName", "pianoModel", "lastServiceDate"] }
    // Filtros opcionales
    clientTypes: jsonb('client_types'), // Tipos de cliente a los que aplica
    serviceTypes: jsonb('service_types'), // Tipos de servicio relacionados
    pianoCategories: jsonb('piano_categories'), // Categorías de piano
    // Metadatos
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: text('created_by')
});
// Tabla de recordatorios programados (instancias)
export const scheduledReminders = pgTable('scheduled_reminders', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull(),
    ruleId: text('rule_id').references(() => reminderRules.id),
    // Entidades relacionadas
    clientId: text('client_id'),
    pianoId: text('piano_id'),
    serviceId: text('service_id'),
    appointmentId: text('appointment_id'),
    invoiceId: text('invoice_id'),
    contractId: text('contract_id'),
    // Configuración del recordatorio
    type: reminderTypeEnum('type').notNull(),
    status: reminderStatusEnum('status').default('pending'),
    // Programación
    scheduledFor: timestamp('scheduled_for').notNull(),
    sentAt: timestamp('sent_at'),
    acknowledgedAt: timestamp('acknowledged_at'),
    snoozedUntil: timestamp('snoozed_until'),
    // Canales y contenido
    channels: jsonb('channels').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data'), // Datos adicionales para la notificación
    // Resultado del envío
    sendResults: jsonb('send_results'),
    // { "push": { "success": true }, "email": { "success": true, "messageId": "..." } }
    // Metadatos
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Tabla de historial de recordatorios enviados
export const reminderHistory = pgTable('reminder_history', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    organizationId: text('organization_id').notNull(),
    reminderId: text('reminder_id').references(() => scheduledReminders.id),
    // Información del envío
    channel: reminderChannelEnum('channel').notNull(),
    recipientId: text('recipient_id'), // clientId o memberId
    recipientEmail: text('recipient_email'),
    recipientPhone: text('recipient_phone'),
    // Resultado
    success: boolean('success').notNull(),
    errorMessage: text('error_message'),
    externalId: text('external_id'), // ID del proveedor (email, SMS, etc.)
    // Interacción
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
    // Metadatos
    sentAt: timestamp('sent_at').defaultNow()
});
// Tabla de preferencias de recordatorios por cliente
export const clientReminderPreferences = pgTable('client_reminder_preferences', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    clientId: text('client_id').notNull(),
    organizationId: text('organization_id').notNull(),
    // Preferencias globales
    enableReminders: boolean('enable_reminders').default(true),
    preferredChannels: jsonb('preferred_channels').default(['email']),
    preferredLanguage: text('preferred_language').default('es'),
    // Preferencias por tipo
    maintenanceReminders: boolean('maintenance_reminders').default(true),
    appointmentReminders: boolean('appointment_reminders').default(true),
    paymentReminders: boolean('payment_reminders').default(true),
    promotionalMessages: boolean('promotional_messages').default(false),
    // Horarios preferidos
    preferredTimeStart: text('preferred_time_start').default('09:00'),
    preferredTimeEnd: text('preferred_time_end').default('20:00'),
    preferredDays: jsonb('preferred_days').default([1, 2, 3, 4, 5]), // Lunes a Viernes
    // Metadatos
    updatedAt: timestamp('updated_at').defaultNow()
});
