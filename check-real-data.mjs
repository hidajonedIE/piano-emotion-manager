import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('📊 Verificando datos reales en la base de datos...\n');

const tables = ['users', 'clients', 'pianos', 'services', 'invoices', 'appointments'];

for (const table of tables) {
  try {
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`${table}: ${rows[0].count} registros`);
  } catch (error) {
    console.log(`${table}: Error - ${error.message}`);
  }
}

await connection.end();
