import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function describeServices() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  try {
    console.log('Estructura de la tabla services:\n');
    
    const [columns] = await connection.query('DESCRIBE services');
    console.table(columns);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

describeServices();
