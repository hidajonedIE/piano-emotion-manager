const mysql = require('mysql2/promise');

async function updateToPremium() {
  const connectionString = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";
  const email = 'jnavarrete@inboundemotion.com';
  
  try {
    const connection = await mysql.createConnection({
      uri: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('Conectado a TiDB...');

    // Buscar usuario
    const [rows] = await connection.execute(
      'SELECT id, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = ?', 
      [email]
    );
    
    if (rows.length === 0) {
      console.log(`Usuario ${email} no encontrado.`);
      await connection.end();
      return;
    }

    const user = rows[0];
    console.log('Usuario encontrado:', user);

    // Actualizar a premium
    await connection.execute(
      'UPDATE users SET subscriptionPlan = ?, subscriptionStatus = ? WHERE email = ?',
      ['premium_ia', 'active', email]
    );

    console.log('✅ Suscripción actualizada a premium_ia con estado active');

    // Verificar
    const [updated] = await connection.execute(
      'SELECT id, email, subscriptionPlan, subscriptionStatus FROM users WHERE email = ?',
      [email]
    );
    console.log('Usuario actualizado:', updated[0]);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateToPremium();
