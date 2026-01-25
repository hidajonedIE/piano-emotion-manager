import { getDb } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkData() {
  const db = await getDb();
  if (!db) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }

  const partnerId = 1; // ID del partner de prueba

  console.log('=== SERVICIOS DE LAS ÚLTIMAS 8 SEMANAS ===\n');
  const services = await db.execute(sql`
    SELECT 
      YEARWEEK(date, 1) as week,
      COUNT(*) as count,
      DATE_FORMAT(MIN(date), '%Y-%m-%d') as firstDate,
      DATE_FORMAT(MAX(date), '%Y-%m-%d') as lastDate
    FROM services
    WHERE partnerId = ${partnerId}
      AND date >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
    GROUP BY YEARWEEK(date, 1)
    ORDER BY week ASC
  `);
  
  const servicesRows = (services as any)[0] || [];
  console.log(`Total de semanas con servicios: ${servicesRows.length}`);
  servicesRows.forEach((row: any) => {
    console.log(`  Semana ${row.week}: ${row.count} servicios (${row.firstDate} - ${row.lastDate})`);
  });

  console.log('\n=== TOTAL DE SERVICIOS ===\n');
  const totalServices = await db.execute(sql`
    SELECT COUNT(*) as total FROM services WHERE partnerId = ${partnerId}
  `);
  const totalRows = (totalServices as any)[0] || [];
  console.log(`Total de servicios: ${totalRows[0]?.total || 0}`);

  console.log('\n=== INVENTARIO ===\n');
  const inventory = await db.execute(sql`
    SELECT COUNT(*) as total FROM inventory WHERE partnerId = ${partnerId}
  `);
  const inventoryRows = (inventory as any)[0] || [];
  console.log(`Total de items en inventario: ${inventoryRows[0]?.total || 0}`);

  console.log('\n=== TABLAS RELACIONADAS CON INVENTARIO ===\n');
  const tables = await db.execute(sql`SHOW TABLES LIKE '%inventory%'`);
  const tablesRows = (tables as any)[0] || [];
  console.log(`Tablas encontradas:`);
  tablesRows.forEach((row: any) => {
    const tableName = Object.values(row)[0];
    console.log(`  - ${tableName}`);
  });

  process.exit(0);
}

checkData();
