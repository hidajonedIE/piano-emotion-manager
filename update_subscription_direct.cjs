const mysql = require('mysql2/promise');

async function updateSubscription() {
  const connectionString = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";
  const email = 'jnavarrete@inboundemotion.com';
  
  try {
    const connection = await mysql.createConnection({
      uri: connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Conectado a TiDB...');

    // Ver estado actual
    const [before] = await connection.execute(
      'SELECT id, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = ?',
      [email]
    );
    console.log('ANTES:', before[0]);

    // Actualizar a premium_ia
    await connection.execute(
      "UPDATE users SET subscriptionPlan = 'premium_ia', subscriptionStatus = 'active' WHERE email = ?",
      [email]
    );

    // Verificar
    const [after] = await connection.execute(
      'SELECT id, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = ?',
      [email]
    );
    console.log('DESPUÉS:', after[0]);

    await connection.end();
    console.log('✅ Suscripción actualizada correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateSubscription();
