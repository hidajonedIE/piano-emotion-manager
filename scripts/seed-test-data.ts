/**
 * Script de Seed - Datos de Prueba para Piano Emotion Manager
 * 
 * Este script genera datos de prueba realistas para la aplicación:
 * - 15+ clientes con datos completos
 * - Pianos asociados a cada cliente
 * - Servicios realizados
 * - Citas programadas
 * - Facturas y presupuestos
 * - Items de inventario
 * 
 * Ejecutar con: npx tsx scripts/seed-test-data.ts
 */

import { getDb } from '../server/db';
import { 
  clients, 
  pianos, 
  services, 
  appointments, 
  invoices, 
  inventory,
  quotes,
  serviceRates,
  reminders
} from '../drizzle/schema';

// ID del usuario propietario (debe coincidir con el usuario autenticado)
const OWNER_ID = 'test_user_seed';

// ============================================================================
// DATOS DE CLIENTES
// ============================================================================
const clientsData = [
  {
    name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+34 612 345 678',
    address: 'Calle Mayor 15, 3º A',
    clientType: 'particular' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28013',
    notes: 'Cliente desde 2020. Prefiere citas por la tarde.',
  },
  {
    name: 'Conservatorio Municipal de Música',
    email: 'info@conservatorio-madrid.es',
    phone: '+34 915 678 901',
    address: 'Avenida de la Música 42',
    clientType: 'conservatory' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28020',
    notes: 'Contrato anual de mantenimiento. 12 pianos.',
  },
  {
    name: 'Carlos Rodríguez Martín',
    email: 'carlos.rodriguez@gmail.com',
    phone: '+34 623 456 789',
    address: 'Plaza del Sol 8, 2º B',
    clientType: 'professional' as const,
    city: 'Barcelona',
    region: 'Cataluña',
    postalCode: '08001',
    notes: 'Pianista profesional. Requiere afinación frecuente.',
  },
  {
    name: 'Academia de Música Allegro',
    email: 'contacto@academiaallegro.com',
    phone: '+34 934 567 890',
    address: 'Carrer de Balmes 156',
    clientType: 'music_school' as const,
    city: 'Barcelona',
    region: 'Cataluña',
    postalCode: '08008',
    notes: '5 pianos verticales y 2 de cola.',
  },
  {
    name: 'Ana Fernández Ruiz',
    email: 'ana.fernandez@outlook.com',
    phone: '+34 634 567 890',
    address: 'Calle Sierpes 23, 1º',
    clientType: 'student' as const,
    city: 'Sevilla',
    region: 'Andalucía',
    postalCode: '41004',
    notes: 'Estudiante de piano. Piano heredado de su abuela.',
  },
  {
    name: 'Teatro Real de Madrid',
    email: 'tecnico@teatroreal.es',
    phone: '+34 915 160 660',
    address: 'Plaza de Isabel II, s/n',
    clientType: 'concert_hall' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28013',
    notes: 'Steinway de concierto. Afinación antes de cada evento.',
  },
  {
    name: 'Pedro Sánchez Gómez',
    email: 'pedro.sanchez@yahoo.es',
    phone: '+34 645 678 901',
    address: 'Avenida del Puerto 78, 5º C',
    clientType: 'particular' as const,
    city: 'Valencia',
    region: 'Comunidad Valenciana',
    postalCode: '46021',
    notes: 'Piano Yamaha U3. Afinación semestral.',
  },
  {
    name: 'Escuela de Música Sonata',
    email: 'info@escuelasonata.es',
    phone: '+34 963 456 789',
    address: 'Calle Colón 45',
    clientType: 'music_school' as const,
    city: 'Valencia',
    region: 'Comunidad Valenciana',
    postalCode: '46004',
    notes: '8 pianos. Mantenimiento trimestral.',
  },
  {
    name: 'Laura Martínez Pérez',
    email: 'laura.martinez@gmail.com',
    phone: '+34 656 789 012',
    address: 'Gran Vía 102, 4º D',
    clientType: 'professional' as const,
    city: 'Bilbao',
    region: 'País Vasco',
    postalCode: '48001',
    notes: 'Profesora de piano. Bechstein de media cola.',
  },
  {
    name: 'Auditorio Nacional',
    email: 'mantenimiento@auditorionacional.es',
    phone: '+34 913 370 140',
    address: 'Calle Príncipe de Vergara 146',
    clientType: 'concert_hall' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28002',
    notes: 'Dos Steinway D-274. Servicio premium.',
  },
  {
    name: 'Miguel Ángel Torres',
    email: 'miguelangel.torres@hotmail.com',
    phone: '+34 667 890 123',
    address: 'Paseo de Gracia 88, 6º',
    clientType: 'particular' as const,
    city: 'Barcelona',
    region: 'Cataluña',
    postalCode: '08008',
    notes: 'Coleccionista. 3 pianos antiguos.',
  },
  {
    name: 'Conservatorio Superior de Música',
    email: 'secretaria@csm-sevilla.es',
    phone: '+34 954 567 890',
    address: 'Calle Baños 48',
    clientType: 'conservatory' as const,
    city: 'Sevilla',
    region: 'Andalucía',
    postalCode: '41002',
    notes: '20 pianos. Contrato de mantenimiento anual.',
  },
  {
    name: 'Isabel López Navarro',
    email: 'isabel.lopez@email.com',
    phone: '+34 678 901 234',
    address: 'Calle Larios 15, 2º A',
    clientType: 'student' as const,
    city: 'Málaga',
    region: 'Andalucía',
    postalCode: '29005',
    notes: 'Piano digital Kawai. Primera afinación.',
  },
  {
    name: 'Hotel Palace Madrid',
    email: 'eventos@hotelpalace.es',
    phone: '+34 913 608 000',
    address: 'Plaza de las Cortes 7',
    clientType: 'concert_hall' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28014',
    notes: 'Piano de cola en el salón principal.',
  },
  {
    name: 'Roberto Díaz Fernández',
    email: 'roberto.diaz@gmail.com',
    phone: '+34 689 012 345',
    address: 'Calle San Fernando 32',
    clientType: 'particular' as const,
    city: 'Zaragoza',
    region: 'Aragón',
    postalCode: '50001',
    notes: 'Piano Petrof. Afinación anual.',
  },
  {
    name: 'Colegio Alemán de Madrid',
    email: 'musica@colegioaleman.es',
    phone: '+34 917 456 789',
    address: 'Calle Concha Espina 32',
    clientType: 'music_school' as const,
    city: 'Madrid',
    region: 'Comunidad de Madrid',
    postalCode: '28016',
    notes: '4 pianos en el departamento de música.',
  },
  {
    name: 'Elena Ruiz García',
    email: 'elena.ruiz@outlook.es',
    phone: '+34 690 123 456',
    address: 'Avenida de la Constitución 20, 3º',
    clientType: 'professional' as const,
    city: 'Granada',
    region: 'Andalucía',
    postalCode: '18001',
    notes: 'Concertista. Steinway B-211.',
  },
];

