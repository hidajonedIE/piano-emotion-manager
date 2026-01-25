import { getDb } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  const db = await getDb();
  if (!db) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }

  console.log('=== ESTRUCTURA DE clients ===\n');
  const clientsCols = await db.execute(sql`DESCRIBE clients`);
  const clientsRows = (clientsCols as any)[0] || clientsCols;
  clientsRows.forEach((col: any) => {
    console.log(`  ${col.Field} (${col.Type})`);
  });

  console.log('\n=== ESTRUCTURA DE services ===\n');
  const servicesCols = await db.execute(sql`DESCRIBE services`);
  const servicesRows = (servicesCols as any)[0] || servicesCols;
  servicesRows.forEach((col: any) => {
    console.log(`  ${col.Field} (${col.Type})`);
  });

  console.log('\n=== ESTRUCTURA DE pianos ===\n');
  const pianosCols = await db.execute(sql`DESCRIBE pianos`);
  const pianosRows = (pianosCols as any)[0] || pianosCols;
  pianosRows.forEach((col: any) => {
    console.log(`  ${col.Field} (${col.Type})`);
  });

  process.exit(0);
}

checkSchema();
