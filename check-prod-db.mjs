import mysql from 'mysql2/promise';

const prodUrl = 'mysql://2GeAqAcm5LrcHRv.root:PianoEmotion2026@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/piano_emotion_db?ssl={"rejectUnauthorized":true}';

const connection = await mysql.createConnection(prodUrl);

try {
  const [columns] = await connection.query('SHOW COLUMNS FROM users');
  
  console.log('=== Columnas en piano_emotion_db (Vercel) ===\n');
  
  const targetColumns = ['purchases_last_30_days', 'last_purchase_date', 'trial_ends_at', 'distributor_id'];
  
  const existingColumns = columns.map(c => c.Field);
  
  for (const col of targetColumns) {
    const exists = existingColumns.includes(col);
    console.log(`${col}: ${exists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
  }
  
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  await connection.end();
}
