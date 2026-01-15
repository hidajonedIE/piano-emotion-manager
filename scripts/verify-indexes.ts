import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyIndexes() {
  console.log('[Verify] Starting index verification...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('[Verify] ERROR: DATABASE_URL not found in environment');
    process.exit(1);
  }

  let connection;
  
  try {
    // Create connection
    console.log('[Verify] Connecting to database...');
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    });
    
    console.log('[Verify] ✓ Connected successfully\n');

    // Tables to check
    const tables = [
      'clients',
      'pianos', 
      'services',
      'appointments',
      'inventory',
      'invoices',
      'quotes',
      'reminders'
    ];

    console.log('='.repeat(80));
    console.log('CURRENT INDEXES IN DATABASE');
    console.log('='.repeat(80));

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(
          `SHOW INDEX FROM ${table}`
        ) as any;

        console.log(`\n📋 Table: ${table.toUpperCase()}`);
        console.log('-'.repeat(80));
        
        if (rows.length === 0) {
          console.log('   ⚠️  No indexes found (only PRIMARY KEY expected)');
        } else {
          const indexMap = new Map<string, string[]>();
          
          for (const row of rows) {
            const indexName = row.Key_name;
            const columnName = row.Column_name;
            
            if (!indexMap.has(indexName)) {
              indexMap.set(indexName, []);
            }
            indexMap.get(indexName)!.push(columnName);
          }

          let indexCount = 0;
          for (const [indexName, columns] of indexMap.entries()) {
            indexCount++;
            const columnsStr = columns.join(', ');
            const isPrimary = indexName === 'PRIMARY';
            const icon = isPrimary ? '🔑' : '📌';
            console.log(`   ${icon} ${indexName}: (${columnsStr})`);
          }
          
          console.log(`   Total: ${indexCount} indexes`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error checking table ${table}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('[Verify] ✓ Verification complete');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('[Verify] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('[Verify] Connection closed');
    }
  }
}

// Run the script
verifyIndexes().catch(console.error);
