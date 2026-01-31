/**
 * Script para establecer el rol de administrador a un usuario
 * 
 * Uso:
 * npx tsx scripts/set-admin-role.ts <email>
 * 
 * Ejemplo:
 * npx tsx scripts/set-admin-role.ts jnavarrete@inboundemotion.com
 */

import { getDb } from '../server/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function setAdminRole(email: string) {
  try {
    console.log(`🔄 Actualizando rol a admin para: ${email}`);

    const db = await getDb();
    if (!db) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Buscar el usuario por email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ Usuario no encontrado con email: ${email}`);
      process.exit(1);
    }

    console.log(`📧 Usuario encontrado:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - OpenID: ${user.openId}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Rol actual: ${user.role}`);

    // Actualizar el rol a admin
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id));

    console.log(`\n✅ Rol actualizado a admin`);
    console.log(`\n📋 Próximos pasos:`);
    console.log(`   1. Cierra sesión en la aplicación`);
    console.log(`   2. Vuelve a iniciar sesión`);
    console.log(`   3. Deberías ver la opción "Gestión de Ayuda" en el menú hamburguesa`);
    console.log(`   4. Accede a /admin/help para gestionar el contenido de ayuda`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Obtener email del argumento de línea de comandos
const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: npx tsx scripts/set-admin-role.ts <email>');
  console.error('   Ejemplo: npx tsx scripts/set-admin-role.ts jnavarrete@inboundemotion.com');
  process.exit(1);
}

setAdminRole(email);
