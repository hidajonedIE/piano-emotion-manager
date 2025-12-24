import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test";

// Default modules configuration
const DEFAULT_MODULES = [
  {
    code: 'clients',
    name: 'Gestión de Clientes',
    description: 'Gestiona tu cartera de clientes y sus datos de contacto',
    icon: 'people',
    color: '#8b5cf6',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'pianos',
    name: 'Registro de Pianos',
    description: 'Mantén un registro detallado de todos los pianos',
    icon: 'musical-notes',
    color: '#ec4899',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'services',
    name: 'Servicios',
    description: 'Registra afinaciones, reparaciones y otros servicios',
    icon: 'construct',
    color: '#f59e0b',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'calendar',
    name: 'Calendario',
    description: 'Agenda y gestiona tus citas',
    icon: 'calendar',
    color: '#3b82f6',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'basic_invoicing',
    name: 'Facturación Básica',
    description: 'Genera facturas simples para tus servicios',
    icon: 'document-text',
    color: '#14b8a6',
    type: 'free',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'team_management',
    name: 'Gestión de Equipos',
    description: 'Gestiona equipos de técnicos con roles y permisos',
    icon: 'people-circle',
    color: '#10b981',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'inventory',
    name: 'Inventario',
    description: 'Control de stock de piezas y materiales',
    icon: 'cube',
    color: '#6366f1',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'advanced_invoicing',
    name: 'Facturación Avanzada',
    description: 'Facturación electrónica multi-país con cumplimiento legal',
    icon: 'receipt',
    color: '#0891b2',
    type: 'premium',
    includedInPlans: ['starter', 'professional', 'enterprise'],
  },
  {
    code: 'accounting',
    name: 'Contabilidad',
    description: 'Gestión de gastos, ingresos y reportes financieros',
    icon: 'calculator',
    color: '#f97316',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'crm',
    name: 'CRM Avanzado',
    description: 'Seguimiento de leads, oportunidades y pipeline de ventas',
    icon: 'trending-up',
    color: '#8b5cf6',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'analytics',
    name: 'Análisis y Reportes',
    description: 'Dashboards avanzados y reportes personalizados',
    icon: 'analytics',
    color: '#06b6d4',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'api_access',
    name: 'Acceso API',
    description: 'Integración con sistemas externos vía API REST',
    icon: 'code-slash',
    color: '#64748b',
    type: 'enterprise',
    includedInPlans: ['enterprise'],
  },
];

// Default plans configuration
const DEFAULT_PLANS = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para empezar a gestionar tu negocio',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxClients: 50,
    maxPianos: 100,
    maxInvoicesPerMonth: 10,
    maxStorageMb: 100,
    features: ['Gestión básica de clientes', 'Registro de pianos', 'Calendario simple'],
    isPopular: false,
  },
  {
    code: 'starter',
    name: 'Starter',
    description: 'Para profesionales independientes',
    monthlyPrice: 19,
    yearlyPrice: 190,
    maxUsers: 2,
    maxClients: 200,
    maxPianos: 500,
    maxInvoicesPerMonth: 50,
    maxStorageMb: 500,
    features: ['Todo en Gratuito', 'Facturación avanzada', 'Soporte prioritario'],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Profesional',
    description: 'Para equipos pequeños',
    monthlyPrice: 49,
    yearlyPrice: 490,
    maxUsers: 5,
    maxClients: 1000,
    maxPianos: 2000,
    maxInvoicesPerMonth: 200,
    maxStorageMb: 2000,
    features: ['Todo en Starter', 'Gestión de equipos', 'Inventario', 'CRM', 'Análisis'],
    isPopular: true,
  },
  {
    code: 'enterprise',
    name: 'Empresa',
    description: 'Para grandes organizaciones',
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxUsers: null,
    maxClients: null,
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
    features: ['Todo en Profesional', 'Usuarios ilimitados', 'API Access', 'Soporte dedicado'],
    isPopular: false,
  },
];

async function seedModules(connection: mysql.Connection) {
  for (const module of DEFAULT_MODULES) {
    try {
      const [existing] = await connection.execute(
        'SELECT id FROM modules WHERE code = ?',
        [module.code]
      );
      
      if ((existing as any[]).length === 0) {
        await connection.execute(
          `INSERT INTO modules (code, name, description, icon, color, type, includedInPlans) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            module.code,
            module.name,
            module.description,
            module.icon,
            module.color,
            module.type,
            JSON.stringify(module.includedInPlans)
          ]
        );
      } else {
      }
    } catch (error: unknown) {
    }
  }
}

async function seedPlans(connection: mysql.Connection) {
  for (const plan of DEFAULT_PLANS) {
    try {
      const [existing] = await connection.execute(
        'SELECT id FROM subscription_plans WHERE code = ?',
        [plan.code]
      );
      
      if ((existing as any[]).length === 0) {
        await connection.execute(
          `INSERT INTO subscription_plans (code, name, description, monthly_price, yearly_price, max_users, max_clients, max_pianos, max_invoices_per_month, max_storage_mb, features, is_popular) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.code,
            plan.name,
            plan.description,
            plan.monthlyPrice,
            plan.yearlyPrice,
            plan.maxUsers,
            plan.maxClients,
            plan.maxPianos,
            plan.maxInvoicesPerMonth,
            plan.maxStorageMb,
            JSON.stringify(plan.features),
            plan.isPopular
          ]
        );
      } else {
      }
    } catch (error: unknown) {
    }
  }
}

async function main() {
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: {
      rejectUnauthorized: true
    }
  });


  await seedModules(connection);
  await seedPlans(connection);

  await connection.end();
}

main().catch(console.error);