// ============================================================================
// DATOS DE PIANOS
// ============================================================================
const pianosData = [
  // María García - 1 piano
  { clientIndex: 0, brand: 'Yamaha', model: 'U3', serialNumber: 'YU3-456789', year: 2015, category: 'vertical' as const, pianoType: 'Vertical Profesional', condition: 'excellent' as const, location: 'Salón principal' },
  
  // Conservatorio - 3 pianos
  { clientIndex: 1, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'STW-123456', year: 2018, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Auditorio principal' },
  { clientIndex: 1, brand: 'Yamaha', model: 'C7', serialNumber: 'YC7-789012', year: 2016, category: 'grand' as const, pianoType: 'Cola de Concierto', condition: 'good' as const, location: 'Sala de ensayo 1' },
  { clientIndex: 1, brand: 'Kawai', model: 'K-500', serialNumber: 'KW-345678', year: 2019, category: 'vertical' as const, pianoType: 'Vertical Profesional', condition: 'excellent' as const, location: 'Aula 101' },
  
  // Carlos Rodríguez - 1 piano
  { clientIndex: 2, brand: 'Bösendorfer', model: '225', serialNumber: 'BOS-567890', year: 2010, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Estudio de grabación' },
  
  // Academia Allegro - 2 pianos
  { clientIndex: 3, brand: 'Yamaha', model: 'U1', serialNumber: 'YU1-901234', year: 2017, category: 'vertical' as const, pianoType: 'Vertical Estudio', condition: 'good' as const, location: 'Aula 1' },
  { clientIndex: 3, brand: 'Kawai', model: 'GL-30', serialNumber: 'KGL-234567', year: 2020, category: 'grand' as const, pianoType: 'Cuarto de Cola', condition: 'excellent' as const, location: 'Sala de conciertos' },
  
  // Ana Fernández - 1 piano
  { clientIndex: 4, brand: 'Pleyel', model: 'P118', serialNumber: 'PL-678901', year: 1985, category: 'vertical' as const, pianoType: 'Vertical Antiguo', condition: 'fair' as const, location: 'Habitación de estudio', notes: 'Piano heredado. Necesita restauración de martillos.' },
  
  // Teatro Real - 2 pianos
  { clientIndex: 5, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'STW-111222', year: 2020, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Escenario principal' },
  { clientIndex: 5, brand: 'Steinway & Sons', model: 'B-211', serialNumber: 'STW-333444', year: 2019, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Sala de ensayos' },
  
  // Pedro Sánchez - 1 piano
  { clientIndex: 6, brand: 'Yamaha', model: 'U3', serialNumber: 'YU3-555666', year: 2012, category: 'vertical' as const, pianoType: 'Vertical Profesional', condition: 'good' as const, location: 'Salón' },
  
  // Escuela Sonata - 2 pianos
  { clientIndex: 7, brand: 'Kawai', model: 'K-300', serialNumber: 'KK3-777888', year: 2018, category: 'vertical' as const, pianoType: 'Vertical Estudio', condition: 'good' as const, location: 'Aula principal' },
  { clientIndex: 7, brand: 'Yamaha', model: 'GB1K', serialNumber: 'YGB-999000', year: 2021, category: 'grand' as const, pianoType: 'Baby Grand', condition: 'excellent' as const, location: 'Sala de recitales' },
  
  // Laura Martínez - 1 piano
  { clientIndex: 8, brand: 'Bechstein', model: 'M/P 192', serialNumber: 'BCH-112233', year: 2014, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Estudio privado' },
  
  // Auditorio Nacional - 2 pianos
  { clientIndex: 9, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'STW-445566', year: 2021, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Sala Sinfónica' },
  { clientIndex: 9, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'STW-778899', year: 2019, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Sala de Cámara' },
  
  // Miguel Ángel Torres - 3 pianos
  { clientIndex: 10, brand: 'Érard', model: 'Grand', serialNumber: 'ERA-1890', year: 1890, category: 'grand' as const, pianoType: 'Cola Antiguo', condition: 'fair' as const, location: 'Salón de música', notes: 'Piano histórico. Requiere cuidado especial.' },
  { clientIndex: 10, brand: 'Blüthner', model: 'Model 6', serialNumber: 'BLU-1920', year: 1920, category: 'grand' as const, pianoType: 'Media Cola Antiguo', condition: 'good' as const, location: 'Biblioteca' },
  { clientIndex: 10, brand: 'Steinway & Sons', model: 'O', serialNumber: 'STW-1950', year: 1950, category: 'grand' as const, pianoType: 'Cuarto de Cola', condition: 'good' as const, location: 'Estudio' },
  
  // Conservatorio Superior Sevilla - 2 pianos
  { clientIndex: 11, brand: 'Fazioli', model: 'F308', serialNumber: 'FAZ-001122', year: 2022, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Auditorio' },
  { clientIndex: 11, brand: 'Yamaha', model: 'CFX', serialNumber: 'YCFX-334455', year: 2020, category: 'grand' as const, pianoType: 'Gran Cola de Concierto', condition: 'excellent' as const, location: 'Sala principal' },
  
  // Isabel López - 1 piano
  { clientIndex: 12, brand: 'Kawai', model: 'CA99', serialNumber: 'KCA-667788', year: 2023, category: 'vertical' as const, pianoType: 'Digital Profesional', condition: 'excellent' as const, location: 'Habitación' },
  
  // Hotel Palace - 1 piano
  { clientIndex: 13, brand: 'Steinway & Sons', model: 'B-211', serialNumber: 'STW-990011', year: 2017, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Salón La Rotonda' },
  
  // Roberto Díaz - 1 piano
  { clientIndex: 14, brand: 'Petrof', model: 'P 125 F1', serialNumber: 'PET-223344', year: 2016, category: 'vertical' as const, pianoType: 'Vertical Profesional', condition: 'good' as const, location: 'Salón' },
  
  // Colegio Alemán - 2 pianos
  { clientIndex: 15, brand: 'Schimmel', model: 'K 132', serialNumber: 'SCH-556677', year: 2019, category: 'vertical' as const, pianoType: 'Vertical Profesional', condition: 'excellent' as const, location: 'Aula de música 1' },
  { clientIndex: 15, brand: 'Yamaha', model: 'C3X', serialNumber: 'YC3X-889900', year: 2021, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Salón de actos' },
  
  // Elena Ruiz - 1 piano
  { clientIndex: 16, brand: 'Steinway & Sons', model: 'B-211', serialNumber: 'STW-112244', year: 2018, category: 'grand' as const, pianoType: 'Media Cola', condition: 'excellent' as const, location: 'Estudio de conciertos' },
];

// ============================================================================
// DATOS DE INVENTARIO
// ============================================================================
const inventoryData = [
  { name: 'Cuerdas de acero para agudos', category: 'strings' as const, description: 'Cuerdas de repuesto para registro agudo', quantity: 50, unit: 'unidad', minStock: 20, costPerUnit: 2.50, supplier: 'Piano Parts España' },
  { name: 'Cuerdas entorchadas para graves', category: 'strings' as const, description: 'Cuerdas entorchadas de cobre', quantity: 30, unit: 'unidad', minStock: 10, costPerUnit: 8.00, supplier: 'Piano Parts España' },
  { name: 'Martillos Renner', category: 'hammers' as const, description: 'Martillos de fieltro premium', quantity: 24, unit: 'juego', minStock: 6, costPerUnit: 45.00, supplier: 'Renner GmbH' },
  { name: 'Fieltro para apagadores', category: 'dampers' as const, description: 'Fieltro de alta densidad', quantity: 10, unit: 'metro', minStock: 3, costPerUnit: 25.00, supplier: 'Wurzen Filz' },
  { name: 'Clavijas de afinación', category: 'tuning_pins' as const, description: 'Clavijas de acero niquelado', quantity: 100, unit: 'unidad', minStock: 30, costPerUnit: 1.20, supplier: 'Piano Parts España' },
  { name: 'Fieltro verde para mecanismo', category: 'felts' as const, description: 'Fieltro de regulación', quantity: 5, unit: 'metro', minStock: 2, costPerUnit: 15.00, supplier: 'Wurzen Filz' },
  { name: 'Lubricante para mecanismo', category: 'chemicals' as const, description: 'Lubricante especial para piano', quantity: 8, unit: 'bote', minStock: 3, costPerUnit: 12.00, supplier: 'Dampp-Chaser' },
  { name: 'Llave de afinación profesional', category: 'tools' as const, description: 'Llave de afinación con mango ergonómico', quantity: 3, unit: 'unidad', minStock: 1, costPerUnit: 85.00, supplier: 'Jahn Tools' },
  { name: 'Sordinas de práctica', category: 'felts' as const, description: 'Sordinas para reducir volumen', quantity: 15, unit: 'unidad', minStock: 5, costPerUnit: 35.00, supplier: 'Piano Accessories' },
  { name: 'Teclas de marfil sintético', category: 'keys' as const, description: 'Cubiertas de teclas blancas', quantity: 20, unit: 'unidad', minStock: 10, costPerUnit: 8.00, supplier: 'Kluge GmbH' },
  { name: 'Muelles de repetición', category: 'action_parts' as const, description: 'Muelles para mecanismo de repetición', quantity: 50, unit: 'unidad', minStock: 20, costPerUnit: 0.80, supplier: 'Renner GmbH' },
  { name: 'Tornillos de regulación', category: 'action_parts' as const, description: 'Tornillos de latón para ajuste', quantity: 200, unit: 'unidad', minStock: 50, costPerUnit: 0.15, supplier: 'Piano Parts España' },
];

// ============================================================================
// DATOS DE TARIFAS DE SERVICIO
// ============================================================================
const serviceRatesData = [
  { name: 'Afinación estándar', description: 'Afinación completa del piano', category: 'tuning' as const, basePrice: 90.00, taxRate: 21, estimatedDuration: 90 },
  { name: 'Afinación de concierto', description: 'Afinación premium para eventos', category: 'tuning' as const, basePrice: 150.00, taxRate: 21, estimatedDuration: 120 },
  { name: 'Mantenimiento básico', description: 'Limpieza y ajustes menores', category: 'maintenance' as const, basePrice: 120.00, taxRate: 21, estimatedDuration: 60 },
  { name: 'Mantenimiento completo', description: 'Limpieza profunda y regulación', category: 'maintenance' as const, basePrice: 250.00, taxRate: 21, estimatedDuration: 180 },
  { name: 'Regulación de mecanismo', description: 'Ajuste completo del mecanismo', category: 'regulation' as const, basePrice: 350.00, taxRate: 21, estimatedDuration: 240 },
  { name: 'Reparación menor', description: 'Reparaciones puntuales', category: 'repair' as const, basePrice: 80.00, taxRate: 21, estimatedDuration: 60 },
  { name: 'Reparación mayor', description: 'Reparaciones complejas', category: 'repair' as const, basePrice: 200.00, taxRate: 21, estimatedDuration: 180 },
  { name: 'Inspección técnica', description: 'Evaluación del estado del piano', category: 'inspection' as const, basePrice: 50.00, taxRate: 21, estimatedDuration: 45 },
];

// ============================================================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================================================
async function seed() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  const db = await getDb();
  if (!db) {
    throw new Error('No se pudo conectar a la base de datos. Verifica DATABASE_URL.');
  }

  try {
    // 1. Insertar clientes
    console.log('👥 Insertando clientes...');
    const insertedClients = [];
    for (const client of clientsData) {
      const [result] = await db.insert(clients).values({
        odId: OWNER_ID,
        ...client,
      });
      insertedClients.push({ ...client, id: result.insertId });
      console.log(`   ✓ ${client.name}`);
    }
    console.log(`   Total: ${insertedClients.length} clientes\n`);

    // 2. Insertar pianos
    console.log('🎹 Insertando pianos...');
    const insertedPianos = [];
    for (const piano of pianosData) {
      const clientId = insertedClients[piano.clientIndex].id;
      const [result] = await db.insert(pianos).values({
        odId: OWNER_ID,
        clientId,
        brand: piano.brand,
        model: piano.model,
        serialNumber: piano.serialNumber,
        year: piano.year,
        category: piano.category,
        pianoType: piano.pianoType,
        condition: piano.condition,
        location: piano.location,
        notes: piano.notes,
      });
      insertedPianos.push({ ...piano, id: result.insertId, clientId });
      console.log(`   ✓ ${piano.brand} ${piano.model} (${insertedClients[piano.clientIndex].name})`);
    }
    console.log(`   Total: ${insertedPianos.length} pianos\n`);

    // 3. Insertar inventario
    console.log('📦 Insertando inventario...');
    for (const item of inventoryData) {
      await db.insert(inventory).values({
        odId: OWNER_ID,
        ...item,
      });
      console.log(`   ✓ ${item.name}`);
    }
    console.log(`   Total: ${inventoryData.length} items\n`);

    // 4. Insertar tarifas de servicio
    console.log('💰 Insertando tarifas de servicio...');
    for (const rate of serviceRatesData) {
      await db.insert(serviceRates).values({
        odId: OWNER_ID,
        ...rate,
      });
      console.log(`   ✓ ${rate.name}`);
    }
    console.log(`   Total: ${serviceRatesData.length} tarifas\n`);

    // 5. Insertar servicios (histórico)
    console.log('🔧 Insertando servicios realizados...');
    const serviceTypes = ['tuning', 'maintenance_basic', 'maintenance_complete', 'repair', 'regulation'] as const;
    let servicesCount = 0;
    
    for (let i = 0; i < insertedPianos.length; i++) {
      const piano = insertedPianos[i];
      // Generar 1-3 servicios por piano
      const numServices = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numServices; j++) {
        // Distribución de fechas para generar variedad de alertas:
        // - 40% servicios recientes (0-180 días) -> sin alertas
        // - 30% servicios antiguos (180-365 días) -> alertas warning de afinación
        // - 20% servicios muy antiguos (365-900 días) -> alertas urgent de afinación
        // - 10% servicios extremadamente antiguos (900-1500 días) -> alertas de regulación
        const rand = Math.random();
        let daysAgo;
        if (rand < 0.4) {
          daysAgo = Math.floor(Math.random() * 180) + 1; // 0-180 días
        } else if (rand < 0.7) {
          daysAgo = Math.floor(Math.random() * 185) + 180; // 180-365 días
        } else if (rand < 0.9) {
          daysAgo = Math.floor(Math.random() * 535) + 365; // 365-900 días
        } else {
          daysAgo = Math.floor(Math.random() * 600) + 900; // 900-1500 días
        }
        const serviceDate = new Date();
        serviceDate.setDate(serviceDate.getDate() - daysAgo);
        
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        const cost = 80 + Math.floor(Math.random() * 200);
        
        await db.insert(services).values({
          odId: OWNER_ID,
          pianoId: piano.id,
          clientId: piano.clientId,
          serviceType,
          date: serviceDate,
          cost: cost.toString(),
          duration: 60 + Math.floor(Math.random() * 120),
          notes: `Servicio de ${serviceType} realizado correctamente.`,
        });
        servicesCount++;
      }
    }
    console.log(`   Total: ${servicesCount} servicios\n`);

    // 6. Insertar citas (futuras)
    console.log('📅 Insertando citas programadas...');
    let appointmentsCount = 0;
    
    for (let i = 0; i < 20; i++) {
      const pianoIndex = Math.floor(Math.random() * insertedPianos.length);
      const piano = insertedPianos[pianoIndex];
      
      const daysAhead = Math.floor(Math.random() * 60) + 1;
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + daysAhead);
      appointmentDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
      
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const clientName = insertedClients.find(c => c.id === piano.clientId)?.name || 'Cliente';
      
      await db.insert(appointments).values({
        odId: OWNER_ID,
        clientId: piano.clientId,
        pianoId: piano.id,
        title: `${serviceType === 'tuning' ? 'Afinación' : serviceType === 'repair' ? 'Reparación' : 'Mantenimiento'} - ${clientName}`,
        date: appointmentDate,
        duration: 60 + Math.floor(Math.random() * 60),
        serviceType,
        status: 'scheduled',
        notes: `Cita para ${piano.brand} ${piano.model}`,
      });
      appointmentsCount++;
    }
    console.log(`   Total: ${appointmentsCount} citas\n`);

    // 7. Insertar facturas
    console.log('🧾 Insertando facturas...');
    const invoiceStatuses = ['draft', 'sent', 'paid'] as const;
    let invoicesCount = 0;
    
    for (let i = 0; i < 15; i++) {
      const clientIndex = Math.floor(Math.random() * insertedClients.length);
      const client = insertedClients[clientIndex];
      
      const daysAgo = Math.floor(Math.random() * 180);
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      const subtotal = 80 + Math.floor(Math.random() * 300);
      const taxAmount = subtotal * 0.21;
      const total = subtotal + taxAmount;
      
      const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
      
      await db.insert(invoices).values({
        odId: OWNER_ID,
        invoiceNumber: `FAC-2024-${String(i + 1).padStart(4, '0')}`,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: `${client.address}, ${client.postalCode} ${client.city}`,
        date: invoiceDate,
        dueDate,
        status,
        items: [
          { description: 'Afinación de piano', quantity: 1, unitPrice: subtotal, taxRate: 21, total: subtotal }
        ],
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
      });
      invoicesCount++;
    }
    console.log(`   Total: ${invoicesCount} facturas\n`);

    // 8. Insertar presupuestos
    console.log('📝 Insertando presupuestos...');
    const quoteStatuses = ['draft', 'sent', 'accepted', 'rejected'] as const;
    let quotesCount = 0;
    
    for (let i = 0; i < 10; i++) {
      const clientIndex = Math.floor(Math.random() * insertedClients.length);
      const client = insertedClients[clientIndex];
      
      const daysAgo = Math.floor(Math.random() * 90);
      const quoteDate = new Date();
      quoteDate.setDate(quoteDate.getDate() - daysAgo);
      
      const validUntil = new Date(quoteDate);
      validUntil.setDate(validUntil.getDate() + 30);
      
      const subtotal = 150 + Math.floor(Math.random() * 500);
      const taxAmount = subtotal * 0.21;
      const total = subtotal + taxAmount;
      
      const status = quoteStatuses[Math.floor(Math.random() * quoteStatuses.length)];
      
      await db.insert(quotes).values({
        odId: OWNER_ID,
        quoteNumber: `PRES-2024-${String(i + 1).padStart(4, '0')}`,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        date: quoteDate,
        validUntil,
        status,
        items: [
          { description: 'Mantenimiento completo', quantity: 1, unitPrice: subtotal * 0.6, taxRate: 21, total: subtotal * 0.6 },
          { description: 'Regulación de mecanismo', quantity: 1, unitPrice: subtotal * 0.4, taxRate: 21, total: subtotal * 0.4 }
        ],
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        notes: 'Presupuesto válido por 30 días.',
      });
      quotesCount++;
    }
    console.log(`   Total: ${quotesCount} presupuestos\n`);

    // 9. Insertar recordatorios
    console.log('🔔 Insertando recordatorios...');
    const reminderTypes = ['call', 'visit', 'email', 'follow_up'] as const;
    let remindersCount = 0;
    
    for (let i = 0; i < 8; i++) {
      const clientIndex = Math.floor(Math.random() * insertedClients.length);
      const client = insertedClients[clientIndex];
      
      const daysAhead = Math.floor(Math.random() * 30) + 1;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysAhead);
      
      const reminderType = reminderTypes[Math.floor(Math.random() * reminderTypes.length)];
      
      await db.insert(reminders).values({
        odId: OWNER_ID,
        clientId: client.id,
        reminderType,
        dueDate,
        title: `${reminderType === 'call' ? 'Llamar a' : reminderType === 'visit' ? 'Visitar a' : reminderType === 'email' ? 'Enviar email a' : 'Seguimiento de'} ${client.name}`,
        notes: 'Recordatorio generado automáticamente.',
        isCompleted: false,
      });
      remindersCount++;
    }
    console.log(`   Total: ${remindersCount} recordatorios\n`);

    console.log('✅ Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - Clientes: ${insertedClients.length}`);
    console.log(`   - Pianos: ${insertedPianos.length}`);
    console.log(`   - Inventario: ${inventoryData.length} items`);
    console.log(`   - Tarifas: ${serviceRatesData.length}`);
    console.log(`   - Servicios: ${servicesCount}`);
    console.log(`   - Citas: ${appointmentsCount}`);
    console.log(`   - Facturas: ${invoicesCount}`);
    console.log(`   - Presupuestos: ${quotesCount}`);
    console.log(`   - Recordatorios: ${remindersCount}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// Ejecutar el seed
seed()
  .then(() => {
    console.log('\n🎉 ¡Datos de prueba creados correctamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
