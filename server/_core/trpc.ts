import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

// Rate limiting storage
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Global rate limiting middleware
const globalRateLimit = t.middleware(async (opts) => {
  const { ctx, next, path, type } = opts;
  
  // Identificar al usuario por ID o IP
  const identifier = ctx.user?.id?.toString() || 'anonymous';
  const now = Date.now();
  
  // Determinar límite según el tipo de operación
  const isWriteOperation = type === 'mutation';
  const maxRequests = isWriteOperation ? 20 : 100; // 20 para escritura, 100 para lectura
  const windowMs = 60000; // 1 minuto
  
  // Clave única por usuario y tipo de operación
  const key = `${identifier}:${type}`;
  
  // Obtener o crear entrada de rate limiting
  let entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Nueva ventana de tiempo
    entry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitMap.set(key, entry);
    return next();
  }
  
  // Verificar si se excedió el límite
  if (entry.count >= maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    
    console.warn('[Rate Limit] Limit exceeded', {
      identifier,
      type,
      path,
      count: entry.count,
      maxRequests,
      resetIn
    });
    
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Too many ${type === 'mutation' ? 'write' : 'read'} operations. Try again in ${resetIn} seconds.`
    });
  }
  
  // Incrementar contador
  entry.count++;
  
  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure.use(globalRateLimit);

const requireUser = t.middleware(async (opts) => {
  console.log('[DEBUG] Entering requireUser middleware...');
  const { ctx, next } = opts;
  
  console.log('[DEBUG] requireUser middleware - ctx.user:', ctx.user ? { id: ctx.user.id, openId: ctx.user.openId, email: ctx.user.email, partnerId: ctx.partnerId, language: ctx.language } : 'null/undefined');
  console.log('[DEBUG] requireUser middleware - ctx.user exists:', !!ctx.user);
  console.log('[DEBUG] requireUser middleware - ctx.partnerId:', ctx.partnerId);
  console.log('[DEBUG] requireUser middleware - ctx.language:', ctx.language);

  console.log('[DEBUG] Checking for user in context:', ctx.user ? `User ID: ${ctx.user.id}` : 'No user');
  if (!ctx.user) {
    console.log('[DEBUG] requireUser middleware - REJECTING request: ctx.user is null/undefined');
    console.error('[DEBUG] User not found in context, throwing UNAUTHORIZED error.');
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  
  if (!ctx.partnerId) {
    console.log('[DEBUG] requireUser middleware - WARNING: ctx.partnerId is null/undefined');
  }
  
  console.log('[DEBUG] requireUser middleware - ALLOWING request: ctx.user is valid');

  console.log('[DEBUG] User found, proceeding with procedure.');
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      partnerId: ctx.partnerId,
      language: ctx.language,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    console.log('[DEBUG] User found, proceeding with procedure.');
  return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
