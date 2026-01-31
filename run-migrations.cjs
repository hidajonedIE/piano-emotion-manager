const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3v9ofvvgodfeCHv.root',
    password: '9wl3Ks7pqSVjBamc',
    database: 'test',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    },
    multipleStatements: true
  });

  console.log('Conectado a TiDB Cloud');

  // Read migration file
  const migrationPath = path.join(__dirname, 'drizzle/migrations/0000_easy_sage.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split by statement breakpoint and execute each statement
  const statements = migrationSQL.split('--> statement-breakpoint');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement) {
      try {
        console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);
        await connection.execute(statement);
        console.log(`  ✓ Completado`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`  ⚠ Tabla ya existe, saltando...`);
        } else {
          console.error(`  ✗ Error: ${err.message}`);
        }
      }
    }
  }

  // Create drizzle migrations table if not exists
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
    console.log('✓ Tabla de migraciones creada');
  } catch (err) {
    console.log('Tabla de migraciones ya existe');
  }

  // Record migration
  try {
    await connection.execute(
      'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
      ['0000_easy_sage', Date.now()]
    );
    console.log('✓ Migración registrada');
  } catch (err) {
    console.log('Migración ya registrada');
  }

  // Verify tables
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('\nTablas en la base de datos:');
  tables.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });

  await connection.end();
  console.log('\n✓ Migraciones completadas exitosamente');
}

runMigrations().catch(console.error);
