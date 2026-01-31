/**
 * Script de seed para crear datos de prueba en Piano Emotion Manager
 * Ejecutar con: node scripts/seed-data.cjs
 */

const mysql = require('mysql2/promise');

// Configuración de conexión
const DATABASE_URL = process.env.DATABASE_URL || 'mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test';

// ID de usuario propietario (simulado)
const OWNER_ID = 'seed-user-001';

// ==================== DATOS DE CLIENTES ====================
const clientsData = [
  {
    name: 'María García López',
    email: 'maria.garcia@gmail.com',
    phone: '+34 612 345 678',
    address: JSON.stringify({ street: 'Calle Mayor', number: '15', floor: '3º A', postalCode: '28013', city: 'Madrid', province: 'Madrid' }),
    clientType: 'particular',
    notes: 'Prefiere citas por la tarde. Tiene un Yamaha U1 heredado de su abuela.'
  },
  {
    name: 'Conservatorio Municipal de Valencia',
    email: 'administracion@conservatoriovalencia.es',
    phone: '+34 963 456 789',
    address: JSON.stringify({ street: 'Avenida de la Música', number: '42', floor: '', postalCode: '46002', city: 'Valencia', province: 'Valencia' }),
    clientType: 'conservatory',
    notes: 'Contrato anual de mantenimiento. 12 pianos de cola y 8 verticales. Contactar con Dña. Carmen Ruiz.'
  },
  {
    name: 'Carlos Fernández Martín',
    email: 'carlos.fernandez@outlook.com',
    phone: '+34 654 987 321',
    address: JSON.stringify({ street: 'Paseo de Gracia', number: '88', floor: '5º', postalCode: '08008', city: 'Barcelona', province: 'Barcelona' }),
    clientType: 'professional',
    notes: 'Pianista profesional. Requiere afinación cada 3 meses. Steinway Model D.'
  },
  {
    name: 'Academia de Música Allegro',
    email: 'info@academiaallegro.com',
    phone: '+34 955 123 456',
    address: JSON.stringify({ street: 'Calle Sierpes', number: '72', floor: 'Local', postalCode: '41004', city: 'Sevilla', province: 'Sevilla' }),
    clientType: 'music_school',
    notes: '6 pianos verticales para clases. Mantenimiento trimestral.'
  },
  {
    name: 'Ana Belén Rodríguez',
    email: 'anabelen.rodriguez@yahoo.es',
    phone: '+34 678 234 567',
    address: JSON.stringify({ street: 'Calle San Fernando', number: '23', floor: '2º B', postalCode: '41001', city: 'Sevilla', province: 'Sevilla' }),
    clientType: 'student',
    notes: 'Estudiante de 4º de piano. Piano Kawai K-300.'
  },
  {
    name: 'Teatro Real de Madrid',
    email: 'tecnicos@teatroreal.es',
    phone: '+34 915 160 660',
    address: JSON.stringify({ street: 'Plaza de Isabel II', number: 's/n', floor: '', postalCode: '28013', city: 'Madrid', province: 'Madrid' }),
    clientType: 'concert_hall',
    notes: 'Steinway D-274 de concierto. Afinación antes de cada actuación importante.'
  },
  {
    name: 'Pedro Sánchez Gómez',
    email: 'pedro.sanchez.piano@gmail.com',
    phone: '+34 622 111 222',
    address: JSON.stringify({ street: 'Calle Larios', number: '5', floor: '4º', postalCode: '29005', city: 'Málaga', province: 'Málaga' }),
    clientType: 'particular',
    notes: 'Piano antiguo Pleyel de 1920. Necesita restauración parcial.'
  },
  {
    name: 'Escuela de Música Moderna',
    email: 'contacto@musicamoderna.es',
    phone: '+34 943 567 890',
    address: JSON.stringify({ street: 'Avenida de la Libertad', number: '18', floor: '', postalCode: '20004', city: 'San Sebastián', province: 'Guipúzcoa' }),
    clientType: 'music_school',
    notes: '4 pianos digitales Yamaha CLP y 2 acústicos. Mantenimiento semestral de los acústicos.'
  },
  {
    name: 'Lucía Martínez Vega',
    email: 'lucia.martinez@icloud.com',
    phone: '+34 666 333 444',
    address: JSON.stringify({ street: 'Gran Vía', number: '45', floor: '7º C', postalCode: '48011', city: 'Bilbao', province: 'Vizcaya' }),
    clientType: 'professional',
    notes: 'Profesora de piano en conservatorio. Bösendorfer 225 en casa.'
  },
  {
    name: 'Hotel Palace Barcelona',
    email: 'eventos@hotelpalacebcn.com',
    phone: '+34 933 456 789',
    address: JSON.stringify({ street: 'Gran Via de les Corts Catalanes', number: '668', floor: '', postalCode: '08010', city: 'Barcelona', province: 'Barcelona' }),
    clientType: 'concert_hall',
    notes: 'Piano de cola en el salón principal. Afinación mensual y antes de eventos especiales.'
  },
  {
    name: 'Roberto Jiménez Alonso',
    email: 'roberto.jimenez@protonmail.com',
    phone: '+34 699 888 777',
    address: JSON.stringify({ street: 'Calle Alfonso I', number: '12', floor: '1º', postalCode: '50003', city: 'Zaragoza', province: 'Zaragoza' }),
    clientType: 'particular',
    notes: 'Coleccionista de pianos antiguos. Tiene 3 pianos: Erard 1890, Bechstein 1910, Blüthner 1925.'
  },
  {
    name: 'Conservatorio Superior de Música de Aragón',
    email: 'secretaria@csma.es',
    phone: '+34 976 123 456',
    address: JSON.stringify({ street: 'Vía Hispanidad', number: '22', floor: '', postalCode: '50009', city: 'Zaragoza', province: 'Zaragoza' }),
    clientType: 'conservatory',
    notes: 'Contrato de mantenimiento anual. 20 pianos entre verticales y de cola.'
  }
];

