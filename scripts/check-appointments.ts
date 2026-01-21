import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { clients, appointments } from '../drizzle/schema.js.js';
import { eq } from 'drizzle-orm';

async function main() {
  const DATABASE_URL = 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}';
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const userEmail = 'jnavarrete@inboundemotion.com';

  // Obtener algunas citas
  const someAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.odId, userEmail))
    .limit(10);

  console.log(`Total de citas encontradas: ${someAppointments.length}`);
  console.log('\nPrimeras 10 citas:');
  console.log(JSON.stringify(someAppointments, null, 2));

  // Obtener algunos clientes
  const someClients = await db
    .select()
    .from(clients)
    .where(eq(clients.odId, userEmail))
    .limit(10);

  console.log(`\nTotal de clientes encontrados: ${someClients.length}`);
  console.log('\nPrimeros 10 clientes:');
  console.log(JSON.stringify(someClients, null, 2));

  // Verificar si los clientIds de las citas existen en la tabla de clientes
  if (someAppointments.length > 0 && someClients.length > 0) {
    const clientIdsInAppointments = someAppointments.map(a => a.clientId);
    const clientIdsInDb = someClients.map(c => c.id);
    
    console.log('\n--- ANÁLISIS DE COINCIDENCIAS ---');
    console.log('ClientIds en citas:', clientIdsInAppointments);
    console.log('ClientIds en DB:', clientIdsInDb);
    
    const missing = clientIdsInAppointments.filter(id => !clientIdsInDb.includes(id));
    if (missing.length > 0) {
      console.log('\n⚠️  ClientIds faltantes en tabla clients:', missing);
      console.log(`Total de citas con clientId inválido: ${missing.length} de ${someAppointments.length}`);
    } else {
      console.log('\n✅ Todos los clientIds de las citas existen en la tabla clients');
    }
  }

  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
