import 'dotenv/config';
import { getDb } from '../server/db.js';
import { services } from '../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

const CORRECT_ODID = 'user_37Nq41VhiCgFUQldUPyH8fn25j6';

async function checkServiceTypes() {
  console.log('🔍 Verificando tipos de servicios...\n');
  
  try {
    const database = await getDb();
    if (!database) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    const allServices = await database
      .select()
      .from(services)
      .where(eq(services.odId, CORRECT_ODID));
    
    console.log(`📋 Total de servicios: ${allServices.length}\n`);
    
    // Agrupar por tipo de servicio
    const servicesByType: Record<string, number> = {};
    
    allServices.forEach(service => {
      const type = service.serviceType || 'undefined';
      servicesByType[type] = (servicesByType[type] || 0) + 1;
    });
    
    console.log('📊 Servicios por tipo:');
    Object.entries(servicesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log('\n📋 Primeros 5 servicios con detalles:');
    allServices.slice(0, 5).forEach((service, index) => {
      console.log(`\n   ${index + 1}. ID: ${service.id}`);
      console.log(`      Tipo: ${service.serviceType || 'undefined'}`);
      console.log(`      Piano ID: ${service.pianoId || 'undefined'}`);
      console.log(`      Fecha: ${service.date}`);
      console.log(`      Precio: €${service.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkServiceTypes();
