/**
 * Script para verificar el usuario autenticado y los datos asociados
 */
import { getDb } from '../server/db';
import { users, clients, pianos, services } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkUserAuth() {
  console.log('🔍 Verificando configuración de usuario...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }

  // 1. Listar todos los usuarios en la base de datos
  console.log('📋 Usuarios en la base de datos:');
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos\n');
  } else {
    allUsers.forEach(user => {
      console.log(`  ID: ${user.id}`);
      console.log(`  OpenID: ${user.openId}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Login Method: ${user.loginMethod}`);
      console.log(`  Last Signed In: ${user.lastSignedIn}`);
      console.log('');
    });
  }

  // 2. Verificar clientes por cada usuario
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Clientes por usuario:\n');

  for (const user of allUsers) {
    const userClients = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, user.openId || ''));

    console.log(`Usuario: ${user.email} (OpenID: ${user.openId})`);
    console.log(`  Clientes: ${userClients.length}`);

    if (userClients.length > 0) {
      // Contar pianos para este usuario
      let totalPianos = 0;
      let totalServices = 0;

      for (const client of userClients) {
        const clientPianos = await db
          .select()
          .from(pianos)
          .where(eq(pianos.clientId, client.id));
        
        totalPianos += clientPianos.length;

        for (const piano of clientPianos) {
          const pianoServices = await db
            .select()
            .from(services)
            .where(eq(services.pianoId, piano.id));
          
          totalServices += pianoServices.length;
        }
      }

      console.log(`  Pianos: ${totalPianos}`);
      console.log(`  Servicios: ${totalServices}`);
    }
    console.log('');
  }

  // 3. Verificar el OWNER_ID esperado
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 Verificando OWNER_ID esperado:\n');
  
  const expectedOwnerId = 'jnavarrete-inboundemotion';
  const clientsWithExpectedOwner = await db
    .select()
    .from(clients)
    .where(eq(clients.ownerId, expectedOwnerId));

  console.log(`OWNER_ID buscado: ${expectedOwnerId}`);
  console.log(`Clientes encontrados: ${clientsWithExpectedOwner.length}`);

  if (clientsWithExpectedOwner.length > 0) {
    console.log('✅ Hay datos con este OWNER_ID');
  } else {
    console.log('❌ NO hay datos con este OWNER_ID');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 CONCLUSIÓN:');
  console.log('   Para que las alertas funcionen, el usuario autenticado en Clerk');
  console.log('   debe tener un OpenID que coincida con el ownerId de los clientes.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

checkUserAuth().catch(console.error);