// ==================== DATOS DE PIANOS ====================
const pianosData = [
  { clientIndex: 0, brand: 'Yamaha', model: 'U1', serialNumber: 'J2345678', year: 1995, category: 'vertical', pianoType: 'Vertical 121cm', condition: 'good', location: 'Salón principal', notes: 'Heredado de la abuela. Buen estado general.' },
  { clientIndex: 1, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'ST567890', year: 2010, category: 'grand', pianoType: 'Gran Cola Concierto', condition: 'excellent', location: 'Auditorio principal', notes: 'Piano principal de conciertos.' },
  { clientIndex: 1, brand: 'Yamaha', model: 'C7', serialNumber: 'YC789012', year: 2005, category: 'grand', pianoType: 'Cola 227cm', condition: 'excellent', location: 'Sala de cámara', notes: 'Usado para recitales y música de cámara.' },
  { clientIndex: 1, brand: 'Kawai', model: 'GX-7', serialNumber: 'KW345678', year: 2015, category: 'grand', pianoType: 'Cola 229cm', condition: 'excellent', location: 'Aula 101', notes: 'Piano para clases magistrales.' },
  { clientIndex: 2, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'ST901234', year: 2018, category: 'grand', pianoType: 'Gran Cola Concierto', condition: 'excellent', location: 'Estudio de grabación', notes: 'Piano de concierto personal. Afinación A=442Hz.' },
  { clientIndex: 3, brand: 'Yamaha', model: 'U3', serialNumber: 'YU567890', year: 2000, category: 'vertical', pianoType: 'Vertical 131cm', condition: 'good', location: 'Aula 1', notes: 'Piano para clases de iniciación.' },
  { clientIndex: 3, brand: 'Yamaha', model: 'U3', serialNumber: 'YU567891', year: 2000, category: 'vertical', pianoType: 'Vertical 131cm', condition: 'good', location: 'Aula 2', notes: 'Piano para clases de iniciación.' },
  { clientIndex: 4, brand: 'Kawai', model: 'K-300', serialNumber: 'KK123456', year: 2019, category: 'vertical', pianoType: 'Vertical 122cm', condition: 'excellent', location: 'Habitación de estudio', notes: 'Piano nuevo, excelente para estudiantes.' },
  { clientIndex: 5, brand: 'Steinway & Sons', model: 'D-274', serialNumber: 'ST111222', year: 2015, category: 'grand', pianoType: 'Gran Cola Concierto', condition: 'excellent', location: 'Escenario principal', notes: 'Piano de concierto del Teatro Real.' },
  { clientIndex: 6, brand: 'Pleyel', model: 'Grand Modèle', serialNumber: 'PL1920001', year: 1920, category: 'grand', pianoType: 'Cola Histórico', condition: 'fair', location: 'Salón', notes: 'Piano histórico. Necesita restauración de macillos y cuerdas.' },
  { clientIndex: 7, brand: 'Yamaha', model: 'U1', serialNumber: 'YU999888', year: 2012, category: 'vertical', pianoType: 'Vertical 121cm', condition: 'good', location: 'Aula principal', notes: 'Piano principal de la escuela.' },
  { clientIndex: 8, brand: 'Bösendorfer', model: '225', serialNumber: 'BO225001', year: 2008, category: 'grand', pianoType: 'Cola 225cm', condition: 'excellent', location: 'Salón de música', notes: 'Piano de alta gama. Sonido excepcional.' },
  { clientIndex: 9, brand: 'Steinway & Sons', model: 'B-211', serialNumber: 'STB54321', year: 2012, category: 'grand', pianoType: 'Cola 211cm', condition: 'excellent', location: 'Salón de eventos', notes: 'Piano para eventos y cócteles.' },
  { clientIndex: 10, brand: 'Erard', model: 'Grand', serialNumber: 'ER1890001', year: 1890, category: 'grand', pianoType: 'Cola Histórico', condition: 'fair', location: 'Sala de colección', notes: 'Piano histórico francés. Mecanismo de repetición Erard original.' },
  { clientIndex: 10, brand: 'Bechstein', model: 'Model A', serialNumber: 'BE1910001', year: 1910, category: 'grand', pianoType: 'Cola Histórico', condition: 'good', location: 'Sala de colección', notes: 'Piano alemán de principios de siglo. Restaurado en 2015.' },
  { clientIndex: 10, brand: 'Blüthner', model: 'Model 6', serialNumber: 'BL1925001', year: 1925, category: 'grand', pianoType: 'Cola 190cm', condition: 'good', location: 'Sala de colección', notes: 'Sistema de cuerdas alícuotas Blüthner. Sonido único.' },
  { clientIndex: 11, brand: 'Fazioli', model: 'F278', serialNumber: 'FA278001', year: 2020, category: 'grand', pianoType: 'Gran Cola 278cm', condition: 'excellent', location: 'Auditorio', notes: 'Piano italiano de alta gama. Adquirido nuevo.' }
];

