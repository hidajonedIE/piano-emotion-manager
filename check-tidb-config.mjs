import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('=== Configuración de TiDB ===\n');
  
  // Verificar lower_case_table_names
  const [rows1] = await connection.query("SHOW VARIABLES LIKE 'lower_case_table_names'");
  console.log('lower_case_table_names:', rows1);
  
  // Verificar versión
  const [rows2] = await connection.query("SELECT VERSION()");
  console.log('\nVersión:', rows2);
  
  // Verificar si es TiDB
  const [rows3] = await connection.query("SELECT @@tidb_version");
  console.log('\nTiDB Version:', rows3);
  
} catch (e) {
  console.log('Error:', e.message);
} finally {
  await connection.end();
}
