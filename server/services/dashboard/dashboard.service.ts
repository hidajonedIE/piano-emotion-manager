/**
 * Servicio de Dashboard Personalizable
 * 
 * Gestiona layouts, widgets y datos del dashboard
 */

import { eq, and, desc } from 'drizzle-orm';
import type {
  DatabaseConnection,
  WidgetConfig,
  StatsCardData,
  ChartData,
  RecentClient,
  RecentService,
  RecentInvoice,
  UpcomingAppointment,
  RevenueSummary,
  PaymentStatusData,
  InventoryAlert,
  TeamActivityMember,
  DashboardLayoutRow,
  SqlParameterValue,
} from './dashboard.types.js';

// Tipos de widget disponibles
export type WidgetType = 
  | 'stats_card'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'chart_area'
  | 'calendar'
  | 'tasks'
  | 'recent_clients'
  | 'recent_services'
  | 'recent_invoices'
  | 'upcoming_appointments'
  | 'revenue_summary'
  | 'map'
  | 'weather'
  | 'notes'
  | 'shortcuts'
  | 'team_activity'
  | 'inventory_alerts'
  | 'payment_status'
  | 'custom';

export type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';

// Interfaz de widget
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config: Record<string, any>;
  isVisible: boolean;
  refreshInterval?: number;
}

// Interfaz de layout
interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  columns: number;
  rowHeight: number;
  widgets: Widget[];
}

// Plantillas predefinidas
const DEFAULT_TEMPLATES = [
  {
    id: 'basic',
    name: 'Básico',
    description: 'Dashboard simple con las métricas esenciales',
    category: 'basic',
    columns: 3,
    widgets: [
      { type: 'stats_card', title: 'Ingresos del mes', size: 'small', positionX: 0, positionY: 0, width: 1, height: 1, config: { metric: 'monthly_revenue' } },
      { type: 'stats_card', title: 'Servicios realizados', size: 'small', positionX: 1, positionY: 0, width: 1, height: 1, config: { metric: 'services_count' } },
      { type: 'stats_card', title: 'Clientes activos', size: 'small', positionX: 2, positionY: 0, width: 1, height: 1, config: { metric: 'active_clients' } },
      { type: 'upcoming_appointments', title: 'Próximas citas', size: 'medium', positionX: 0, positionY: 1, width: 2, height: 1, config: { limit: 5 } },
      { type: 'shortcuts', title: 'Accesos rápidos', size: 'small', positionX: 2, positionY: 1, width: 1, height: 1, config: {} },
    ],
  },
  {
    id: 'financial',
    name: 'Financiero',
    description: 'Enfocado en métricas financieras y facturación',
    category: 'financial',
    columns: 3,
    widgets: [
      { type: 'revenue_summary', title: 'Resumen de ingresos', size: 'wide', positionX: 0, positionY: 0, width: 3, height: 1, config: { period: 'year' } },
      { type: 'chart_line', title: 'Evolución de ingresos', size: 'large', positionX: 0, positionY: 1, width: 2, height: 2, config: { dataSource: 'revenue', period: 'year' } },
      { type: 'payment_status', title: 'Estado de pagos', size: 'tall', positionX: 2, positionY: 1, width: 1, height: 2, config: {} },
      { type: 'recent_invoices', title: 'Últimas facturas', size: 'wide', positionX: 0, positionY: 3, width: 3, height: 1, config: { limit: 5 } },
    ],
  },
  {
    id: 'operations',
    name: 'Operaciones',
    description: 'Para gestión diaria de servicios y citas',
    category: 'advanced',
    columns: 3,
    widgets: [
      { type: 'calendar', title: 'Calendario', size: 'large', positionX: 0, positionY: 0, width: 2, height: 2, config: {} },
      { type: 'tasks', title: 'Tareas pendientes', size: 'tall', positionX: 2, positionY: 0, width: 1, height: 2, config: {} },
      { type: 'recent_services', title: 'Servicios recientes', size: 'medium', positionX: 0, positionY: 2, width: 2, height: 1, config: { limit: 5 } },
      { type: 'inventory_alerts', title: 'Alertas de inventario', size: 'small', positionX: 2, positionY: 2, width: 1, height: 1, config: {} },
    ],
  },
  {
    id: 'team',
    name: 'Equipo',
    description: 'Para gestores con equipo de técnicos',
    category: 'team',
    isPremium: true,
    columns: 3,
    widgets: [
      { type: 'team_activity', title: 'Actividad del equipo', size: 'wide', positionX: 0, positionY: 0, width: 3, height: 1, config: {} },
      { type: 'chart_bar', title: 'Servicios por técnico', size: 'medium', positionX: 0, positionY: 1, width: 2, height: 1, config: { dataSource: 'services_by_technician' } },
      { type: 'map', title: 'Mapa de clientes', size: 'small', positionX: 2, positionY: 1, width: 1, height: 1, config: {} },
      { type: 'stats_card', title: 'Técnicos activos', size: 'small', positionX: 0, positionY: 2, width: 1, height: 1, config: { metric: 'active_technicians' } },
      { type: 'stats_card', title: 'Servicios hoy', size: 'small', positionX: 1, positionY: 2, width: 1, height: 1, config: { metric: 'today_services' } },
      { type: 'stats_card', title: 'Eficiencia', size: 'small', positionX: 2, positionY: 2, width: 1, height: 1, config: { metric: 'team_efficiency' } },
    ],
  },
];