// ==================== DATOS DE SERVICIOS ====================
const servicesData = [
  { pianoIndex: 0, clientIndex: 0, serviceType: 'tuning', date: '2024-11-15', cost: 120.00, duration: 90, notes: 'Afinación estándar A=440Hz. Piano en buen estado.', technicianNotes: 'Clavijas firmes. Próxima afinación en 6 meses.' },
  { pianoIndex: 1, clientIndex: 1, serviceType: 'tuning', date: '2024-12-01', cost: 180.00, duration: 120, notes: 'Afinación de concierto A=442Hz.', technicianNotes: 'Preparado para concierto de Navidad.' },
  { pianoIndex: 4, clientIndex: 2, serviceType: 'tuning', date: '2024-12-10', cost: 180.00, duration: 120, notes: 'Afinación de concierto A=442Hz.', technicianNotes: 'Cliente muy exigente. Resultado excelente.' },
  { pianoIndex: 5, clientIndex: 3, serviceType: 'maintenance_basic', date: '2024-10-20', cost: 200.00, duration: 180, notes: 'Mantenimiento básico trimestral.', technicianNotes: 'Limpieza de mecanismo, ajuste de macillos, afinación.' },
  { pianoIndex: 7, clientIndex: 4, serviceType: 'tuning', date: '2024-11-25', cost: 100.00, duration: 75, notes: 'Afinación para estudiante.', technicianNotes: 'Piano en excelente estado. Recomendado para estudio.' },
  { pianoIndex: 8, clientIndex: 5, serviceType: 'tuning', date: '2024-12-18', cost: 250.00, duration: 150, notes: 'Afinación pre-concierto.', technicianNotes: 'Preparación para ópera de fin de año.' },
  { pianoIndex: 9, clientIndex: 6, serviceType: 'repair', date: '2024-09-10', cost: 450.00, duration: 300, notes: 'Reparación de macillos desgastados.', technicianNotes: 'Reemplazados 15 macillos. Piano histórico requiere cuidado especial.' },
  { pianoIndex: 9, clientIndex: 6, serviceType: 'restoration', date: '2024-06-15', cost: 2500.00, duration: 1200, notes: 'Restauración parcial del mecanismo.', technicianNotes: 'Restauración de apagadores y regulación completa.' },
  { pianoIndex: 11, clientIndex: 8, serviceType: 'tuning', date: '2024-12-05', cost: 200.00, duration: 120, notes: 'Afinación de Bösendorfer.', technicianNotes: 'Piano excepcional. Afinación perfecta.' },
  { pianoIndex: 12, clientIndex: 9, serviceType: 'maintenance_complete', date: '2024-11-01', cost: 350.00, duration: 240, notes: 'Mantenimiento completo anual.', technicianNotes: 'Limpieza profunda, regulación, afinación. Listo para temporada de eventos.' },
  { pianoIndex: 13, clientIndex: 10, serviceType: 'inspection', date: '2024-08-20', cost: 150.00, duration: 90, notes: 'Inspección de piano histórico Erard.', technicianNotes: 'Necesita restauración de cuerdas graves. Presupuesto enviado.' },
  { pianoIndex: 14, clientIndex: 10, serviceType: 'regulation', date: '2024-07-10', cost: 400.00, duration: 300, notes: 'Regulación completa del mecanismo.', technicianNotes: 'Bechstein 1910 regulado según especificaciones originales.' },
  { pianoIndex: 16, clientIndex: 11, serviceType: 'tuning', date: '2024-12-15', cost: 300.00, duration: 150, notes: 'Afinación de Fazioli F278.', technicianNotes: 'Piano de alta gama. Afinación de concierto A=442Hz.' }
];

