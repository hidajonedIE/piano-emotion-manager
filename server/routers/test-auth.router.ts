/**
 * Test Auth Router - Para verificar que la autenticación funciona
 */
import { protectedProcedure, router } from "../_core/trpc.js";

export const testAuthRouter = router({
  // Endpoint simple para verificar autenticación
  whoami: protectedProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      user: {
        openId: ctx.user.email,
        email: ctx.user.email,
        name: ctx.user.name,
      },
      message: "Autenticación funcionando correctamente"
    };
  }),
});
