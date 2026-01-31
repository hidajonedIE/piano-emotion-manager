/**
 * Alert Dismissals Schema
 * Gestión de alertas desactivadas temporalmente por usuarios
 */
import { mysqlTable, int, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/mysql-core';
export const alertDismissals = mysqlTable('alert_dismissals', {
    id: int('id').primaryKey().autoincrement(),
    // Identificación de la alerta
    alertType: varchar('alert_type', { length: 50 }).notNull(),
    alertKey: varchar('alert_key', { length: 255 }).notNull(),
    // Usuario que desactivó
    userId: varchar('user_id', { length: 255 }).notNull(),
    partnerId: int('partner_id').notNull(),
    // Control de desactivación
    dismissedAt: timestamp('dismissed_at').notNull().defaultNow(),
    reactivateAt: timestamp('reactivate_at'),
    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
    // Índices para búsqueda rápida
    userPartnerIdx: index('idx_user_partner').on(table.userId, table.partnerId),
    alertLookupIdx: index('idx_alert_lookup').on(table.alertType, table.alertKey, table.partnerId),
    reactivateIdx: index('idx_reactivate').on(table.reactivateAt),
    // Constraint: una alerta solo puede estar desactivada una vez por usuario
    uniqueDismissal: uniqueIndex('unique_dismissal').on(table.alertType, table.alertKey, table.userId, table.partnerId),
}));
