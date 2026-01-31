/**
 * Módulo de Reportes y Analytics
 * Piano Emotion Manager
 */

// Servicios
export { AnalyticsService, createAnalyticsService } from './analytics.service.js';
export { PDFGeneratorService, createPDFGenerator } from './pdf-generator.service.js';

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
} from './analytics.service.js';

// Tipos de PDF Generator
export type {
  ReportConfig,
  ReportSection,
  GeneratedReport,
} from './pdf-generator.service.js';
