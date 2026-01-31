import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function checkDuplicates() {
  console.log('[Check Duplicates] Connecting...\n');
  
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });
  
  console.log('[Check Duplicates] ✓ Connected\n');

  // Get all indexes from reminders
  const [rows] = await connection.execute(
    `SHOW INDEX FROM reminders`
  ) as any;

  console.log('='.repeat(80));
  console.log('REMINDERS TABLE - ALL INDEXES');
  console.log('='.repeat(80));

  const indexMap = new Map<string, any[]>();
  
  for (const row of rows) {
    const key = `${row.Column_name}`;
    if (!indexMap.has(key)) {
      indexMap.set(key, []);
    }
    indexMap.get(key)!.push({
      name: row.Key_name,
      column: row.Column_name,
      seq: row.Seq_in_index
    });
  }

  // Find duplicates
  const duplicates: string[] = [];
  
  for (const [column, indexes] of indexMap.entries()) {
    const singleColumnIndexes = indexes.filter(idx => idx.seq === 1);
    if (singleColumnIndexes.length > 1) {
      console.log(`\n⚠️  DUPLICATE: Column "${column}" has ${singleColumnIndexes.length} indexes:`);
      for (const idx of singleColumnIndexes) {
        console.log(`   - ${idx.name}`);
        if (idx.name !== 'PRIMARY' && idx.name !== 'idx_partnerId') {
          duplicates.push(idx.name);
        }
      }
    }
  }

  if (duplicates.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('INDEXES TO REMOVE:');
    console.log('='.repeat(80));
    
    for (const indexName of duplicates) {
      if (indexName === '' || indexName === 'PRIMARY') continue;
      console.log(`\nDROP INDEX IF EXISTS \`${indexName}\` ON reminders;`);
    }
  } else {
    console.log('\n✓ No duplicate indexes found');
  }

  await connection.end();
}

checkDuplicates().catch(console.error);
