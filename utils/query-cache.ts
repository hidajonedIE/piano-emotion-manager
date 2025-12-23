/**
 * Utilidad de caché para optimizar consultas repetidas
 * Implementa un sistema de caché en memoria con TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Obtiene un valor de la caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda un valor en la caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene o calcula un valor (patrón cache-aside)
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Obtiene estadísticas de la caché
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instancia singleton
export const queryCache = new QueryCache();

// Claves de caché predefinidas
export const CACHE_KEYS = {
  clients: (userId: string) => `clients:${userId}`,
  client: (userId: string, clientId: string) => `client:${userId}:${clientId}`,
  pianos: (userId: string) => `pianos:${userId}`,
  piano: (userId: string, pianoId: string) => `piano:${userId}:${pianoId}`,
  pianosByClient: (userId: string, clientId: string) => `pianos:${userId}:client:${clientId}`,
  services: (userId: string) => `services:${userId}`,
  service: (userId: string, serviceId: string) => `service:${userId}:${serviceId}`,
  servicesByClient: (userId: string, clientId: string) => `services:${userId}:client:${clientId}`,
  servicesByPiano: (userId: string, pianoId: string) => `services:${userId}:piano:${pianoId}`,
  appointments: (userId: string) => `appointments:${userId}`,
  appointment: (userId: string, appointmentId: string) => `appointment:${userId}:${appointmentId}`,
  invoices: (userId: string) => `invoices:${userId}`,
  invoice: (userId: string, invoiceId: string) => `invoice:${userId}:${invoiceId}`,
  inventory: (userId: string) => `inventory:${userId}`,
  stats: (userId: string, period: string) => `stats:${userId}:${period}`,
};

// TTLs específicos por tipo de dato (en milisegundos)
export const CACHE_TTL = {
  short: 1 * 60 * 1000,      // 1 minuto - para datos que cambian frecuentemente
  medium: 5 * 60 * 1000,     // 5 minutos - para listas
  long: 15 * 60 * 1000,      // 15 minutos - para datos estáticos
  veryLong: 60 * 60 * 1000,  // 1 hora - para configuraciones
};

// Hook para invalidar caché cuando se modifican datos
export const invalidateCacheOnMutation = {
  clients: (userId: string) => {
    queryCache.invalidatePattern(`clients:${userId}`);
    queryCache.invalidatePattern(`client:${userId}`);
  },
  pianos: (userId: string) => {
    queryCache.invalidatePattern(`pianos:${userId}`);
    queryCache.invalidatePattern(`piano:${userId}`);
  },
  services: (userId: string) => {
    queryCache.invalidatePattern(`services:${userId}`);
    queryCache.invalidatePattern(`service:${userId}`);
    queryCache.invalidatePattern(`stats:${userId}`);
  },
  appointments: (userId: string) => {
    queryCache.invalidatePattern(`appointments:${userId}`);
    queryCache.invalidatePattern(`appointment:${userId}`);
  },
  invoices: (userId: string) => {
    queryCache.invalidatePattern(`invoices:${userId}`);
    queryCache.invalidatePattern(`invoice:${userId}`);
    queryCache.invalidatePattern(`stats:${userId}`);
  },
  inventory: (userId: string) => {
    queryCache.invalidatePattern(`inventory:${userId}`);
  },
  all: (userId: string) => {
    queryCache.invalidatePattern(userId);
  },
};
