import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [columns] = await connection.query('SHOW COLUMNS FROM users');
  console.log('\n=== Columnas de la tabla users ===\n');
  columns.forEach(col => {
    console.log(`${col.Field} - ${col.Type} - ${col.Null} - ${col.Default}`);
  });
  
  // Buscar específicamente las columnas problemáticas
  const problemCols = ['purchasesLast30Days', 'lastPurchaseDate', 'trialEndsAt', 'distributorId'];
  console.log('\n=== Columnas problemáticas ===\n');
  problemCols.forEach(name => {
    const found = columns.find(c => c.Field === name || c.Field === name.toLowerCase());
    console.log(`${name}: ${found ? '✅ EXISTE' : '❌ NO EXISTE'}`);
  });
} finally {
  await connection.end();
}
