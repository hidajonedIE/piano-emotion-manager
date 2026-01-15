import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function fixRemindersIndexes() {
  console.log('[Fix Reminders] Starting...\n');
  
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });
  
  console.log('[Fix Reminders] ✓ Connected\n');

  const sqlFile = path.join(__dirname, '../drizzle/migrations/fix-reminders-indexes.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  const createIndexRegex = /CREATE INDEX IF NOT EXISTS (\w+) ON (\w+)\([^)]+\);/g;
  const statements: Array<{sql: string, indexName: string}> = [];
  
  let match;
  while ((match = createIndexRegex.exec(sql)) !== null) {
    statements.push({ sql: match[0], indexName: match[1] });
  }

  console.log(`[Fix Reminders] Found ${statements.length} indexes to create\n`);

  let success = 0, skipped = 0;

  for (const { sql: stmt, indexName } of statements) {
    try {
      await connection.execute(stmt);
      console.log(`✓ ${indexName}`);
      success++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log(`⊘ ${indexName} (exists)`);
        skipped++;
      } else {
        console.log(`✗ ${indexName}: ${error.message}`);
      }
    }
  }

  console.log(`\n[Fix Reminders] ✓ Created: ${success}, Skipped: ${skipped}`);
  await connection.end();
}

fixRemindersIndexes().catch(console.error);
