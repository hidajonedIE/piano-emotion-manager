import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('📦 Exportando todas las tablas...');

// Obtener lista de tablas
const [tables] = await connection.query("SHOW TABLES");
console.log(`Encontradas ${tables.length} tablas`);

let sqlDump = `-- Piano Emotion Database Backup
-- Date: ${new Date().toISOString()}
-- Database: piano_emotion_db

SET FOREIGN_KEY_CHECKS=0;

`;

for (const tableRow of tables) {
  const tableName = Object.values(tableRow)[0];
  console.log(`Exportando tabla: ${tableName}`);
  
  // Obtener estructura
  const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
  sqlDump += `\n-- Table: ${tableName}\n`;
  sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
  sqlDump += createTable[0]['Create Table'] + ';\n\n';
  
  // Obtener datos
  const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
  
  if (rows.length > 0) {
    sqlDump += `-- Data for table ${tableName}\n`;
    for (const row of rows) {
      const columns = Object.keys(row).map(k => `\`${k}\``).join(', ');
      const values = Object.values(row).map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return connection.escape(v);
        if (v instanceof Date) return connection.escape(v.toISOString());
        if (typeof v === 'object') return connection.escape(JSON.stringify(v));
        return connection.escape(v);
      }).join(', ');
      sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
    }
    sqlDump += '\n';
  }
}

sqlDump += 'SET FOREIGN_KEY_CHECKS=1;\n';

fs.writeFileSync('/home/ubuntu/piano-emotion-backup/database-full-backup.sql', sqlDump);
console.log('✅ Exportación completada');
console.log(`Tamaño: ${(sqlDump.length / 1024 / 1024).toFixed(2)} MB`);

await connection.end();
