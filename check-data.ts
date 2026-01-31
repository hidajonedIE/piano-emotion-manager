import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkData() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  console.log('Verificando datos en la base de datos...\n');

  // Verificar clientes
  const [clients] = await connection.execute(
    'SELECT COUNT(*) as count, odId FROM clients GROUP BY odId'
  );
  console.log('Clientes por OWNER_ID:', clients);

  // Verificar pianos
  const [pianos] = await connection.execute(
    'SELECT COUNT(*) as count, odId FROM pianos GROUP BY odId'
  );
  console.log('\nPianos por OWNER_ID:', pianos);

  // Verificar servicios
  const [services] = await connection.execute(
    'SELECT COUNT(*) as count, odId FROM services GROUP BY odId'
  );
  console.log('\nServicios por OWNER_ID:', services);

  await connection.end();
}

checkData().catch(console.error);
