import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkAlerts() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  const ownerId = 'jnavarrete-inboundemotion';

  console.log(`Verificando pianos que deberían generar avisos para OWNER_ID: ${ownerId}\n`);

  // Obtener pianos con su último servicio
  const [pianos] = await connection.execute(`
    SELECT 
      p.id,
      p.brand,
      p.model,
      p.lastServiceDate,
      p.needsRepair,
      DATEDIFF(NOW(), p.lastServiceDate) as daysSinceService
    FROM pianos p
    WHERE p.odId = ?
    ORDER BY p.lastServiceDate ASC
    LIMIT 10
  `, [ownerId]);

  console.log('Pianos con fechas de servicio más antiguas:');
  console.log(pianos);

  // Calcular cuántos pianos deberían tener avisos
  const pianosArray = pianos as any[];
  const urgentPianos = pianosArray.filter(p => 
    p.needsRepair || (p.lastServiceDate && p.daysSinceService > 270) // 9 meses
  );
  const pendingPianos = pianosArray.filter(p => 
    !p.needsRepair && p.lastServiceDate && p.daysSinceService > 180 && p.daysSinceService <= 270 // 6-9 meses
  );

  console.log(`\n📊 Resumen de avisos:`);
  console.log(`   Pianos urgentes (>9 meses o necesitan reparación): ${urgentPianos.length}`);
  console.log(`   Pianos pendientes (6-9 meses): ${pendingPianos.length}`);

  await connection.end();
}

checkAlerts().catch(console.error);
