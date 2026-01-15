import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

async function applyIndexes() {
  console.log('[Indexes] Starting index creation...');
  
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
      multipleStatements: true,
    });
    
    console.log('[Indexes] ✓ Connected successfully');

    // Read SQL file
    const sqlFile = path.join(__dirname, '../drizzle/migrations/add-performance-indexes.sql');
    console.log('[Indexes] Reading SQL file:', sqlFile);
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[Indexes] Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) {
        continue;
      }

      // Extract index name for logging
      const indexMatch = statement.match(/idx_\w+/);
      const indexName = indexMatch ? indexMatch[0] : `statement ${i + 1}`;

      try {
        await connection.execute(statement);
        console.log(`[Indexes] ✓ Created: ${indexName}`);
        successCount++;
      } catch (error: any) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('Duplicate key name')) {
          console.log(`[Indexes] ⊘ Skipped (already exists): ${indexName}`);
          skipCount++;
        } else {
          console.error(`[Indexes] ✗ Error creating ${indexName}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n[Indexes] ========================================');
    console.log(`[Indexes] Summary:`);
    console.log(`[Indexes]   Created: ${successCount}`);
    console.log(`[Indexes]   Skipped: ${skipCount}`);
    console.log(`[Indexes]   Errors: ${errorCount}`);
    console.log('[Indexes] ========================================\n');

    if (errorCount > 0) {
      console.error('[Indexes] ⚠️  Some indexes failed to create. Check errors above.');
      process.exit(1);
    } else {
      console.log('[Indexes] ✓ All indexes created successfully!');
    }

  } catch (error) {
    console.error('[Indexes] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('[Indexes] Connection closed');
    }
  }
}

// Run the script
applyIndexes().catch(console.error);
