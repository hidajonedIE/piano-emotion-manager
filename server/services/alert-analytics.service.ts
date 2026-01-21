/**
 * Alert Analytics Service
 * Análisis y métricas del sistema de alertas
 */
import * as db from '../getDb().js';
import { alertHistory, pianos, clients } from '../../drizzle/schema.js';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

interface TimeSeriesData {
  date: string;
  urgent: number;
  pending: number;
  resolved: number;
}

interface AlertDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface PerformanceMetrics {
  averageResolutionTime: number; // días
  resolutionRate: number; // porcentaje
  activeAlertsCount: number;
  resolvedAlertsCount: number;
  dismissedAlertsCount: number;
  totalAlertsCount: number;
}

interface TrendAnalysis {
  period: string;
  alertsCreated: number;
  alertsResolved: number;
  averageResolutionTime: number;
  resolutionRate: number;
}

interface ServiceTypeAnalysis {
  type: string;
  typeName: string;
  totalAlerts: number;
  urgentAlerts: number;
  pendingAlerts: number;
  averageResolutionTime: number;
  resolutionRate: number;
}

export class AlertAnalyticsService {
  /**
   * Obtener métricas de rendimiento generales
   */
  static async getPerformanceMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetrics> {
    const database = await getDb().getDb();
    if (!database) {
      return {
        averageResolutionTime: 0,
        resolutionRate: 0,
        activeAlertsCount: 0,
        resolvedAlertsCount: 0,
        dismissedAlertsCount: 0,
        totalAlertsCount: 0,
      };
    }

    try {
      // Construir condiciones de filtro
      const conditions = [eq(alertHistory.userId, userId)];
      
      if (startDate) {
        conditions.push(gte(alertHistory.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(alertHistory.createdAt, endDate));
      }

      // Obtener todas las alertas en el período
      const alerts = await database.query.alertHistory.findMany({
        where: and(...conditions),
      });

      const totalAlertsCount = alerts.length;
      const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
      const resolvedAlertsCount = alerts.filter(a => a.status === 'resolved').length;
      const dismissedAlertsCount = alerts.filter(a => a.status === 'dismissed').length;

      // Calcular tiempo promedio de resolución
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolvedAt);
      let totalResolutionTime = 0;
      
      for (const alert of resolvedAlerts) {
        if (alert.resolvedAt) {
          const created = new Date(alert.createdAt).getTime();
          const resolved = new Date(alert.resolvedAt).getTime();
          const days = (resolved - created) / (1000 * 60 * 60 * 24);
          totalResolutionTime += days;
        }
      }

      const averageResolutionTime = resolvedAlerts.length > 0
        ? Math.round(totalResolutionTime / resolvedAlerts.length)
        : 0;

      // Calcular tasa de resolución
      const resolutionRate = totalAlertsCount > 0
        ? Math.round((resolvedAlertsCount / totalAlertsCount) * 100)
        : 0;

      return {
        averageResolutionTime,
        resolutionRate,
        activeAlertsCount,
        resolvedAlertsCount,
        dismissedAlertsCount,
        totalAlertsCount,
      };
    } catch (error) {
      console.error('[AlertAnalytics] Error getting performance metrics:', error);
      return {
        averageResolutionTime: 0,
        resolutionRate: 0,
        activeAlertsCount: 0,
        resolvedAlertsCount: 0,
        dismissedAlertsCount: 0,
        totalAlertsCount: 0,
      };
    }
  }

  /**
   * Obtener datos de serie temporal para gráficos
   */
  static async getTimeSeriesData(
    userId: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    const database = await getDb().getDb();
    if (!database) {
      return [];
    }

    try {
      // Obtener todas las alertas en el período
      const alerts = await database.query.alertHistory.findMany({
        where: and(
          eq(alertHistory.userId, userId),
          gte(alertHistory.createdAt, startDate),
          lte(alertHistory.createdAt, endDate)
        ),
      });

      // Agrupar por fecha según el intervalo
      const dataMap = new Map<string, { urgent: number; pending: number; resolved: number }>();

      for (const alert of alerts) {
        const date = new Date(alert.createdAt);
        let key: string;

        switch (interval) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!dataMap.has(key)) {
          dataMap.set(key, { urgent: 0, pending: 0, resolved: 0 });
        }

        const data = dataMap.get(key)!;

        if (alert.priority === 'urgent') {
          data.urgent++;
        } else {
          data.pending++;
        }

        if (alert.status === 'resolved') {
          data.resolved++;
        }
      }

      // Convertir a array y ordenar
      const result: TimeSeriesData[] = Array.from(dataMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    } catch (error) {
      console.error('[AlertAnalytics] Error getting time series data:', error);
      return [];
    }
  }

