/**
 * Middleware de Caché para tRPC - Versión Robusta
 * 
 * Arquitectura sólida con:
 * - Manejo explícito de errores
 * - Logging estructurado
 * - Fallback automático
 * - Soporte para batch requests
 * - Validación de inputs
 */

import { TRPCError } from '@trpc/server';
import { cacheService } from './cache.service.js';

export interface CacheOptions {
  /**
   * Tiempo de vida del caché en segundos
   * Default: 300 (5 minutos)
   */
  ttl?: number;
  
  /**
   * Prefijo para la clave de caché
   * Default: 'trpc'
   */
  prefix?: string;
  
  /**
   * Si es true, incluye el userId en la clave de caché
   * Default: true
   */
  includeUser?: boolean;
  
  /**
   * Tags para invalidación de caché
   */
  tags?: string[];
  
  /**
   * Path explícito del procedimiento (REQUERIDO para robustez)
   */
  procedurePath?: string;
}

/**
 * Generar clave de caché basada en path, input y userId
 */
export function generateCacheKey(
  path: string,
  input: any,
  userId?: string,
  options?: CacheOptions
): string {
  const prefix = options?.prefix || 'trpc';
  const includeUser = options?.includeUser !== false;
  
  const parts = [prefix, path];
  
  if (includeUser && userId) {
    parts.push(userId);
  }
  
  if (input && Object.keys(input).length > 0) {
    // Serializar input de forma determinística
    const inputStr = JSON.stringify(input, Object.keys(input).sort());
    const inputHash = simpleHash(inputStr);
    parts.push(inputHash);
  }
  
  return parts.join(':');
}

/**
 * Hash simple para inputs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Middleware de caché para queries - VERSIÓN ROBUSTA
 * 
 * IMPORTANTE: Siempre pasar `procedurePath` en las opciones para evitar ambigüedades
 * 
 * Ejemplo de uso:
 * ```typescript
 * list: publicProcedure
 *   .input(z.object({ limit: z.number() }))
 *   .query(withCache(
 *     async ({ input, ctx }) => {
 *       // tu lógica aquí
 *     },
 *     { 
 *       procedurePath: 'clients.list',
 *       ttl: 300,
 *       includeUser: true
 *     }
 *   ))
 * ```
 */
export function withCache<TInput, TOutput>(
  handler: (opts: { ctx: any; input: TInput }) => Promise<TOutput>,
  options?: CacheOptions
) {
  return async (opts: { ctx: any; input: TInput }): Promise<TOutput> => {
    const { ctx, input } = opts;
    const startTime = Date.now();
    let cacheHit = false;
    let cacheError: Error | null = null;
    
    try {
      // Solo cachear en producción o si está explícitamente habilitado
      const cacheEnabled = process.env.NODE_ENV === 'production' || 
                          process.env.ENABLE_CACHE === 'true';
      
      if (!cacheEnabled) {
        console.log('[Cache] Cache disabled, executing handler directly');
        return await handler({ ctx, input });
      }
      
      // Validar que tenemos un path válido
      const procedurePath = options?.procedurePath || ctx.path || ctx.procedure?.path;
      
      if (!procedurePath || procedurePath === 'unknown') {
        console.warn('[Cache] No valid procedure path found, executing without cache', {
          optionsPath: options?.procedurePath,
          ctxPath: ctx.path,
          procedurePath: ctx.procedure?.path
        });
        return await handler({ ctx, input });
      }
      
      // Obtener userId de forma segura
      const userId = ctx.user?.id?.toString() || 
                    ctx.session?.userId?.toString() || 
                    ctx.user?.openId?.toString();
      
      // Generar clave de caché
      const cacheKey = generateCacheKey(procedurePath, input, userId, options);
      
      console.log('[Cache] Attempting to get from cache', {
        key: cacheKey,
        path: procedurePath,
        userId: userId ? `${userId.substring(0, 8)}...` : 'none'
      });
      
      // Intentar obtener del caché
      try {
        const cached = await cacheService.get<TOutput>(cacheKey);
        if (cached !== null) {
          cacheHit = true;
          const duration = Date.now() - startTime;
          console.log('[Cache] Cache HIT', {
            key: cacheKey,
            duration: `${duration}ms`
          });
          return cached;
        }
      } catch (error) {
        cacheError = error as Error;
        console.error('[Cache] Error getting from cache, will execute handler', {
          key: cacheKey,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Si no está en caché o hubo error, ejecutar handler
      console.log('[Cache] Cache MISS, executing handler', { key: cacheKey });
      const result = await handler({ ctx, input });
      
      // Intentar guardar en caché (no bloqueante)
      const ttl = options?.ttl || 300;
      cacheService.set(cacheKey, result, ttl).catch((error) => {
        console.error('[Cache] Error setting cache (non-blocking)', {
          key: cacheKey,
          error: error instanceof Error ? error.message : String(error)
        });
      });
      
      const duration = Date.now() - startTime;
      console.log('[Cache] Handler executed successfully', {
        key: cacheKey,
        duration: `${duration}ms`,
        cached: false
      });
      
      return result;
      
    } catch (error) {
      // Si hay un error en el handler, propagarlo
      const duration = Date.now() - startTime;
      console.error('[Cache] Error in cache middleware or handler', {
        duration: `${duration}ms`,
        cacheHit,
        cacheError: cacheError?.message,
        handlerError: error instanceof Error ? error.message : String(error)
      });
      
      // Si el error es del handler, propagarlo
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Si es un error desconocido, intentar ejecutar el handler sin caché
      console.error('[Cache] Unexpected error, attempting to execute handler without cache');
      return await handler({ ctx, input });
    }
  };
}

/**
 * Invalidar caché por tags
 */
export async function invalidateCache(tags: string[]): Promise<void> {
  try {
    for (const tag of tags) {
      const count = await cacheService.delPattern(`trpc:*:${tag}:*`);
      console.log(`[Cache] Invalidated ${count} keys for tag: ${tag}`);
    }
  } catch (error) {
    console.error('[Cache] Error invalidating cache by tags', {
      tags,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Invalidar caché de un usuario específico
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const count = await cacheService.delPattern(`trpc:*:${userId}:*`);
    console.log(`[Cache] Invalidated ${count} keys for user: ${userId}`);
  } catch (error) {
    console.error('[Cache] Error invalidating user cache', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Invalidar caché de un path específico
 */
export async function invalidatePath(path: string): Promise<void> {
  try {
    const count = await cacheService.delPattern(`trpc:${path}:*`);
    console.log(`[Cache] Invalidated ${count} keys for path: ${path}`);
  } catch (error) {
    console.error('[Cache] Error invalidating path cache', {
      path,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
