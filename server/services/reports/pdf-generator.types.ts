/**
 * Tipos para el servicio de generación de reportes PDF
 * Piano Emotion Manager
 */

import type { DateRange, DashboardMetrics } from './analytics.service';

// ============================================================================
// Tipos de Sección
// ============================================================================

export type ReportSectionType = 'summary' | 'revenue' | 'services' | 'clients' | 'pianos' | 'technicians' | 'custom';

// ============================================================================
// Datos de Secciones
// ============================================================================

export interface RevenueDataItem {
  period: string;
  revenue: number;
  services: number;
  averageTicket: number;
}

export interface ServiceDataItem {
  typeName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface PianoDataItem {
  brand: string;
  count: number;
  percentage: number;
  averageAge: number;
}

export interface ClientDataItem {
  name: string;
  totalServices: number;
  totalRevenue: number;
  lastService: string;
}

export interface TechnicianDataItem {
  name: string;
  servicesCompleted: number;
  revenue: number;
  averageRating: number;
}

// ============================================================================
// Unión de tipos de datos de sección
// ============================================================================

export type SectionData = 
  | DashboardMetrics 
  | RevenueDataItem[] 
  | ServiceDataItem[] 
  | PianoDataItem[] 
  | ClientDataItem[] 
  | TechnicianDataItem[]
  | unknown;

// ============================================================================
// Configuración de Reporte
// ============================================================================

export interface ReportSection {
  type: ReportSectionType;
  title: string;
  data?: SectionData;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  dateRange: DateRange;
  sections: ReportSection[];
  includeCharts: boolean;
  includeTables: boolean;
  language: 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'da';
}

export interface GeneratedReport {
  filename: string;
  content: Buffer | string;
  mimeType: string;
  size: number;
}
