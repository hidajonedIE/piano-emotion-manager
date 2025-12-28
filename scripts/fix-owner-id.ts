/**
 * Script para actualizar el ownerId de los clientes al openId correcto del usuario autenticado
 * 
 * Este script:
 * 1. Busca el usuario con email jnavarrete@inboundemotion.com en la tabla users
 * 2. Obtiene su openId (el ID de Clerk)
 * 3. Actualiza todos los clientes que tienen ownerId='jnavarrete-inboundemotion' 
 *    para usar el openId correcto
 */
import { getDb } from '../server/db';
import { users, clients } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const TARGET_EMAIL = 'jnavarrete@inboundemotion.com';
const OLD_OWNER_ID = 'jnavarrete-inboundemotion';

async function fixOwnerId() {
  console.log('🔧 Iniciando corrección de ownerId...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ No se pudo conectar a la base de datos');
    console.error('   Asegúrate de que DATABASE_URL esté configurada');
    process.exit(1);
  }

  // 1. Buscar el usuario por email
  console.log(`🔍 Buscando usuario con email: ${TARGET_EMAIL}`);
  const targetUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, TARGET_EMAIL))
    .limit(1);

  if (targetUsers.length === 0) {
    console.error(`❌ No se encontró usuario con email ${TARGET_EMAIL}`);
    console.error('   El usuario debe iniciar sesión al menos una vez para que Clerk lo registre en la BD');
    process.exit(1);
  }

  const targetUser = targetUsers[0];
  const correctOpenId = targetUser.openId;

  console.log(`✅ Usuario encontrado:`);
  console.log(`   ID: ${targetUser.id}`);
  console.log(`   OpenID (Clerk): ${correctOpenId}`);
  console.log(`   Email: ${targetUser.email}`);
  console.log(`   Name: ${targetUser.name}\n`);

  // 2. Verificar cuántos clientes tienen el ownerId incorrecto
  console.log(`🔍 Buscando clientes con ownerId='${OLD_OWNER_ID}'`);
  const clientsToUpdate = await db
    .select()
    .from(clients)
    .where(eq(clients.ownerId, OLD_OWNER_ID));

  console.log(`📊 Encontrados ${clientsToUpdate.length} clientes para actualizar\n`);

  if (clientsToUpdate.length === 0) {
    console.log('✅ No hay clientes que actualizar. El ownerId ya está correcto.');
    process.exit(0);
  }

  // 3. Actualizar los clientes
  console.log(`🔄 Actualizando ownerId de ${OLD_OWNER_ID} a ${correctOpenId}...`);
  
  const result = await db
    .update(clients)
    .set({ ownerId: correctOpenId })
    .where(eq(clients.ownerId, OLD_OWNER_ID));

  console.log(`✅ Actualización completada\n`);

  // 4. Verificar la actualización
  console.log('🔍 Verificando actualización...');
  const updatedClients = await db
    .select()
    .from(clients)
    .where(eq(clients.ownerId, correctOpenId));

  console.log(`✅ ${updatedClients.length} clientes ahora tienen el ownerId correcto\n`);

  // 5. Mostrar resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 RESUMEN:');
  console.log(`   Email del usuario: ${TARGET_EMAIL}`);
  console.log(`   OpenID correcto: ${correctOpenId}`);
  console.log(`   Clientes actualizados: ${clientsToUpdate.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ ¡Corrección completada con éxito!');
  console.log('   Ahora el usuario debería poder ver sus datos y alertas en el dashboard.\n');

  process.exit(0);
}

fixOwnerId().catch((error) => {
  console.error('❌ Error al ejecutar el script:', error);
  process.exit(1);
});
