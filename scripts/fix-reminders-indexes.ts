import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function fixRemindersIndexes() {
  console.log('[Reminders Indexes] Starting...');
  
  if (!process.env.DATABASE_URL) {
    console.error('[Reminders Indexes] ERROR: DATABASE_URL not found');
    process.exit(1);
  }

  let connection;
  
  try {
    console.log('[Reminders Indexes] Connecting to database...');
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      multipleStatements: true,
    });
    
    console.log('[Reminders Indexes] ✓ Connected');

    const sqlFile = path.join(__dirname, '../drizzle/migrations/fix-reminders-indexes-v2.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (s.length === 0) return false;
        const lines = s.split('\n').filter(line => !line.trim().startsWith('--'));
        return lines.join('\n').trim().length > 0;
      })
      .map(s => {
        return s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
      });

    console.log(`[Reminders Indexes] Found ${statements.length} statements`);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      const indexMatch = statement.match(/idx_\w+/);
      const indexName = indexMatch ? indexMatch[0] : 'unknown';

      try {
        await connection.execute(statement);
        console.log(`[Reminders Indexes] ✓ Created: ${indexName}`);
        successCount++;
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`[Reminders Indexes] ⊘ Skipped: ${indexName}`);
          skipCount++;
        } else {
          console.error(`[Reminders Indexes] ✗ Error: ${indexName}:`, error.message);
        }
      }
    }

    console.log('\n[Reminders Indexes] ========================================');
    console.log(`[Reminders Indexes] Created: ${successCount}`);
    console.log(`[Reminders Indexes] Skipped: ${skipCount}`);
    console.log('[Reminders Indexes] ========================================\n');
    console.log('[Reminders Indexes] ✓ Done!');

  } catch (error) {
    console.error('[Reminders Indexes] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixRemindersIndexes().catch(console.error);