// Catálogo de widgets disponibles
const WIDGET_CATALOG = [
  { type: 'stats_card', name: 'Tarjeta de estadísticas', description: 'Muestra un KPI con comparación', sizes: ['small'], icon: 'stats-chart' },
  { type: 'chart_line', name: 'Gráfico de líneas', description: 'Evolución temporal de datos', sizes: ['medium', 'large', 'wide'], icon: 'trending-up' },
  { type: 'chart_bar', name: 'Gráfico de barras', description: 'Comparación de categorías', sizes: ['medium', 'large', 'wide'], icon: 'bar-chart' },
  { type: 'chart_pie', name: 'Gráfico circular', description: 'Distribución porcentual', sizes: ['small', 'medium'], icon: 'pie-chart' },
  { type: 'chart_area', name: 'Gráfico de área', description: 'Evolución con área rellena', sizes: ['medium', 'large', 'wide'], icon: 'analytics' },
  { type: 'calendar', name: 'Calendario', description: 'Vista de calendario con citas', sizes: ['medium', 'large'], icon: 'calendar' },
  { type: 'tasks', name: 'Tareas pendientes', description: 'Lista de tareas por hacer', sizes: ['small', 'medium', 'tall'], icon: 'checkbox' },
  { type: 'recent_clients', name: 'Clientes recientes', description: 'Últimos clientes añadidos', sizes: ['small', 'medium'], icon: 'people' },
  { type: 'recent_services', name: 'Servicios recientes', description: 'Últimos servicios realizados', sizes: ['medium', 'wide'], icon: 'construct' },
  { type: 'recent_invoices', name: 'Facturas recientes', description: 'Últimas facturas emitidas', sizes: ['medium', 'wide'], icon: 'document-text' },
  { type: 'upcoming_appointments', name: 'Próximas citas', description: 'Citas programadas', sizes: ['small', 'medium', 'tall'], icon: 'time' },
  { type: 'revenue_summary', name: 'Resumen de ingresos', description: 'Ingresos totales y comparativa', sizes: ['medium', 'wide'], icon: 'cash' },
  { type: 'map', name: 'Mapa de clientes', description: 'Ubicación de clientes', sizes: ['medium', 'large'], icon: 'map' },
  { type: 'weather', name: 'Clima', description: 'Previsión meteorológica', sizes: ['small'], icon: 'partly-sunny' },
  { type: 'notes', name: 'Notas rápidas', description: 'Bloc de notas personal', sizes: ['small', 'medium', 'tall'], icon: 'create' },
  { type: 'shortcuts', name: 'Accesos directos', description: 'Enlaces rápidos personalizados', sizes: ['small', 'medium'], icon: 'apps' },
  { type: 'team_activity', name: 'Actividad del equipo', description: 'Actividad reciente del equipo', sizes: ['medium', 'wide'], icon: 'people-circle', premium: true },
  { type: 'inventory_alerts', name: 'Alertas de inventario', description: 'Stock bajo y alertas', sizes: ['small', 'medium'], icon: 'alert-circle' },
  { type: 'payment_status', name: 'Estado de pagos', description: 'Pagos pendientes y completados', sizes: ['small', 'medium', 'tall'], icon: 'wallet' },
];

