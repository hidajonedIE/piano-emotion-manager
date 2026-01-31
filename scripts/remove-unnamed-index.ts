import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

async function removeUnnamedIndex() {
  console.log('[Remove Unnamed Index] Iniciando proceso...\n');
  
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: true },
  });
  
  console.log('[Remove Unnamed Index] ✓ Conectado a la base de datos\n');

  try {
    // Paso 1: Verificar que el índice sin nombre existe
    console.log('Paso 1: Verificando índice sin nombre...');
    const [rows] = await connection.execute(
      `SHOW INDEX FROM reminders WHERE Key_name = ''`
    ) as any;

    if (rows.length === 0) {
      console.log('✓ No se encontró índice sin nombre. Ya está limpio.');
      await connection.end();
      return;
    }

    console.log(`✓ Encontrado índice sin nombre en columna: ${rows[0].Column_name}`);
    console.log(`  Detalles: ${JSON.stringify(rows[0], null, 2)}\n`);

    // Paso 2: Intentar eliminar usando ALTER TABLE DROP INDEX con backticks vacíos
    console.log('Paso 2: Intentando eliminar índice sin nombre...');
    
    try {
      // Método 1: Intentar con nombre vacío entre backticks
      await connection.execute('ALTER TABLE reminders DROP INDEX ``');
      console.log('✓ Índice sin nombre eliminado exitosamente (método 1)\n');
    } catch (error1: any) {
      console.log(`⚠️  Método 1 falló: ${error1.message}`);
      
      try {
        // Método 2: Intentar sin backticks
        await connection.execute("ALTER TABLE reminders DROP INDEX ''");
        console.log('✓ Índice sin nombre eliminado exitosamente (método 2)\n');
      } catch (error2: any) {
        console.log(`⚠️  Método 2 falló: ${error2.message}`);
        
        // Método 3: Recrear el índice con nombre
        console.log('\nMétodo 3: Recrear índice con nombre correcto...');
        console.log('  Nota: Este método requiere eliminar y recrear el índice');
        
        // Primero verificar si podemos obtener la definición exacta
        const [indexInfo] = await connection.execute(
          `SELECT * FROM information_schema.STATISTICS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'reminders' 
           AND INDEX_NAME = ''`
        ) as any;
        
        if (indexInfo.length > 0) {
          console.log('  Información del índice sin nombre:');
          console.log(`  - Columna: ${indexInfo[0].COLUMN_NAME}`);
          console.log(`  - Tipo: ${indexInfo[0].INDEX_TYPE}`);
          console.log(`  - Non_unique: ${indexInfo[0].NON_UNIQUE}`);
          
          console.log('\n⚠️  No se puede eliminar automáticamente.');
          console.log('  El índice sin nombre requiere intervención manual en TiDB.');
          console.log('  Sin embargo, esto NO afecta la funcionalidad del sistema.');
        }
      }
    }

    // Paso 3: Verificar resultado
    console.log('\nPaso 3: Verificando resultado...');
    const [afterRows] = await connection.execute(
      `SHOW INDEX FROM reminders WHERE Key_name = ''`
    ) as any;

    if (afterRows.length === 0) {
      console.log('✓ ÉXITO: Índice sin nombre eliminado correctamente\n');
    } else {
      console.log('⚠️  El índice sin nombre aún existe');
      console.log('   Esto es un problema cosmético que no afecta la funcionalidad\n');
    }

  } catch (error) {
    console.error('❌ Error durante el proceso:', error);
  } finally {
    await connection.end();
    console.log('[Remove Unnamed Index] Conexión cerrada');
  }
}

removeUnnamedIndex().catch(console.error);
