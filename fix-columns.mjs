import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('=== Eliminando columnas con camelCase ===\n');
  
  await connection.query('ALTER TABLE users DROP COLUMN purchasesLast30Days');
  console.log('✅ Eliminada purchasesLast30Days');
  
  await connection.query('ALTER TABLE users DROP COLUMN lastPurchaseDate');
  console.log('✅ Eliminada lastPurchaseDate');
  
  await connection.query('ALTER TABLE users DROP COLUMN trialEndsAt');
  console.log('✅ Eliminada trialEndsAt');
  
  await connection.query('ALTER TABLE users DROP COLUMN distributorId');
  console.log('✅ Eliminada distributorId');
  
  console.log('\n=== Creando columnas en snake_case ===\n');
  
  await connection.query('ALTER TABLE users ADD COLUMN purchases_last_30_days INT DEFAULT 0');
  console.log('✅ Creada purchases_last_30_days');
  
  await connection.query('ALTER TABLE users ADD COLUMN last_purchase_date TIMESTAMP NULL');
  console.log('✅ Creada last_purchase_date');
  
  await connection.query('ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP NULL');
  console.log('✅ Creada trial_ends_at');
  
  await connection.query('ALTER TABLE users ADD COLUMN distributor_id INT NULL');
  console.log('✅ Creada distributor_id');
  
  console.log('\n✅ Migración completada');
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  await connection.end();
}
