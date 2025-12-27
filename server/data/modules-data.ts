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
    name: 'Inventario',
    description: 'Control de stock de piezas y materiales',
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
    code: 'shop',
    name: 'Piano Emotion Store',
    description: 'Acceso a tiendas de proveedores integradas - GRATIS para todos',
    icon: 'cart',
    color: '#84cc16',
    type: 'free',
    includedInPlans: ['free', 'professional', 'premium'],
  },
  // Professional modules
  {
    code: 'advanced_invoicing',
    name: 'Facturación Electrónica',
    description: 'Facturación electrónica multi-país con cumplimiento legal',
    icon: 'receipt',
    color: '#0891b2',
    type: 'professional',
    includedInPlans: ['professional', 'premium'],
  },
  // Premium modules
  {
    code: 'accounting',
    name: 'Contabilidad',
    description: 'Gestión de gastos, ingresos y reportes financieros',
    icon: 'calculator',
    color: '#f97316',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'reports',
    name: 'Reportes y Analytics',
    description: 'Análisis avanzado y reportes personalizados',
    icon: 'analytics',
    color: '#06b6d4',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'crm',
    name: 'CRM Avanzado',
    description: 'Segmentación de clientes, campañas y automatizaciones',
    icon: 'heart',
    color: '#ef4444',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  {
    code: 'calendar_sync',
    name: 'Sincronización Calendario',
    description: 'Sincroniza con Google Calendar y Outlook',
    icon: 'sync',
    color: '#a855f7',
    type: 'premium',
    includedInPlans: ['premium'],
  },
  // Addon modules
  {
    code: 'ai_assistant',
    name: 'Asistente IA',
    description: 'Asistente inteligente para optimizar tu trabajo',
    icon: 'sparkles',
    color: '#f472b6',
    type: 'addon',
    includedInPlans: ['premium'],
  },
];

// ============================================================================
// Default Plans Configuration
// ============================================================================

export const DEFAULT_PLANS: PlanInfo[] = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para técnicos independientes que empiezan',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxClients: 100,
    maxPianos: 100,
    maxInvoicesPerMonth: 10,
    maxStorageMb: 100,
    features: [
      'Gestión básica de clientes',
      'Registro de pianos',
      'Calendario simple',
      'Facturación básica',
      'Gestión de equipos',
      'Inventario',
      'Piano Emotion Store'
    ],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Profesional',
    description: 'Para técnicos profesionales (30€/año)',
    monthlyPrice: 2.5,
    yearlyPrice: 30,
    maxUsers: 3,
    maxClients: null, // Ilimitado
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: 1000,
    features: [
      'Todo lo del plan Gratuito',
      'Facturación electrónica',
      'Soporte por email'
    ],
    isPopular: true,
  },
  {
    code: 'premium',
    name: 'Premium',
    description: 'Para empresas con equipos de técnicos',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    maxUsers: null, // Ilimitado
    maxClients: null,
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
    features: [
      'Todo lo del plan Profesional',
      'Contabilidad',
      'Reportes y Analytics',
      'CRM Avanzado',
      'Sincronización calendario',
      'Asistente IA',
      'Soporte prioritario'
    ],
    isPopular: false,
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
