/**
 * Servicio de Caché con Redis
 * 
 * Implementa caché en memoria para reducir carga en base de datos
 * Soporta TTL, invalidación y estrategias de caché
 */

import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private useMemoryFallback: boolean = false;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();

  /**
   * Inicializar conexión a Redis
   */
  async connect(): Promise<void> {
    try {
      // Intentar conectar a Redis (Vercel KV o Redis externo)
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      
      if (!redisUrl) {
        console.warn('⚠️  No REDIS_URL configured, using in-memory cache fallback');
        this.useMemoryFallback = true;
        this.isConnected = true;
        return;
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('❌ Redis connection failed after 3 retries, using memory fallback');
              this.useMemoryFallback = true;
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.useMemoryFallback = true;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.useMemoryFallback = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.useMemoryFallback = true;
      this.isConnected = true;
    }
  }

  /**
   * Obtener valor del caché
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useMemoryFallback) {
        return this.getFromMemory<T>(key);
      }

      if (!this.client || !this.isConnected) {
        return null;
      }

      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Establecer valor en caché con TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      if (this.useMemoryFallback) {
        return this.setInMemory(key, value, ttlSeconds);
      }

      if (!this.client || !this.isConnected) {
        return false;
      }

      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
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

      await this.client.del(keys);
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
    
    // Guardar en caché
    await this.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Cerrar conexión
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected && !this.useMemoryFallback) {
      await this.client.quit();
      this.isConnected = false;
    }
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

// Inicializar al importar
cacheService.connect().catch((err) => {
  console.error('Failed to initialize cache service:', err);
});
