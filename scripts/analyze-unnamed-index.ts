import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function analyzeUnnamedIndex() {
  console.log('[Analyze] Connecting to database...\n');
  
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });
  
  console.log('[Analyze] ✓ Connected\n');

  // Get all indexes from reminders with full details
  const [rows] = await connection.execute(
    `SHOW INDEX FROM reminders`
  ) as any;

  console.log('='.repeat(80));
  console.log('ALL INDEXES IN REMINDERS TABLE - FULL DETAILS');
  console.log('='.repeat(80));

  for (const row of rows) {
    console.log('\n---');
    console.log(`Key_name: "${row.Key_name}"`);
    console.log(`Column_name: ${row.Column_name}`);
    console.log(`Seq_in_index: ${row.Seq_in_index}`);
    console.log(`Non_unique: ${row.Non_unique}`);
    console.log(`Index_type: ${row.Index_type}`);
    
    if (row.Key_name === '' || row.Key_name === null) {
      console.log('⚠️  THIS IS THE UNNAMED INDEX');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));

  await connection.end();
}

analyzeUnnamedIndex().catch(console.error);
