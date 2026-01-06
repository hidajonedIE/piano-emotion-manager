const mysql = require('mysql2/promise');

async function updateToPremium() {
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  try {
    // Actualizar a premium
    const [result] = await connection.execute(
      `UPDATE users 
       SET subscriptionPlan = 'premium', 
           subscriptionStatus = 'active',
           updatedAt = NOW()
       WHERE email = 'jnavarrete@inboundemotion.com'`
    );
    
    console.log('✅ Suscripción actualizada a premium:', result);
    
    // Verificar
    const [rows] = await connection.execute(
      'SELECT id, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = ?',
      ['jnavarrete@inboundemotion.com']
    );
    
    console.log('📋 Estado actual:', rows[0]);
  } finally {
    await connection.end();
  }
}

updateToPremium().catch(console.error);
