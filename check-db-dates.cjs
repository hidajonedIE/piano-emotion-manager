const mysql = require('mysql2/promise');
const fs = require('fs');

// Leer DATABASE_URL del .env.local
const envContent = fs.readFileSync('/home/ubuntu/piano-emotion-manager/.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
let DATABASE_URL = dbUrlMatch ? dbUrlMatch[1].trim() : null;

// Limpiar comillas y saltos de línea
if (DATABASE_URL) {
  DATABASE_URL = DATABASE_URL.replace(/^["']|["']$/g, '').replace(/\\n/g, '').trim();
}

if (!DATABASE_URL) {
  console.error('No se encontró DATABASE_URL en .env.local');
  process.exit(1);
}

async function checkDates() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Consultar rango de fechas
    const [rows] = await connection.execute(`
      SELECT 
        MIN(date) as fecha_minima,
        MAX(date) as fecha_maxima,
        COUNT(*) as total_servicios,
        DATE_FORMAT(MIN(date), '%Y-%m') as mes_minimo,
        DATE_FORMAT(MAX(date), '%Y-%m') as mes_maximo
      FROM services
    `);
    
    console.log('\n=== RANGO DE FECHAS EN LA BASE DE DATOS ===\n');
    console.log('Fecha más antigua:', rows[0].fecha_minima);
    console.log('Fecha más reciente:', rows[0].fecha_maxima);
    console.log('Total de servicios:', rows[0].total_servicios);
    console.log('Mes más antiguo:', rows[0].mes_minimo);
    console.log('Mes más reciente:', rows[0].mes_maximo);
    
    // Distribución por mes
    const [monthly] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as mes,
        COUNT(*) as cantidad,
        SUM(CAST(cost AS DECIMAL(10,2))) as ingresos
      FROM services
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY mes DESC
      LIMIT 12
    `);
    
    console.log('\n=== ÚLTIMOS 12 MESES ===\n');
    monthly.forEach(m => {
      console.log(`${m.mes}: ${m.cantidad} servicios, ${Math.round(m.ingresos)}€`);
    });
    
  } finally {
    await connection.end();
  }
}

checkDates().catch(console.error);
