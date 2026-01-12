import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users, clients } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function checkClients() {
  console.log('🔍 Verificando clientes...\n');
  
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
    
    // Verificar los clientes
    console.log('\n📋 Clientes:');
    const allClients = await database
      .select()
      .from(clients)
      .where(eq(clients.odId, user.openId));
    
    console.log(`   Total de clientes con odId = '${user.openId}': ${allClients.length}`);
    
    if (allClients.length > 0) {
      console.log('\n   Primeros 5 clientes:');
      allClients.slice(0, 5).forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (ID: ${client.id}, odId: ${client.odId})`);
      });
    }
    
    // Verificar si hay clientes con otros odId
    console.log('\n📋 Todos los odId únicos en la tabla clients:');
    const uniqueOdIds = await database
      .selectDistinct({ odId: clients.odId })
      .from(clients);
    
    uniqueOdIds.forEach(({ odId }) => {
      console.log(`   - ${odId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkClients();
