/**
 * Script de depuración para verificar las recomendaciones de servicio
 */
import { getDb } from '../server/db';
import { pianos, services, clients } from '../drizzle/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const OWNER_ID = 'jnavarrete-inboundemotion';

async function debugRecommendations() {
  console.log('🔍 Iniciando depuración de recomendaciones...\n');

  const db = await getDb();
  if (!db) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }

  // 1. Obtener todos los pianos del usuario
  const userPianos = await db
    .select({
      id: pianos.id,
      brand: pianos.brand,
      model: pianos.model,
      serialNumber: pianos.serialNumber,
      clientId: pianos.clientId,
    })
    .from(pianos)
    .innerJoin(clients, eq(pianos.clientId, clients.id))
    .where(eq(clients.ownerId, OWNER_ID));

  console.log(`✅ Encontrados ${userPianos.length} pianos del usuario\n`);

  // 2. Para cada piano, obtener el último servicio de afinación
  let urgentCount = 0;
  let pendingCount = 0;

  for (const piano of userPianos) {
    const lastTuning = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.pianoId, piano.id),
          eq(services.serviceType, 'tuning')
        )
      )
      .orderBy(desc(services.serviceDate))
      .limit(1);

    if (lastTuning.length > 0) {
      const lastService = lastTuning[0];
      const daysSinceService = Math.floor(
        (Date.now() - new Date(lastService.serviceDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      let status = '';
      if (daysSinceService > 270) {
        urgentCount++;
        status = '🔴 URGENTE';
      } else if (daysSinceService > 180) {
        pendingCount++;
        status = '🟡 PENDIENTE';
      } else {
        status = '✅ OK';
      }

      console.log(`Piano: ${piano.brand} ${piano.model} (${piano.serialNumber})`);
      console.log(`  Último servicio: ${lastService.serviceDate}`);
      console.log(`  Días desde servicio: ${daysSinceService}`);
      console.log(`  Estado: ${status}\n`);
    } else {
      console.log(`Piano: ${piano.brand} ${piano.model} (${piano.serialNumber})`);
      console.log(`  ⚠️  Sin servicios de afinación registrados\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 RESUMEN:`);
  console.log(`   Pianos urgentes: ${urgentCount}`);
  console.log(`   Pianos pendientes: ${pendingCount}`);
  console.log(`   Total pianos: ${userPianos.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. Verificar servicios con serviceType
  const allServices = await db
    .select()
    .from(services)
    .limit(5);

  console.log('🔍 Muestra de servicios en la base de datos:');
  allServices.forEach(s => {
    console.log(`  Service ID: ${s.id}, Type: ${s.serviceType}, Piano ID: ${s.pianoId}, Date: ${s.serviceDate}`);
  });

  process.exit(0);
}

debugRecommendations().catch(console.error);
