import { TRPCError } from '@trpc/server';

/**
 * Rate limiting middleware para tRPC
 * Limita el número de requests por usuario en una ventana de tiempo
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Map para almacenar los contadores de rate limiting
// En producción, esto debería usar Redis para compartir entre instancias serverless
const rateLimitMap = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /**
   * Máximo número de requests permitidos en la ventana de tiempo
   * @default 100
   */
  maxRequests?: number;
  
  /**
   * Ventana de tiempo en milisegundos
   * @default 60000 (1 minuto)
   */
  windowMs?: number;
  
  /**
   * Mensaje de error personalizado
   */
  message?: string;
}

/**
 * Middleware de rate limiting para tRPC
 * 
 * @example
 * ```typescript
 * // En un router
 * .query(
 *   rateLimit({ maxRequests: 10, windowMs: 60000 })(
 *     async ({ ctx, input }) => {
 *       // handler
 *     }
 *   )
 * )
 * ```
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minuto por defecto
    message = 'Too many requests, please try again later'
  } = options;

  return <TInput, TOutput>(
    handler: (opts: { ctx: any; input: TInput }) => Promise<TOutput>
  ) => {
    return async (opts: { ctx: any; input: TInput }): Promise<TOutput> => {
      const { ctx } = opts;
      
      // Identificar al usuario por ID o IP
      const identifier = ctx.user?.id?.toString() || ctx.ip || 'anonymous';
      const now = Date.now();
      
      // Obtener o crear entrada de rate limiting
      let entry = rateLimitMap.get(identifier);
      
      if (!entry || now > entry.resetTime) {
        // Nueva ventana de tiempo
        entry = {
          count: 1,
          resetTime: now + windowMs
        };
        rateLimitMap.set(identifier, entry);
        
        // Ejecutar handler
        return await handler(opts);
      }
      
      // Verificar si se excedió el límite
      if (entry.count >= maxRequests) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        console.warn('[Rate Limit] Limit exceeded', {
          identifier,
          count: entry.count,
          maxRequests,
          resetIn
        });
        
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `${message}. Try again in ${resetIn} seconds.`
        });
      }
      
      // Incrementar contador
      entry.count++;
      
      // Ejecutar handler
      return await handler(opts);
    };
  };
}

/**
 * Rate limiting más estricto para operaciones de escritura
 */
export const strictRateLimit = rateLimit({
  maxRequests: 20,
  windowMs: 60000, // 20 requests por minuto
  message: 'Too many write operations'
});

/**
 * Rate limiting moderado para operaciones de lectura
 */
export const moderateRateLimit = rateLimit({
  maxRequests: 100,
  windowMs: 60000, // 100 requests por minuto
  message: 'Too many read operations'
});

/**
 * Rate limiting permisivo para endpoints de autenticación
 */
export const authRateLimit = rateLimit({
  maxRequests: 10,
  windowMs: 60000, // 10 requests por minuto
  message: 'Too many authentication attempts'
});
