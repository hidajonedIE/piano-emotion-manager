/**
 * Esquema de Base de Datos para Dashboard Personalizable
 *
 * Define las tablas para gestionar widgets y configuraciones del dashboard
 */
import { pgTable, text, timestamp, jsonb, uuid, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';
// Enum para tipos de widget
export const widgetTypeEnum = pgEnum('widget_type', [
    'stats_card', // Tarjeta de estadísticas (KPI)
    'chart_line', // Gráfico de líneas
    'chart_bar', // Gráfico de barras
    'chart_pie', // Gráfico circular
    'chart_area', // Gráfico de área
    'calendar', // Mini calendario
    'tasks', // Lista de tareas pendientes
    'recent_clients', // Clientes recientes
    'recent_services', // Servicios recientes
    'recent_invoices', // Facturas recientes
    'upcoming_appointments', // Próximas citas
    'revenue_summary', // Resumen de ingresos
    'map', // Mapa de clientes
    'weather', // Clima (para planificación)
    'notes', // Notas rápidas
    'shortcuts', // Accesos directos
    'team_activity', // Actividad del equipo
    'inventory_alerts', // Alertas de inventario
    'payment_status', // Estado de pagos
    'custom' // Widget personalizado
]);
// Enum para tamaños de widget
export const widgetSizeEnum = pgEnum('widget_size', [
    'small', // 1x1
    'medium', // 2x1
    'large', // 2x2
    'wide', // 3x1
    'tall', // 1x2
    'full' // 3x2
]);
// Tabla de layouts de dashboard
export const dashboardLayouts = pgTable('dashboard_layouts', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id').notNull(),
    userId: text('user_id').notNull(),
    // Información del layout
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').default(false),
    isShared: boolean('is_shared').default(false), // Compartido con el equipo
    // Configuración del grid
    columns: integer('columns').default(3),
    rowHeight: integer('row_height').default(150),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Tabla de widgets
export const dashboardWidgets = pgTable('dashboard_widgets', {
    id: uuid('id').defaultRandom().primaryKey(),
    layoutId: uuid('layout_id').notNull().references(() => dashboardLayouts.id, { onDelete: 'cascade' }),
    // Tipo y configuración
    type: widgetTypeEnum('type').notNull(),
    title: text('title').notNull(),
    size: widgetSizeEnum('size').notNull().default('medium'),
    // Posición en el grid
    positionX: integer('position_x').notNull().default(0),
    positionY: integer('position_y').notNull().default(0),
    width: integer('width').notNull().default(1),
    height: integer('height').notNull().default(1),
    // Configuración específica del widget
    config: jsonb('config').default({}),
    // Ejemplos de config:
    // stats_card: { metric: 'total_revenue', period: 'month', comparison: true }
    // chart_line: { dataSource: 'revenue', period: 'year', groupBy: 'month' }
    // shortcuts: { links: [{ label: 'Clientes', route: '/clients' }] }
    // Estado
    isVisible: boolean('is_visible').default(true),
    refreshInterval: integer('refresh_interval'), // En segundos, null = no auto-refresh
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Tabla de plantillas de dashboard predefinidas
export const dashboardTemplates = pgTable('dashboard_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    // Información de la plantilla
    name: text('name').notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'), // URL de imagen de preview
    category: text('category'), // 'basic', 'advanced', 'financial', 'team'
    // Configuración
    columns: integer('columns').default(3),
    widgets: jsonb('widgets').notNull(), // Array de widgets predefinidos
    // Estado
    isActive: boolean('is_active').default(true),
    isPremium: boolean('is_premium').default(false),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Tabla de preferencias de usuario para el dashboard
export const dashboardPreferences = pgTable('dashboard_preferences', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull().unique(),
    // Layout activo
    activeLayoutId: uuid('active_layout_id').references(() => dashboardLayouts.id),
    // Preferencias generales
    theme: text('theme').default('auto'), // 'light', 'dark', 'auto'
    compactMode: boolean('compact_mode').default(false),
    showWelcome: boolean('show_welcome').default(true),
    defaultPeriod: text('default_period').default('month'), // 'week', 'month', 'quarter', 'year'
    // Notificaciones en dashboard
    showNotifications: boolean('show_notifications').default(true),
    showTips: boolean('show_tips').default(true),
    // Timestamps
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
