import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users, pianos } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function checkOpenId() {
  console.log('🔍 Verificando openId y pianos...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    // Verificar el usuario
    console.log('📋 Usuario:');
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, 'jnavarrete@inboundemotion.com'));
    
    if (!user) {
      console.error('❌ No se encontró el usuario');
      process.exit(1);
    }
    
    console.log(`   Email: ${user.email}`);
    console.log(`   openId: ${user.openId}`);
    console.log(`   ID: ${user.id}`);
    
    // Verificar los pianos
    console.log('\n📋 Pianos:');
    const allPianos = await database
      .select()
      .from(pianos)
      .where(eq(pianos.odId, user.openId));
    
    console.log(`   Total de pianos con odId = '${user.openId}': ${allPianos.length}`);
    
    if (allPianos.length > 0) {
      console.log('\n   Primeros 3 pianos:');
      allPianos.slice(0, 3).forEach((piano, index) => {
        console.log(`   ${index + 1}. ${piano.brand} ${piano.model || ''} (ID: ${piano.id}, odId: ${piano.odId})`);
      });
    }
    
    // Verificar si hay pianos con otros odId
    console.log('\n📋 Todos los odId únicos en la tabla pianos:');
    const uniqueOdIds = await database
      .selectDistinct({ odId: pianos.odId })
      .from(pianos);
    
    uniqueOdIds.forEach(({ odId }) => {
      console.log(`   - ${odId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkOpenId();
