import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkServicesForAlerts() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  const ownerId = 'jnavarrete-inboundemotion';

  console.log(`Verificando servicios para OWNER_ID: ${ownerId}\n`);

  // Obtener pianos y sus últimos servicios de tuning
  const [pianos] = await connection.execute(`
    SELECT 
      p.id as pianoId,
      p.brand,
      p.model,
      p.condition,
      p.createdAt as pianoCreatedAt,
      (SELECT s.date 
       FROM services s 
       WHERE s.pianoId = p.id AND s.serviceType = 'tuning'
       ORDER BY s.date DESC 
       LIMIT 1) as lastTuningDate,
      DATEDIFF(NOW(), (SELECT s.date 
                       FROM services s 
                       WHERE s.pianoId = p.id AND s.serviceType = 'tuning'
                       ORDER BY s.date DESC 
                       LIMIT 1)) as daysSinceLastTuning
    FROM pianos p
    WHERE p.odId = ?
    ORDER BY daysSinceLastTuning DESC
    LIMIT 20
  `, [ownerId]);

  console.log('Pianos y sus últimos servicios de tuning:');
  console.table(pianos);

  // Calcular cuántos avisos deberían aparecer
  const pianosArray = pianos as any[];
  const urgentPianos = pianosArray.filter(p => 
    p.condition === 'needs_repair' || 
    (p.lastTuningDate && p.daysSinceLastTuning > 270) || // 9 meses
    (!p.lastTuningDate && p.pianoCreatedAt && 
     ((Date.now() - new Date(p.pianoCreatedAt).getTime()) / (1000 * 60 * 60 * 24)) > 270)
  );
  
  const pendingPianos = pianosArray.filter(p => 
    p.condition !== 'needs_repair' &&
    ((p.lastTuningDate && p.daysSinceLastTuning > 180 && p.daysSinceLastTuning <= 270) ||
     (!p.lastTuningDate && p.pianoCreatedAt && 
      ((Date.now() - new Date(p.pianoCreatedAt).getTime()) / (1000 * 60 * 60 * 24)) > 180 &&
      ((Date.now() - new Date(p.pianoCreatedAt).getTime()) / (1000 * 60 * 60 * 24)) <= 270))
  );

  console.log(`\n📊 Resumen de avisos que deberían aparecer:`);
  console.log(`   Pianos urgentes (>9 meses o needs_repair): ${urgentPianos.length}`);
  console.log(`   Pianos pendientes (6-9 meses): ${pendingPianos.length}`);
  console.log(`   Total de avisos: ${urgentPianos.length + pendingPianos.length}`);

  if (urgentPianos.length > 0) {
    console.log(`\n🚨 Pianos urgentes:`);
    urgentPianos.forEach(p => {
      console.log(`   - ${p.brand} ${p.model} (ID: ${p.pianoId}): ${p.daysSinceLastTuning || 'Sin tuning'} días`);
    });
  }

  if (pendingPianos.length > 0) {
    console.log(`\n⏰ Pianos pendientes:`);
    pendingPianos.forEach(p => {
      console.log(`   - ${p.brand} ${p.model} (ID: ${p.pianoId}): ${p.daysSinceLastTuning || 'Sin tuning'} días`);
    });
  }

  await connection.end();
}

checkServicesForAlerts().catch(console.error);
