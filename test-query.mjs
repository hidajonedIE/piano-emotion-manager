import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Probar con camelCase
  console.log('=== Probando con camelCase ===');
  try {
    const [rows1] = await connection.query('SELECT purchasesLast30Days FROM users LIMIT 1');
    console.log('✅ camelCase funciona:', rows1);
  } catch (e) {
    console.log('❌ camelCase falla:', e.message);
  }
  
  // Probar con minúsculas
  console.log('\n=== Probando con minúsculas ===');
  try {
    const [rows2] = await connection.query('SELECT purchaseslast30days FROM users LIMIT 1');
    console.log('✅ minúsculas funciona:', rows2);
  } catch (e) {
    console.log('❌ minúsculas falla:', e.message);
  }
  
  // Probar con backticks
  console.log('\n=== Probando con backticks ===');
  try {
    const [rows3] = await connection.query('SELECT `purchasesLast30Days` FROM users LIMIT 1');
    console.log('✅ backticks funciona:', rows3);
  } catch (e) {
    console.log('❌ backticks falla:', e.message);
  }
} finally {
  await connection.end();
}
