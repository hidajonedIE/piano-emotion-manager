/**
 * Configuración de Planes de Suscripción
 * Piano Emotion Manager
 */

export type PlanType = 'free' | 'professional' | 'premium_ia';

export interface PlanLimits {
  clients: number;          // Límite de clientes (-1 = ilimitado)
  pianos: number;           // Límite de pianos (-1 = ilimitado)
  servicesPerMonth: number; // Servicios por mes (-1 = ilimitado)
  invoicesPerMonth: number; // Facturas por mes (-1 = ilimitado)
  quotesPerMonth: number;   // Presupuestos por mes (-1 = ilimitado)
  storageBytes: number;     // Almacenamiento en bytes
}

export interface PlanFeatures {
  // Funcionalidades básicas (incluidas en todos los planes)
  basicCRM: boolean;
  basicCalendar: boolean;
  basicInvoicing: boolean;
  basicInventory: boolean;
  basicReminders: boolean;
  basicContracts: boolean;
  clientMap: boolean;
  routes: boolean;
  fiscalData: boolean;
  importExport: boolean;
  
  // Funcionalidades Pro (Plan Pro y Premium)
  communications: boolean;      // WhatsApp, Email
  marketing: boolean;           // Campañas de marketing
  advancedCRM: boolean;         // CRM avanzado
  teams: boolean;               // Multi-técnico
  accounting: boolean;          // Contabilidad
  advancedAnalytics: boolean;   // Analytics avanzados
  clientPortal: boolean;        // Portal de clientes
  basicWorkflows: boolean;      // Automatizaciones básicas
  calendarSync: boolean;        // Sync Google/Outlook
  paymentGateways: boolean;     // Pasarelas de pago
  supplierStore: boolean;       // Tienda proveedores
  prioritySupport: boolean;     // Soporte prioritario
  
  // Funcionalidades Premium IA (Solo Plan Premium)
  aiChat: boolean;              // Asistente de chat con IA
  aiPredictions: boolean;       // Predicciones con IA
  aiEmails: boolean;            // Generación de emails con IA
  aiReports: boolean;           // Informes con IA
  aiClientAnalysis: boolean;    // Análisis de riesgo de clientes
  aiPriceSuggestions: boolean;  // Sugerencias de precios
  advancedWorkflows: boolean;   // Workflows avanzados
  whiteLabel: boolean;          // Marca blanca
  customApi: boolean;           // API personalizada
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;              // Precio en euros
  billingPeriod: 'year';      // Período de facturación
  limits: PlanLimits;
  features: PlanFeatures;
  description: string;
  stripePriceId: string | null;
}

