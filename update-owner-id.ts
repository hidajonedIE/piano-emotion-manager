import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function updateOwnerId() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  const oldOwnerId = 'jnavarrete-3962';
  const newOwnerId = 'jnavarrete-inboundemotion';

  console.log(`Actualizando OWNER_ID de '${oldOwnerId}' a '${newOwnerId}'...\n`);

  // Actualizar todas las tablas
  const tables = [
    'clients',
    'pianos',
    'services',
    'appointments',
    'invoices',
    'quotes',
    'inventory',
    'serviceRates',
    'reminders'
  ];

  for (const table of tables) {
    try {
      const [result] = await connection.execute(
        `UPDATE ${table} SET odId = ? WHERE odId = ?`,
        [newOwnerId, oldOwnerId]
      );
      console.log(`✅ ${table}: ${(result as any).affectedRows} registros actualizados`);
    } catch (error) {
      console.log(`❌ ${table}: Error - ${error}`);
    }
  }

  console.log('\n✅ Actualización completada!');
  await connection.end();
}

updateOwnerId().catch(console.error);
