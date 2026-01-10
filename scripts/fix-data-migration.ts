/**
 * Script de migración para corregir los odId de los datos de prueba
 * Se ejecuta directamente en el servidor
 */

import { getDb } from "../server/db.js";
import { clients, pianos, services } from "../drizzle/schema.js";

async function runMigration() {
  console.log("🚀 Iniciando migración de datos...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ No se pudo conectar a la base de datos");
      return;
    }

    const correctOdId = "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";
    console.log(`🔍 Actualizando registros al odId: ${correctOdId}`);

    // Actualizar Clientes
    const clientsResult = await db.update(clients).set({ odId: correctOdId }).execute();
    console.log(`✅ Clientes actualizados: ${clientsResult.rowsAffected}`);

    // Actualizar Pianos
    const pianosResult = await db.update(pianos).set({ odId: correctOdId }).execute();
    console.log(`✅ Pianos actualizados: ${pianosResult.rowsAffected}`);

    // Actualizar Servicios
    const servicesResult = await db.update(services).set({ odId: correctOdId }).execute();
    console.log(`✅ Servicios actualizados: ${servicesResult.rowsAffected}`);

    console.log("🎉 Migración completada con éxito");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
  }
}

runMigration().then(() => process.exit(0));
