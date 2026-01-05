/**
 * Cache Module - Redis Integration
 * Proporciona funciones de caché para optimizar consultas frecuentes
 */
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

/**
 * Obtiene o crea el cliente de Redis
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  // Si ya existe un cliente conectado, devolverlo
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Si no hay URL de Redis configurada, retornar null (modo sin caché)
  if (!process.env.REDIS_URL) {
    console.warn('[Cache] REDIS_URL not configured, caching disabled');
    return null;
  }

  // Evitar múltiples intentos de conexión simultáneos
  if (isConnecting) {
    // Esperar a que termine la conexión en curso
    await new Promise(resolve => setTimeout(resolve, 100));
    return redisClient?.isOpen ? redisClient : null;
  }

  try {
    isConnecting = true;
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Reintentar cada 1 segundo, máximo 10 veces
          if (retries > 10) {
            console.error('[Cache] Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return 1000;
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis Client Connected');
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('[Cache] Failed to connect to Redis:', error);
    redisClient = null;
    return null;
  }
}

/**
 * Obtiene un valor del caché
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Cache] Error getting cached value:', error);
    return null;
  }
}

/**
 * Guarda un valor en el caché con TTL (Time To Live)
 */
export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number = 600 // 10 minutos por defecto
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch (error) {
    console.error('[Cache] Error setting cached value:', error);
  }
}

/**
 * Elimina un valor del caché
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(key);
  } catch (error) {
    console.error('[Cache] Error deleting cached value:', error);
  }
}

/**
 * Elimina múltiples valores del caché que coincidan con un patrón
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('[Cache] Error deleting cached pattern:', error);
  }
}

/**
 * Cierra la conexión de Redis (para cleanup)
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    if (redisClient?.isOpen) {
      await redisClient.quit();
      redisClient = null;
    }
  } catch (error) {
    console.error('[Cache] Error closing Redis connection:', error);
  }
}
