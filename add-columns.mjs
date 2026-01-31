import { createPool } from 'mysql2/promise';

const pool = createPool(process.env.DATABASE_URL);

console.log("=== AGREGANDO COLUMNAS FALTANTES ===\n");

const columns = [
  { name: 'purchasesLast30Days', sql: 'ADD COLUMN purchasesLast30Days INT DEFAULT 0' },
  { name: 'lastPurchaseDate', sql: 'ADD COLUMN lastPurchaseDate TIMESTAMP NULL' },
  { name: 'trialEndsAt', sql: 'ADD COLUMN trialEndsAt TIMESTAMP NULL' },
  { name: 'distributorId', sql: 'ADD COLUMN distributorId INT NULL' }
];

for (const col of columns) {
  try {
    console.log(`Agregando ${col.name}...`);
    await pool.execute(`ALTER TABLE users ${col.sql}`);
    console.log(`✅ ${col.name} agregada\n`);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log(`⚠️  ${col.name} ya existe\n`);
    } else {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

console.log("=== VERIFICANDO ===\n");
const [rows] = await pool.execute("SHOW COLUMNS FROM users");
const existing = rows.map(r => r.Field);

columns.forEach(col => {
  console.log(`${existing.includes(col.name) ? '✅' : '❌'} ${col.name}`);
});

await pool.end();
