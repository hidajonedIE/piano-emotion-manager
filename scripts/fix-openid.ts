import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users } from '../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

const CORRECT_CLERK_ID = 'user_37Nq41VhiCgFUQIdUPyH8fn25j6';
const USER_EMAIL = 'jnavarrete@inboundemotion.com';

async function fixOpenId() {
  console.log('🔧 Corrigiendo openId en la tabla users...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado' : 'NO configurado');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    // Primero, verificar el valor actual
    console.log('📋 Verificando valor actual...');
    const [currentUser] = await database
      .select()
      .from(users)
      .where(eq(users.email, USER_EMAIL));
    
    if (!currentUser) {
      console.error(`❌ No se encontró usuario con email: ${USER_EMAIL}`);
      process.exit(1);
    }
    
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   openId actual: ${currentUser.openId}`);
    console.log(`   openId correcto: ${CORRECT_CLERK_ID}`);
    
    if (currentUser.openId === CORRECT_CLERK_ID) {
      console.log('\n✅ El openId ya es correcto, no se necesita actualizar');
      process.exit(0);
    }
    
    // Actualizar el openId
    console.log('\n🔄 Actualizando openId...');
    await database
      .update(users)
      .set({ openId: CORRECT_CLERK_ID })
      .where(eq(users.email, USER_EMAIL));
    
    console.log('✅ openId actualizado correctamente');
    
    // Verificar la actualización
    console.log('\n📋 Verificando actualización...');
    const [updatedUser] = await database
      .select()
      .from(users)
      .where(eq(users.email, USER_EMAIL));
    
    console.log(`   openId después de actualizar: ${updatedUser.openId}`);
    
    if (updatedUser.openId === CORRECT_CLERK_ID) {
      console.log('\n✅ ¡Corrección completada exitosamente!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Advertencia: El valor no coincide después de actualizar');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  }
}

fixOpenId();
