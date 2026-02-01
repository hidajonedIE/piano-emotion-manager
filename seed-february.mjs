import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🌱 Iniciando seed de datos para febrero 2026...\n');

  // Usar partnerId = 1 (valor por defecto en la BD)
  const partnerId = 1;
  console.log(`✅ Usando partnerId: ${partnerId}\n`);

  // 1. CLIENTES
  console.log('📋 Creando clientes...');
  const clientNames = [
    { name: 'María González', email: 'maria.gonzalez@email.com', phone: '+34 612 345 678', address: 'Calle Mayor 15, Madrid' },
    { name: 'Juan Martínez', email: 'juan.martinez@email.com', phone: '+34 623 456 789', address: 'Av. Diagonal 234, Barcelona' },
    { name: 'Ana López', email: 'ana.lopez@email.com', phone: '+34 634 567 890', address: 'Gran Vía 56, Valencia' },
    { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', phone: '+34 645 678 901', address: 'Paseo de Gracia 78, Barcelona' },
    { name: 'Laura Fernández', email: 'laura.fernandez@email.com', phone: '+34 656 789 012', address: 'Calle Serrano 123, Madrid' },
    { name: 'Pedro Sánchez', email: 'pedro.sanchez@email.com', phone: '+34 667 890 123', address: 'Rambla Catalunya 45, Barcelona' },
    { name: 'Isabel García', email: 'isabel.garcia@email.com', phone: '+34 678 901 234', address: 'Calle Alcalá 89, Madrid' },
    { name: 'Miguel Ruiz', email: 'miguel.ruiz@email.com', phone: '+34 689 012 345', address: 'Av. Libertad 67, Sevilla' },
    { name: 'Carmen Díaz', email: 'carmen.diaz@email.com', phone: '+34 690 123 456', address: 'Plaza España 12, Zaragoza' },
    { name: 'Francisco Moreno', email: 'francisco.moreno@email.com', phone: '+34 601 234 567', address: 'Calle Real 34, Málaga' },
    { name: 'Elena Jiménez', email: 'elena.jimenez@email.com', phone: '+34 612 345 678', address: 'Av. Constitución 56, Bilbao' },
    { name: 'Antonio Álvarez', email: 'antonio.alvarez@email.com', phone: '+34 623 456 789', address: 'Calle Toledo 78, Madrid' },
    { name: 'Rosa Romero', email: 'rosa.romero@email.com', phone: '+34 634 567 890', address: 'Paseo Marítimo 23, Valencia' },
    { name: 'José Torres', email: 'jose.torres@email.com', phone: '+34 645 678 901', address: 'Calle Larios 45, Málaga' },
    { name: 'Lucía Navarro', email: 'lucia.navarro@email.com', phone: '+34 656 789 012', address: 'Gran Vía 90, Granada' },
  ];

  const clientIds = [];
  for (const client of clientNames) {
    const odId = `CL${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const [result] = await connection.execute(
      `INSERT INTO clients (odId, name, email, phone, address, partnerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [odId, client.name, client.email, client.phone, client.address, partnerId]
    );
    clientIds.push(result.insertId);
  }
  console.log(`✅ ${clientIds.length} clientes creados\n`);

  // 2. PIANOS
  console.log('🎹 Creando pianos...');
  const pianoTypes = ['vertical', 'grand', 'baby_grand', 'digital'];
  const pianoBrands = ['Yamaha', 'Steinway', 'Kawai', 'Bösendorfer', 'Fazioli', 'Blüthner', 'Bechstein'];
  const pianoIds = [];

  for (let i = 0; i < 25; i++) {
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const type = pianoTypes[Math.floor(Math.random() * pianoTypes.length)];
    const brand = pianoBrands[Math.floor(Math.random() * pianoBrands.length)];
    const model = `${brand} ${type === 'grand' ? 'C' : 'U'}${Math.floor(Math.random() * 9) + 1}`;
    const serialNumber = `SN${Math.floor(Math.random() * 900000) + 100000}`;
    const year = 2024 - Math.floor(Math.random() * 30);
    const odId = `PI${Date.now()}${i}`;

    const [result] = await connection.execute(
      `INSERT INTO pianos (odId, clientId, brand, model, serialNumber, type, year, partnerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [odId, clientId, brand, model, serialNumber, type, year, partnerId]
    );
    pianoIds.push(result.insertId);
  }
  console.log(`✅ ${pianoIds.length} pianos creados\n`);

  // 3. SERVICIOS Y CITAS (febrero 2026)
  console.log('🔧 Creando servicios y citas para febrero 2026...');
  const serviceTypes = ['tuning', 'repair', 'regulation', 'maintenance_basic', 'maintenance_complete', 'inspection'];
  const serviceCosts = {
    tuning: [80, 120],
    repair: [150, 400],
    regulation: [200, 350],
    maintenance_basic: [60, 100],
    maintenance_complete: [120, 200],
    inspection: [50, 80],
  };

  const serviceIds = [];
  const appointmentStatuses = ['scheduled', 'confirmed', 'completed'];
  
  // Generar 50 servicios distribuidos en febrero
  for (let i = 0; i < 50; i++) {
    const pianoId = pianoIds[Math.floor(Math.random() * pianoIds.length)];
    
    // Obtener clientId del piano
    const [pianoData] = await connection.execute('SELECT clientId FROM pianos WHERE id = ?', [pianoId]);
    const clientId = pianoData[0].clientId;

    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const [minCost, maxCost] = serviceCosts[serviceType];
    const cost = (Math.random() * (maxCost - minCost) + minCost).toFixed(2);
    
    // Fecha aleatoria en febrero 2026
    const day = Math.floor(Math.random() * 28) + 1;
    const hour = Math.floor(Math.random() * 10) + 8; // 8:00 - 17:00
    const date = `2026-02-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:00:00`;
    
    const duration = Math.floor(Math.random() * 180) + 60; // 60-240 minutos
    const odId = `OD${Date.now()}${i}`;

    // Crear servicio
    const [serviceResult] = await connection.execute(
      `INSERT INTO services (odId, pianoId, clientId, serviceType, date, cost, duration, status, partnerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW(), NOW())`,
      [odId, pianoId, clientId, serviceType, date, cost, duration, partnerId]
    );
    const serviceId = serviceResult.insertId;
    serviceIds.push({ id: serviceId, cost, clientId, date, pianoId });

    // Crear cita asociada al servicio
    const appointmentStatus = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
    const notes = `Cita para ${serviceType.replace('_', ' ')} - Piano ${pianoId}`;
    
    await connection.execute(
      `INSERT INTO appointments (clientId, pianoId, scheduledDate, serviceType, status, notes, partnerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [clientId, pianoId, date, serviceType, appointmentStatus, notes, partnerId]
    );
  }
  console.log(`✅ ${serviceIds.length} servicios y citas creados\n`);

  // 4. FACTURAS
  console.log('💰 Creando facturas...');
  for (const service of serviceIds) {
    const invoiceNumber = `INV-2026-${String(service.id).padStart(6, '0')}`;
    const dueDate = new Date(service.date);
    dueDate.setDate(dueDate.getDate() + 30);
    const odId = `INV${Date.now()}${service.id}`;
    
    await connection.execute(
      `INSERT INTO invoices (odId, invoiceNumber, clientId, amount, status, issueDate, dueDate, partnerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, NOW(), NOW())`,
      [odId, invoiceNumber, service.clientId, service.cost, service.date, dueDate.toISOString().split('T')[0], partnerId]
    );
  }
  console.log(`✅ ${serviceIds.length} facturas creadas\n`);

  // RESUMEN
  console.log('📊 RESUMEN:');
  const [clientCount] = await connection.execute('SELECT COUNT(*) as total FROM clients WHERE partnerId = ?', [partnerId]);
  const [pianoCount] = await connection.execute('SELECT COUNT(*) as total FROM pianos WHERE partnerId = ?', [partnerId]);
  const [serviceCount] = await connection.execute('SELECT COUNT(*) as total FROM services WHERE partnerId = ? AND date >= "2026-02-01" AND date < "2026-03-01"', [partnerId]);
  const [appointmentCount] = await connection.execute('SELECT COUNT(*) as total FROM appointments WHERE partnerId = ? AND scheduledDate >= "2026-02-01" AND scheduledDate < "2026-03-01"', [partnerId]);
  const [invoiceCount] = await connection.execute('SELECT COUNT(*) as total FROM invoices WHERE partnerId = ?', [partnerId]);
  const [totalRevenue] = await connection.execute('SELECT SUM(cost) as total FROM services WHERE partnerId = ? AND date >= "2026-02-01" AND date < "2026-03-01"', [partnerId]);

  console.log(`  Clientes: ${clientCount[0].total}`);
  console.log(`  Pianos: ${pianoCount[0].total}`);
  console.log(`  Servicios (febrero): ${serviceCount[0].total}`);
  console.log(`  Citas (febrero): ${appointmentCount[0].total}`);
  console.log(`  Facturas: ${invoiceCount[0].total}`);
  console.log(`  Ingresos totales (febrero): €${parseFloat(totalRevenue[0].total || 0).toFixed(2)}`);

  console.log('\n✅ Seed completado exitosamente!');

} catch (error) {
  console.error('❌ Error durante el seed:', error);
  throw error;
} finally {
  await connection.end();
}
