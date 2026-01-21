import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users } from '../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

const OLD_OPENID = 'user_37Nq41VhiCgFUQldUPyH8fn25j6';
const USER_EMAIL = 'jnavarrete@inboundemotion.com';

async function revertOpenId() {
  console.log('🔄 REVIRTIENDO openId al valor anterior...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    console.log(`📋 Actualizando openId a: ${OLD_OPENID}`);
    
    await database
      .update(users)
      .set({ openId: OLD_OPENID })
      .where(eq(users.email, USER_EMAIL));
    
    console.log('✅ openId revertido correctamente');
    
    // Verificar
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, USER_EMAIL));
    
    console.log(`\n📋 Verificación:`);
    console.log(`   openId actual: ${user.openId}`);
    
    if (user.openId === OLD_OPENID) {
      console.log('\n✅ ¡Reversión completada exitosamente!');
    } else {
      console.log('\n⚠️  Advertencia: El valor no coincide');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

revertOpenId();
