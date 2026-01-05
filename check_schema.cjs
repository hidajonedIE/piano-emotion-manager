const mysql = require('mysql2/promise');

async function checkSchema() {
  const connectionString = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";
  
  try {
    const connection = await mysql.createConnection({
      uri: connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Conectado a TiDB...');

    // Ver el schema de la columna subscriptionPlan
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'subscriptionPlan'"
    );
    console.log('Schema de subscriptionPlan:');
    console.log(columns[0]);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
