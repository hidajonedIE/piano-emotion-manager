/**
 * Admin Router
 * Endpoints administrativos para mantenimiento de la BD
 * NOTA: Solo disponible en desarrollo
 */

import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { clients, pianos, services } from "../../drizzle/schema.js";
import { z } from "zod";

export const adminRouter = router({
  fixOdIds: protectedProcedure
    .input(z.object({
      odId: z.string().optional(),
      partnerId: z.string().optional(),
      organizationId: z.string().optional(),
      forceCreate: z.boolean().optional()
    }).optional())
    .mutation(async ({ ctx, input }) => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        const correctOdId = input?.odId || "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";
        const partnerId = input?.partnerId || "partner_test_1";
        const organizationId = input?.organizationId || "org_test_1";

        console.log(`🔍 Iniciando fix masivo para odId: ${correctOdId}`);

        // 1. Actualizar registros existentes
        await database.update(clients).set({ odId: correctOdId, partnerId, organizationId }).execute();
        await database.update(pianos).set({ odId: correctOdId, partnerId, organizationId }).execute();
        await database.update(services).set({ odId: correctOdId, partnerId, organizationId }).execute();

        // 2. Si se solicita creación forzada, inyectar datos nuevos
        if (input?.forceCreate) {
          console.log("🏗️ Creando pianos de prueba nuevos...");
          
          const pianosToCreate = [
            { brand: "Yamaha", model: "U3", type: "vertical", serialNumber: "Y12345", odId: correctOdId, partnerId, organizationId },
            { brand: "Steinway", model: "Model B", type: "grand", serialNumber: "S67890", odId: correctOdId, partnerId, organizationId },
            { brand: "Kawai", model: "K-300", type: "vertical", serialNumber: "K11223", odId: correctOdId, partnerId, organizationId },
            { brand: "Bösendorfer", model: "225", type: "grand", serialNumber: "B44556", odId: correctOdId, partnerId, organizationId },
            { brand: "Petrof", model: "P 125", type: "vertical", serialNumber: "P77889", odId: correctOdId, partnerId, organizationId },
            { brand: "Fazioli", model: "F278", type: "grand", serialNumber: "F99001", odId: correctOdId, partnerId, organizationId }
          ];

          for (const piano of pianosToCreate) {
            await database.insert(pianos).values(piano as any).execute();
          }
          
          console.log("🏗️ Creando servicios de prueba nuevos...");
          const servicesToCreate = [
            { name: "Afinación Estándar", description: "Afinación completa a 440Hz", price: 90, odId: correctOdId, partnerId, organizationId },
            { name: "Regulación Mecánica", description: "Ajuste de maquinaria y teclado", price: 150, odId: correctOdId, partnerId, organizationId },
            { name: "Limpieza Integral", description: "Limpieza profunda interior y exterior", price: 60, odId: correctOdId, partnerId, organizationId }
          ];

          for (const service of servicesToCreate) {
            await database.insert(services).values(service as any).execute();
          }
        }

        return {
          success: true,
          message: "Datos vinculados y generados correctamente",
          results: { odId: correctOdId, partnerId, organizationId }
        };
      } catch (error) {
        console.error("❌ Error en fixOdIds:", error);
        throw error;
      }
    }),

  diagnoseData: protectedProcedure
    .query(async () => {
      try {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");

        // Obtener una muestra de cada tabla sin filtros
        const allClients = await database.select().from(clients).limit(5).execute();
        const allPianos = await database.select().from(pianos).limit(5).execute();
        const allServices = await database.select().from(services).limit(5).execute();

        return {
          clients: allClients,
          pianos: allPianos,
          services: allServices,
        };
      } catch (error) {
        console.error("❌ Error en diagnoseData:", error);
        throw error;
      }
    }),
});
