/**
 * Tipos para el servicio de Dashboard
 * Piano Emotion Manager
 */

import type { MySql2Database } from 'drizzle-orm/mysql2';

// ============================================================================
// Tipos de Base de Datos
// ============================================================================

export type DatabaseConnection = MySql2Database<Record<string, never>>;

export interface DatabaseQueryResult<T = unknown> {
  rows?: T[];
}

// ============================================================================
// Tipos de Widget
// ============================================================================

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

// ============================================================================
// Configuración de Widgets
// ============================================================================

export interface WidgetConfig {
  metric?: string;
  limit?: number;
  period?: string;
  dataSource?: string;
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config: WidgetConfig;
  isVisible: boolean;
  refreshInterval?: number;
}

// ============================================================================
// Layout
// ============================================================================

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isShared: boolean;
  columns: number;
  rowHeight: number;
  widgets: Widget[];
}

export interface DashboardLayoutRow {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_shared: boolean;
  columns: number;
  row_height: number;
  widgets?: Widget[];
}

// ============================================================================
// Datos de Widgets
// ============================================================================

export interface StatsCardData {
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down';
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface RecentClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface RecentService {
  id: string;
  type: string;
  status: string;
  created_at: string;
  client_name?: string;
}

export interface RecentInvoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  client_name?: string;
}

export interface UpcomingAppointment {
  id: string;
  date: string;
  time: string;
  type: string;
  client_name?: string;
  address?: string;
}

export interface RevenueSummary {
  total: number;
  count: number;
  paid: number;
  pending: number;
}

export interface PaymentStatusData {
  paid: number;
  pending: number;
  overdue: number;
  pending_amount: number;
}

export interface InventoryAlert {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
}

export interface TeamActivityMember {
  id: string;
  name: string;
  services_count: number;
  last_activity?: string;
}

// ============================================================================
// Filas de Base de Datos
// ============================================================================

export interface RevenueQueryRow {
  current: string;
  previous: string;
}

export interface CountQueryRow {
  current: string;
  previous: string;
}

export interface SimpleCountRow {
  count: string;
}

export interface RevenueSummaryRow {
  total: string;
  count: string;
  paid: string;
  pending: string;
}

export interface PaymentStatusRow {
  paid: string;
  pending: string;
  overdue: string;
  pending_amount: string;
}

// ============================================================================
// Valores de Actualización SQL
// ============================================================================

export type SqlParameterValue = string | number | boolean | Date | null | undefined;
