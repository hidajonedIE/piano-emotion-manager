import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { clients, appointments } from '../drizzle/schema.js.js';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  const DATABASE_URL = 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}';
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const userEmail = 'jnavarrete@inboundemotion.com';

  // Obtener todas las citas
  const allAppointments = await db
    .select()
    .from(appointments)
    .where(eq(appointments.odId, userEmail));

  console.log(`Total de citas: ${allAppointments.length}`);

  // Obtener todos los clientIds únicos de las citas
  const uniqueClientIds = [...new Set(allAppointments.map(a => a.clientId))];
  console.log(`ClientIds únicos en citas: ${uniqueClientIds.length}`);
  console.log(`IDs: ${uniqueClientIds.slice(0, 20).join(', ')}...`);

  // Verificar cuáles de esos clientIds existen en la tabla clients
  const existingClients = await db
    .select()
    .from(clients)
    .where(inArray(clients.id, uniqueClientIds));

  console.log(`\nClientes encontrados en DB: ${existingClients.length} de ${uniqueClientIds.length}`);

  const existingClientIds = new Set(existingClients.map(c => c.id));
  const missingClientIds = uniqueClientIds.filter(id => !existingClientIds.has(id));

  if (missingClientIds.length > 0) {
    console.log(`\n⚠️  ClientIds que NO EXISTEN en la tabla clients:`);
    console.log(missingClientIds.join(', '));
    console.log(`\nTotal de clientIds faltantes: ${missingClientIds.length}`);
    
    // Contar cuántas citas tienen clientIds inválidos
    const invalidAppointments = allAppointments.filter(a => !existingClientIds.has(a.clientId));
    console.log(`Citas afectadas: ${invalidAppointments.length} de ${allAppointments.length}`);
  } else {
    console.log(`\n✅ Todos los clientIds de las citas existen en la tabla clients`);
  }

  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