  /**
   * Obtener distribución de alertas por tipo
   */
  static async getAlertDistribution(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AlertDistribution[]> {
    const database = await getDb().getDb();
    if (!database) {
      return [];
    }

    try {
      const conditions = [eq(alertHistory.userId, userId)];
      
      if (startDate) {
        conditions.push(gte(alertHistory.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(alertHistory.createdAt, endDate));
      }

      const alerts = await database.query.alertHistory.findMany({
        where: and(...conditions),
      });

      const total = alerts.length;
      const distribution = new Map<string, number>();

      for (const alert of alerts) {
        const type = alert.alertType;
        distribution.set(type, (distribution.get(type) || 0) + 1);
      }

      const result: AlertDistribution[] = Array.from(distribution.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return result;
    } catch (error) {
      console.error('[AlertAnalytics] Error getting alert distribution:', error);
      return [];
    }
  }

  /**
   * Obtener análisis de tendencias por período
   */
  static async getTrendAnalysis(
    userId: string,
    periods: number = 12,
    interval: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TrendAnalysis[]> {
    const database = await getDb().getDb();
    if (!database) {
      return [];
    }

    try {
      const now = new Date();
      const trends: TrendAnalysis[] = [];

      for (let i = periods - 1; i >= 0; i--) {
        const periodStart = new Date(now);
        const periodEnd = new Date(now);

        switch (interval) {
          case 'month':
            periodStart.setMonth(now.getMonth() - i);
            periodStart.setDate(1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd.setMonth(now.getMonth() - i + 1);
            periodEnd.setDate(0);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'quarter':
            const quarterStart = Math.floor((now.getMonth() - i * 3) / 3) * 3;
            periodStart.setMonth(quarterStart);
            periodStart.setDate(1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd.setMonth(quarterStart + 3);
            periodEnd.setDate(0);
            periodEnd.setHours(23, 59, 59, 999);
            break;
          case 'year':
            periodStart.setFullYear(now.getFullYear() - i);
            periodStart.setMonth(0);
            periodStart.setDate(1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd.setFullYear(now.getFullYear() - i);
            periodEnd.setMonth(11);
            periodEnd.setDate(31);
            periodEnd.setHours(23, 59, 59, 999);
            break;
        }

        const alerts = await database.query.alertHistory.findMany({
          where: and(
            eq(alertHistory.userId, userId),
            gte(alertHistory.createdAt, periodStart),
            lte(alertHistory.createdAt, periodEnd)
          ),
        });

        const alertsCreated = alerts.length;
        const alertsResolved = alerts.filter(a => a.status === 'resolved').length;

        // Calcular tiempo promedio de resolución
        const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolvedAt);
        let totalResolutionTime = 0;
        
        for (const alert of resolvedAlerts) {
          if (alert.resolvedAt) {
            const created = new Date(alert.createdAt).getTime();
            const resolved = new Date(alert.resolvedAt).getTime();
            const days = (resolved - created) / (1000 * 60 * 60 * 24);
            totalResolutionTime += days;
          }
        }

        const averageResolutionTime = resolvedAlerts.length > 0
          ? Math.round(totalResolutionTime / resolvedAlerts.length)
          : 0;

        const resolutionRate = alertsCreated > 0
          ? Math.round((alertsResolved / alertsCreated) * 100)
          : 0;

        const periodLabel = interval === 'month'
          ? periodStart.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
          : interval === 'quarter'
          ? `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${periodStart.getFullYear()}`
          : periodStart.getFullYear().toString();

        trends.push({
          period: periodLabel,
          alertsCreated,
          alertsResolved,
          averageResolutionTime,
          resolutionRate,
        });
      }

      return trends;
    } catch (error) {
      console.error('[AlertAnalytics] Error getting trend analysis:', error);
      return [];
    }
  }

  /**
   * Obtener análisis por tipo de servicio
   */
  static async getServiceTypeAnalysis(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceTypeAnalysis[]> {
    const database = await getDb().getDb();
    if (!database) {
      return [];
    }

    try {
      const conditions = [eq(alertHistory.userId, userId)];
      
      if (startDate) {
        conditions.push(gte(alertHistory.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(alertHistory.createdAt, endDate));
      }

      const alerts = await database.query.alertHistory.findMany({
        where: and(...conditions),
      });

      const serviceTypes = ['tuning', 'regulation', 'repair'];
      const typeNames: Record<string, string> = {
        tuning: 'Afinación',
        regulation: 'Regulación',
        repair: 'Reparación',
      };

      const analysis: ServiceTypeAnalysis[] = [];

      for (const type of serviceTypes) {
        const typeAlerts = alerts.filter(a => a.alertType === type);
        const totalAlerts = typeAlerts.length;
        const urgentAlerts = typeAlerts.filter(a => a.priority === 'urgent').length;
        const pendingAlerts = typeAlerts.filter(a => a.priority === 'pending').length;

        // Calcular tiempo promedio de resolución
        const resolvedAlerts = typeAlerts.filter(a => a.status === 'resolved' && a.resolvedAt);
        let totalResolutionTime = 0;
        
        for (const alert of resolvedAlerts) {
          if (alert.resolvedAt) {
            const created = new Date(alert.createdAt).getTime();
            const resolved = new Date(alert.resolvedAt).getTime();
            const days = (resolved - created) / (1000 * 60 * 60 * 24);
            totalResolutionTime += days;
          }
        }

        const averageResolutionTime = resolvedAlerts.length > 0
          ? Math.round(totalResolutionTime / resolvedAlerts.length)
          : 0;

        const resolutionRate = totalAlerts > 0
          ? Math.round((resolvedAlerts.length / totalAlerts) * 100)
          : 0;

        analysis.push({
          type,
          typeName: typeNames[type],
          totalAlerts,
          urgentAlerts,
          pendingAlerts,
          averageResolutionTime,
          resolutionRate,
        });
      }

      return analysis.sort((a, b) => b.totalAlerts - a.totalAlerts);
    } catch (error) {
      console.error('[AlertAnalytics] Error getting service type analysis:', error);
      return [];
    }
  }

  /**
   * Obtener top pianos con más alertas
   */
  static async getTopAlertPianos(
    userId: string,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    pianoId: number;
    brand: string;
    model: string;
    serialNumber?: string;
    alertCount: number;
    urgentCount: number;
    pendingCount: number;
  }>> {
    const database = await getDb().getDb();
    if (!database) {
      return [];
    }

    try {
      const conditions = [eq(alertHistory.userId, userId)];
      
      if (startDate) {
        conditions.push(gte(alertHistory.createdAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(alertHistory.createdAt, endDate));
      }

      const alerts = await database.query.alertHistory.findMany({
        where: and(...conditions),
        with: {
          piano: true,
        },
      });

      // Agrupar por piano
      const pianoMap = new Map<number, {
        piano: any;
        alertCount: number;
        urgentCount: number;
        pendingCount: number;
      }>();

      for (const alert of alerts) {
        const pianoId = alert.pianoId;
        
        if (!pianoMap.has(pianoId)) {
          pianoMap.set(pianoId, {
            piano: alert.piano,
            alertCount: 0,
            urgentCount: 0,
            pendingCount: 0,
          });
        }

        const data = pianoMap.get(pianoId)!;
        data.alertCount++;
        
        if (alert.priority === 'urgent') {
          data.urgentCount++;
        } else {
          data.pendingCount++;
        }
      }

      // Convertir a array y ordenar
      const result = Array.from(pianoMap.entries())
        .map(([pianoId, data]) => ({
          pianoId,
          brand: data.piano.brand,
          model: data.piano.model,
          serialNumber: data.piano.serialNumber,
          alertCount: data.alertCount,
          urgentCount: data.urgentCount,
          pendingCount: data.pendingCount,
        }))
        .sort((a, b) => b.alertCount - a.alertCount)
        .slice(0, limit);

      return result;
    } catch (error) {
      console.error('[AlertAnalytics] Error getting top alert pianos:', error);
      return [];
    }
  }

  /**
   * Obtener comparativa de rendimiento mensual
   */
  static async getMonthlyComparison(
    userId: string,
    currentMonth: Date,
    previousMonth: Date
  ): Promise<{
    current: PerformanceMetrics;
    previous: PerformanceMetrics;
    changes: {
      averageResolutionTime: number;
      resolutionRate: number;
      totalAlerts: number;
    };
  }> {
    const currentEnd = new Date(currentMonth);
    currentEnd.setMonth(currentEnd.getMonth() + 1);
    currentEnd.setDate(0);

    const previousEnd = new Date(previousMonth);
    previousEnd.setMonth(previousEnd.getMonth() + 1);
    previousEnd.setDate(0);

    const current = await this.getPerformanceMetrics(userId, currentMonth, currentEnd);
    const previous = await this.getPerformanceMetrics(userId, previousMonth, previousEnd);

    const changes = {
      averageResolutionTime: current.averageResolutionTime - previous.averageResolutionTime,
      resolutionRate: current.resolutionRate - previous.resolutionRate,
      totalAlerts: current.totalAlertsCount - previous.totalAlertsCount,
    };

    return {
      current,
      previous,
      changes,
    };
  }
}
