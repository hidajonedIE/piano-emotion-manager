import { getDb } from './drizzle/db.js';

async function checkSchema() {
  const db = await getDb();
  const result = await db.execute('DESCRIBE services');
  console.log('=== Estructura de la tabla services ===');
  console.log(result);
  process.exit(0);
}

checkSchema().catch(console.error);
