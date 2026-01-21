import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users } from '../drizzle/schema.js.js';

async function checkUserEmail() {
  console.log('🔍 Verificando email del usuario...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    const allUsers = await database.select().from(users);
    
    console.log(`📋 Total de usuarios: ${allUsers.length}\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Usuario:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   OpenID (Clerk ID): ${user.openId}`);
      console.log(`   Partner ID: ${user.partnerId}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkUserEmail();
