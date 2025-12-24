/**
 * Servicio de Generación de Reportes PDF
 * Piano Emotion Manager
 * 
 * Genera reportes en formato PDF con gráficos y tablas
 */

import { AnalyticsService, DateRange, DashboardMetrics } from './analytics.service';

// ============================================================================
// Types
// ============================================================================

export interface ReportConfig {
  title: string;
  subtitle?: string;
  dateRange: DateRange;
  sections: ReportSection[];
  includeCharts: boolean;
  includeTables: boolean;
  language: 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'da';
}

export interface ReportSection {
  type: 'summary' | 'revenue' | 'services' | 'clients' | 'pianos' | 'technicians' | 'custom';
  title: string;
  data?: any;
}

export interface GeneratedReport {
  filename: string;
  content: Buffer | string;
  mimeType: string;
  size: number;
}

// ============================================================================
// PDF Generator Service
// ============================================================================

export class PDFGeneratorService {
  private analytics: AnalyticsService;
  private organizationId: number;

  constructor(organizationId: number) {
    this.organizationId = organizationId;
    this.analytics = new AnalyticsService(organizationId);
  }

  /**
   * Genera un reporte completo en PDF
   */
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const { title, subtitle, dateRange, sections, language } = config;

    // Recopilar datos para cada sección
    const sectionData: Map<string, any> = new Map();

    for (const section of sections) {
      switch (section.type) {
        case 'summary':
          sectionData.set('summary', await this.analytics.getDashboardMetrics(dateRange));
          break;
        case 'revenue':
          sectionData.set('revenue', await this.analytics.getRevenueByPeriod(dateRange, 'month'));
          break;
        case 'services':
          sectionData.set('services', await this.analytics.getServicesByType(dateRange));
          break;
        case 'pianos':
          sectionData.set('pianos', await this.analytics.getPianosByBrand());
          break;
        case 'technicians':
          sectionData.set('technicians', await this.analytics.getTechnicianPerformance(dateRange));
          break;
      }
    }

    // Generar HTML del reporte
    const html = this.generateReportHTML(config, sectionData);

    // En producción, usar puppeteer o similar para convertir a PDF
    // Por ahora, devolvemos el HTML como string
    const filename = `reporte_${this.formatDateForFilename(new Date())}.html`;

