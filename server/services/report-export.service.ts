/**
 * Report Export Service
 * Exportación de reportes de alertas en PDF y Excel
 */
import * as db from '../db.js';
import { alertHistory } from '../../drizzle/schema.js.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { AlertAnalyticsService } from './alert-analytics.service.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  includeCharts?: boolean;
  includeDetailedList?: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export class ReportExportService {
  private static readonly EXPORT_DIR = '/tmp/piano-emotion-exports';

  /**
   * Exportar reporte completo de alertas
   */
  static async exportAlertReport(
    userId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Asegurar que el directorio de exportación existe
      if (!existsSync(this.EXPORT_DIR)) {
        await mkdir(this.EXPORT_DIR, { recursive: true });
      }

      // Obtener datos para el reporte
      const metrics = await AlertAnalyticsService.getPerformanceMetrics(
        userId,
        options.startDate,
        options.endDate
      );

      const distribution = await AlertAnalyticsService.getAlertDistribution(
        userId,
        options.startDate,
        options.endDate
      );

      const serviceAnalysis = await AlertAnalyticsService.getServiceTypeAnalysis(
        userId,
        options.startDate,
        options.endDate
      );

      const topPianos = await AlertAnalyticsService.getTopAlertPianos(
        userId,
        10,
        options.startDate,
        options.endDate
      );

      let detailedAlerts: any[] = [];
      if (options.includeDetailedList) {
        const database = await getDb().getDb();
        if (database) {
          const conditions = [eq(alertHistory.userId, userId)];
          
          if (options.startDate) {
            conditions.push(gte(alertHistory.createdAt, options.startDate));
          }
          
          if (options.endDate) {
            conditions.push(lte(alertHistory.createdAt, options.endDate));
          }

          detailedAlerts = await database.query.alertHistory.findMany({
            where: and(...conditions),
            with: {
              piano: true,
              client: true,
            },
            orderBy: [alertHistory.createdAt],
          });
        }
      }

      // Generar reporte según formato
      switch (options.format) {
        case 'pdf':
          return await this.generatePDFReport(
            userId,
            metrics,
            distribution,
            serviceAnalysis,
            topPianos,
            detailedAlerts,
            options
          );
        
        case 'excel':
          return await this.generateExcelReport(
            userId,
            metrics,
            distribution,
            serviceAnalysis,
            topPianos,
            detailedAlerts,
            options
          );
        
        case 'csv':
          return await this.generateCSVReport(
            userId,
            detailedAlerts,
            options
          );
        
        default:
          return {
            success: false,
            error: 'Formato no soportado',
          };
      }
    } catch (error) {
      console.error('[ReportExport] Error exporting report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Generar reporte en PDF
   */
  private static async generatePDFReport(
    userId: string,
    metrics: any,
    distribution: any[],
    serviceAnalysis: any[],
    topPianos: any[],
    detailedAlerts: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const timestamp = new Date().getTime();
      const fileName = `reporte-alertas-${timestamp}.pdf`;
      const filePath = path.join(this.EXPORT_DIR, fileName);

      // Generar contenido Markdown
      const markdown = this.generateMarkdownReport(
        metrics,
        distribution,
        serviceAnalysis,
        topPianos,
        detailedAlerts,
        options
      );

      // Guardar Markdown temporal
      const mdPath = path.join(this.EXPORT_DIR, `temp-${timestamp}.md`);
      await writeFile(mdPath, markdown, 'utf-8');

      // Convertir a PDF usando manus-md-to-pdf
      await execAsync(`manus-md-to-pdf ${mdPath} ${filePath}`);

      return {
        success: true,
        filePath,
        fileName,
      };
    } catch (error) {
      console.error('[ReportExport] Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar PDF',
      };
    }
  }

  /**
   * Generar reporte en Excel
   */
  private static async generateExcelReport(
    userId: string,
    metrics: any,
    distribution: any[],
    serviceAnalysis: any[],
    topPianos: any[],
    detailedAlerts: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const timestamp = new Date().getTime();
      const fileName = `reporte-alertas-${timestamp}.xlsx`;
      const filePath = path.join(this.EXPORT_DIR, fileName);

      // Generar contenido CSV para cada hoja
      const sheets = {
        'Resumen': this.generateSummaryCSV(metrics),
        'Distribucion': this.generateDistributionCSV(distribution),
        'Por Servicio': this.generateServiceAnalysisCSV(serviceAnalysis),
        'Top Pianos': this.generateTopPianosCSV(topPianos),
      };

      if (detailedAlerts.length > 0) {
        sheets['Detalle'] = this.generateDetailedAlertsCSV(detailedAlerts);
      }

      // Por ahora, generar CSV simple (Excel requiere librería adicional)
      // TODO: Implementar generación real de Excel con múltiples hojas
      const csvContent = sheets['Detalle'] || sheets['Resumen'];
      await writeFile(filePath.replace('.xlsx', '.csv'), csvContent, 'utf-8');

      return {
        success: true,
        filePath: filePath.replace('.xlsx', '.csv'),
        fileName: fileName.replace('.xlsx', '.csv'),
      };
    } catch (error) {
      console.error('[ReportExport] Error generating Excel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar Excel',
      };
    }
  }

  /**
   * Generar reporte en CSV
   */
  private static async generateCSVReport(
    userId: string,
    detailedAlerts: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const timestamp = new Date().getTime();
      const fileName = `reporte-alertas-${timestamp}.csv`;
      const filePath = path.join(this.EXPORT_DIR, fileName);

      const csvContent = this.generateDetailedAlertsCSV(detailedAlerts);
      await writeFile(filePath, csvContent, 'utf-8');

      return {
        success: true,
        filePath,
        fileName,
      };
    } catch (error) {
      console.error('[ReportExport] Error generating CSV:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar CSV',
      };
    }
  }

  /**
   * Generar contenido Markdown del reporte
   */
  private static generateMarkdownReport(
    metrics: any,
    distribution: any[],
    serviceAnalysis: any[],
    topPianos: any[],
    detailedAlerts: any[],
    options: ExportOptions
  ): string {
    const now = new Date();
    const dateRange = options.startDate && options.endDate
      ? `${options.startDate.toLocaleDateString('es-ES')} - ${options.endDate.toLocaleDateString('es-ES')}`
      : 'Todo el período';

    let markdown = `# Reporte de Alertas\n\n`;
    markdown += `**Generado:** ${now.toLocaleString('es-ES')}\n\n`;
    markdown += `**Período:** ${dateRange}\n\n`;
    markdown += `---\n\n`;

    // Resumen ejecutivo
    markdown += `## Resumen Ejecutivo\n\n`;
    markdown += `| Métrica | Valor |\n`;
    markdown += `|---------|-------|\n`;
    markdown += `| Total de Alertas | ${metrics.totalAlertsCount} |\n`;
    markdown += `| Alertas Activas | ${metrics.activeAlertsCount} |\n`;
    markdown += `| Alertas Resueltas | ${metrics.resolvedAlertsCount} |\n`;
    markdown += `| Alertas Descartadas | ${metrics.dismissedAlertsCount} |\n`;
    markdown += `| Tiempo Promedio de Resolución | ${metrics.averageResolutionTime} días |\n`;
    markdown += `| Tasa de Resolución | ${metrics.resolutionRate}% |\n\n`;

    // Distribución por tipo
    if (distribution.length > 0) {
      markdown += `## Distribución por Tipo de Servicio\n\n`;
      markdown += `| Tipo | Cantidad | Porcentaje |\n`;
      markdown += `|------|----------|------------|\n`;
      for (const item of distribution) {
        const typeName = this.getServiceTypeName(item.type);
        markdown += `| ${typeName} | ${item.count} | ${item.percentage}% |\n`;
      }
      markdown += `\n`;
    }

    // Análisis por servicio
    if (serviceAnalysis.length > 0) {
      markdown += `## Análisis por Tipo de Servicio\n\n`;
      markdown += `| Servicio | Total | Urgentes | Pendientes | Tiempo Prom. Resolución | Tasa Resolución |\n`;
      markdown += `|----------|-------|----------|------------|-------------------------|------------------|\n`;
      for (const item of serviceAnalysis) {
        markdown += `| ${item.typeName} | ${item.totalAlerts} | ${item.urgentAlerts} | ${item.pendingAlerts} | ${item.averageResolutionTime} días | ${item.resolutionRate}% |\n`;
      }
      markdown += `\n`;
    }

    // Top pianos
    if (topPianos.length > 0) {
      markdown += `## Top 10 Pianos con Más Alertas\n\n`;
      markdown += `| Piano | Alertas | Urgentes | Pendientes |\n`;
      markdown += `|-------|---------|----------|------------|\n`;
      for (const piano of topPianos) {
        const pianoName = `${piano.brand} ${piano.model}${piano.serialNumber ? ` (${piano.serialNumber})` : ''}`;
        markdown += `| ${pianoName} | ${piano.alertCount} | ${piano.urgentCount} | ${piano.pendingCount} |\n`;
      }
      markdown += `\n`;
    }

    // Lista detallada
    if (detailedAlerts.length > 0) {
      markdown += `## Lista Detallada de Alertas\n\n`;
      for (const alert of detailedAlerts) {
        const priorityEmoji = alert.priority === 'urgent' ? '🔴' : '🟡';
        const statusEmoji = alert.status === 'resolved' ? '✅' : alert.status === 'active' ? '⚠️' : '❌';
        const typeName = this.getServiceTypeName(alert.alertType);
        
        markdown += `### ${priorityEmoji} ${alert.piano.brand} ${alert.piano.model}\n\n`;
        markdown += `- **Estado:** ${statusEmoji} ${this.getStatusText(alert.status)}\n`;
        markdown += `- **Prioridad:** ${alert.priority === 'urgent' ? 'Urgente' : 'Pendiente'}\n`;
        markdown += `- **Tipo:** ${typeName}\n`;
        markdown += `- **Cliente:** ${alert.client.name}\n`;
        markdown += `- **Días desde último servicio:** ${alert.daysSinceLastService}\n`;
        markdown += `- **Fecha de creación:** ${new Date(alert.createdAt).toLocaleDateString('es-ES')}\n`;
        if (alert.resolvedAt) {
          markdown += `- **Fecha de resolución:** ${new Date(alert.resolvedAt).toLocaleDateString('es-ES')}\n`;
        }
        markdown += `- **Mensaje:** ${alert.message}\n\n`;
      }
    }

    markdown += `---\n\n`;
    markdown += `*Reporte generado automáticamente por Piano Emotion Manager*\n`;

    return markdown;
  }

  /**
   * Generar CSV de resumen
   */
  private static generateSummaryCSV(metrics: any): string {
    let csv = 'Métrica,Valor\n';
    csv += `Total de Alertas,${metrics.totalAlertsCount}\n`;
    csv += `Alertas Activas,${metrics.activeAlertsCount}\n`;
    csv += `Alertas Resueltas,${metrics.resolvedAlertsCount}\n`;
    csv += `Alertas Descartadas,${metrics.dismissedAlertsCount}\n`;
    csv += `Tiempo Promedio de Resolución (días),${metrics.averageResolutionTime}\n`;
    csv += `Tasa de Resolución (%),${metrics.resolutionRate}\n`;
    return csv;
  }

  /**
   * Generar CSV de distribución
   */
  private static generateDistributionCSV(distribution: any[]): string {
    let csv = 'Tipo,Cantidad,Porcentaje\n';
    for (const item of distribution) {
      const typeName = this.getServiceTypeName(item.type);
      csv += `${typeName},${item.count},${item.percentage}\n`;
    }
    return csv;
  }

  /**
   * Generar CSV de análisis por servicio
   */
  private static generateServiceAnalysisCSV(serviceAnalysis: any[]): string {
    let csv = 'Servicio,Total,Urgentes,Pendientes,Tiempo Prom. Resolución (días),Tasa Resolución (%)\n';
    for (const item of serviceAnalysis) {
      csv += `${item.typeName},${item.totalAlerts},${item.urgentAlerts},${item.pendingAlerts},${item.averageResolutionTime},${item.resolutionRate}\n`;
    }
    return csv;
  }

  /**
   * Generar CSV de top pianos
   */
  private static generateTopPianosCSV(topPianos: any[]): string {
    let csv = 'Piano,Alertas,Urgentes,Pendientes\n';
    for (const piano of topPianos) {
      const pianoName = `${piano.brand} ${piano.model}${piano.serialNumber ? ` (${piano.serialNumber})` : ''}`;
      csv += `"${pianoName}",${piano.alertCount},${piano.urgentCount},${piano.pendingCount}\n`;
    }
    return csv;
  }

  /**
   * Generar CSV de alertas detalladas
   */
  private static generateDetailedAlertsCSV(detailedAlerts: any[]): string {
    let csv = 'ID,Piano,Cliente,Tipo,Prioridad,Estado,Días desde último servicio,Fecha creación,Fecha resolución,Mensaje\n';
    
    for (const alert of detailedAlerts) {
      const pianoName = `${alert.piano.brand} ${alert.piano.model}`;
      const typeName = this.getServiceTypeName(alert.alertType);
      const priorityText = alert.priority === 'urgent' ? 'Urgente' : 'Pendiente';
      const statusText = this.getStatusText(alert.status);
      const createdDate = new Date(alert.createdAt).toLocaleDateString('es-ES');
      const resolvedDate = alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString('es-ES') : '';
      
      csv += `${alert.id},"${pianoName}","${alert.client.name}",${typeName},${priorityText},${statusText},${alert.daysSinceLastService},${createdDate},${resolvedDate},"${alert.message}"\n`;
    }
    
    return csv;
  }

  /**
   * Obtener nombre del tipo de servicio
   */
  private static getServiceTypeName(type: string): string {
    switch (type) {
      case 'tuning':
        return 'Afinación';
      case 'regulation':
        return 'Regulación';
      case 'repair':
        return 'Reparación';
      default:
        return type;
    }
  }

  /**
   * Obtener texto del estado
   */
  private static getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'acknowledged':
        return 'Reconocida';
      case 'resolved':
        return 'Resuelta';
      case 'dismissed':
        return 'Descartada';
      default:
        return status;
    }
  }
}