// ==================== DATOS DE CITAS ====================
const appointmentsData = [
  { clientIndex: 0, pianoIndex: 0, title: 'Afinación semestral', date: '2025-01-15 10:00:00', duration: 90, serviceType: 'tuning', status: 'scheduled', notes: 'Llamar el día antes para confirmar.' },
  { clientIndex: 1, pianoIndex: 1, title: 'Preparación concierto de Año Nuevo', date: '2024-12-30 09:00:00', duration: 180, serviceType: 'tuning', status: 'confirmed', notes: 'Acceso por entrada de artistas.' },
  { clientIndex: 2, pianoIndex: 4, title: 'Afinación trimestral', date: '2025-01-10 14:00:00', duration: 120, serviceType: 'tuning', status: 'scheduled', notes: 'Cliente prefiere tardes.' },
  { clientIndex: 3, pianoIndex: 5, title: 'Mantenimiento trimestral', date: '2025-01-20 09:30:00', duration: 240, serviceType: 'maintenance_basic', status: 'scheduled', notes: 'Revisar los 6 pianos.' },
  { clientIndex: 4, pianoIndex: 7, title: 'Afinación pre-examen', date: '2025-02-01 11:00:00', duration: 75, serviceType: 'tuning', status: 'scheduled', notes: 'Examen de conservatorio en febrero.' },
  { clientIndex: 5, pianoIndex: 8, title: 'Afinación pre-ópera', date: '2025-01-05 08:00:00', duration: 150, serviceType: 'tuning', status: 'confirmed', notes: 'Estreno de temporada.' },
  { clientIndex: 6, pianoIndex: 9, title: 'Revisión restauración', date: '2025-01-25 10:00:00', duration: 60, serviceType: 'inspection', status: 'scheduled', notes: 'Seguimiento de restauración anterior.' },
  { clientIndex: 8, pianoIndex: 11, title: 'Afinación Bösendorfer', date: '2025-02-10 15:00:00', duration: 120, serviceType: 'tuning', status: 'scheduled', notes: 'Preparación para recital privado.' },
  { clientIndex: 9, pianoIndex: 12, title: 'Mantenimiento pre-temporada', date: '2025-01-08 09:00:00', duration: 180, serviceType: 'maintenance_complete', status: 'confirmed', notes: 'Preparar para temporada de bodas.' },
  { clientIndex: 10, pianoIndex: 13, title: 'Presupuesto restauración Erard', date: '2025-01-12 11:00:00', duration: 120, serviceType: 'inspection', status: 'scheduled', notes: 'Presentar presupuesto de restauración de cuerdas.' },
  { clientIndex: 11, pianoIndex: 16, title: 'Afinación Fazioli', date: '2025-02-20 10:00:00', duration: 150, serviceType: 'tuning', status: 'scheduled', notes: 'Preparación para masterclass internacional.' }
];

