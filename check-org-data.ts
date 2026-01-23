import { getDb } from './server/db';
import { services } from './drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

async function checkOrgData() {
  const db = await getDb();
  
  // Ver todos los services
  const allServices = await db.select().from(services).limit(5);
  console.log('\n=== Primeros 5 servicios ===');
  console.log(JSON.stringify(allServices, null, 2));
  
  // Ver organizationIds únicos
  const orgIds = await db.select({ orgId: services.organizationId }).from(services).limit(20);
  console.log('\n=== Organization IDs en services ===');
  console.log(orgIds);
  
  // Contar por organización
  const countByOrg = await db
    .select({ 
      orgId: services.organizationId,
      count: sql<number>`count(*)` 
    })
    .from(services)
    .groupBy(services.organizationId);
  console.log('\n=== Conteo por organización ===');
  console.log(countByOrg);
  
  process.exit(0);
}

checkOrgData();
