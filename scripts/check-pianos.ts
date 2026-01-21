import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { clients, pianos, appointments } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const DATABASE_URL = 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}';
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const userEmail = 'jnavarrete@inboundemotion.com';

  // Obtener todos los clientes
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.odId, userEmail));

  console.log(`Total de clientes en DB: ${allClients.length}`);
  console.log(`Rango de IDs de clientes: ${Math.min(...allClients.map(c => c.id))} - ${Math.max(...allClients.map(c => c.id))}`);

  // Obtener algunos pianos
  const somePianos = await db
    .select()
    .from(pianos)
    .where(eq(pianos.odId, userEmail))
    .limit(10);

  console.log(`\nPrimeros 10 pianos:`);
  somePianos.forEach(p => {
    console.log(`  Piano ID ${p.id}: clientId=${p.clientId}, ${p.brand} ${p.model}`);
  });

  // Verificar si los clientIds de los pianos existen
  const clientIdsSet = new Set(allClients.map(c => c.id));
  const invalidPianos = somePianos.filter(p => !clientIdsSet.has(p.clientId));
  
  if (invalidPianos.length > 0) {
    console.log(`\n⚠️  Pianos con clientId inválido: ${invalidPianos.length} de ${somePianos.length}`);
    invalidPianos.forEach(p => {
      console.log(`  - Piano ID ${p.id}: clientId=${p.clientId} (NO EXISTE)`);
    });
  } else {
    console.log(`\n✅ Todos los pianos tienen clientIds válidos`);
  }

  // Obtener algunas citas
  const someAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.odId, userEmail))
    .limit(10);

  console.log(`\nPrimeras 10 citas:`);
  someAppointments.forEach(a => {
    const clientExists = clientIdsSet.has(a.clientId);
    console.log(`  Cita ID ${a.id}: clientId=${a.clientId} ${clientExists ? '✓' : '✗ NO EXISTE'}, pianoId=${a.pianoId}, ${a.title}`);
  });

  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