// ==================== DATOS DE INVENTARIO ====================
const inventoryData = [
  { name: 'Cuerdas graves Paulello', category: 'strings', description: 'Cuerdas entorchadas para graves de piano de cola', quantity: 25, unit: 'unidad', minStock: 10, costPerUnit: 45.00, supplier: 'Paulello Italia' },
  { name: 'Cuerdas agudas Röslau', category: 'strings', description: 'Cuerdas de acero para registro agudo', quantity: 100, unit: 'metro', minStock: 50, costPerUnit: 2.50, supplier: 'Röslau Alemania' },
  { name: 'Macillos Abel', category: 'hammers', description: 'Macillos de fieltro premium para Steinway', quantity: 15, unit: 'juego', minStock: 5, costPerUnit: 280.00, supplier: 'Abel Alemania' },
  { name: 'Macillos Renner', category: 'hammers', description: 'Macillos estándar para pianos verticales', quantity: 20, unit: 'juego', minStock: 8, costPerUnit: 180.00, supplier: 'Renner Alemania' },
  { name: 'Apagadores Steinway', category: 'dampers', description: 'Apagadores originales Steinway', quantity: 8, unit: 'juego', minStock: 3, costPerUnit: 350.00, supplier: 'Steinway USA' },
  { name: 'Fieltro verde para apagadores', category: 'felts', description: 'Fieltro de alta densidad para apagadores', quantity: 5, unit: 'metro', minStock: 2, costPerUnit: 35.00, supplier: 'Wurzen Alemania' },
  { name: 'Fieltro rojo para mecanismo', category: 'felts', description: 'Fieltro de regulación para mecanismo', quantity: 8, unit: 'metro', minStock: 3, costPerUnit: 28.00, supplier: 'Wurzen Alemania' },
  { name: 'Clavijas de afinación', category: 'tuning_pins', description: 'Clavijas de acero niquelado 7mm', quantity: 200, unit: 'unidad', minStock: 100, costPerUnit: 1.20, supplier: 'Diamant Alemania' },
  { name: 'Llave de afinar Jahn', category: 'tools', description: 'Llave de afinación profesional', quantity: 3, unit: 'unidad', minStock: 2, costPerUnit: 85.00, supplier: 'Jahn Alemania' },
  { name: 'Sordinas de goma', category: 'tools', description: 'Sordinas para afinación', quantity: 10, unit: 'juego', minStock: 5, costPerUnit: 25.00, supplier: 'Pianotek España' },
  { name: 'Lubricante Protek CLP', category: 'chemicals', description: 'Lubricante para centros de mecanismo', quantity: 6, unit: 'bote', minStock: 3, costPerUnit: 18.00, supplier: 'Protek USA' },
  { name: 'Limpiador de teclas marfil', category: 'chemicals', description: 'Limpiador especial para teclas de marfil', quantity: 4, unit: 'bote', minStock: 2, costPerUnit: 22.00, supplier: 'Cory USA' }
];

// ==================== DATOS DE FACTURAS ====================
const invoicesData = [
  {
    invoiceNumber: 'FAC-2024-001',
    clientIndex: 0,
    date: '2024-11-15',
    dueDate: '2024-12-15',
    status: 'paid',
    items: JSON.stringify([{ description: 'Afinación estándar', quantity: 1, unitPrice: 99.17, taxRate: 21, total: 120.00 }]),
    subtotal: 99.17,
    taxAmount: 20.83,
    total: 120.00,
    notes: 'Pagado en efectivo.'
  },
  {
    invoiceNumber: 'FAC-2024-002',
    clientIndex: 1,
    date: '2024-12-01',
    dueDate: '2025-01-01',
    status: 'sent',
    items: JSON.stringify([{ description: 'Afinación de concierto Steinway D-274', quantity: 1, unitPrice: 148.76, taxRate: 21, total: 180.00 }]),
    subtotal: 148.76,
    taxAmount: 31.24,
    total: 180.00,
    notes: 'Factura enviada por email.'
  },
  {
    invoiceNumber: 'FAC-2024-003',
    clientIndex: 2,
    date: '2024-12-10',
    dueDate: '2025-01-10',
    status: 'sent',
    items: JSON.stringify([{ description: 'Afinación de concierto', quantity: 1, unitPrice: 148.76, taxRate: 21, total: 180.00 }]),
    subtotal: 148.76,
    taxAmount: 31.24,
    total: 180.00,
    notes: ''
  },
  {
    invoiceNumber: 'FAC-2024-004',
    clientIndex: 3,
    date: '2024-10-20',
    dueDate: '2024-11-20',
    status: 'paid',
    items: JSON.stringify([
      { description: 'Mantenimiento básico', quantity: 1, unitPrice: 123.97, taxRate: 21, total: 150.00 },
      { description: 'Afinación', quantity: 1, unitPrice: 41.32, taxRate: 21, total: 50.00 }
    ]),
    subtotal: 165.29,
    taxAmount: 34.71,
    total: 200.00,
    notes: 'Transferencia bancaria recibida.'
  },
  {
    invoiceNumber: 'FAC-2024-005',
    clientIndex: 5,
    date: '2024-12-18',
    dueDate: '2025-01-18',
    status: 'sent',
    items: JSON.stringify([{ description: 'Afinación pre-concierto Teatro Real', quantity: 1, unitPrice: 206.61, taxRate: 21, total: 250.00 }]),
    subtotal: 206.61,
    taxAmount: 43.39,
    total: 250.00,
    notes: 'Factura institucional.'
  },
  {
    invoiceNumber: 'FAC-2024-006',
    clientIndex: 6,
    date: '2024-09-10',
    dueDate: '2024-10-10',
    status: 'paid',
    items: JSON.stringify([
      { description: 'Reparación de macillos (15 unidades)', quantity: 15, unitPrice: 24.79, taxRate: 21, total: 450.00 }
    ]),
    subtotal: 371.90,
    taxAmount: 78.10,
    total: 450.00,
    notes: 'Incluye materiales.'
  },
  {
    invoiceNumber: 'FAC-2024-007',
    clientIndex: 6,
    date: '2024-06-15',
    dueDate: '2024-07-15',
    status: 'paid',
    items: JSON.stringify([
      { description: 'Restauración parcial mecanismo Pleyel 1920', quantity: 1, unitPrice: 2066.12, taxRate: 21, total: 2500.00 }
    ]),
    subtotal: 2066.12,
    taxAmount: 433.88,
    total: 2500.00,
    notes: 'Restauración histórica. Pagado en 3 plazos.'
  },
  {
    invoiceNumber: 'FAC-2024-008',
    clientIndex: 8,
    date: '2024-12-05',
    dueDate: '2025-01-05',
    status: 'sent',
    items: JSON.stringify([{ description: 'Afinación Bösendorfer 225', quantity: 1, unitPrice: 165.29, taxRate: 21, total: 200.00 }]),
    subtotal: 165.29,
    taxAmount: 34.71,
    total: 200.00,
    notes: ''
  },
  {
    invoiceNumber: 'FAC-2024-009',
    clientIndex: 9,
    date: '2024-11-01',
    dueDate: '2024-12-01',
    status: 'paid',
    items: JSON.stringify([
      { description: 'Mantenimiento completo anual', quantity: 1, unitPrice: 247.93, taxRate: 21, total: 300.00 },
      { description: 'Afinación', quantity: 1, unitPrice: 41.32, taxRate: 21, total: 50.00 }
    ]),
    subtotal: 289.26,
    taxAmount: 60.74,
    total: 350.00,
    notes: 'Contrato anual de mantenimiento.'
  },
  {
    invoiceNumber: 'FAC-2024-010',
    clientIndex: 11,
    date: '2024-12-15',
    dueDate: '2025-01-15',
    status: 'draft',
    items: JSON.stringify([{ description: 'Afinación Fazioli F278', quantity: 1, unitPrice: 247.93, taxRate: 21, total: 300.00 }]),
    subtotal: 247.93,
    taxAmount: 52.07,
    total: 300.00,
    notes: 'Pendiente de enviar.'
  }
];

