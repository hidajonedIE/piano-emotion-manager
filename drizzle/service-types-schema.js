import { mysqlTable, int, varchar, text, timestamp, tinyint, index } from "drizzle-orm/mysql-core";
/**
 * Tabla para tipos de servicio personalizados por usuario
 * Permite a cada técnico definir sus propios tipos de servicio
 */
export const serviceTypes = mysqlTable("service_types", {
    id: int().autoincrement().notNull().primaryKey(),
    userId: int().notNull(), // Usuario propietario
    partnerId: int().default(1).notNull(),
    organizationId: int(),
    // Datos del tipo de servicio
    code: varchar({ length: 50 }).notNull(), // Código único (ej: 'custom_voicing')
    label: varchar({ length: 100 }).notNull(), // Etiqueta visible (ej: 'Entonación')
    description: text(), // Descripción opcional
    icon: varchar({ length: 50 }), // Icono opcional
    color: varchar({ length: 7 }), // Color en hex (ej: '#3B82F6')
    // Tareas predefinidas para este tipo de servicio (JSON array)
    defaultTasks: text(), // JSON: ['Tarea 1', 'Tarea 2', ...]
    // Estado
    isActive: tinyint().default(1).notNull(), // 1 = activo, 0 = inactivo
    isDefault: tinyint().default(0).notNull(), // 1 = tipo por defecto del sistema
    sortOrder: int().default(0).notNull(), // Orden de visualización
    // Timestamps
    createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
    updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
    index("idx_user_active").on(table.userId, table.isActive),
    index("idx_user_code").on(table.userId, table.code),
    index("idx_partner").on(table.partnerId),
]);
