import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users, clients, pianos, services, appointments, invoices, quotes } from '../drizzle/schema.js.js';
import { writeFileSync } from 'fs';

async function exportDatabase() {
  console.log('📦 Exportando base de datos completa...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: 'v1.1-working-pianos-services',
      data: {
        users: await database.select().from(users),
        clients: await database.select().from(clients),
        pianos: await database.select().from(pianos),
        services: await database.select().from(services),
        appointments: await database.select().from(appointments),
        invoices: await database.select().from(invoices),
        quotes: await database.select().from(quotes),
      }
    };
    
    console.log('📊 Datos exportados:');
    console.log(`   Users: ${backup.data.users.length}`);
    console.log(`   Clients: ${backup.data.clients.length}`);
    console.log(`   Pianos: ${backup.data.pianos.length}`);
    console.log(`   Services: ${backup.data.services.length}`);
    console.log(`   Appointments: ${backup.data.appointments.length}`);
    console.log(`   Invoices: ${backup.data.invoices.length}`);
    console.log(`   Quotes: ${backup.data.quotes.length}`);
    
    const filename = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = `/home/ubuntu/${filename}`;
    
    writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup guardado en: ${filepath}`);
    console.log(`   Tamaño: ${(JSON.stringify(backup).length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

exportDatabase();