// ==================== DATOS DE TARIFAS ====================
const serviceRatesData = [
  { name: 'Afinación estándar', description: 'Afinación de piano vertical o de cola', category: 'tuning', basePrice: 100.00, taxRate: 21, estimatedDuration: 90, isActive: true },
  { name: 'Afinación de concierto', description: 'Afinación de alta precisión para conciertos', category: 'tuning', basePrice: 150.00, taxRate: 21, estimatedDuration: 120, isActive: true },
  { name: 'Afinación + elevación de tono', description: 'Afinación con corrección de tono', category: 'tuning', basePrice: 180.00, taxRate: 21, estimatedDuration: 150, isActive: true },
  { name: 'Mantenimiento básico', description: 'Limpieza, ajustes menores y afinación', category: 'maintenance', basePrice: 200.00, taxRate: 21, estimatedDuration: 180, isActive: true },
  { name: 'Mantenimiento completo', description: 'Limpieza profunda, regulación parcial y afinación', category: 'maintenance', basePrice: 350.00, taxRate: 21, estimatedDuration: 300, isActive: true },
  { name: 'Mantenimiento premium', description: 'Servicio completo con regulación total', category: 'maintenance', basePrice: 500.00, taxRate: 21, estimatedDuration: 480, isActive: true },
  { name: 'Regulación de mecanismo', description: 'Ajuste completo del mecanismo', category: 'regulation', basePrice: 400.00, taxRate: 21, estimatedDuration: 360, isActive: true },
  { name: 'Reparación menor', description: 'Reparaciones pequeñas (teclas, pedales)', category: 'repair', basePrice: 80.00, taxRate: 21, estimatedDuration: 60, isActive: true },
  { name: 'Reparación de macillos', description: 'Sustitución o reparación de macillos', category: 'repair', basePrice: 300.00, taxRate: 21, estimatedDuration: 240, isActive: true },
  { name: 'Inspección y presupuesto', description: 'Evaluación del estado del piano', category: 'inspection', basePrice: 60.00, taxRate: 21, estimatedDuration: 60, isActive: true },
  { name: 'Restauración parcial', description: 'Restauración de componentes específicos', category: 'restoration', basePrice: 1500.00, taxRate: 21, estimatedDuration: 960, isActive: true },
  { name: 'Restauración completa', description: 'Restauración integral del piano', category: 'restoration', basePrice: 5000.00, taxRate: 21, estimatedDuration: 4800, isActive: true }
];

