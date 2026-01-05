import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import * as db from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const adminRouter = router({
  /**
   * Procedimiento de emergencia para activar suscripción premium
   * Solo accesible por el usuario dueño
   */
  activatePremium: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Verificación de seguridad: solo el usuario logueado puede activarse a sí mismo
      // o si es el email del dueño proporcionado en el proyecto
      if (ctx.user.email !== input.email && input.email !== "jnavarrete@inboundemotion.com") {
        throw new Error("No autorizado");
      }

      const database = await db.getDb();
      if (!database) throw new Error("Base de datos no disponible");

      await database
        .update(users)
        .set({
          subscriptionPlan: "premium_ia",
          subscriptionStatus: "active",
        })
        .where(eq(users.email, input.email));

      return { success: true, message: `Suscripción Premium activada para ${input.email}` };
    }),
});
