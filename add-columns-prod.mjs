import mysql from 'mysql2/promise';

const prodUrl = 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}';

console.log('Conectando a piano_emotion_db (Vercel)...\n');

const connection = await mysql.createConnection(prodUrl);

try {
  console.log('=== Agregando columnas faltantes ===\n');
  
  await connection.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS purchases_last_30_days INT DEFAULT 0');
  console.log('✅ purchases_last_30_days agregada');
  
  await connection.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP NULL');
  console.log('✅ last_purchase_date agregada');
  
  await connection.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL');
  console.log('✅ trial_ends_at agregada');
  
  await connection.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS distributor_id INT NULL');
  console.log('✅ distributor_id agregada');
  
  console.log('\n✅ Migración completada en piano_emotion_db');
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  await connection.end();
}
