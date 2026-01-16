/**
 * Servicio de Caché con Upstash Redis
 * 
 * Implementa caché distribuido con Upstash Redis para reducir carga en base de datos
 * Soporta TTL, invalidación y estrategias de caché
 * Fallback automático a memoria si Redis no está disponible
 */

import { Redis } from '@upstash/redis';

class CacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private useMemoryFallback: boolean = false;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();
  private connectPromise: Promise<void> | null = null;

  constructor() {
    // Log inicial para debugging
    console.log('[Cache Service] 🔧 CONSTRUCTOR CALLED - Initial state', {
      timestamp: new Date().toISOString(),
      hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      redisUrlLength: process.env.UPSTASH_REDIS_REST_URL?.length || 0,
      redisTokenLength: process.env.UPSTASH_REDIS_REST_TOKEN?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });
  }

  /**
   * Inicializar conexión a Upstash Redis
   */
  async connect(): Promise<void> {
    try {
      // Intentar conectar a Upstash Redis
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
      
      console.log('[Cache Service] Attempting to connect to Redis', {
        hasUrl: !!redisUrl,
        hasToken: !!redisToken,
        urlPrefix: redisUrl ? redisUrl.substring(0, 30) + '...' : 'none',
        tokenLength: redisToken ? redisToken.length : 0
      });
      
      if (!redisUrl || !redisToken) {
        console.warn('⚠️  [Cache Service] No UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN configured, using in-memory cache fallback');
        this.useMemoryFallback = true;
        this.isConnected = true;
        return;
      }

      // Crear cliente de Upstash Redis (REST API)
      this.client = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      // Verificar conexión con un ping
      try {
        console.log('[Cache Service] Pinging Redis...');
        const pingResult = await this.client.ping();
        console.log('✅ [Cache Service] Upstash Redis connected successfully', { pingResult });
        this.isConnected = true;
        this.useMemoryFallback = false;
      } catch (pingError) {
        console.error('❌ [Cache Service] Upstash Redis ping failed, using memory fallback', {
          error: pingError instanceof Error ? pingError.message : String(pingError),
          stack: pingError instanceof Error ? pingError.stack : undefined
        });
        this.useMemoryFallback = true;
        this.isConnected = true;
      }
    } catch (error) {
      console.error('❌ [Cache Service] Failed to connect to Upstash Redis', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      this.useMemoryFallback = true;
      this.isConnected = true;
    }
  }

  /**
   * Asegurar que está conectado (lazy initialization)
   */
  private async ensureConnected(): Promise<void> {
    if (this.isConnected) return;
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.connect();
    await this.connectPromise;
  }

  /**
   * Obtener valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    console.log('[Cache Service] GET operation started', {
      key: key.substring(0, 50) + '...',
      useMemoryFallback: this.useMemoryFallback,
      isConnected: this.isConnected,
      hasClient: !!this.client
    });
    
    await this.ensureConnected();
    
    try {
      if (this.useMemoryFallback) {
        console.log('[Cache Service] Using MEMORY fallback for GET');
        return this.getFromMemory<T>(key);
      }

      if (!this.client || !this.isConnected) {
        return null;
      }

      const value = await this.client.get(key);
      if (!value) return null;

      // Upstash devuelve el valor parseado automáticamente si es JSON
      return value as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establecer valor en caché con TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    console.log('[Cache Service] SET operation started', {
      key: key.substring(0, 50) + '...',
      ttlSeconds,
      useMemoryFallback: this.useMemoryFallback,
      isConnected: this.isConnected,
      hasClient: !!this.client
    });
    
    await this.ensureConnected();
    
    try {
      if (this.useMemoryFallback) {
        console.log('[Cache Service] Using MEMORY fallback for SET');
        return this.setInMemory(key, value, ttlSeconds);
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      // Upstash maneja la serialización automáticamente
      await this.client.setex(key, ttlSeconds, value);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar valor del caché
   */
  async del(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        this.memoryCache.delete(key);
        return true;
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar múltiples claves por patrón
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (this.useMemoryFallback) {
        let count = 0;
        for (const key of this.memoryCache.keys()) {
          if (this.matchPattern(key, pattern)) {
            this.memoryCache.delete(key);
            count++;
          }
        }
        return count;
      }

      if (!this.client || !this.isConnected) {
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      // Eliminar todas las claves encontradas
      await Promise.all(keys.map(key => this.client!.del(key)));
      return keys.length;
    } catch (error) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        const cached = this.memoryCache.get(key);
        if (!cached) return false;
        if (Date.now() > cached.expiry) {
          this.memoryCache.delete(key);
          return false;
        }
        return true;
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtener o establecer (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si no está en caché, obtener del origen
    const value = await fetcher();
    
    // Guardar en caché (no bloqueante)
    this.set(key, value, ttlSeconds).catch(err => {
      console.error('Failed to cache value:', err);
    });
    
    return value;
  }

  /**
   * Cerrar conexión (no necesario para Upstash REST API)
   */
  async disconnect(): Promise<void> {
    // Upstash REST API no requiere cerrar conexión
    this.isConnected = false;
  }

  // ===== Métodos privados para fallback en memoria =====

  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    // Verificar si expiró
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    try {
      return JSON.parse(cached.value) as T;
    } catch {
      return null;
    }
  }

  private setInMemory(key: string, value: any, ttlSeconds: number): boolean {
    try {
      const serialized = JSON.stringify(value);
      const expiry = Date.now() + ttlSeconds * 1000;
      this.memoryCache.set(key, { value: serialized, expiry });
      
      // Limpieza periódica (evitar memory leaks)
      if (this.memoryCache.size > 1000) {
        this.cleanupMemoryCache();
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }
}

// Singleton instance
export const cacheService = new CacheService();

// NO inicializar al importar, usar lazy initialization
