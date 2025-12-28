/**
 * Auth Router
 * Gestión de autenticación
 */
import { COOKIE_NAME } from "../../shared/const.js";
import { getSessionCookieOptions } from "../.core/cookies.js";
import { publicProcedure, router } from "../.core/trpc.js";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  
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
