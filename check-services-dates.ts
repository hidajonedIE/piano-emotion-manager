import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

async function checkServicesDates() {
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
  });

  try {
    console.log('Verificando fechas de servicios...\n');
    
    // Contar servicios por mes
    const [services] = await connection.query(`
      SELECT 
        DATE_FORMAT(scheduled_date, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(total_price) as revenue
      FROM services
      WHERE scheduled_date IS NOT NULL
      GROUP BY DATE_FORMAT(scheduled_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);
    
    console.log('Servicios por mes:');
    console.table(services);
    
    // Ver rango de fechas
    const [dateRange] = await connection.query(`
      SELECT 
        MIN(scheduled_date) as first_service,
        MAX(scheduled_date) as last_service,
        COUNT(*) as total_services
      FROM services
      WHERE scheduled_date IS NOT NULL
    `);
    
    console.log('\nRango de fechas:');
    console.table(dateRange);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkServicesDates();
