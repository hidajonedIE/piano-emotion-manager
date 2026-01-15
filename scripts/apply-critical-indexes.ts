import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

async function applyCriticalIndexes() {
  console.log('[Indexes] Starting critical index creation...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('[Indexes] ERROR: DATABASE_URL not found in environment');
    process.exit(1);
  }

  let connection;
  
  try {
    // Create connection
    console.log('[Indexes] Connecting to database...');
    connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    });
    
    console.log('[Indexes] ✓ Connected successfully\n');

    // Read SQL file
    const sqlFile = path.join(__dirname, '../drizzle/migrations/add-critical-indexes.sql');
    console.log('[Indexes] Reading SQL file:', sqlFile);
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Extract CREATE INDEX statements
    const createIndexRegex = /CREATE INDEX IF NOT EXISTS (\w+) ON (\w+)\([^)]+\);/g;
    const statements: Array<{sql: string, indexName: string, tableName: string}> = [];
    
    let match;
    while ((match = createIndexRegex.exec(sql)) !== null) {
      statements.push({
        sql: match[0],
        indexName: match[1],
        tableName: match[2]
      });
    }

    console.log(`[Indexes] Found ${statements.length} CREATE INDEX statements\n`);
    console.log('='.repeat(80));

    // Execute each statement one by one
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const { sql: statement, indexName, tableName } = statements[i];
      
      console.log(`\n[${i + 1}/${statements.length}] Creating: ${indexName} on ${tableName}`);
      console.log(`SQL: ${statement}`);

      try {
        const startTime = Date.now();
        await connection.execute(statement);
        const duration = Date.now() - startTime;
        
        console.log(`✓ SUCCESS - Created in ${duration}ms`);
        successCount++;
        
        // Verify index was created
        const [rows] = await connection.execute(
          `SHOW INDEX FROM ${tableName} WHERE Key_name = ?`,
          [indexName]
        ) as any;
        
        if (rows.length > 0) {
          console.log(`✓ VERIFIED - Index exists in database`);
        } else {
          console.log(`⚠️  WARNING - Index not found after creation`);
        }
        
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`⊘ SKIPPED - Index already exists`);
          skipCount++;
        } else {
          console.log(`✗ ERROR - ${error.message}`);
          console.log(`   Code: ${error.code}`);
          errorCount++;
        }
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`✓ Created:  ${successCount}`);
    console.log(`⊘ Skipped:  ${skipCount}`);
    console.log(`✗ Errors:   ${errorCount}`);
    console.log(`  Total:    ${statements.length}`);
    console.log('='.repeat(80) + '\n');

    if (errorCount > 0) {
      console.error('[Indexes] ⚠️  Some indexes failed to create. Check errors above.');
      console.error('[Indexes] System is still functional, but some queries may be slower.');
    } else {
      console.log('[Indexes] ✓ All critical indexes created successfully!');
    }

  } catch (error) {
    console.error('[Indexes] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n[Indexes] Connection closed');
    }
  }
}

// Run the script
applyCriticalIndexes().catch(console.error);