export class DashboardService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  // ============================================
  // LAYOUTS
  // ============================================

  /**
   * Obtiene todos los layouts de un usuario
   */
  async getUserLayouts(userId: string, organizationId: string): Promise<DashboardLayout[]> {
    const result = await this.getDb().execute(`
      SELECT l.*, 
        (SELECT json_agg(w.*) FROM dashboard_widgets w WHERE w.layout_id = l.id) as widgets
      FROM dashboard_layouts l
      WHERE l.user_id = $1 AND l.organization_id = $2
      ORDER BY l.is_default DESC, l.updated_at DESC
    `, [userId, organizationId]);

    return (result.rows || []).map((row: DashboardLayoutRow) => ({
      ...row,
      widgets: row.widgets || [],
    }));
  }

  /**
   * Obtiene un layout por ID
   */
  async getLayout(layoutId: string): Promise<DashboardLayout | null> {
    const result = await this.getDb().execute(`
      SELECT l.*, 
        (SELECT json_agg(w.*) FROM dashboard_widgets w WHERE w.layout_id = l.id ORDER BY w.position_y, w.position_x) as widgets
      FROM dashboard_layouts l
      WHERE l.id = $1
    `, [layoutId]);

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      widgets: row.widgets || [],
    };
  }

  /**
   * Crea un nuevo layout
   */
  async createLayout(
    userId: string,
    organizationId: string,
    data: {
      name: string;
      description?: string;
      columns?: number;
      rowHeight?: number;
      isDefault?: boolean;
    }
  ): Promise<string> {
    // Si es default, quitar default de otros layouts
    if (data.isDefault) {
      await this.getDb().execute(`
        UPDATE dashboard_layouts SET is_default = false
        WHERE user_id = $1 AND organization_id = $2
      `, [userId, organizationId]);
    }

    const result = await this.getDb().execute(`
      INSERT INTO dashboard_layouts (user_id, organization_id, name, description, columns, row_height, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      userId,
      organizationId,
      data.name,
      data.description,
      data.columns || 3,
      data.rowHeight || 150,
      data.isDefault || false,
    ]);

    return result.rows[0].id;
  }

  /**
   * Actualiza un layout
   */
  async updateLayout(layoutId: string, data: Partial<DashboardLayout>): Promise<void> {
    const updates: string[] = [];
    const values: SqlParameterValue[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.columns !== undefined) {
      updates.push(`columns = $${paramIndex++}`);
      values.push(data.columns);
    }
    if (data.rowHeight !== undefined) {
      updates.push(`row_height = $${paramIndex++}`);
      values.push(data.rowHeight);
    }
    if (data.isShared !== undefined) {
      updates.push(`is_shared = $${paramIndex++}`);
      values.push(data.isShared);
    }

    updates.push(`updated_at = NOW()`);
    values.push(layoutId);

    await this.getDb().execute(`
      UPDATE dashboard_layouts SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
  }

  /**
   * Elimina un layout
   */
  async deleteLayout(layoutId: string): Promise<void> {
    await this.getDb().execute(`DELETE FROM dashboard_layouts WHERE id = $1`, [layoutId]);
  }

  /**
   * Establece un layout como predeterminado
   */
  async setDefaultLayout(userId: string, organizationId: string, layoutId: string): Promise<void> {
    await this.getDb().execute(`
      UPDATE dashboard_layouts SET is_default = false
      WHERE user_id = $1 AND organization_id = $2
    `, [userId, organizationId]);

    await this.getDb().execute(`
      UPDATE dashboard_layouts SET is_default = true
      WHERE id = $1
    `, [layoutId]);
  }

  // ============================================
  // WIDGETS
  // ============================================

  /**
   * Añade un widget a un layout
   */
  async addWidget(layoutId: string, widget: Omit<Widget, 'id'>): Promise<string> {
    const result = await this.getDb().execute(`
      INSERT INTO dashboard_widgets 
      (layout_id, type, title, size, position_x, position_y, width, height, config, is_visible, refresh_interval)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      layoutId,
      widget.type,
      widget.title,
      widget.size,
      widget.positionX,
      widget.positionY,
      widget.width,
      widget.height,
      JSON.stringify(widget.config),
      widget.isVisible !== false,
      widget.refreshInterval,
    ]);

    // Actualizar timestamp del layout
    await this.getDb().execute(`
      UPDATE dashboard_layouts SET updated_at = NOW() WHERE id = $1
    `, [layoutId]);

    return result.rows[0].id;
  }

  /**
   * Actualiza un widget
   */
  async updateWidget(widgetId: string, data: Partial<Widget>): Promise<void> {
    const updates: string[] = [];
    const values: SqlParameterValue[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.size !== undefined) {
      updates.push(`size = $${paramIndex++}`);
      values.push(data.size);
    }
    if (data.positionX !== undefined) {
      updates.push(`position_x = $${paramIndex++}`);
      values.push(data.positionX);
    }
    if (data.positionY !== undefined) {
      updates.push(`position_y = $${paramIndex++}`);
      values.push(data.positionY);
    }
    if (data.width !== undefined) {
      updates.push(`width = $${paramIndex++}`);
      values.push(data.width);
    }
    if (data.height !== undefined) {
      updates.push(`height = $${paramIndex++}`);
      values.push(data.height);
    }
    if (data.config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(data.config));
    }
    if (data.isVisible !== undefined) {
      updates.push(`is_visible = $${paramIndex++}`);
      values.push(data.isVisible);
    }
    if (data.refreshInterval !== undefined) {
      updates.push(`refresh_interval = $${paramIndex++}`);
      values.push(data.refreshInterval);
    }

    updates.push(`updated_at = NOW()`);
    values.push(widgetId);

    await this.getDb().execute(`
      UPDATE dashboard_widgets SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
  }

  /**
   * Actualiza las posiciones de múltiples widgets (drag & drop)
   */
  async updateWidgetPositions(widgets: Array<{ id: string; positionX: number; positionY: number }>): Promise<void> {
    for (const widget of widgets) {
      await this.getDb().execute(`
        UPDATE dashboard_widgets SET position_x = $1, position_y = $2, updated_at = NOW()
        WHERE id = $3
      `, [widget.positionX, widget.positionY, widget.id]);
    }
  }

  /**
   * Elimina un widget
   */
  async deleteWidget(widgetId: string): Promise<void> {
    await this.getDb().execute(`DELETE FROM dashboard_widgets WHERE id = $1`, [widgetId]);
  }

  // ============================================
  // PLANTILLAS
  // ============================================

  /**
   * Obtiene las plantillas disponibles
   */
  getTemplates(): typeof DEFAULT_TEMPLATES {
    return DEFAULT_TEMPLATES;
  }

  /**
   * Aplica una plantilla a un layout
   */
  async applyTemplate(layoutId: string, templateId: string): Promise<void> {
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    // Eliminar widgets existentes
    await this.getDb().execute(`DELETE FROM dashboard_widgets WHERE layout_id = $1`, [layoutId]);

    // Añadir widgets de la plantilla
    for (const widget of template.widgets) {
      await this.addWidget(layoutId, {
        type: widget.type as WidgetType,
        title: widget.title,
        size: widget.size as WidgetSize,
        positionX: widget.positionX,
        positionY: widget.positionY,
        width: widget.width,
        height: widget.height,
        config: widget.config,
        isVisible: true,
      });
    }

    // Actualizar columnas del layout
    await this.getDb().execute(`
      UPDATE dashboard_layouts SET columns = $1, updated_at = NOW() WHERE id = $2
    `, [template.columns, layoutId]);
  }

  // ============================================
  // CATÁLOGO DE WIDGETS
  // ============================================

  /**
   * Obtiene el catálogo de widgets disponibles
   */
  getWidgetCatalog() {
    return WIDGET_CATALOG;
  }

  // ============================================
  // DATOS DE WIDGETS
  // ============================================

  /**
   * Obtiene los datos para un widget específico
   */
  async getWidgetData(organizationId: string, widget: Widget): Promise<any> {
    switch (widget.type) {
      case 'stats_card':
        return this.getStatsCardData(organizationId, widget.config);
      case 'chart_line':
      case 'chart_bar':
      case 'chart_area':
        return this.getChartData(organizationId, widget.config);
      case 'chart_pie':
        return this.getPieChartData(organizationId, widget.config);
      case 'recent_clients':
        return this.getRecentClients(organizationId, widget.config.limit || 5);
      case 'recent_services':
        return this.getRecentServices(organizationId, widget.config.limit || 5);
      case 'recent_invoices':
        return this.getRecentInvoices(organizationId, widget.config.limit || 5);
      case 'upcoming_appointments':
        return this.getUpcomingAppointments(organizationId, widget.config.limit || 5);
      case 'revenue_summary':
        return this.getRevenueSummary(organizationId, widget.config.period || 'month');
      case 'payment_status':
        return this.getPaymentStatus(organizationId);
      case 'inventory_alerts':
        return this.getInventoryAlerts(organizationId);
      case 'team_activity':
        return this.getTeamActivity(organizationId, widget.config.limit || 10);
      default:
        return null;
    }
  }

  private async getStatsCardData(organizationId: string, config: WidgetConfig): Promise<StatsCardData> {
    const metric = config.metric;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let currentValue = 0;
    let previousValue = 0;

    switch (metric) {
      case 'monthly_revenue':
        const revenueResult = await this.getDb().execute(`
          SELECT 
            COALESCE(SUM(CASE WHEN created_at >= $2 THEN total ELSE 0 END), 0) as current,
            COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at <= $4 THEN total ELSE 0 END), 0) as previous
          FROM invoices
          WHERE organization_id = $1 AND status = 'paid'
        `, [organizationId, startOfMonth, startOfLastMonth, endOfLastMonth]);
        currentValue = parseFloat(revenueResult.rows?.[0]?.current) || 0;
        previousValue = parseFloat(revenueResult.rows?.[0]?.previous) || 0;
        break;

      case 'services_count':
        const servicesResult = await this.getDb().execute(`
          SELECT 
            COUNT(CASE WHEN created_at >= $2 THEN 1 END) as current,
            COUNT(CASE WHEN created_at >= $3 AND created_at <= $4 THEN 1 END) as previous
          FROM services
          WHERE organization_id = $1
        `, [organizationId, startOfMonth, startOfLastMonth, endOfLastMonth]);
        currentValue = parseInt(servicesResult.rows?.[0]?.current) || 0;
        previousValue = parseInt(servicesResult.rows?.[0]?.previous) || 0;
        break;

      case 'active_clients':
        const clientsResult = await this.getDb().execute(`
          SELECT COUNT(*) as count FROM clients WHERE organization_id = $1
        `, [organizationId]);
        currentValue = parseInt(clientsResult.rows?.[0]?.count) || 0;
        break;
    }

    const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    return {
      value: currentValue,
      previousValue,
      change: Math.round(change * 10) / 10,
      trend: change >= 0 ? 'up' : 'down',
    };
  }

  private async getChartData(organizationId: string, config: WidgetConfig): Promise<ChartData> {
    // Implementación simplificada - retorna datos de ejemplo
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(months[monthIndex]);
      data.push(Math.floor(Math.random() * 5000) + 1000);
    }

    return { labels, data };
  }

  private async getPieChartData(organizationId: string, config: WidgetConfig): Promise<ChartData> {
    return {
      labels: ['Afinación', 'Regulación', 'Reparación', 'Otros'],
      data: [45, 25, 20, 10],
    };
  }

  private async getRecentClients(organizationId: string, limit: number): Promise<RecentClient[]> {
    const result = await this.getDb().execute(`
      SELECT id, name, email, phone, created_at
      FROM clients
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows || [];
  }

  private async getRecentServices(organizationId: string, limit: number): Promise<RecentService[]> {
    const result = await this.getDb().execute(`
      SELECT s.id, s.type, s.status, s.created_at, c.name as client_name
      FROM services s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.organization_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows || [];
  }

  private async getRecentInvoices(organizationId: string, limit: number): Promise<RecentInvoice[]> {
    const result = await this.getDb().execute(`
      SELECT i.id, i.invoice_number, i.total, i.status, i.created_at, c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.organization_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows || [];
  }

  private async getUpcomingAppointments(organizationId: string, limit: number): Promise<UpcomingAppointment[]> {
    const result = await this.getDb().execute(`
      SELECT a.id, a.date, a.time, a.type, c.name as client_name, c.address
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.organization_id = $1 AND a.date >= CURRENT_DATE
      ORDER BY a.date, a.time
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows || [];
  }

  private async getRevenueSummary(organizationId: string, period: string): Promise<RevenueSummary> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const result = await this.getDb().execute(`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END), 0) as pending
      FROM invoices
      WHERE organization_id = $1 AND created_at >= $2
    `, [organizationId, startDate]);

    return result.rows?.[0] || { total: 0, count: 0, paid: 0, pending: 0 };
  }

  private async getPaymentStatus(organizationId: string): Promise<PaymentStatusData> {
    const result = await this.getDb().execute(`
      SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END), 0) as pending_amount
      FROM invoices
      WHERE organization_id = $1
    `, [organizationId]);

    return result.rows?.[0] || { paid: 0, pending: 0, overdue: 0, pending_amount: 0 };
  }

  private async getInventoryAlerts(organizationId: string): Promise<InventoryAlert[]> {
    const result = await this.getDb().execute(`
      SELECT id, name, current_stock, min_stock
      FROM inventory_items
      WHERE organization_id = $1 AND current_stock <= min_stock
      ORDER BY (current_stock::float / NULLIF(min_stock, 0)) ASC
      LIMIT 5
    `, [organizationId]);

    return result.rows || [];
  }

  private async getTeamActivity(organizationId: string, limit: number): Promise<TeamActivityMember[]> {
    const result = await this.getDb().execute(`
      SELECT 
        tm.id,
        tm.name,
        COUNT(s.id) as services_count,
        MAX(s.created_at) as last_activity
      FROM team_members tm
      LEFT JOIN services s ON s.technician_id = tm.id AND s.created_at >= NOW() - INTERVAL '7 days'
      WHERE tm.organization_id = $1
      GROUP BY tm.id, tm.name
      ORDER BY services_count DESC
      LIMIT $2
    `, [organizationId, limit]);

    return result.rows || [];
  }
}

export default DashboardService;