// Constantes de almacenamiento
const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Plan Gratuito',
    price: 0,
    billingPeriod: 'year',
    stripePriceId: null,
    description: 'Funcionalidades básicas para empezar',
    limits: {
      clients: 100,
      pianos: 200,
      servicesPerMonth: 50,
      invoicesPerMonth: 30,
      quotesPerMonth: 30,
      storageBytes: 500 * MB, // 500 MB
    },
    features: {
      // Básicas - SÍ
      basicCRM: true,
      basicCalendar: true,
      basicInvoicing: true,
      basicInventory: true,
      basicReminders: true,
      basicContracts: true,
      clientMap: true,
      routes: true,
      fiscalData: true,
      importExport: true,
      
      // Pro - NO
      communications: false,
      marketing: false,
      advancedCRM: false,
      teams: false,
      accounting: false,
      advancedAnalytics: false,
      clientPortal: false,
      basicWorkflows: false,
      calendarSync: false,
      paymentGateways: false,
      supplierStore: false,
      prioritySupport: false,
      
      // Premium IA - NO
      aiChat: false,
      aiPredictions: false,
      aiEmails: false,
      aiReports: false,
      aiClientAnalysis: false,
      aiPriceSuggestions: false,
      advancedWorkflows: false,
      whiteLabel: false,
      customApi: false,
    },
  },
  
  professional: {
    id: 'professional',
    name: 'Plan Pro',
    price: 30,
    billingPeriod: 'year',
    stripePriceId: 'price_1SiNNrDpmJIxYFlvPsgsL3iX',
    description: 'Todas las funcionalidades para profesionales',
    limits: {
      clients: -1,           // Ilimitados
      pianos: -1,            // Ilimitados
      servicesPerMonth: -1,  // Ilimitados
      invoicesPerMonth: -1,  // Ilimitadas
      quotesPerMonth: -1,    // Ilimitados
      storageBytes: 2 * GB,  // 2 GB
    },
    features: {
      // Básicas - SÍ
      basicCRM: true,
      basicCalendar: true,
      basicInvoicing: true,
      basicInventory: true,
      basicReminders: true,
      basicContracts: true,
      clientMap: true,
      routes: true,
      fiscalData: true,
      importExport: true,
      
      // Pro - SÍ
      communications: true,
      marketing: true,
      advancedCRM: true,
      teams: true,
      accounting: true,
      advancedAnalytics: true,
      clientPortal: true,
      basicWorkflows: true,
      calendarSync: true,
      paymentGateways: true,
      supplierStore: true,
      prioritySupport: true,
      
      // Premium IA - NO
      aiChat: false,
      aiPredictions: false,
      aiEmails: false,
      aiReports: false,
      aiClientAnalysis: false,
      aiPriceSuggestions: false,
      advancedWorkflows: false,
      whiteLabel: false,
      customApi: false,
    },
  },
  
  premium_ia: {
    id: 'premium_ia',
    name: 'Plan Premium IA',
    price: 50,
    billingPeriod: 'year',
    stripePriceId: 'price_1SiMu2DpmJIxYFlv3ZHbLKBg',
    description: 'Todo incluido + Inteligencia Artificial + Marca Blanca',
    limits: {
      clients: -1,           // Ilimitados
      pianos: -1,            // Ilimitados
      servicesPerMonth: -1,  // Ilimitados
      invoicesPerMonth: -1,  // Ilimitadas
      quotesPerMonth: -1,    // Ilimitados
      storageBytes: 5 * GB,  // 5 GB
    },
    features: {
      // Básicas - SÍ
      basicCRM: true,
      basicCalendar: true,
      basicInvoicing: true,
      basicInventory: true,
      basicReminders: true,
      basicContracts: true,
      clientMap: true,
      routes: true,
      fiscalData: true,
      importExport: true,
      
      // Pro - SÍ
      communications: true,
      marketing: true,
      advancedCRM: true,
      teams: true,
      accounting: true,
      advancedAnalytics: true,
      clientPortal: true,
      basicWorkflows: true,
      calendarSync: true,
      paymentGateways: true,
      supplierStore: true,
      prioritySupport: true,
      
      // Premium IA - SÍ
      aiChat: true,
      aiPredictions: true,
      aiEmails: true,
      aiReports: true,
      aiClientAnalysis: true,
      aiPriceSuggestions: true,
      advancedWorkflows: true,
      whiteLabel: true,       // Marca blanca con tienda exclusiva
      customApi: true,        // API personalizada
    },
  },
};

/**
 * Obtener plan por tipo
 */
export function getPlan(planType: PlanType): Plan {
  return PLANS[planType] || PLANS.free;
}

/**
 * Verificar si un usuario tiene acceso a una funcionalidad
 */
export function hasFeature(planType: PlanType, feature: keyof PlanFeatures): boolean {
  const plan = getPlan(planType);
  return plan.features[feature] || false;
}

/**
 * Verificar si un usuario ha alcanzado un límite
 */
export function isWithinLimit(
  planType: PlanType,
  limitType: keyof PlanLimits,
  currentValue: number
): boolean {
  const plan = getPlan(planType);
  const limit = plan.limits[limitType];
  
  // -1 significa ilimitado
  if (limit === -1) return true;
  
  return currentValue < limit;
}

/**
 * Obtener el límite de un plan
 */
export function getLimit(planType: PlanType, limitType: keyof PlanLimits): number {
  const plan = getPlan(planType);
  return plan.limits[limitType];
}

/**
 * Formatear límite para mostrar
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Ilimitado';
  return limit.toString();
}

/**
 * Formatear almacenamiento para mostrar
 */
export function formatStorage(bytes: number): string {
  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(0)} GB`;
  }
  return `${(bytes / MB).toFixed(0)} MB`;
}
