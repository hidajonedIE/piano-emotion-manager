/**
 * Script para corregir los odId de clientes, pianos y servicios
 * Obtiene el odId correcto del usuario jnavarrete y actualiza todos los registros
 */

import { getDb } from "../server/db.js";
import { users, clients, pianos, services } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

async function fixOdIds() {
  try {
    console.log("🔍 Obteniendo conexión a la BD...");
    const db = await getDb();
    
    if (!db) {
      throw new Error("No se pudo conectar a la BD");
    }
    
    console.log("👤 Buscando usuario jnavarrete@inboundemotion.com...");
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        openId: users.openId,
      })
      .from(users)
      .where(eq(users.email, "jnavarrete@inboundemotion.com"))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      throw new Error("Usuario jnavarrete no encontrado");
    }
    
    const user = userResult[0];
    console.log(`✅ Usuario encontrado: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   OpenID (odId): ${user.openId}`);
    
    const correctOdId = user.openId;
    
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
