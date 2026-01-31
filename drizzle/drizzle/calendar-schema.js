/**
 * Esquema de Base de Datos para Calendario Avanzado
 * Piano Emotion Manager
 *
 * Sincronización con calendarios externos y recordatorios
 */
import { pgTable, serial, varchar, text, integer, boolean, timestamp, date, time, pgEnum, json, index, uniqueIndex, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ============================================================================
// Enums
// ============================================================================
export const calendarProviderEnum = pgEnum('calendar_provider', [
    'google',
    'outlook',
    'apple',
    'caldav',
]);
export const eventTypeEnum = pgEnum('event_type', [
    'service', // Servicio de piano
    'appointment', // Cita general
    'reminder', // Recordatorio
    'block', // Bloqueo de tiempo
    'personal', // Evento personal
    'meeting', // Reunión
]);
export const eventStatusEnum = pgEnum('event_status', [
    'tentative', // Tentativo
    'confirmed', // Confirmado
    'cancelled', // Cancelado
    'completed', // Completado
]);
export const reminderTypeEnum = pgEnum('reminder_type', [
    'email',
    'sms',
    'push',
    'whatsapp',
]);
export const recurrenceFrequencyEnum = pgEnum('recurrence_frequency', [
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'yearly',
]);
// ============================================================================
// Tables
// ============================================================================
/**
 * Conexiones a calendarios externos
 */
export const calendarConnections = pgTable('calendar_connections', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    organizationId: integer('organization_id'),
    provider: calendarProviderEnum('provider').notNull(),
    accountEmail: varchar('account_email', { length: 255 }).notNull(),
    accountName: varchar('account_name', { length: 255 }),
    // OAuth tokens
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at'),
    // CalDAV specific
    caldavUrl: text('caldav_url'),
    caldavUsername: varchar('caldav_username', { length: 255 }),
    caldavPassword: text('caldav_password'), // Encrypted
    // Sync settings
    syncEnabled: boolean('sync_enabled').default(true),
    syncDirection: varchar('sync_direction', { length: 20 }).default('bidirectional'), // 'import', 'export', 'bidirectional'
    lastSyncAt: timestamp('last_sync_at'),
    syncErrors: json('sync_errors').$type(),
    // Calendar selection
    selectedCalendarIds: json('selected_calendar_ids').$type(),
    defaultCalendarId: varchar('default_calendar_id', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userProviderIdx: uniqueIndex('calendar_conn_user_provider_idx').on(table.userId, table.provider),
}));
/**
 * Calendarios disponibles (de conexiones externas)
 */
export const externalCalendars = pgTable('external_calendars', {
    id: serial('id').primaryKey(),
    connectionId: integer('connection_id').notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }),
    isSelected: boolean('is_selected').default(false),
    isReadOnly: boolean('is_read_only').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    connExternalIdx: uniqueIndex('ext_cal_conn_external_idx').on(table.connectionId, table.externalId),
}));
/**
 * Eventos del calendario
 */
export const calendarEvents = pgTable('calendar_events', {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id').notNull(),
    userId: integer('user_id').notNull(),
    // Tipo y estado
    type: eventTypeEnum('type').notNull(),
    status: eventStatusEnum('status').default('confirmed').notNull(),
    // Información básica
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    location: text('location'),
    // Fechas y horas
    startDate: date('start_date').notNull(),
    startTime: time('start_time'),
    endDate: date('end_date').notNull(),
    endTime: time('end_time'),
    isAllDay: boolean('is_all_day').default(false),
    timezone: varchar('timezone', { length: 50 }).default('Europe/Madrid'),
    // Relaciones con otras entidades
    clientId: integer('client_id'),
    pianoId: integer('piano_id'),
    serviceId: integer('service_id'),
    assignedTo: integer('assigned_to'), // Técnico asignado
    // Recurrencia
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRule: json('recurrence_rule').$type(),
    recurrenceParentId: integer('recurrence_parent_id'),
    // Sincronización externa
    externalId: varchar('external_id', { length: 255 }),
    externalCalendarId: integer('external_calendar_id'),
    externalEtag: varchar('external_etag', { length: 255 }),
    lastSyncedAt: timestamp('last_synced_at'),
    // Colores y visualización
    color: varchar('color', { length: 7 }),
    // Metadatos
    metadata: json('metadata').$type(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    orgDateIdx: index('cal_events_org_date_idx').on(table.organizationId, table.startDate),
    userDateIdx: index('cal_events_user_date_idx').on(table.userId, table.startDate),
    assignedDateIdx: index('cal_events_assigned_date_idx').on(table.assignedTo, table.startDate),
    externalIdx: index('cal_events_external_idx').on(table.externalId),
}));
/**
 * Recordatorios de eventos
 */