    return {
      filename,
      content: html,
      mimeType: 'text/html',
      size: html.length,
    };
  }

  /**
   * Genera reporte de resumen ejecutivo
   */
  async generateExecutiveSummary(dateRange: DateRange): Promise<GeneratedReport> {
    return this.generateReport({
      title: 'Resumen Ejecutivo',
      subtitle: `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`,
      dateRange,
      sections: [
        { type: 'summary', title: 'Métricas Principales' },
        { type: 'revenue', title: 'Evolución de Ingresos' },
        { type: 'services', title: 'Servicios por Tipo' },
      ],
      includeCharts: true,
      includeTables: true,
      language: 'es',
    });
  }

  /**
   * Genera reporte de servicios
   */
  async generateServicesReport(dateRange: DateRange): Promise<GeneratedReport> {
    return this.generateReport({
      title: 'Reporte de Servicios',
      subtitle: `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`,
      dateRange,
      sections: [
        { type: 'services', title: 'Servicios por Tipo' },
        { type: 'technicians', title: 'Rendimiento de Técnicos' },
      ],
      includeCharts: true,
      includeTables: true,
      language: 'es',
    });
  }

  /**
   * Genera reporte financiero
   */
  async generateFinancialReport(dateRange: DateRange): Promise<GeneratedReport> {
    return this.generateReport({
      title: 'Reporte Financiero',
      subtitle: `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`,
      dateRange,
      sections: [
        { type: 'summary', title: 'Resumen Financiero' },
        { type: 'revenue', title: 'Ingresos por Período' },
      ],
      includeCharts: true,
      includeTables: true,
      language: 'es',
    });
  }

  /**
   * Genera reporte de clientes
   */
  async generateClientsReport(dateRange: DateRange): Promise<GeneratedReport> {
    return this.generateReport({
      title: 'Reporte de Clientes',
      subtitle: `${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`,
      dateRange,
      sections: [
        { type: 'clients', title: 'Estadísticas de Clientes' },
        { type: 'pianos', title: 'Pianos por Marca' },
      ],
      includeCharts: true,
      includeTables: true,
      language: 'es',
    });
  }

  // ============================================================================
  // HTML Generation
  // ============================================================================

  private generateReportHTML(config: ReportConfig, data: Map<string, any>): string {
    const { title, subtitle, sections } = config;

    let sectionsHTML = '';

    for (const section of sections) {
      const sectionData = data.get(section.type);
      sectionsHTML += this.generateSectionHTML(section, sectionData);
    }

    return `
<!DOCTYPE html>
<html lang="${config.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    .header .date {
      font-size: 14px;
      color: #9ca3af;
      margin-top: 8px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .metric-change {
      font-size: 12px;
      margin-top: 8px;
    }
    .metric-change.positive {
      color: #22c55e;
    }
    .metric-change.negative {
      color: #ef4444;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:hover {
      background: #f9fafb;
    }
    .chart-placeholder {
      background: #f3f4f6;
      border-radius: 12px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      margin: 20px 0;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="date">Generado el ${this.formatDate(new Date())}</div>
  </div>

  ${sectionsHTML}

  <div class="footer">
    <p>Piano Emotion Manager - Reporte generado automáticamente</p>
    <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
  </div>
</body>
</html>
    `;
  }

  private generateSectionHTML(section: ReportSection, data: any): string {
    switch (section.type) {
      case 'summary':
        return this.generateSummarySection(section.title, data as DashboardMetrics);
      case 'revenue':
        return this.generateRevenueSection(section.title, data);
      case 'services':
        return this.generateServicesSection(section.title, data);
      case 'pianos':
        return this.generatePianosSection(section.title, data);
      default:
        return '';
    }
  }

  private generateSummarySection(title: string, metrics: DashboardMetrics): string {
    if (!metrics) return '';

    const changeClass = metrics.revenue.changePercent >= 0 ? 'positive' : 'negative';
    const changeSign = metrics.revenue.changePercent >= 0 ? '+' : '';

    return `
      <div class="section">
        <h2>${title}</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${this.formatCurrency(metrics.revenue.total)}</div>
            <div class="metric-label">Ingresos Totales</div>
            <div class="metric-change ${changeClass}">
              ${changeSign}${metrics.revenue.changePercent.toFixed(1)}% vs período anterior
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.services.total}</div>
            <div class="metric-label">Servicios Realizados</div>
            <div class="metric-change">${metrics.services.completionRate.toFixed(1)}% completados</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.clients.total}</div>
            <div class="metric-label">Clientes Totales</div>
            <div class="metric-change positive">+${metrics.clients.new} nuevos</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${this.formatCurrency(metrics.averages.ticketValue)}</div>
            <div class="metric-label">Ticket Medio</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateRevenueSection(title: string, data: any[]): string {
    if (!data || data.length === 0) return '';

    const rows = data.map(item => `
      <tr>
        <td>${item.period}</td>
        <td>${this.formatCurrency(item.revenue)}</td>
        <td>${item.services}</td>
        <td>${this.formatCurrency(item.averageTicket)}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>${title}</h2>
        <div class="chart-placeholder">
          [Gráfico de evolución de ingresos]
        </div>
        <table>
          <thead>
            <tr>
              <th>Período</th>
              <th>Ingresos</th>
              <th>Servicios</th>
              <th>Ticket Medio</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateServicesSection(title: string, data: any[]): string {
    if (!data || data.length === 0) return '';

    const rows = data.map(item => `
      <tr>
        <td>${item.typeName}</td>
        <td>${item.count}</td>
        <td>${this.formatCurrency(item.revenue)}</td>
        <td>${item.percentage.toFixed(1)}%</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>${title}</h2>
        <div class="chart-placeholder">
          [Gráfico circular de servicios por tipo]
        </div>
        <table>
          <thead>
            <tr>
              <th>Tipo de Servicio</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generatePianosSection(title: string, data: any[]): string {
    if (!data || data.length === 0) return '';

    const rows = data.map(item => `
      <tr>
        <td>${item.brand}</td>
        <td>${item.count}</td>
        <td>${item.percentage.toFixed(1)}%</td>
        <td>${item.averageAge} años</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Cantidad</th>
              <th>Porcentaje</th>
              <th>Edad Media</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPDFGenerator(organizationId: number): PDFGeneratorService {
  return new PDFGeneratorService(organizationId);
}
