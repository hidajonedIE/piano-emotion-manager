/**
 * Auth Router
 * Gestión de autenticación
 */
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { publicProcedure, router } from "../_core/trpc.js";
import { withCache } from "../lib/cache.middleware.js";
import { withQueue } from "../lib/queue.js";

export const authRouter = router({
  me: publicProcedure.query(withCache(
    async (opts) => withQueue(async () => opts.ctx.user),
    { ttl: 300, prefix: 'auth', includeUser: true, procedurePath: 'auth.me' }
  )),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    // Clear cookie by setting it with expired date
    const cookieValue = `${COOKIE_NAME}=; Path=${cookieOptions.path || '/'}; HttpOnly; SameSite=${cookieOptions.sameSite || 'Lax'}; Max-Age=0`;
    // Set cookie header - works with both Express and Vercel responses
    if (typeof ctx.res.setHeader === 'function') {
      ctx.res.setHeader('Set-Cookie', cookieValue);
    } else if (ctx.res.headers && typeof ctx.res.headers.set === 'function') {
      ctx.res.headers.set('Set-Cookie', cookieValue);
    }
    return { success: true } as const;
  }),
});
