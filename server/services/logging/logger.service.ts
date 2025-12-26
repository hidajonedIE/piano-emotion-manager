/**
 * Logger Service
 * Sistema de logging estructurado para la aplicación
 */

// ============================================================================
// TIPOS
// ============================================================================

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerOptions {
  level?: LogLevel;
  context?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
  maxBufferSize?: number;
  flushInterval?: number;
}

interface RequestLogData {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m",  // Green
  warn: "\x1b[33m",  // Yellow
  error: "\x1b[31m", // Red
  fatal: "\x1b[35m", // Magenta
};

const RESET_COLOR = "\x1b[0m";

// ============================================================================
// CLASE LOGGER
// ============================================================================

class Logger {
  private options: Required<LoggerOptions>;
  private buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || "info",
      context: options.context || "app",
      enableConsole: options.enableConsole ?? true,
      enableFile: options.enableFile ?? false,
      enableRemote: options.enableRemote ?? false,
      remoteEndpoint: options.remoteEndpoint || "",
      maxBufferSize: options.maxBufferSize || 100,
      flushInterval: options.flushInterval || 5000,
    };

    if (this.options.enableRemote && this.options.remoteEndpoint) {
      this.startFlushTimer();
    }
  }

  /**
   * Crea un logger hijo con contexto adicional
   */
  child(context: string): Logger {
    return new Logger({
      ...this.options,
      context: `${this.options.context}:${context}`,
    });
  }

  /**
   * Log de nivel debug
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  /**
   * Log de nivel info
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  /**
   * Log de nivel warn
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  /**
   * Log de nivel error
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log("error", message, { ...metadata, ...errorData });
  }

  /**
   * Log de nivel fatal
   */
  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorData = this.formatError(error);
    this.log("fatal", message, { ...metadata, ...errorData });
  }

  /**
   * Log de request HTTP
   */
  request(data: RequestLogData): void {
    const message = `${data.method} ${data.path} ${data.statusCode || "-"} ${data.duration ? `${data.duration}ms` : "-"}`;
    const level: LogLevel = data.statusCode && data.statusCode >= 500 ? "error" : 
                            data.statusCode && data.statusCode >= 400 ? "warn" : "info";
    
    this.log(level, message, {
      type: "request",
      ...data,
    });
  }

  /**
   * Log de operación de base de datos
   */
  database(operation: string, table: string, duration?: number, metadata?: Record<string, unknown>): void {
    this.debug(`DB: ${operation} ${table}${duration ? ` (${duration}ms)` : ""}`, {
      type: "database",
      operation,
      table,
      duration,
      ...metadata,
    });
  }

  /**
   * Log de evento de negocio
   */
  event(eventName: string, metadata?: Record<string, unknown>): void {
    this.info(`Event: ${eventName}`, {
      type: "event",
      event: eventName,
      ...metadata,
    });
  }

  /**
   * Log de métrica
   */
  metric(name: string, value: number, unit?: string, metadata?: Record<string, unknown>): void {
    this.debug(`Metric: ${name} = ${value}${unit ? ` ${unit}` : ""}`, {
      type: "metric",
      metric: name,
      value,
      unit,
      ...metadata,
    });
  }

  /**
   * Log de auditoría
   */
  audit(action: string, userId: string, resource: string, metadata?: Record<string, unknown>): void {
    this.info(`Audit: ${action} on ${resource} by ${userId}`, {
      type: "audit",
      action,
      userId,
      resource,
      ...metadata,
    });
  }

  /**
   * Inicia un timer para medir duración
   */
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label} completed in ${duration}ms`, {
        type: "timer",
        label,
        duration,
      });
    };
  }

  /**
   * Wrapper para medir duración de funciones async
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const end = this.startTimer(label);
    try {
      return await fn();
    } finally {
      end();
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    // Verificar nivel
    if (LOG_LEVELS[level] < LOG_LEVELS[this.options.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.options.context,
      metadata,
    };

    // Log a consola
    if (this.options.enableConsole) {
      this.logToConsole(entry);
    }

    // Añadir al buffer para envío remoto
    if (this.options.enableRemote) {
      this.buffer.push(entry);
      if (this.buffer.length >= this.options.maxBufferSize) {
        this.flush();
      }
    }
  }

  /**
   * Formatea un error para logging
   */
  private formatError(error: Error | unknown): { error?: LogEntry["error"] } {
    if (!error) return {};
    
    if (error instanceof Error) {
      return {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      };
    }
    
    return {
      error: {
        name: "UnknownError",
        message: String(error),
      },
    };
  }

  /**
   * Log a consola con formato
   */
  private logToConsole(entry: LogEntry): void {
    const color = LEVEL_COLORS[entry.level];
    const levelStr = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context ? `[${entry.context}]` : "";
    
    const prefix = `${color}${entry.timestamp} ${levelStr}${RESET_COLOR} ${contextStr}`;
    const message = entry.message;
    
    // Usar el método de consola apropiado
    switch (entry.level) {
      case "debug":
        console.debug(prefix, message, entry.metadata || "");
        break;
      case "info":
        console.info(prefix, message, entry.metadata || "");
        break;
      case "warn":
        console.warn(prefix, message, entry.metadata || "");
        break;
      case "error":
      case "fatal":
        console.error(prefix, message, entry.metadata || "");
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  /**
   * Inicia el timer de flush
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  /**
   * Envía logs al endpoint remoto
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.options.remoteEndpoint) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.options.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (error) {
      // Re-añadir al buffer si falla
      this.buffer = [...entries, ...this.buffer].slice(0, this.options.maxBufferSize);
      console.error("Failed to flush logs:", error);
    }
  }

  /**
   * Cierra el logger
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// ============================================================================
// INSTANCIA GLOBAL
// ============================================================================

let globalLogger: Logger | null = null;

/**
 * Obtiene el logger global
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger({
      level: (process.env.LOG_LEVEL as LogLevel) || "info",
      context: "piano-emotion",
    });
  }
  return globalLogger;
}

/**
 * Crea un logger con contexto específico
 */
export function createLogger(context: string, options?: Omit<LoggerOptions, "context">): Logger {
  return new Logger({ ...options, context });
}

// ============================================================================
// MIDDLEWARE DE LOGGING
// ============================================================================

/**
 * Middleware para logging de requests (para Express/tRPC)
 */
export function requestLoggerMiddleware() {
  const logger = getLogger().child("http");
  
  return (req: { method: string; url: string; headers?: Record<string, string> }, res: { statusCode: number }, next: () => void) => {
    const start = Date.now();
    
    // Capturar cuando termine la respuesta
    const originalEnd = (res as any).end;
    (res as any).end = function(...args: unknown[]) {
      const duration = Date.now() - start;
      
      logger.request({
        method: req.method,
        path: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers?.["user-agent"],
      });
      
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Logger };
export type { LogLevel, LogEntry, LoggerOptions, RequestLogData };
