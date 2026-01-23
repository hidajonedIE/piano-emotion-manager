import { getDb } from './drizzle/db.js';
import { services } from './drizzle/schema.js';
import { sql } from 'drizzle-orm';

async function checkServicesDates() {
  const db = await getDb();
  
  // Obtener rango de fechas de servicios
  const result = await db
    .select({
      minDate: sql`MIN(${services.date})`,
      maxDate: sql`MAX(${services.date})`,
      count: sql`COUNT(*)`,
    })
    .from(services);
  
  console.log('=== Rango de fechas de servicios en la BD ===');
  console.log('Fecha más antigua:', result[0].minDate);
  console.log('Fecha más reciente:', result[0].maxDate);
  console.log('Total de servicios:', result[0].count);
  
  // Obtener servicios por mes
  const byMonth = await db
    .select({
      month: sql`strftime('%Y-%m', ${services.date})`,
      count: sql`COUNT(*)`,
      total: sql`SUM(${services.cost})`,
    })
    .from(services)
    .groupBy(sql`strftime('%Y-%m', ${services.date})`)
    .orderBy(sql`strftime('%Y-%m', ${services.date})`);
  
  console.log('\n=== Servicios por mes ===');
  byMonth.forEach(row => {
    console.log(`${row.month}: ${row.count} servicios, ${row.total}€`);
  });
  
  process.exit(0);
}

checkServicesDates().catch(console.error);
