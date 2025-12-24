/**
 * Módulo de Reportes y Analytics
 * Piano Emotion Manager
 */

// Servicios
export { AnalyticsService, createAnalyticsService } from './analytics.service';
export { PDFGeneratorService, createPDFGenerator } from './pdf-generator.service';

// Tipos de Analytics
export type {
  DateRange,
  DashboardMetrics,
  RevenueByPeriod,
  ServicesByType,
  TopClient,
  TechnicianPerformance,
  PianosByBrand,
  MonthlyTrend,
  GeographicDistribution,
} from './analytics.service';

// Tipos de PDF Generator
export type {
  ReportConfig,
  ReportSection,
  GeneratedReport,
} from './pdf-generator.service';
