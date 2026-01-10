/**
 * Admin Router
 * Endpoints administrativos para mantenimiento de la BD
 * NOTA: Solo disponible en desarrollo
 */

import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { clients, pianos, services } from "../../drizzle/schema.js";

export const adminRouter = router({
  fixOdIds: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Solo permitir en desarrollo
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Este endpoint solo está disponible en desarrollo");
      }

      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const correctOdId = "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";

        console.log("🔍 Iniciando fix de odId...");

        // Actualizar clientes
        const clientsUpdateResult = await database
          .update(clients)
          .set({ odId: correctOdId })
          .execute();

        console.log(`✅ ${clientsUpdateResult.rowsAffected} clientes actualizados`);

        // Actualizar pianos
        const pianosUpdateResult = await database
          .update(pianos)
          .set({ odId: correctOdId })
          .execute();

        console.log(`✅ ${pianosUpdateResult.rowsAffected} pianos actualizados`);

        // Actualizar servicios
        const servicesUpdateResult = await database
          .update(services)
          .set({ odId: correctOdId })
          .execute();

        console.log(`✅ ${servicesUpdateResult.rowsAffected} servicios actualizados`);

        return {
          success: true,
          message: "odId actualizado correctamente",
          results: {
            clientsUpdated: clientsUpdateResult.rowsAffected,
            pianosUpdated: pianosUpdateResult.rowsAffected,
            servicesUpdated: servicesUpdateResult.rowsAffected,
          },
        };
      } catch (error) {
        console.error("❌ Error en fixOdIds:", error);
        throw error;
      }
    }),
});
