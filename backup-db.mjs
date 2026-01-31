import mysql from 'mysql2/promise';
import fs from 'fs';
import { config } from 'dotenv';

config({ path: '/home/ubuntu/piano-emotion-manager/.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function backup() {
  console.log('[Backup] Conectando...');
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log('[Backup] ✓ Conectado');
  
  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);
  console.log(`[Backup] ${tableNames.length} tablas`);
  
  let sql = `-- Backup ${new Date().toISOString()}\nSET FOREIGN_KEY_CHECKS=0;\n\n`;
  
  for (const t of tableNames) {
    console.log(`[Backup] ${t}...`);
    const [ct] = await conn.query(`SHOW CREATE TABLE \`${t}\``);
    sql += `DROP TABLE IF EXISTS \`${t}\`;\n${ct[0]['Create Table']};\n\n`;
    
    const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
    if (rows.length > 0) {
      console.log(`  → ${rows.length} registros`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'number') return v;
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return `'${String(v).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
        });
        sql += `INSERT INTO \`${t}\` (\`${cols.join('`, `')}\`) VALUES (${vals.join(', ')});\n`;
      }
      sql += '\n';
    }
  }
  
  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  fs.writeFileSync('/home/ubuntu/database-backup.sql', sql);
  console.log('[Backup] ✓ Completado: database-backup.sql');
  await conn.end();
}

backup().catch(e => { console.error(e); process.exit(1); });
