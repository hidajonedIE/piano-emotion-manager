import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";

async function runMigration() {
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: {
      rejectUnauthorized: true
    }
  });


  // Read migration file
  const migrationPath = path.join(__dirname, 'drizzle/migrations/0001_hesitant_star_brand.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split by statement-breakpoint and execute each statement
  const statements = migrationSQL.split('--> statement-breakpoint');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement) {
      try {
        await connection.execute(statement);
      } catch (error: unknown) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
        } else {
        }
      }
    }
  }

  // Now create the modules and subscription_plans tables if they don't exist
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
  } catch (error: unknown) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
    } else {
    }
  }

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
  } catch (error: unknown) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
    } else {
    }
  }

  await connection.end();
}

runMigration().catch(console.error);
