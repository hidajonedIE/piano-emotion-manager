import 'dotenv/config';
import { getDb } from '../server/db.js';
import { 
  users, clients, pianos, services, appointments, 
  invoices, quotes, inventory, reminders, serviceRates,
  businessInfo, quoteTemplates
} from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Mapeo de OpenID a Email (incluyendo ambas variantes)
const USER_MAPPING = {
  'user_37Nq41VhiCgFUQldUPyH8fn25j6': 'jnavarrete@inboundemotion.com', // con 'l'
  'user_37Nq41VhiCgFUQIdUPyH8fn25j6': 'jnavarrete@inboundemotion.com', // con 'I'
  'test-user-456': 'test2@example.com',
  'test-user-999': 'test@test.com',
};

async function migrateOdIdToEmail() {
  console.log('🔄 Migrando odId restantes de Clerk ID a Email...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    const tables = [
      { name: 'clients', table: clients },
      { name: 'pianos', table: pianos },
      { name: 'services', table: services },
      { name: 'appointments', table: appointments },
      { name: 'invoices', table: invoices },
      { name: 'quotes', table: quotes },
      { name: 'inventory', table: inventory },
      { name: 'reminders', table: reminders },
      { name: 'serviceRates', table: serviceRates },
      { name: 'businessInfo', table: businessInfo },
      { name: 'quoteTemplates', table: quoteTemplates },
    ];
    
    for (const { name, table } of tables) {
      console.log(`📋 Procesando tabla: ${name}`);
      
      for (const [oldOdId, email] of Object.entries(USER_MAPPING)) {
        try {
          const result = await database
            .update(table)
            .set({ odId: email })
            .where(eq(table.odId, oldOdId));
          
          console.log(`   ✅ ${oldOdId} → ${email}`);
        } catch (error: any) {
          // Ignorar errores si la tabla no tiene registros con ese odId
          if (!error.message.includes('no rows')) {
            console.log(`   ⚠️  Error: ${error.message}`);
          }
        }
      }
      
      console.log('');
    }
    
    console.log('✅ Migración completada\n');
    
    // Verificar resultados
    console.log('📊 Verificando resultados:\n');
    
    for (const { name, table } of tables) {
      try {
        const records = await database.select().from(table);
        
        if (records.length > 0) {
          const byOdId: Record<string, number> = {};
          records.forEach((record: any) => {
            const odId = record.odId || 'undefined';
            byOdId[odId] = (byOdId[odId] || 0) + 1;
          });
          
          console.log(`${name}:`);
          Object.entries(byOdId).forEach(([odId, count]) => {
            const isEmail = odId.includes('@');
            const icon = isEmail ? '✅' : '❌';
            console.log(`   ${icon} ${odId}: ${count} registros`);
          });
          console.log('');
        }
      } catch (error) {
        // Ignorar errores de tablas vacías
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateOdIdToEmail();