export const eventReminders = pgTable('event_reminders', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull(),
    type: reminderTypeEnum('type').notNull(),
    minutesBefore: integer('minutes_before').notNull(), // Minutos antes del evento
    // Estado
    scheduledAt: timestamp('scheduled_at').notNull(),
    sentAt: timestamp('sent_at'),
    isSent: boolean('is_sent').default(false),
    // Para SMS/WhatsApp
    phoneNumber: varchar('phone_number', { length: 20 }),
    // Para email
    email: varchar('email', { length: 255 }),
    // Resultado
    deliveryStatus: varchar('delivery_status', { length: 50 }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    eventIdx: index('reminders_event_idx').on(table.eventId),
    scheduledIdx: index('reminders_scheduled_idx').on(table.scheduledAt, table.isSent),
}));
/**
 * Plantillas de recordatorio
 */
export const reminderTemplates = pgTable('reminder_templates', {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: reminderTypeEnum('type').notNull(),
    // Contenido
    subject: varchar('subject', { length: 255 }), // Para email
    content: text('content').notNull(),
    // Variables disponibles: {{client_name}}, {{service_date}}, {{service_time}}, {{technician_name}}, etc.
    isDefault: boolean('is_default').default(false),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Configuración de recordatorios por usuario
 */
export const reminderSettings = pgTable('reminder_settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().unique(),
    organizationId: integer('organization_id'),
    // Recordatorios por defecto para nuevos eventos
    defaultReminders: json('default_reminders').$type().default([
        { type: 'push', minutesBefore: 60 },
        { type: 'email', minutesBefore: 1440 }, // 24 horas
    ]),
    // Recordatorios para clientes
    clientReminderEnabled: boolean('client_reminder_enabled').default(true),
    clientReminderTypes: json('client_reminder_types').$type().default(['email', 'sms']),
    clientReminderTiming: json('client_reminder_timing').$type().default([1440, 60]), // 24h y 1h antes
    // Preferencias de notificación
    emailNotifications: boolean('email_notifications').default(true),
    smsNotifications: boolean('sms_notifications').default(false),
    pushNotifications: boolean('push_notifications').default(true),
    whatsappNotifications: boolean('whatsapp_notifications').default(false),
    // Horarios de no molestar
    quietHoursEnabled: boolean('quiet_hours_enabled').default(false),
    quietHoursStart: time('quiet_hours_start').default('22:00'),
    quietHoursEnd: time('quiet_hours_end').default('08:00'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
/**
 * Disponibilidad de técnicos
 */
export const technicianAvailability = pgTable('technician_availability', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    organizationId: integer('organization_id'),
    // Día de la semana (0=Domingo, 1=Lunes, etc.)
    dayOfWeek: integer('day_of_week').notNull(),
    // Horarios
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    // Excepciones
    isAvailable: boolean('is_available').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userDayIdx: uniqueIndex('availability_user_day_idx').on(table.userId, table.dayOfWeek),
}));
/**
 * Bloqueos de tiempo (vacaciones, ausencias, etc.)
 */
export const timeBlocks = pgTable('time_blocks', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    organizationId: integer('organization_id'),
    title: varchar('title', { length: 255 }).notNull(),
    reason: text('reason'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    startTime: time('start_time'), // null = todo el día
    endTime: time('end_time'),
    isAllDay: boolean('is_all_day').default(true),
    isRecurring: boolean('is_recurring').default(false),
    recurrenceRule: json('recurrence_rule').$type(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userDateIdx: index('time_blocks_user_date_idx').on(table.userId, table.startDate),
}));
// ============================================================================
// Relations
// ============================================================================
export const calendarConnectionsRelations = relations(calendarConnections, ({ many }) => ({
    calendars: many(externalCalendars),
}));
export const externalCalendarsRelations = relations(externalCalendars, ({ one }) => ({
    connection: one(calendarConnections, {
        fields: [externalCalendars.connectionId],
        references: [calendarConnections.id],
    }),
}));
export const calendarEventsRelations = relations(calendarEvents, ({ many, one }) => ({
    reminders: many(eventReminders),
    externalCalendar: one(externalCalendars, {
        fields: [calendarEvents.externalCalendarId],
        references: [externalCalendars.id],
    }),
}));
export const eventRemindersRelations = relations(eventReminders, ({ one }) => ({
    event: one(calendarEvents, {
        fields: [eventReminders.eventId],
        references: [calendarEvents.id],
    }),
}));
