import 'dotenv/config';
import { getDb } from '../server/db.js';
import { users, pianos, services } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const CORRECT_ODID = 'user_37Nq41VhiCgFUQldUPyH8fn25j6'; // El que funciona con clientes
const INCORRECT_ODID = 'user_37Nq41VhiCgFUQIdUPyH8fn25j6'; // El que tienen pianos/servicios

async function fixOdIds() {
  console.log('🔧 Actualizando odId de Pianos y Servicios...\n');
  
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
    
    console.log(`   openId: ${user.openId}`);
    
    // Contar pianos a actualizar
    console.log('\n📋 Pianos:');
    const pianosToUpdate = await database
      .select()
      .from(pianos)
      .where(eq(pianos.odId, INCORRECT_ODID));
    
    console.log(`   Pianos con odId incorrecto: ${pianosToUpdate.length}`);
    
    if (pianosToUpdate.length > 0) {
      console.log(`   Actualizando ${pianosToUpdate.length} pianos...`);
      await database
        .update(pianos)
        .set({ odId: CORRECT_ODID })
        .where(eq(pianos.odId, INCORRECT_ODID));
      console.log('   ✅ Pianos actualizados');
    }
    
    // Contar servicios a actualizar
    console.log('\n📋 Servicios:');
    const servicesToUpdate = await database
      .select()
      .from(services)
      .where(eq(services.odId, INCORRECT_ODID));
    
    console.log(`   Servicios con odId incorrecto: ${servicesToUpdate.length}`);
    
    if (servicesToUpdate.length > 0) {
      console.log(`   Actualizando ${servicesToUpdate.length} servicios...`);
      await database
        .update(services)
        .set({ odId: CORRECT_ODID })
        .where(eq(services.odId, INCORRECT_ODID));
      console.log('   ✅ Servicios actualizados');
    }
    
    // Verificar resultados
    console.log('\n📋 Verificación final:');
    
    const pianosAfter = await database
      .select()
      .from(pianos)
      .where(eq(pianos.odId, CORRECT_ODID));
    console.log(`   Pianos con odId correcto: ${pianosAfter.length}`);
    
    const servicesAfter = await database
      .select()
      .from(services)
      .where(eq(services.odId, CORRECT_ODID));
    console.log(`   Servicios con odId correcto: ${servicesAfter.length}`);
    
    console.log('\n✅ ¡Actualización completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixOdIds();
