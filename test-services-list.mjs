import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar servicios de febrero 2026 con partnerId = 1
const [services] = await conn.execute(`
  SELECT id, date, cost, serviceType, partnerId
  FROM services 
  WHERE partnerId = 1 
  AND date >= '2026-02-01' 
  AND date < '2026-03-01'
  ORDER BY date 
  LIMIT 20
`);

console.log(`\n📊 Servicios de febrero 2026 (partnerId=1): ${services.length} encontrados\n`);
console.table(services.map(s => ({
  id: s.id,
  fecha: s.date.toISOString().split('T')[0],
  costo: s.cost,
  tipo: s.serviceType,
  partnerId: s.partnerId
})));

// Calcular total de ingresos de febrero
const [total] = await conn.execute(`
  SELECT COUNT(*) as count, SUM(cost) as total
  FROM services 
  WHERE partnerId = 1 
  AND date >= '2026-02-01' 
  AND date < '2026-03-01'
`);

console.log(`\n💰 Total servicios febrero: ${total[0].count}`);
console.log(`💵 Total ingresos febrero: €${parseFloat(total[0].total).toFixed(2)}\n`);

await conn.end();
