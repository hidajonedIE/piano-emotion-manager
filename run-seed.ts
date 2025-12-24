import { drizzle } from "drizzle-orm/mysql2";
import { eq } from 'drizzle-orm';
import { modules, subscriptionPlans } from './drizzle/modules-schema';

// Connect directly to TiDB
const DATABASE_URL = process.env.DATABASE_URL || "mysql://3v9ofvvgodfeCHv.root:9wl3Ks7pqSVjBamc@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}";

const db = drizzle(DATABASE_URL);

// Default modules configuration
const DEFAULT_MODULES = [
  {
    code: 'clients',
    name: 'Gestión de Clientes',
    description: 'Gestiona tu cartera de clientes y sus datos de contacto',
    icon: 'people',
    color: '#8b5cf6',
    type: 'core' as const,
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'pianos',
    name: 'Registro de Pianos',
    description: 'Mantén un registro detallado de todos los pianos',
    icon: 'musical-notes',
    color: '#ec4899',
    type: 'core' as const,
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'services',
    name: 'Servicios',
    description: 'Registra afinaciones, reparaciones y otros servicios',
    icon: 'construct',
    color: '#f59e0b',
    type: 'core' as const,
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'calendar',
    name: 'Calendario',
    description: 'Agenda y gestiona tus citas',
    icon: 'calendar',
    color: '#3b82f6',
    type: 'core' as const,
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'basic_invoicing',
    name: 'Facturación Básica',
    description: 'Genera facturas simples para tus servicios',
    icon: 'document-text',
    color: '#14b8a6',
    type: 'free' as const,
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'team_management',
    name: 'Gestión de Equipos',
    description: 'Gestiona equipos de técnicos con roles y permisos',
    icon: 'people-circle',
    color: '#10b981',
    type: 'premium' as const,
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'inventory',
    name: 'Inventario',
    description: 'Control de stock de piezas y materiales',
    icon: 'cube',
    color: '#6366f1',
    type: 'premium' as const,
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'advanced_invoicing',
    name: 'Facturación Avanzada',
    description: 'Facturación electrónica multi-país con cumplimiento legal',
    icon: 'receipt',
    color: '#0891b2',
    type: 'premium' as const,
    includedInPlans: ['starter', 'professional', 'enterprise'],
  },
  {
    code: 'accounting',
    name: 'Contabilidad',
    description: 'Gestión de gastos, ingresos y reportes financieros',
    icon: 'calculator',
    color: '#f97316',
    type: 'premium' as const,
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'crm',
    name: 'CRM Avanzado',
    description: 'Seguimiento de leads, oportunidades y pipeline de ventas',
    icon: 'trending-up',
    color: '#8b5cf6',
    type: 'premium' as const,
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'analytics',
    name: 'Análisis y Reportes',
    description: 'Dashboards avanzados y reportes personalizados',
    icon: 'analytics',
    color: '#06b6d4',
    type: 'premium' as const,
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'api_access',
    name: 'Acceso API',
    description: 'Integración con sistemas externos vía API REST',
    icon: 'code-slash',
    color: '#64748b',
    type: 'enterprise' as const,
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

async function seedModules() {
  console.log('Seeding modules...');
  for (const module of DEFAULT_MODULES) {
    try {
      const existing = await db.select().from(modules).where(eq(modules.code, module.code));
      if (existing.length === 0) {
        await db.insert(modules).values({
          code: module.code,
          name: module.name,
          description: module.description,
          icon: module.icon,
          color: module.color,
          type: module.type,
          includedInPlans: module.includedInPlans,
        });
        console.log(`  - Created module: ${module.name}`);
      } else {
        console.log(`  - Module already exists: ${module.name}`);
      }
    } catch (error) {
      console.error(`  - Error creating module ${module.name}:`, error);
    }
  }
}

async function seedPlans() {
  console.log('Seeding plans...');
  for (const plan of DEFAULT_PLANS) {
    try {
      const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.code, plan.code));
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values({
          code: plan.code,
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice.toString(),
          yearlyPrice: plan.yearlyPrice.toString(),
          maxUsers: plan.maxUsers,
          maxClients: plan.maxClients,
          maxPianos: plan.maxPianos,
          maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
          maxStorageMb: plan.maxStorageMb,
          features: plan.features,
          isPopular: plan.isPopular,
        });
        console.log(`  - Created plan: ${plan.name}`);
      } else {
        console.log(`  - Plan already exists: ${plan.name}`);
      }
    } catch (error) {
      console.error(`  - Error creating plan ${plan.name}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('Connecting to TiDB...');
    await seedModules();
    await seedPlans();
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