// ==================== DATOS DE RECORDATORIOS ====================
const remindersData = [
  { clientIndex: 0, pianoIndex: 0, reminderType: 'call', dueDate: '2025-01-10', title: 'Confirmar cita de afinación', notes: 'Llamar para confirmar cita del 15 de enero.', isCompleted: false },
  { clientIndex: 1, pianoIndex: 1, reminderType: 'email', dueDate: '2025-06-01', title: 'Renovación contrato anual', notes: 'Enviar propuesta de renovación del contrato de mantenimiento.', isCompleted: false },
  { clientIndex: 2, pianoIndex: 4, reminderType: 'whatsapp', dueDate: '2025-01-05', title: 'Recordatorio afinación trimestral', notes: 'Enviar recordatorio de próxima afinación.', isCompleted: false },
  { clientIndex: 3, pianoIndex: 5, reminderType: 'visit', dueDate: '2025-04-15', title: 'Mantenimiento trimestral', notes: 'Programar siguiente mantenimiento trimestral.', isCompleted: false },
  { clientIndex: 4, pianoIndex: 7, reminderType: 'call', dueDate: '2025-01-25', title: 'Seguimiento post-examen', notes: 'Llamar para saber cómo fue el examen.', isCompleted: false },
  { clientIndex: 6, pianoIndex: 9, reminderType: 'follow_up', dueDate: '2025-02-01', title: 'Seguimiento restauración Pleyel', notes: 'Verificar estado tras 6 meses de restauración.', isCompleted: false },
  { clientIndex: 8, pianoIndex: 11, reminderType: 'whatsapp', dueDate: '2025-02-05', title: 'Recordatorio recital', notes: 'Confirmar afinación antes del recital.', isCompleted: false },
  { clientIndex: 9, pianoIndex: 12, reminderType: 'email', dueDate: '2025-01-02', title: 'Confirmar mantenimiento', notes: 'Confirmar cita de mantenimiento pre-temporada.', isCompleted: false },
  { clientIndex: 10, pianoIndex: 13, reminderType: 'call', dueDate: '2025-01-08', title: 'Decisión restauración Erard', notes: 'Llamar para saber si acepta presupuesto de restauración.', isCompleted: false },
  { clientIndex: 11, pianoIndex: 16, reminderType: 'email', dueDate: '2025-02-15', title: 'Confirmar masterclass', notes: 'Confirmar fecha exacta de la masterclass internacional.', isCompleted: false }
];

// ==================== DATOS DE NEGOCIO ====================
const businessInfoData = {
  name: 'Piano Emotion - Servicios Técnicos',
  taxId: 'B12345678',
  address: 'Calle de la Música, 42, Local 3',
  city: 'Madrid',
  postalCode: '28001',
  phone: '+34 912 345 678',
  email: 'servicios@pianoemotion.es',
  bankAccount: 'ES12 1234 5678 9012 3456 7890'
};

