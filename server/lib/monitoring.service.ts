/**
 * Monitoring Service
 * 
 * Provides structured logging, metrics tracking, and error monitoring
 * for production environments.
 */

interface LogContext {
  userId?: number;
  endpoint?: string;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

interface MetricData {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  tags?: Record<string, string>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {
    console.log('📊 [Monitoring] Service initialized');
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Log informational message with context
   */
  info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
      ...context,
    };
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log warning message with context
   */
  warn(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
      ...context,
    };
    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Log error message with context and stack trace
   */
  error(message: string, error: Error, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    };
    console.error(JSON.stringify(logEntry));
  }

  /**
   * Track a metric value
   */
  trackMetric(data: MetricData): void {
    const { name, value, unit, tags } = data;
    
    // Store metric for aggregation
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Log metric
    const timestamp = new Date().toISOString();
    const metricEntry = {
      type: 'METRIC',
      timestamp,
      name,
      value,
      unit,
      tags,
    };
    console.log(JSON.stringify(metricEntry));
  }

  /**
   * Track request duration
   */
  trackRequestDuration(endpoint: string, duration: number, userId?: number): void {
    this.trackMetric({
      name: 'http_request_duration',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        userId: userId?.toString() || 'anonymous',
      },
    });
  }

  /**
   * Track error occurrence
   */
  trackError(endpoint: string, errorType: string, userId?: number): void {
    this.trackMetric({
      name: 'error_count',
      value: 1,
      unit: 'count',
      tags: {
        endpoint,
        errorType,
        userId: userId?.toString() || 'anonymous',
      },
    });
  }

  /**
   * Track cache hit/miss
   */
  trackCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, duration?: number): void {
    this.trackMetric({
      name: `cache_${operation}`,
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      tags: {
        key: key.split(':')[0], // Only track the prefix (e.g., 'clients', 'pianos')
      },
    });
  }

  /**
   * Track database query duration
   */
  trackDatabaseQuery(table: string, operation: string, duration: number): void {
    this.trackMetric({
      name: 'db_query_duration',
      value: duration,
      unit: 'ms',
      tags: {
        table,
        operation,
      },
    });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(metricName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, avg, min, max, p50, p95, p99 };
  }

  /**
   * Clear metrics (useful for testing)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get all metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    for (const [name, _values] of this.metrics.entries()) {
      summary[name] = this.getMetricStats(name);
    }
    return summary;
  }
}

export const monitoring = MonitoringService.getInstance();
