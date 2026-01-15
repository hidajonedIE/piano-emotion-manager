/**
 * Script para generar datos de prueba masivos para stress testing
 * Genera miles de registros en la base de datos
 */

import { getDb } from '../server/db';
import { clients, pianos, services, appointments, invoices, inventory, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const CLIENTS_COUNT = 250;
const SERVICES_COUNT = 1500;
const APPOINTMENTS_COUNT = 100;
const INVOICES_COUNT = 300;
const PIANOS_COUNT = 400;
const INVENTORY_COUNT = 80;

// Datos realistas para generación
const firstNames = ['Carlos', 'María', 'José', 'Ana', 'Francisco', 'Carmen', 'Antonio', 'Isabel', 'Manuel', 'Dolores', 'David', 'Pilar', 'Daniel', 'Teresa', 'Javier', 'Rosa', 'Miguel', 'Concepción', 'Alejandro', 'Josefa', 'Rafael', 'Francisca', 'Fernando', 'Antonia', 'Sergio', 'Mercedes', 'Pablo', 'Rosario', 'Jorge', 'Ángeles', 'Alberto', 'Cristina', 'Luis', 'Lucía', 'Álvaro', 'Marta', 'Adrián', 'Elena', 'Diego', 'Laura', 'Raúl', 'Patricia', 'Rubén', 'Sara', 'Óscar', 'Beatriz', 'Iván', 'Silvia', 'Víctor', 'Nuria'];

const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'];

const calles = ['Gran Vía', 'Calle Mayor', 'Paseo de la Castellana', 'Calle Alcalá', 'Avenida de América', 'Calle Serrano', 'Calle Goya', 'Calle Velázquez', 'Paseo del Prado', 'Calle Princesa', 'Avenida Diagonal', 'Rambla de Cataluña', 'Paseo de Gracia', 'Calle Balmes', 'Calle Aragón', 'Calle Valencia', 'Calle Mallorca', 'Avenida Meridiana', 'Calle Colón', 'Plaza España', 'Calle San Vicente', 'Avenida del Puerto', 'Calle Xàtiva', 'Gran Vía Marqués del Turia', 'Calle Reyes Católicos', 'Avenida de Andalucía', 'Calle Recogidas', 'Calle Mesones', 'Gran Vía de Colón', 'Calle Larios'];

const ciudades = [
  { nombre: 'Madrid', cp: ['28001', '28002', '28003', '28004', '28005', '28006', '28007', '28008', '28009', '28010', '28013', '28015', '28020', '28028'] },
  { nombre: 'Barcelona', cp: ['08001', '08002', '08003', '08004', '08005', '08006', '08007', '08008', '08009', '08010', '08012', '08015', '08021', '08025'] },
  { nombre: 'Valencia', cp: ['46001', '46002', '46003', '46004', '46005', '46006', '46007', '46008', '46009', '46010', '46011', '46015', '46020', '46022'] },
  { nombre: 'Sevilla', cp: ['41001', '41002', '41003', '41004', '41005', '41006', '41007', '41008', '41009', '41010', '41011', '41013', '41018', '41020'] },
  { nombre: 'Zaragoza', cp: ['50001', '50002', '50003', '50004', '50005', '50006', '50007', '50008', '50009', '50010', '50012', '50015', '50018', '50021'] },
  { nombre: 'Málaga', cp: ['29001', '29002', '29003', '29004', '29005', '29006', '29007', '29008', '29009', '29010', '29011', '29013', '29016', '29018'] },
  { nombre: 'Murcia', cp: ['30001', '30002', '30003', '30004', '30005', '30006', '30007', '30008', '30009', '30010', '30011', '30012', '30100', '30120'] },
  { nombre: 'Palma', cp: ['07001', '07002', '07003', '07004', '07005', '07006', '07007', '07008', '07009', '07010', '07011', '07012', '07013', '07014'] },
  { nombre: 'Bilbao', cp: ['48001', '48002', '48003', '48004', '48005', '48006', '48007', '48008', '48009', '48010', '48011', '48013', '48014', '48015'] },
  { nombre: 'Alicante', cp: ['03001', '03002', '03003', '03004', '03005', '03006', '03007', '03008', '03009', '03010', '03011', '03012', '03013', '03014'] }
];
const pianoTypes = ['Vertical', 'Cola', 'Digital', 'Media Cola'];
const pianoBrands = ['Yamaha', 'Kawai', 'Steinway', 'Bösendorfer', 'Fazioli', 'Bechstein', 'Blüthner'];
const serviceTypes = ['Afinación', 'Reparación', 'Mantenimiento', 'Restauración', 'Regulación'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateClients(userId: number, db: any, userEmail: string) {
  console.log(`Generando ${CLIENTS_COUNT} clientes...`);
  const clientsData = [];
  
  // Distribución fija de tipos de clientes
  const clientTypes = [
    ...Array(205).fill('particular'),      // 82% - 205 pianos
    ...Array(20).fill('professional'),     // 8% - 20 pianos
    ...Array(18).fill('music_school'),     // 7% - ~135 pianos
    ...Array(4).fill('conservatory'),      // 1.6% - ~80 pianos
    ...Array(3).fill('concert_hall'),      // 1.2% - ~13 pianos
  ];  // Total esperado: ~450 pianos
  
  for (let i = 0; i < CLIENTS_COUNT; i++) {
    const firstName = randomElement(firstNames);
    const lastName = `${randomElement(lastNames)} ${randomElement(lastNames)}`;
    
    const calle = randomElement(calles);
    const numero = Math.floor(1 + Math.random() * 200);
    const ciudad = randomElement(ciudades);
    const cp = randomElement(ciudad.cp);
    const direccionCompleta = `${calle}, ${numero}, ${cp} ${ciudad.nombre}`;
    
    const emailNombre = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const emailApellido = lastName.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Obtener tipo de cliente de la distribución fija
    const clientType = clientTypes[i];
    
    clientsData.push({
      odId: userEmail,
      name: `${firstName} ${lastName}`,
      email: `${emailNombre}.${emailApellido}${i}@test.com`,
      phone: `6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      address: direccionCompleta,
      clientType: clientType as any,
      partnerId: 1,
      notes: `Cliente generado para pruebas de estrés`,
      createdAt: randomDate(new Date(2020, 0, 1), new Date()),
    });
    
    if (clientsData.length >= 100) {
      await db.insert(clients).values(clientsData);
      clientsData.length = 0;
    }
  }
  
  if (clientsData.length > 0) {
    await db.insert(clients).values(clientsData);
  }
  
  console.log(`✅ ${CLIENTS_COUNT} clientes generados`);
}

async function generatePianos(userId: number, clientIds: any[], db: any, userEmail: string) {
  console.log(`Generando pianos según tipo de cliente...`);
  const pianosData = [];
  let totalPianos = 0;
  
  // Obtener información completa de los clientes para saber su tipo
  const allClientsInfo = await db.select({ id: clients.id, clientType: clients.clientType }).from(clients).where(eq(clients.odId, userEmail));
  
  // Asignar pianos según el tipo de cliente
  for (const client of allClientsInfo) {
    let numPianos = 1; // Por defecto, 1 piano
    
    // Determinar cantidad de pianos según tipo
    if (client.clientType === 'music_school') {
      numPianos = 5 + Math.floor(Math.random() * 6); // 5-10 pianos
    } else if (client.clientType === 'conservatory') {
      numPianos = 15 + Math.floor(Math.random() * 11); // 15-25 pianos
    } else if (client.clientType === 'concert_hall') {
      numPianos = 3 + Math.floor(Math.random() * 4); // 3-6 pianos
    }
    // particulares y professional: 1 piano (default)
    
    // Generar los pianos para este cliente
    for (let j = 0; j < numPianos; j++) {
      // Salas de concierto tienen principalmente pianos de cola
      const types = client.clientType === 'concert_hall' ? ['Cola', 'Media Cola'] : pianoTypes;
      
      pianosData.push({
        odId: userEmail,
        clientId: client.id,
        brand: randomElement(pianoBrands),
        model: `Modelo ${Math.floor(Math.random() * 1000)}`,
        pianoType: randomElement(types),
        serialNumber: `SN${Math.floor(Math.random() * 1000000)}`,
        year: 1950 + Math.floor(Math.random() * 74),
        location: randomElement(ciudades).nombre,
        partnerId: 1,
        notes: `Piano de prueba ${totalPianos}`,
        createdAt: randomDate(new Date(2020, 0, 1), new Date()),
      });
      
      totalPianos++;
      
      if (pianosData.length >= 100) {
        await db.insert(pianos).values(pianosData);
        pianosData.length = 0;
      }
    }
  }
  
  if (pianosData.length > 0) {
    await db.insert(pianos).values(pianosData);
  }
  
  console.log(`✅ ${totalPianos} pianos generados`);
}

async function generateServices(userId: number, clientIds: string[], pianoIds: string[], db: any, userEmail: string) {
  console.log(`Generando ${SERVICES_COUNT} servicios...`);
  const servicesData = [];
  
  for (let i = 0; i < SERVICES_COUNT; i++) {
    // Generar servicios con variedad de fechas para tener diferentes tipos de alertas
    // 60% servicios recientes (2024-2026), 30% de 2023, 10% de 2022
    let startDate;
    const rand = Math.random();
    if (rand < 0.6) {
      startDate = new Date(2024, 0, 1); // Recientes
    } else if (rand < 0.9) {
      startDate = new Date(2023, 0, 1); // Warnings
    } else {
      startDate = new Date(2022, 0, 1); // Urgentes
    }
    const date = randomDate(startDate, new Date());
    servicesData.push({
      odId: userEmail,
      clientId: randomElement(clientIds),
      pianoId: pianoIds[i % pianoIds.length],
      type: randomElement(serviceTypes),
      date: date.toISOString().split('T')[0],
      cost: 50 + Math.floor(Math.random() * 450),
      partnerId: 1,
      notes: `Servicio de prueba ${i}`,
      status: randomElement(['completed', 'pending', 'cancelled']),
      createdAt: date,
    });
    
    if (servicesData.length >= 100) {
      await db.insert(services).values(servicesData);
      servicesData.length = 0;
    }
  }
  
  if (servicesData.length > 0) {
    await db.insert(services).values(servicesData);
  }
  
  console.log(`✅ ${SERVICES_COUNT} servicios generados`);
}

async function generateAppointments(userId: number, clientIds: string[], pianoIds: string[], db: any, userEmail: string) {
  console.log(`Generando ${APPOINTMENTS_COUNT} citas...`);
  
  if (pianoIds.length === 0) {
    console.error('⚠️  No hay pianos disponibles para generar citas');
    return;
  }
  
  const appointmentsData = [];
  
  for (let i = 0; i < APPOINTMENTS_COUNT; i++) {
    const date = randomDate(new Date(), new Date(2026, 11, 31));
    const hour = 9 + Math.floor(Math.random() * 9);
    const type = randomElement(serviceTypes);
    appointmentsData.push({
      odId: userEmail,
      clientId: randomElement(clientIds),
      pianoId: pianoIds[i % pianoIds.length],
      title: type,
      date: date.toISOString().split('T')[0],
      time: `${hour.toString().padStart(2, '0')}:00`,
      type: type,
      partnerId: 1,
      status: randomElement(['scheduled', 'completed', 'cancelled']),
      notes: `Cita de prueba ${i}`,
      createdAt: new Date(),
    });
    
    if (appointmentsData.length >= 100) {
      await db.insert(appointments).values(appointmentsData);
      appointmentsData.length = 0;
    }
  }
  
  if (appointmentsData.length > 0) {
    await db.insert(appointments).values(appointmentsData);
  }
  
  console.log(`✅ ${APPOINTMENTS_COUNT} citas generadas`);
}

async function generateInvoices(userId: number, clientIds: string[], db: any, userEmail: string) {
  console.log(`Generando ${INVOICES_COUNT} facturas...`);
  
  // Obtener nombres de clientes
  const allClientsInfo = await db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.odId, userEmail));
  const clientsMap = new Map(allClientsInfo.map(c => [c.id, c.name]));
  
  const invoicesData = [];
  
  for (let i = 0; i < INVOICES_COUNT; i++) {
    const date = randomDate(new Date(2023, 0, 1), new Date());
    const amount = 100 + Math.floor(Math.random() * 900);
    const paid = Math.random() > 0.25; // 75% de facturas pagadas (25% pendientes para generar avisos)
    
    const clientId = randomElement(clientIds);
    invoicesData.push({
      odId: userEmail,
      clientId: clientId,
      clientName: clientsMap.get(clientId) || 'Cliente Desconocido',
      invoiceNumber: `INV-2024-${(i + 1).toString().padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: amount,
      taxAmount: Math.round(amount * 0.21), // 21% IVA
      total: Math.round(amount * 1.21),
      amount,
      paid,
      partnerId: 1,
      paidDate: paid ? new Date(date.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      notes: `Factura de prueba ${i}`,
      createdAt: date,
    });
    
    if (invoicesData.length >= 100) {
      await db.insert(invoices).values(invoicesData);
      invoicesData.length = 0;
    }
  }
  
  if (invoicesData.length > 0) {
    await db.insert(invoices).values(invoicesData);
  }
  
  console.log(`✅ ${INVOICES_COUNT} facturas generadas`);
}

async function generateInventory(userId: number, db: any, userEmail: string) {
  console.log(`Generando ${INVENTORY_COUNT} productos de inventario...`);
  const inventoryData = [];
  const categories = ['strings', 'hammers', 'dampers', 'keys', 'action_parts', 'pedals', 'tuning_pins', 'felts', 'tools', 'chemicals', 'other'];
  
  for (let i = 0; i < INVENTORY_COUNT; i++) {
    inventoryData.push({
      odId: userEmail,
      name: `Producto ${i}`,
      category: randomElement(categories),
      quantity: Math.floor(Math.random() * 100),
      minQuantity: 5 + Math.floor(Math.random() * 15),
      price: 10 + Math.floor(Math.random() * 190),
      partnerId: 1,
      supplier: `Proveedor ${Math.floor(Math.random() * 20)}`,
      notes: `Producto de prueba ${i}`,
      createdAt: randomDate(new Date(2020, 0, 1), new Date()),
    });
    
    if (inventoryData.length >= 100) {
      await db.insert(inventory).values(inventoryData);
      inventoryData.length = 0;
    }
  }
  
  if (inventoryData.length > 0) {
    await db.insert(inventory).values(inventoryData);
  }
  
  console.log(`✅ ${INVENTORY_COUNT} productos de inventario generados`);
}

async function main() {
  // Obtener conexión a la base de datos
  const db = await getDb();
  if (!db) {
    console.error('❌ Error: No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  // Buscar usuario por email
  const [user] = await db.select().from(users).where(eq(users.email, 'jnavarrete@inboundemotion.com')).limit(1);
  
  if (!user) {
    console.error('❌ Error: Usuario no encontrado');
    process.exit(1);
  }
  
  const userId = user.id;
  const userEmail = user.email;
  console.log(`✅ Usuario encontrado: ${userEmail} (ID: ${userId})\n`);
  
  console.log('🚀 Iniciando generación de datos de prueba masivos...\n');
  
  try {
    // Generar clientes
    await generateClients(userId, db, userEmail);
    
    // Obtener IDs de clientes generados
    const allClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.odId, userEmail));
    const clientIds = allClients.map(c => c.id);
    
    // Generar pianos
    await generatePianos(userId, clientIds, db, userEmail);
    
    // Obtener IDs de pianos generados
    const allPianos = await db.select({ id: pianos.id }).from(pianos).where(eq(pianos.odId, userEmail));
    const pianoIds = allPianos.map(p => p.id);
    
    // Generar servicios
    await generateServices(userId, clientIds, pianoIds, db, userEmail);
    
    // Generar citas
    await generateAppointments(userId, clientIds, pianoIds, db, userEmail);
    
    // Generar facturas
    await generateInvoices(userId, clientIds, db, userEmail);
    
    // Generar inventario
    await generateInventory(userId, db, userEmail);
    
    console.log('\n✅ ¡Generación de datos completada exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - ${CLIENTS_COUNT} clientes`);
    console.log(`   - ${PIANOS_COUNT} pianos`);
    console.log(`   - ${SERVICES_COUNT} servicios`);
    console.log(`   - ${APPOINTMENTS_COUNT} citas`);
    console.log(`   - ${INVOICES_COUNT} facturas`);
    console.log(`   - ${INVENTORY_COUNT} productos de inventario`);
    
  } catch (error) {
    console.error('❌ Error durante la generación de datos:', error);
    process.exit(1);
  }
}

main();
