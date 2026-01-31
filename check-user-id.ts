import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkUserId() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  // Buscar usuarios en la tabla users
  const [users] = await connection.execute(
    'SELECT * FROM users WHERE email LIKE ?',
    ['%jnavarrete%']
  );
  
  console.log('Usuarios encontrados:', users);
  
  // También buscar en clients por si acaso
  const [clients] = await connection.execute(
    'SELECT DISTINCT odId FROM clients LIMIT 10'
  );
  
  console.log('\nOWNER_IDs en la tabla clients:', clients);
  
  await connection.end();
}

checkUserId().catch(console.error);
