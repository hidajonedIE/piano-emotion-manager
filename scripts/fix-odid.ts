/**
 * Script para corregir los odId de clientes, pianos y servicios
 * Usa el odId correcto del usuario jnavarrete
 */

import { getDb } from "../server/db.js";
import { clients, pianos, services } from "../drizzle/schema.js";

async function fixOdIds() {
  try {
    console.log("🔍 Obteniendo conexión a la BD...");
    const db = await getDb();
    
    if (!db) {
      throw new Error("No se pudo conectar a la BD");
    }
    
    // El odId correcto del usuario jnavarrete
    const correctOdId = "user_37Nq41VhiCgFUQ1dUPyH8fn25j6";
    
    console.log(`✅ Usando odId: ${correctOdId}`);
    
    // Actualizar clientes
    console.log("\n👥 Actualizando clientes...");
    const clientsResult = await db
      .select({ id: clients.id, odId: clients.odId })
      .from(clients);
    
    console.log(`   Clientes encontrados: ${clientsResult.length}`);
    
    if (clientsResult.length > 0) {
      const updateResult = await db
        .update(clients)
        .set({ odId: correctOdId })
        .execute();
      
      console.log(`   ✅ ${updateResult.rowsAffected} clientes actualizados`);
    }
    
    // Actualizar pianos
    console.log("\n🎹 Actualizando pianos...");
    const pianosResult = await db
      .select({ id: pianos.id, odId: pianos.odId })
      .from(pianos);
    
    console.log(`   Pianos encontrados: ${pianosResult.length}`);
    
    if (pianosResult.length > 0) {
      const updateResult = await db
        .update(pianos)
        .set({ odId: correctOdId })
        .execute();
      
      console.log(`   ✅ ${updateResult.rowsAffected} pianos actualizados`);
    }
    
    // Actualizar servicios
    console.log("\n🔧 Actualizando servicios...");
    const servicesResult = await db
      .select({ id: services.id, odId: services.odId })
      .from(services);
    
    console.log(`   Servicios encontrados: ${servicesResult.length}`);
    
    if (servicesResult.length > 0) {
      const updateResult = await db
        .update(services)
        .set({ odId: correctOdId })
        .execute();
      
      console.log(`   ✅ ${updateResult.rowsAffected} servicios actualizados`);
    }
    
    console.log("\n✨ ¡Proceso completado exitosamente!");
    console.log(`   Todos los registros ahora tienen odId: ${correctOdId}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixOdIds();
