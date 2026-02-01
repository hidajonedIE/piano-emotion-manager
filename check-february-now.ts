import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { clients, services, pianos } from './drizzle/schema.js';
import { eq, and, gte, lt } from 'drizzle-orm';

async function checkFebruaryData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log('\n🔍 CONSULTANDO BASE DE DATOS TIDB...\n');

  // Clientes creados en febrero 2026
  const clientsCount = await db.execute(`
    SELECT COUNT(*) as total
    FROM clients 
    WHERE partner_id = 1 
    AND created_at >= '2026-02-01 00:00:00'
    AND created_at < '2026-03-01 00:00:00'
  `);
  console.log('✅ Clientes creados en febrero 2026:', (clientsCount as any)[0][0].total);

  // Pianos creados en febrero 2026
  const pianosCount = await db.execute(`
    SELECT COUNT(*) as total
    FROM pianos 
    WHERE partner_id = 1 
    AND created_at >= '2026-02-01 00:00:00'
    AND created_at < '2026-03-01 00:00:00'
  `);
  console.log('✅ Pianos creados en febrero 2026:', (pianosCount as any)[0][0].total);

  // Servicios con fecha en febrero 2026
  const servicesCount = await db.execute(`
    SELECT COUNT(*) as total
    FROM services 
    WHERE partner_id = 1 
    AND date >= '2026-02-01 00:00:00'
    AND date < '2026-03-01 00:00:00'
  `);
  console.log('✅ Servicios con fecha en febrero 2026:', (servicesCount as any)[0][0].total);

  // Muestra de servicios
  console.log('\n📋 MUESTRA DE SERVICIOS DE FEBRERO:');
  const servicesSample = await db.execute(`
    SELECT id, client_id, piano_id, service_type, 
           DATE_FORMAT(date, '%Y-%m-%d') as fecha_servicio,
           DATE_FORMAT(created_at, '%Y-%m-%d') as fecha_creacion,
           cost
    FROM services 
    WHERE partner_id = 1 
    AND date >= '2026-02-01 00:00:00'
    AND date < '2026-03-01 00:00:00'
    ORDER BY date DESC
    LIMIT 10
  `);
  console.table((servicesSample as any)[0]);

  await connection.end();
}

checkFebruaryData().catch(console.error);
