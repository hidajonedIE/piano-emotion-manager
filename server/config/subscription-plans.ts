/**
 * Subscription Plans Configuration
 * Piano Emotion Manager
 * 
 * Defines the features and limits for each subscription tier.
 * Used for both UI display and backend permission checks.
 */

export type SubscriptionPlan = 
  | 'free' 
  | 'professional_basic' 
  | 'professional_advanced' 
  | 'enterprise_basic' 
  | 'enterprise_advanced';

export type FeatureKey = 
  // Communication features
  | 'whatsapp_integration'
  | 'email_integration'
  | 'automatic_reminders'
  | 'appointment_confirmations'
  | 'marketing_automation'
  | 'advanced_marketing_campaigns'
  | 'unlimited_templates'
  // Storage features
  | 'image_storage'
  | 'document_storage'
  | 'backup_cloud'
  // Team features
  | 'multi_technician'
  | 'admin_panel'
  | 'client_assignment'
  | 'team_reports'
  | 'technician_statistics'
  // Support features
  | 'priority_support'
  | 'premium_support'
  // Analytics features
  | 'advanced_analytics'
  | 'custom_reports'
  | 'export_data';

export interface PlanFeature {
  key: FeatureKey;
  name: string;
  description: string;
  availableFrom: SubscriptionPlan;
  icon?: string;
}

export interface PlanLimits {
  whatsappMessagesPerMonth: number;
  emailsPerMonth: number;
  storageGB: number;
  maxTechnicians: number;
  maxClients: number;
  maxPianos: number;
}

