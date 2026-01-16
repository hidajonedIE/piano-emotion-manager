import { getDb } from '../server/db.js';
import { readFileSync } from 'fs';

async function applyIndexes() {
  console.log('🔌 Connecting to TiDB...');
  const db = await getDb();
  
  if (!db) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  console.log('✅ Connected to TiDB');
  console.log('📝 Reading SQL file...');
  
  const sql = readFileSync('./drizzle/migrations/add_performance_indexes.sql', 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt) {
      try {
        await (db as any).execute(stmt);
        console.log(`✅ [${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);
      } catch (error: any) {
        console.error(`⚠️  [${i + 1}/${statements.length}] Error: ${error.message}`);
      }
    }
  }

  console.log('✅ Índices aplicados exitosamente');
  process.exit(0);
}

applyIndexes().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
