import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Consultar estructura de la tabla services
  const [rows] = await connection.execute('DESCRIBE services');
  console.log('=== Estructura de la tabla services ===');
  rows.forEach(row => {
    console.log(`${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${row.Key ? `(${row.Key})` : ''}`);
  });

  // Consultar un registro de ejemplo
  const [sample] = await connection.execute('SELECT * FROM services WHERE partnerId = 1 LIMIT 1');
  if (sample.length > 0) {
    console.log('\n=== Campos disponibles en un registro real ===');
    console.log(Object.keys(sample[0]).join(', '));
  } else {
    console.log('\nNo hay registros en la tabla services');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
