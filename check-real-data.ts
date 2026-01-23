import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkRealData() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  try {
    console.log('Verificando datos reales en la base de datos...\n');
    
    // Contar servicios por mes
    const [services] = await connection.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(cost) as revenue
      FROM services
      WHERE date IS NOT NULL
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);
    
    console.log('Servicios por mes:');
    console.table(services);
    
    // Contar appointments por mes
    const [appointments] = await connection.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        status,
        COUNT(*) as count
      FROM appointments
      WHERE date IS NOT NULL
      GROUP BY DATE_FORMAT(date, '%Y-%m'), status
      ORDER BY month DESC, status
      LIMIT 20
    `);
    
    console.log('\nAppointments por mes y estado:');
    console.table(appointments);
    
    // Total de clientes
    const [clients] = await connection.query(`
      SELECT COUNT(*) as total FROM clients
    `);
    
    console.log('\nTotal de clientes:');
    console.table(clients);
    
    // Total de pianos
    const [pianos] = await connection.query(`
      SELECT COUNT(*) as total FROM pianos
    `);
    
    console.log('\nTotal de pianos:');
    console.table(pianos);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkRealData();
