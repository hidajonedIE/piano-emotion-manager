import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";

async function runMigration() {
  console.log('Connecting to TiDB with SSL...');
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: {
      rejectUnauthorized: true
    }
  });

  console.log('Connected successfully!');

  // Read migration file
  const migrationPath = path.join(__dirname, 'drizzle/migrations/0001_hesitant_star_brand.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split by statement-breakpoint and execute each statement
  const statements = migrationSQL.split('--> statement-breakpoint');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement) {
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
        console.log(`  ✓ Success`);
      } catch (error: any) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`  ⚠ Table/index already exists, skipping`);
        } else {
          console.error(`  ✗ Error:`, error.message);
        }
      }
    }
  }

  // Now create the modules and subscription_plans tables if they don't exist
  console.log('\nCreating modules table...');
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS modules (
        id int AUTO_INCREMENT NOT NULL,
        code varchar(50) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        icon varchar(50),
        color varchar(7),
        type enum('core','free','premium','enterprise') NOT NULL DEFAULT 'core',
        includedInPlans json,
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT modules_id PRIMARY KEY(id),
        CONSTRAINT modules_code_unique UNIQUE(code)
      )
    `);
    console.log('  ✓ modules table created');
  } catch (error: any) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('  ⚠ modules table already exists');
    } else {
      console.error('  ✗ Error:', error.message);
    }
  }

  console.log('\nCreating subscription_plans table...');
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id int AUTO_INCREMENT NOT NULL,
        code varchar(50) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        monthly_price decimal(10,2) NOT NULL DEFAULT 0,
        yearly_price decimal(10,2) NOT NULL DEFAULT 0,
        currency varchar(3) DEFAULT 'EUR',
        max_users int,
        max_clients int,
        max_pianos int,
        max_invoices_per_month int,
        max_storage_mb int,
        features json,
        is_active boolean NOT NULL DEFAULT true,
        is_popular boolean DEFAULT false,
        trial_days int DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT subscription_plans_id PRIMARY KEY(id),
        CONSTRAINT subscription_plans_code_unique UNIQUE(code)
      )
    `);
    console.log('  ✓ subscription_plans table created');
  } catch (error: any) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('  ⚠ subscription_plans table already exists');
    } else {
      console.error('  ✗ Error:', error.message);
    }
  }

  await connection.end();
  console.log('\nMigration completed!');
}

runMigration().catch(console.error);
