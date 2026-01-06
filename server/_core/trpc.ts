import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  console.log('[DEBUG] requireUser middleware - ctx.user:', ctx.user ? { id: ctx.user.id, openId: ctx.user.openId, email: ctx.user.email, partnerId: ctx.partnerId, language: ctx.language } : 'null/undefined');
  console.log('[DEBUG] requireUser middleware - ctx.user exists:', !!ctx.user);
  console.log('[DEBUG] requireUser middleware - ctx.partnerId:', ctx.partnerId);
  console.log('[DEBUG] requireUser middleware - ctx.language:', ctx.language);

  if (!ctx.user) {
    console.log('[DEBUG] requireUser middleware - REJECTING request: ctx.user is null/undefined');
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  
  if (!ctx.partnerId) {
    console.log('[DEBUG] requireUser middleware - WARNING: ctx.partnerId is null/undefined');
  }
  
  console.log('[DEBUG] requireUser middleware - ALLOWING request: ctx.user is valid');

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

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
