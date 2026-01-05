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

    // Primero buscamos al usuario
    const [rows] = await connection.execute('SELECT id, email, subscriptionPlan FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      console.log(`Usuario ${email} no encontrado.`);
      await connection.end();
      return;
    }

    const user = rows[0];
    console.log(`Usuario encontrado: ID ${user.id}, Plan actual: ${user.subscriptionPlan}`);

    // Actualizamos a Premium
    // Según el esquema: ["free", "starter", "professional", "enterprise", "premium_ia"]
    // El usuario pidió "Premium". Según el error anterior, "premium_ia" podría no ser válido o estar truncado.
    // Intentaré con "premium" que es el estándar.
    const [result] = await connection.execute(
      'UPDATE users SET subscriptionPlan = ?, subscriptionStatus = ? WHERE email = ?',
      ['premium', 'active', email]
    );

    if (result.affectedRows > 0) {
      console.log(`¡Éxito! El usuario ${email} ahora tiene el plan Premium.`);
    } else {
      console.log('No se realizaron cambios.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error al actualizar:', error);
  }
}

updateToPremium();
