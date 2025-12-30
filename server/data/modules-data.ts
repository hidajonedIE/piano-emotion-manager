/**
 * Datos de Módulos y Planes de Suscripción
 * Piano Emotion Manager
 * 
 * Este archivo contiene las definiciones estáticas de módulos y planes.
 * Se usa tanto para el seed de la base de datos como para el router.
 */

import type { ModuleType, SubscriptionPlan } from '../../drizzle/modules-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface ModuleInfo {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: ModuleType;
  isEnabled: boolean;
  isAvailable: boolean;
  requiresUpgrade: boolean;
  includedInCurrentPlan: boolean;
  includedInPlans: SubscriptionPlan[];
}

export interface PlanInfo {
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number | null;
  maxClients: number | null;
  maxPianos: number | null;
  maxInvoicesPerMonth: number | null;
  maxStorageMb: number | null;
  features: string[];
  isPopular: boolean;
}

// ============================================================================
// Default Modules Configuration
// ============================================================================

export const DEFAULT_MODULES: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: ModuleType;
  includedInPlans: SubscriptionPlan[];
}> = [
  // Core modules (always available)
  {
    code: 'clients',
    name: 'Gestión de Clientes',
    description: 'Gestiona tu cartera de clientes y sus datos de contacto',
    icon: 'people',
    color: '#8b5cf6',
    type: 'core',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'pianos',
    name: 'Registro de Pianos',
    description: 'Mantén un registro detallado de todos los pianos',
    icon: 'musical-notes',
    color: '#ec4899',
    type: 'core',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'services',
    name: 'Servicios',
    description: 'Registra afinaciones, reparaciones y otros servicios',
    icon: 'construct',
    color: '#f59e0b',
    type: 'core',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'calendar',
    name: 'Calendario',
    description: 'Agenda y gestiona tus citas',
    icon: 'calendar',
    color: '#3b82f6',
    type: 'core',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  // Free optional modules
  {
    code: 'basic_invoicing',
    name: 'Facturación Básica',
    description: 'Genera facturas simples para tus servicios',
    icon: 'document-text',
    color: '#14b8a6',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'inventory',
    name: 'Inventario Básico',
    description: 'Control básico de stock de piezas y materiales',
    icon: 'cube',
    color: '#6366f1',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'team_management',
    name: 'Gestión de Equipos',
    description: 'Gestiona equipos de técnicos con roles y permisos',
    icon: 'people-circle',
    color: '#10b981',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'communications',
    name: 'Comunicaciones',
    description: 'Envío de WhatsApp y Email a clientes',
    icon: 'chatbubbles',
    color: '#10b981',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'reminders',
    name: 'Recordatorios',
    description: 'Recordatorios automáticos para mantenimiento',
    icon: 'alarm',
    color: '#f59e0b',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'contracts',
    name: 'Contratos',
    description: 'Gestión de contratos con clientes',
    icon: 'document',
    color: '#3b82f6',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'client_map',
    name: 'Mapa de Clientes',
    description: 'Visualiza tus clientes en el mapa',
    icon: 'map',
    color: '#ec4899',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'routes',
    name: 'Rutas',
    description: 'Optimiza tus rutas de trabajo',
    icon: 'navigate',
    color: '#8b5cf6',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'import_export',
    name: 'Importar/Exportar',
    description: 'Importa y exporta tus datos',
    icon: 'swap-horizontal',
    color: '#06b6d4',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  {
    code: 'client_portal',
    name: 'Portal de Clientes',
    description: 'Portal web para que tus clientes vean sus servicios',
    icon: 'globe',
    color: '#ec4899',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  // Pro modules
  {
    code: 'electronic_invoicing',
    name: 'Facturación Electrónica',
    description: 'Facturas electrónicas con validación fiscal',
    icon: 'receipt',
    color: '#14b8a6',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'inventory_advanced',
    name: 'Inventario Avanzado',
    description: 'Gestión avanzada de inventario con alertas y proveedores',
    icon: 'cube-outline',
    color: '#6366f1',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'marketing',
    name: 'Marketing y Campañas',
    description: 'Crea y gestiona campañas de marketing',
    icon: 'megaphone',
    color: '#f59e0b',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'crm_basic',
    name: 'CRM Avanzado',
    description: 'Gestión avanzada de relaciones con clientes',
    icon: 'people-circle',
    color: '#8b5cf6',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'multi_technician',
    name: 'Equipos Multi-Técnico',
    description: 'Gestión de equipos con múltiples técnicos',
    icon: 'people',
    color: '#3b82f6',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'accounting_basic',
    name: 'Contabilidad',
    description: 'Gestión básica de gastos e ingresos',
    icon: 'calculator',
    color: '#f97316',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'analytics',
    name: 'Analytics Avanzados',
    description: 'Análisis y reportes de tu negocio',
    icon: 'bar-chart',
    color: '#06b6d4',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'automations',
    name: 'Automatizaciones Básicas',
    description: 'Automatiza tareas repetitivas',
    icon: 'flash',
    color: '#eab308',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'calendar_sync',
    name: 'Sync Google/Outlook',
    description: 'Sincroniza con Google Calendar y Outlook',
    icon: 'sync',
    color: '#a855f7',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  {
    code: 'payment_gateways',
    name: 'Pasarelas de Pago',
    description: 'Acepta pagos online con Stripe y otras pasarelas',
    icon: 'card',
    color: '#14b8a6',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  // Premium IA modules
  {
    code: 'ai_chat',
    name: 'Asistente de Chat con IA (Gemini)',
    description: 'Asistente inteligente con IA de Google Gemini',
    icon: 'chatbubble-ellipses',
    color: '#8b5cf6',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'ai_predictions',
    name: 'Predicciones con IA',
    description: 'Predicciones inteligentes sobre mantenimiento y clientes',
    icon: 'trending-up',
    color: '#3b82f6',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'ai_email_generation',
    name: 'Generación Automática de Emails',
    description: 'Genera emails personalizados con IA',
    icon: 'mail',
    color: '#10b981',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'ai_service_reports',
    name: 'Informes de Servicio con IA',
    description: 'Genera informes de servicio automáticamente',
    icon: 'document-text',
    color: '#f59e0b',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'ai_risk_analysis',
    name: 'Análisis de Riesgo de Clientes',
    description: 'Identifica clientes con riesgo de abandono',
    icon: 'warning',
    color: '#ef4444',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'ai_pricing',
    name: 'Sugerencias de Precios Inteligentes',
    description: 'IA sugiere precios óptimos para tus servicios',
    icon: 'pricetag',
    color: '#eab308',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'workflows_advanced',
    name: 'Workflows Avanzados',
    description: 'Automatizaciones complejas con múltiples pasos',
    icon: 'git-network',
    color: '#06b6d4',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'white_label',
    name: 'Marca Blanca',
    description: 'Tienda exclusiva con tu propia marca',
    icon: 'ribbon',
    color: '#ec4899',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'custom_api',
    name: 'API Personalizada',
    description: 'Acceso a API para integraciones personalizadas',
    icon: 'code-slash',
    color: '#a855f7',
    type: 'premium',
    includedInPlans: ['premium'],
  },
];

// ============================================================================
// Default Plans Configuration
// ============================================================================

export const DEFAULT_PLANS: PlanInfo[] = [
  {
    code: 'free',
    name: 'Plan Gratuito',
    description: 'Gratis',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxClients: 100,
    maxPianos: 200,
    maxInvoicesPerMonth: 100,
    maxStorageMb: 500,
    features: [
      'Hasta 100 clientes',
      'Hasta 200 pianos',
      'Hasta 100 servicios/mes',
      'Hasta 100 facturas/mes',
      'Calendario completo',
      'Inventario básico',
      'Recordatorios',
      'Contratos',
      'Mapa de clientes',
      'Rutas',
      'Importar/Exportar',
      '500 MB almacenamiento'
    ],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Plan Pro',
    description: '€30/año',
    monthlyPrice: 2.5,
    yearlyPrice: 30,
    maxUsers: null,
    maxClients: null,
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: 2000,
    features: [
      'Todo lo del Plan Gratuito',
      'Clientes ilimitados',
      'Pianos ilimitados',
      'Servicios ilimitados',
      'Facturas ilimitadas',
      'Comunicaciones (WhatsApp, Email)',
      'Marketing y campañas',
      'CRM avanzado',
      'Equipos (multi-técnico)',
      'Contabilidad',
      'Analytics avanzados',
      'Portal de clientes',
      'Automatizaciones básicas',
      'Sync Google/Outlook',
      'Pasarelas de pago',
      '2 GB almacenamiento',
      'Soporte prioritario por email'
    ],
    isPopular: false,
  },
  {
    code: 'premium',
    name: 'Plan Premium IA',
    description: '€50/año',
    monthlyPrice: 4.17,
    yearlyPrice: 50,
    maxUsers: null,
    maxClients: null,
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: 5000,
    features: [
      'Todo lo del Plan Pro',
      'Asistente de chat con IA (Gemini)',
      'Predicciones con IA',
      'Generación automática de emails',
      'Informes de servicio con IA',
      'Análisis de riesgo de clientes',
      'Sugerencias de precios inteligentes',
      'Workflows avanzados',
      'Marca blanca (tienda exclusiva)',
      'API personalizada',
      '5 GB almacenamiento',
      'Soporte prioritario por email'
    ],
    isPopular: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convierte los módulos estáticos al formato ModuleInfo para el frontend
 */
export function getModulesForPlan(currentPlan: SubscriptionPlan = 'free'): ModuleInfo[] {
  return DEFAULT_MODULES.map(module => ({
    code: module.code,
    name: module.name,
    description: module.description,
    icon: module.icon,
    color: module.color,
    type: module.type,
    includedInPlans: module.includedInPlans,
    isEnabled: module.type === 'core' || module.includedInPlans.includes(currentPlan),
    isAvailable: module.type === 'core' || module.includedInPlans.includes(currentPlan),
    requiresUpgrade: !module.includedInPlans.includes(currentPlan) && module.type !== 'core',
    includedInCurrentPlan: module.includedInPlans.includes(currentPlan),
  }));
}

/**
 * Obtiene un plan por su código
 */
export function getPlanByCode(code: SubscriptionPlan): PlanInfo | undefined {
  return DEFAULT_PLANS.find(plan => plan.code === code);
}
