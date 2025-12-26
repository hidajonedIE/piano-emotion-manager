import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";

async function fixModulesTables() {
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: {
      rejectUnauthorized: true
    }
  });


  // Drop existing tables and recreate with correct structure
  try {
    await connection.execute('DROP TABLE IF EXISTS modules');
  } catch (error: unknown) {
  }

  try {
    await connection.execute(`
      CREATE TABLE modules (
        id int AUTO_INCREMENT NOT NULL,
        code varchar(50) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        icon varchar(50),
        color varchar(7),
        type enum('core', 'free', 'premium', 'addon') NOT NULL DEFAULT 'core',
        includedInPlans json,
        addonPrice decimal(10,2),
        addonPriceCurrency varchar(3) DEFAULT 'EUR',
        dependencies json,
        sortOrder int DEFAULT 0,
        isActive boolean NOT NULL DEFAULT true,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT modules_id PRIMARY KEY(id),
        CONSTRAINT modules_code_unique UNIQUE(code)
      )
    `);
  } catch (error: unknown) {
  }

  try {
    await connection.execute('DROP TABLE IF EXISTS organization_modules');
    await connection.execute(`
      CREATE TABLE organization_modules (
        id int AUTO_INCREMENT NOT NULL,
        organizationId int NOT NULL,
        moduleCode varchar(50) NOT NULL,
        isEnabled boolean DEFAULT true,
        accessType varchar(20) NOT NULL DEFAULT 'plan',
        purchasedAt timestamp,
        expiresAt timestamp,
        settings json,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT organization_modules_id PRIMARY KEY(id),
        INDEX org_modules_idx (organizationId, moduleCode)
      )
    `);
  } catch (error: unknown) {
  }

  // Now seed the modules
  
  const modules = [
    { code: 'clients', name: 'Gestión de Clientes', description: 'Gestiona tu cartera de clientes y sus datos de contacto', icon: 'people', color: '#8b5cf6', type: 'core', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 1 },
    { code: 'pianos', name: 'Registro de Pianos', description: 'Mantén un registro detallado de todos los pianos', icon: 'musical-notes', color: '#ec4899', type: 'core', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 2 },
    { code: 'services', name: 'Servicios', description: 'Registra afinaciones, reparaciones y otros servicios', icon: 'construct', color: '#f59e0b', type: 'core', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 3 },
    { code: 'calendar', name: 'Calendario', description: 'Agenda y gestiona tus citas', icon: 'calendar', color: '#3b82f6', type: 'core', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 4 },
    { code: 'basic_invoicing', name: 'Facturación Básica', description: 'Genera facturas simples para tus servicios', icon: 'document-text', color: '#14b8a6', type: 'free', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 5 },
    { code: 'team_management', name: 'Gestión de Equipos', description: 'Gestiona equipos de técnicos con roles y permisos', icon: 'people-circle', color: '#10b981', type: 'premium', includedInPlans: ['professional', 'enterprise'], sortOrder: 6 },
    { code: 'inventory', name: 'Inventario', description: 'Control de stock de piezas y materiales', icon: 'cube', color: '#6366f1', type: 'free', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 7 },
    { code: 'advanced_invoicing', name: 'Facturación Avanzada', description: 'Facturación electrónica multi-país con cumplimiento legal', icon: 'receipt', color: '#0891b2', type: 'premium', includedInPlans: ['starter', 'professional', 'enterprise'], sortOrder: 8 },
    { code: 'accounting', name: 'Contabilidad', description: 'Gestión de gastos, ingresos y reportes financieros', icon: 'calculator', color: '#f97316', type: 'premium', includedInPlans: ['professional', 'enterprise'], sortOrder: 9 },
    { code: 'reports', name: 'Reportes y Analytics', description: 'Análisis avanzado y reportes personalizados', icon: 'analytics', color: '#06b6d4', type: 'premium', includedInPlans: ['professional', 'enterprise'], sortOrder: 10 },
    { code: 'crm', name: 'CRM Avanzado', description: 'Segmentación de clientes, campañas y automatizaciones', icon: 'heart', color: '#ef4444', type: 'premium', includedInPlans: ['professional', 'enterprise'], sortOrder: 11 },
    { code: 'shop', name: 'Tienda Online', description: 'Acceso a tiendas de proveedores integradas', icon: 'cart', color: '#84cc16', type: 'free', includedInPlans: ['free', 'starter', 'professional', 'enterprise'], sortOrder: 12 },
  ];

  for (const module of modules) {
    try {
      await connection.execute(
        `INSERT INTO modules (code, name, description, icon, color, type, includedInPlans, sortOrder) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          module.code,
          module.name,
          module.description,
          module.icon,
          module.color,
          module.type,
          JSON.stringify(module.includedInPlans),
          module.sortOrder
        ]
      );
    } catch (error: unknown) {
    }
  }

  // Verify the data
  const [rows] = await connection.execute('SELECT code, name, type FROM modules ORDER BY sortOrder');

  await connection.end();
}

fixModulesTables().catch(console.error);