export interface PlanConfig {
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: FeatureKey[];
  isPopular: boolean;
  note?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

// Feature definitions with their minimum required plan
export const FEATURES: PlanFeature[] = [
  // Communication features - Professional Basic+
  {
    key: 'whatsapp_integration',
    name: 'WhatsApp Business',
    description: 'Envía mensajes de WhatsApp a tus clientes directamente desde la app',
    availableFrom: 'professional_basic',
    icon: 'logo-whatsapp',
  },
  {
    key: 'email_integration',
    name: 'Email integrado',
    description: 'Envía emails profesionales a tus clientes',
    availableFrom: 'professional_basic',
    icon: 'mail',
  },
  {
    key: 'automatic_reminders',
    name: 'Recordatorios automáticos',
    description: 'Envía recordatorios automáticos de citas a tus clientes',
    availableFrom: 'professional_basic',
    icon: 'notifications',
  },
  {
    key: 'appointment_confirmations',
    name: 'Confirmaciones de cita',
    description: 'Solicita confirmación de citas automáticamente',
    availableFrom: 'professional_basic',
    icon: 'checkmark-circle',
  },
  {
    key: 'marketing_automation',
    name: 'Marketing automatizado',
    description: 'Campañas de marketing básicas automatizadas',
    availableFrom: 'professional_basic',
    icon: 'megaphone',
  },
  
  // Storage features - Professional Basic+
  {
    key: 'image_storage',
    name: 'Almacenamiento de imágenes',
    description: 'Guarda fotos de pianos e intervenciones en la nube',
    availableFrom: 'professional_basic',
    icon: 'images',
  },
  {
    key: 'document_storage',
    name: 'Almacenamiento de documentos',
    description: 'Guarda facturas, contratos y documentos en la nube',
    availableFrom: 'professional_basic',
    icon: 'document',
  },
  {
    key: 'backup_cloud',
    name: 'Backup en la nube',
    description: 'Copias de seguridad automáticas de tus datos',
    availableFrom: 'professional_basic',
    icon: 'cloud-upload',
  },
  
  // Advanced features - Professional Advanced+
  {
    key: 'advanced_marketing_campaigns',
    name: 'Campañas avanzadas',
    description: 'Campañas de marketing segmentadas y personalizadas',
    availableFrom: 'professional_advanced',
    icon: 'trending-up',
  },
  {
    key: 'unlimited_templates',
    name: 'Plantillas ilimitadas',
    description: 'Crea plantillas personalizadas sin límite',
    availableFrom: 'professional_advanced',
    icon: 'copy',
  },
  
  // Team features - Enterprise Basic+
  {
    key: 'multi_technician',
    name: 'Multi-técnico',
    description: 'Gestiona un equipo de técnicos',
    availableFrom: 'enterprise_basic',
    icon: 'people',
  },
  {
    key: 'admin_panel',
    name: 'Panel de administración',
    description: 'Panel centralizado para gestionar tu equipo',
    availableFrom: 'enterprise_basic',
    icon: 'settings',
  },
  {
    key: 'client_assignment',
    name: 'Asignación de clientes',
    description: 'Asigna clientes a técnicos específicos',
    availableFrom: 'enterprise_basic',
    icon: 'person-add',
  },
  {
    key: 'team_reports',
    name: 'Reportes de equipo',
    description: 'Informes de rendimiento del equipo',
    availableFrom: 'enterprise_basic',
    icon: 'bar-chart',
  },
  
  // Enterprise Advanced features
  {
    key: 'technician_statistics',
    name: 'Estadísticas por técnico',
    description: 'Estadísticas detalladas de cada técnico',
    availableFrom: 'enterprise_advanced',
    icon: 'analytics',
  },
  
  // Support features
  {
    key: 'priority_support',
    name: 'Soporte prioritario',
    description: 'Atención prioritaria en soporte técnico',
    availableFrom: 'professional_basic',
    icon: 'headset',
  },
  {
    key: 'premium_support',
    name: 'Soporte premium',
    description: 'Soporte premium con respuesta garantizada en 24h',
    availableFrom: 'professional_advanced',
    icon: 'star',
  },
  
  // Analytics features
  {
    key: 'advanced_analytics',
    name: 'Analíticas avanzadas',
    description: 'Dashboards y métricas avanzadas de tu negocio',
    availableFrom: 'professional_advanced',
    icon: 'stats-chart',
  },
  {
    key: 'custom_reports',
    name: 'Informes personalizados',
    description: 'Crea informes personalizados de tu actividad',
    availableFrom: 'enterprise_basic',
    icon: 'document-text',
  },
  {
    key: 'export_data',
    name: 'Exportación de datos',
    description: 'Exporta tus datos en múltiples formatos',
    availableFrom: 'professional_basic',
    icon: 'download',
  },
];

// Plan configurations
export const PLANS: PlanConfig[] = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para todos los técnicos',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      whatsappMessagesPerMonth: 0,
      emailsPerMonth: 0,
      storageGB: 0,
      maxTechnicians: 1,
      maxClients: -1, // unlimited
      maxPianos: -1, // unlimited
    },
    features: [],
    isPopular: false,
  },
  {
    code: 'professional_basic',
    name: 'Profesional Básico',
    description: 'Para técnicos independientes',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    limits: {
      whatsappMessagesPerMonth: 50,
      emailsPerMonth: 100,
      storageGB: 2,
      maxTechnicians: 1,
      maxClients: -1,
      maxPianos: -1,
    },
    features: [
      'whatsapp_integration',
      'email_integration',
      'automatic_reminders',
      'appointment_confirmations',
      'marketing_automation',
      'image_storage',
      'document_storage',
      'backup_cloud',
      'priority_support',
      'export_data',
    ],
    isPopular: true,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
  {
    code: 'professional_advanced',
    name: 'Profesional Avanzado',
    description: 'Para técnicos con alto volumen',
    monthlyPrice: 14.99,
    yearlyPrice: 149,
    limits: {
      whatsappMessagesPerMonth: 100,
      emailsPerMonth: 200,
      storageGB: 5,
      maxTechnicians: 1,
      maxClients: -1,
      maxPianos: -1,
    },
    features: [
      'whatsapp_integration',
      'email_integration',
      'automatic_reminders',
      'appointment_confirmations',
      'marketing_automation',
      'advanced_marketing_campaigns',
      'unlimited_templates',
      'image_storage',
      'document_storage',
      'backup_cloud',
      'priority_support',
      'premium_support',
      'advanced_analytics',
      'export_data',
    ],
    isPopular: false,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
  {
    code: 'enterprise_basic',
    name: 'Empresa Básico',
    description: 'Para equipos de técnicos',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    limits: {
      whatsappMessagesPerMonth: 50, // per technician
      emailsPerMonth: 100, // per technician
      storageGB: 10,
      maxTechnicians: 5,
      maxClients: -1,
      maxPianos: -1,
    },
    features: [
      'whatsapp_integration',
      'email_integration',
      'automatic_reminders',
      'appointment_confirmations',
      'marketing_automation',
      'image_storage',
      'document_storage',
      'backup_cloud',
      'priority_support',
      'export_data',
      'multi_technician',
      'admin_panel',
      'client_assignment',
      'team_reports',
      'custom_reports',
    ],
    isPopular: false,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
  {
    code: 'enterprise_advanced',
    name: 'Empresa Avanzado',
    description: 'Para equipos con alto volumen',
    monthlyPrice: 14.99,
    yearlyPrice: 149,
    limits: {
      whatsappMessagesPerMonth: 100, // per technician
      emailsPerMonth: 200, // per technician
      storageGB: 20,
      maxTechnicians: -1, // unlimited
      maxClients: -1,
      maxPianos: -1,
    },
    features: [
      'whatsapp_integration',
      'email_integration',
      'automatic_reminders',
      'appointment_confirmations',
      'marketing_automation',
      'advanced_marketing_campaigns',
      'unlimited_templates',
      'image_storage',
      'document_storage',
      'backup_cloud',
      'priority_support',
      'premium_support',
      'advanced_analytics',
      'export_data',
      'multi_technician',
      'admin_panel',
      'client_assignment',
      'team_reports',
      'custom_reports',
      'technician_statistics',
    ],
    isPopular: false,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
];

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  'free': 0,
  'professional_basic': 1,
  'professional_advanced': 2,
  'enterprise_basic': 3,
  'enterprise_advanced': 4,
};

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(plan: SubscriptionPlan, feature: FeatureKey): boolean {
  const planConfig = PLANS.find(p => p.code === plan);
  if (!planConfig) return false;
  return planConfig.features.includes(feature);
}

/**
 * Get the minimum plan required for a feature
 */
export function getMinimumPlanForFeature(feature: FeatureKey): SubscriptionPlan {
  const featureConfig = FEATURES.find(f => f.key === feature);
  return featureConfig?.availableFrom || 'enterprise_advanced';
}

/**
 * Get all features that are locked for a given plan
 */
export function getLockedFeatures(plan: SubscriptionPlan): PlanFeature[] {
  const planConfig = PLANS.find(p => p.code === plan);
  if (!planConfig) return FEATURES;
  
  return FEATURES.filter(f => !planConfig.features.includes(f.key));
}

/**
 * Get all features available for a given plan
 */
export function getAvailableFeatures(plan: SubscriptionPlan): PlanFeature[] {
  const planConfig = PLANS.find(p => p.code === plan);
  if (!planConfig) return [];
  
  return FEATURES.filter(f => planConfig.features.includes(f.key));
}

/**
 * Compare two plans
 */
export function comparePlans(plan1: SubscriptionPlan, plan2: SubscriptionPlan): number {
  return PLAN_HIERARCHY[plan1] - PLAN_HIERARCHY[plan2];
}

/**
 * Check if plan1 is higher or equal to plan2
 */
export function isPlanHigherOrEqual(plan1: SubscriptionPlan, plan2: SubscriptionPlan): boolean {
  return PLAN_HIERARCHY[plan1] >= PLAN_HIERARCHY[plan2];
}

/**
 * Get the next upgrade plan
 */
export function getNextUpgradePlan(currentPlan: SubscriptionPlan): PlanConfig | null {
  const currentIndex = PLANS.findIndex(p => p.code === currentPlan);
  if (currentIndex === -1 || currentIndex >= PLANS.length - 1) return null;
  return PLANS[currentIndex + 1];
}

/**
 * Get plan configuration by code
 */
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig | undefined {
  return PLANS.find(p => p.code === plan);
}

/**
 * Get recommended upgrade plan for a specific feature
 */
export function getRecommendedPlanForFeature(feature: FeatureKey): PlanConfig | undefined {
  const minimumPlan = getMinimumPlanForFeature(feature);
  return PLANS.find(p => p.code === minimumPlan);
}
