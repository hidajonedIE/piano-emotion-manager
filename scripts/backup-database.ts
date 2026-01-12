import { db } from '../server/db';
import * as fs from 'fs';
import * as path from 'path';

async function backupDatabase() {
  try {
    console.log('Iniciando backup de la base de datos...');
    
    // Obtener todas las tablas
    const tables = await db.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'PianoEmotion2026'
    `);

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.sql`);

    let sqlContent = `-- Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`;

    // Para cada tabla, hacer un dump
    for (const row of tables.rows || []) {
      const tableName = (row as any).TABLE_NAME;
      
      // Obtener estructura de la tabla
      const createTableResult = await db.execute(`SHOW CREATE TABLE ${tableName}`);
      if (createTableResult.rows && createTableResult.rows.length > 0) {
        const createTableSQL = (createTableResult.rows[0] as any)['Create Table'];
        sqlContent += `\n-- Table: ${tableName}\n`;
        sqlContent += `DROP TABLE IF EXISTS ${tableName};\n`;
        sqlContent += createTableSQL + ';\n\n';
      }

      // Obtener datos de la tabla
      const dataResult = await db.execute(`SELECT * FROM ${tableName}`);
      if (dataResult.rows && dataResult.rows.length > 0) {
        sqlContent += `-- Data for table: ${tableName}\n`;
        for (const row of dataResult.rows) {
          const columns = Object.keys(row);
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'boolean') return v ? '1' : '0';
            return String(v);
          });
          sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        sqlContent += '\n';
      }
    }

    fs.writeFileSync(backupFile, sqlContent);
    console.log(`Backup completado: ${backupFile}`);
    console.log(`Tamaño: ${fs.statSync(backupFile).size} bytes`);

  } catch (error) {
    console.error('Error durante el backup:', error);
    process.exit(1);
  }
}

backupDatabase();
