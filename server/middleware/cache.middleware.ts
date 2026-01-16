/**
 * Middleware de Caché para tRPC
 * 
 * Intercepta queries y cachea resultados automáticamente
 */

import { TRPCError } from '@trpc/server';
import { cacheService } from '../services/cache.service.js';

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
 * Middleware de caché para queries
 */
export function withCache<TInput, TOutput>(
  handler: (input: TInput, ctx: any) => Promise<TOutput>,
  options?: CacheOptions
) {
  return async (input: TInput, ctx: any): Promise<TOutput> => {
    // Solo cachear en producción o si está explícitamente habilitado
    const cacheEnabled = process.env.NODE_ENV === 'production' || 
                        process.env.ENABLE_CACHE === 'true';
    
    if (!cacheEnabled) {
      return handler(input, ctx);
    }
    
    // Generar clave de caché
    const userId = ctx.user?.id || ctx.session?.userId;
    const path = ctx.path || 'unknown';
    const cacheKey = generateCacheKey(path, input, userId, options);
    
    // Intentar obtener del caché
    const cached = await cacheService.get<TOutput>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Si no está en caché, ejecutar handler
    const result = await handler(input, ctx);
    
    // Guardar en caché
    const ttl = options?.ttl || 300; // 5 minutos por defecto
    await cacheService.set(cacheKey, result, ttl);
    
    return result;
  };
}

/**
 * Invalidar caché por tags
 */
export async function invalidateCache(tags: string[]): Promise<void> {
  for (const tag of tags) {
    await cacheService.delPattern(`trpc:*:${tag}:*`);
  }
}

/**
 * Invalidar caché de un usuario específico
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheService.delPattern(`trpc:*:${userId}:*`);
}

/**
 * Invalidar caché de un path específico
 */
export async function invalidatePath(path: string): Promise<void> {
  await cacheService.delPattern(`trpc:${path}:*`);
}