// ==================== FUNCIÓN PRINCIPAL ====================
async function seedDatabase() {
  console.log('🎹 Iniciando seed de datos de prueba para Piano Emotion Manager...\n');
  
  // Parsear URL de conexión
  const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
  const [username, password] = url.username ? [url.username, url.password] : ['', ''];
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 4000,
    user: decodeURIComponent(username),
    password: decodeURIComponent(password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true }
  });

  try {
    // 1. Insertar clientes
    console.log('📋 Insertando clientes...');
    const clientIds = [];
    for (const client of clientsData) {
      const [result] = await connection.execute(
        `INSERT INTO clients (odId, name, email, phone, address, clientType, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, client.name, client.email, client.phone, client.address, client.clientType, client.notes]
      );
      clientIds.push(result.insertId);
      console.log(`  ✓ ${client.name}`);
    }
    console.log(`  Total: ${clientIds.length} clientes\n`);

    // 2. Insertar pianos
    console.log('🎹 Insertando pianos...');
    const pianoIds = [];
    for (const piano of pianosData) {
      const clientId = clientIds[piano.clientIndex];
      const [result] = await connection.execute(
        `INSERT INTO pianos (odId, clientId, brand, model, serialNumber, year, category, pianoType, \`condition\`, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, clientId, piano.brand, piano.model, piano.serialNumber, piano.year, piano.category, piano.pianoType, piano.condition, piano.location, piano.notes]
      );
      pianoIds.push(result.insertId);
      console.log(`  ✓ ${piano.brand} ${piano.model} (${piano.serialNumber})`);
    }
    console.log(`  Total: ${pianoIds.length} pianos\n`);

    // 3. Insertar servicios
    console.log('🔧 Insertando servicios...');
    for (const service of servicesData) {
      const pianoId = pianoIds[service.pianoIndex];
      const clientId = clientIds[service.clientIndex];
      await connection.execute(
        `INSERT INTO services (odId, pianoId, clientId, serviceType, date, cost, duration, notes, technicianNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, pianoId, clientId, service.serviceType, service.date, service.cost, service.duration, service.notes, service.technicianNotes]
      );
      console.log(`  ✓ ${service.serviceType} - ${service.date}`);
    }
    console.log(`  Total: ${servicesData.length} servicios\n`);

    // 4. Insertar citas
    console.log('📅 Insertando citas...');
    for (const appointment of appointmentsData) {
      const clientId = clientIds[appointment.clientIndex];
      const pianoId = appointment.pianoIndex !== undefined ? pianoIds[appointment.pianoIndex] : null;
      await connection.execute(
        `INSERT INTO appointments (odId, clientId, pianoId, title, date, duration, serviceType, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, clientId, pianoId, appointment.title, appointment.date, appointment.duration, appointment.serviceType, appointment.status, appointment.notes]
      );
      console.log(`  ✓ ${appointment.title} - ${appointment.date}`);
    }
    console.log(`  Total: ${appointmentsData.length} citas\n`);

    // 5. Insertar inventario
    console.log('📦 Insertando inventario...');
    for (const item of inventoryData) {
      await connection.execute(
        `INSERT INTO inventory (odId, name, category, description, quantity, unit, minStock, costPerUnit, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, item.name, item.category, item.description, item.quantity, item.unit, item.minStock, item.costPerUnit, item.supplier]
      );
      console.log(`  ✓ ${item.name}`);
    }
    console.log(`  Total: ${inventoryData.length} items\n`);

    // 6. Insertar facturas
    console.log('🧾 Insertando facturas...');
    for (const invoice of invoicesData) {
      const clientId = clientIds[invoice.clientIndex];
      const client = clientsData[invoice.clientIndex];
      await connection.execute(
        `INSERT INTO invoices (odId, invoiceNumber, clientId, clientName, clientEmail, date, dueDate, status, items, subtotal, taxAmount, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, invoice.invoiceNumber, clientId, client.name, client.email, invoice.date, invoice.dueDate, invoice.status, invoice.items, invoice.subtotal, invoice.taxAmount, invoice.total, invoice.notes]
      );
      console.log(`  ✓ ${invoice.invoiceNumber} - €${invoice.total}`);
    }
    console.log(`  Total: ${invoicesData.length} facturas\n`);

    // 7. Insertar tarifas
    console.log('💰 Insertando tarifas...');
    for (const rate of serviceRatesData) {
      await connection.execute(
        `INSERT INTO serviceRates (odId, name, description, category, basePrice, taxRate, estimatedDuration, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, rate.name, rate.description, rate.category, rate.basePrice, rate.taxRate, rate.estimatedDuration, rate.isActive]
      );
      console.log(`  ✓ ${rate.name} - €${rate.basePrice}`);
    }
    console.log(`  Total: ${serviceRatesData.length} tarifas\n`);

    // 8. Insertar recordatorios
    console.log('⏰ Insertando recordatorios...');
    for (const reminder of remindersData) {
      const clientId = clientIds[reminder.clientIndex];
      const pianoId = reminder.pianoIndex !== undefined ? pianoIds[reminder.pianoIndex] : null;
      await connection.execute(
        `INSERT INTO reminders (odId, clientId, pianoId, reminderType, dueDate, title, notes, isCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [OWNER_ID, clientId, pianoId, reminder.reminderType, reminder.dueDate, reminder.title, reminder.notes, reminder.isCompleted]
      );
      console.log(`  ✓ ${reminder.title}`);
    }
    console.log(`  Total: ${remindersData.length} recordatorios\n`);

    // 9. Insertar información del negocio
    console.log('🏢 Insertando información del negocio...');
    await connection.execute(
      `INSERT INTO businessInfo (odId, name, taxId, address, city, postalCode, phone, email, bankAccount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [OWNER_ID, businessInfoData.name, businessInfoData.taxId, businessInfoData.address, businessInfoData.city, businessInfoData.postalCode, businessInfoData.phone, businessInfoData.email, businessInfoData.bankAccount]
    );
    console.log(`  ✓ ${businessInfoData.name}\n`);

    console.log('✅ ¡Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`  - ${clientIds.length} clientes`);
    console.log(`  - ${pianoIds.length} pianos`);
    console.log(`  - ${servicesData.length} servicios`);
    console.log(`  - ${appointmentsData.length} citas`);
    console.log(`  - ${inventoryData.length} items de inventario`);
    console.log(`  - ${invoicesData.length} facturas`);
    console.log(`  - ${serviceRatesData.length} tarifas`);
    console.log(`  - ${remindersData.length} recordatorios`);
    console.log(`  - 1 información de negocio`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar
seedDatabase().catch(console.error);
