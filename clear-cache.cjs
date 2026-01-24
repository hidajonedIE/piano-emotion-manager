/**
 * Script para limpiar el caché de predicciones IA
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function clearCache() {
  // Leer DATABASE_URL del .env
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  
  if (!dbUrlMatch) {
    console.error('❌ No se encontró DATABASE_URL en .env');
    process.exit(1);
  }
  let dbUrl = dbUrlMatch[1].trim().replace(/['"]/g, '').replace(/\\n/g, '');
  // Remover parámetros SSL problemáticos
  dbUrl = dbUrl.replace(/\?ssl=.*$/, '');
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    const connection = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log('🗑️  Limpiando caché de predicciones...');
    const [result] = await connection.execute(
      'DELETE FROM ai_predictions_cache'
    );
    
    console.log(`✅ Caché limpiado: ${result.affectedRows} registros eliminados`);
    
    await connection.end();
    console.log('✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearCache();
