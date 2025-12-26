/**
 * Cache Service
 * Sistema de caché en memoria para optimizar consultas frecuentes
 */

// ============================================================================
// TIPOS
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

interface CacheOptions {
  ttl?: number; // TTL por defecto en ms
  maxEntries?: number;
  cleanupInterval?: number; // Intervalo de limpieza en ms
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const DEFAULT_MAX_ENTRIES = 1000;
const DEFAULT_CLEANUP_INTERVAL = 60 * 1000; // 1 minuto

// TTLs específicos por tipo de dato
export const CACHE_TTLS = {
  // Datos que cambian poco
  businessInfo: 30 * 60 * 1000, // 30 minutos
  settings: 15 * 60 * 1000, // 15 minutos
  templates: 60 * 60 * 1000, // 1 hora
  
  // Datos que cambian moderadamente
  clients: 5 * 60 * 1000, // 5 minutos
  pianos: 5 * 60 * 1000, // 5 minutos
  inventory: 5 * 60 * 1000, // 5 minutos
  
  // Datos que cambian frecuentemente
  appointments: 2 * 60 * 1000, // 2 minutos
  services: 2 * 60 * 1000, // 2 minutos
  invoices: 2 * 60 * 1000, // 2 minutos
  quotes: 2 * 60 * 1000, // 2 minutos
  
  // Datos en tiempo real
  dashboardStats: 30 * 1000, // 30 segundos
  notifications: 30 * 1000, // 30 segundos
};

// ============================================================================
// CLASE CACHE
// ============================================================================

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private options: Required<CacheOptions>;
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || DEFAULT_TTL,
      maxEntries: options.maxEntries || DEFAULT_MAX_ENTRIES,
      cleanupInterval: options.cleanupInterval || DEFAULT_CLEANUP_INTERVAL,
    };

    // Iniciar limpieza periódica
    this.startCleanup();
  }

  /**
   * Genera una clave de caché única
   */
  generateKey(namespace: string, ...parts: (string | number | undefined)[]): string {
    const validParts = parts.filter(p => p !== undefined);
    return `${namespace}:${validParts.join(":")}`;
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Almacena un valor en el caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Verificar límite de entradas
    if (this.cache.size >= this.options.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl,
      hits: 0,
    });
  }

  /**
   * Obtiene o calcula un valor (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalida todas las entradas de un namespace
   */
  invalidateNamespace(namespace: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalida todas las entradas de un usuario
   */
  invalidateUser(userId: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(`:${userId}:`) || key.endsWith(`:${userId}`)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Verifica si una clave existe y no ha expirado
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Obtiene el tiempo restante de vida de una entrada
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const remaining = entry.ttl - (Date.now() - entry.timestamp);
    return remaining > 0 ? remaining : null;
  }

  /**
   * Extiende el TTL de una entrada
   */
  touch(key: string, additionalTtl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.timestamp = Date.now();
    if (additionalTtl) {
      entry.ttl = additionalTtl;
    }
    
    return true;
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Inicia el proceso de limpieza periódica
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      // Log opcional para debugging
      // console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Elimina las entradas más antiguas cuando se alcanza el límite
   */
  private evictOldest(): void {
    // Encontrar la entrada más antigua con menos hits
    let oldestKey: string | null = null;
    let oldestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score basado en antigüedad y popularidad
      const age = Date.now() - entry.timestamp;
      const score = entry.hits / (age / 1000); // hits por segundo
      
      if (score < oldestScore) {
        oldestScore = score;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Estima el uso de memoria del caché
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Estimación aproximada
      size += key.length * 2; // Caracteres UTF-16
      size += JSON.stringify(entry.data).length * 2;
      size += 32; // Overhead del objeto
    }
    
    return size;
  }

  /**
   * Detiene el servicio de caché
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

let cacheInstance: CacheService | null = null;

/**
 * Obtiene la instancia del servicio de caché
 */
export function getCache(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

/**
 * Crea una nueva instancia de caché (para testing)
 */
export function createCache(options?: CacheOptions): CacheService {
  return new CacheService(options);
}

// ============================================================================
// DECORADORES Y HELPERS
// ============================================================================

/**
 * Helper para crear claves de caché consistentes
 */
export function cacheKey(namespace: string, userId: string, ...params: (string | number)[]): string {
  return getCache().generateKey(namespace, userId, ...params);
}

/**
 * Wrapper para funciones con caché automático
 */
export function withCache<T>(
  keyOrFactory: string | (() => string),
  ttl: number = DEFAULT_TTL
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCache();
      const key = typeof keyOrFactory === "function" 
        ? keyOrFactory() 
        : `${keyOrFactory}:${JSON.stringify(args)}`;

      const cached = cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };

    return descriptor;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CacheService };
export type { CacheEntry, CacheStats, CacheOptions };
