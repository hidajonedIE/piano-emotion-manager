/**
 * Logger Service
 * Servicio centralizado de logging que solo muestra logs en desarrollo
 */

const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.enabled = options.enabled ?? isDev;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.enabled && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    const formattedMessage = `${timestamp} ${prefix} ${message}`;

    switch (level) {
      case 'debug':
        if (isDev) console.debug(formattedMessage, ...args);
        break;
      case 'info':
        if (isDev) console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }

  /**
   * Crear un logger con un prefijo específico
   */
  child(prefix: string): Logger {
    return new Logger({
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      enabled: this.enabled,
    });
  }
}

// Logger global
export const logger = new Logger();

// Crear loggers específicos para diferentes módulos
export const authLogger = logger.child('Auth');
export const apiLogger = logger.child('API');
export const dbLogger = logger.child('DB');
export const stripeLogger = logger.child('Stripe');
export const oauthLogger = logger.child('OAuth');
export const jobsLogger = logger.child('Jobs');
export const emailLogger = logger.child('Email');
export const notificationLogger = logger.child('Notification');

export default logger;
