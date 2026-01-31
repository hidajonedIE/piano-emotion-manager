/**
 * Subscription Limits and Feature Access Control
 * Piano Emotion Manager
 */

export type SubscriptionPlan = 'FREE' | 'PRO' | 'PREMIUM';
export type AIFeature = 'chat' | 'email' | 'report' | 'prediction';

/**
 * Límites de uso de IA por plan
 */
export const AI_LIMITS = {
  FREE: {
    chatMessagesPerMonth: 0,
    emailGenerationsPerMonth: 0,
    reportGenerationsPerMonth: 0,
    predictionsPerMonth: 0,
  },
  PRO: {
    chatMessagesPerMonth: 0,
    emailGenerationsPerMonth: 0,
    reportGenerationsPerMonth: 0,
    predictionsPerMonth: 0,
  },
  PREMIUM: {
    chatMessagesPerMonth: 500,        // ~16 mensajes por día
    emailGenerationsPerMonth: 200,    // ~7 emails por día
    reportGenerationsPerMonth: 100,   // ~3 informes por día
    predictionsPerMonth: 50,          // ~1-2 predicciones por día
  },
} as const;

/**
 * Límites de datos por plan
 */
export const DATA_LIMITS = {
  FREE: {
    maxClients: 100,
    maxPianos: 200,
    maxServicesPerMonth: 100,
    maxInvoicesPerMonth: 100,
    storageGB: 0.5,
    maxTeamMembers: 1,
  },
  PRO: {
    maxClients: -1,        // Ilimitado
    maxPianos: -1,
    maxServicesPerMonth: -1,
    maxInvoicesPerMonth: -1,
    storageGB: 2,
    maxTeamMembers: 5,
  },
  PREMIUM: {
    maxClients: -1,
    maxPianos: -1,
    maxServicesPerMonth: -1,
    maxInvoicesPerMonth: -1,
    storageGB: 5,
    maxTeamMembers: -1,    // Ilimitado
  },
} as const;

/**
 * Acceso a funcionalidades por plan
 */
export const FEATURE_ACCESS = {
  FREE: {
    // Core features
    basicCRM: true,
    calendar: true,
    invoicing: true,
    inventory: true,
    
    // PRO features
    multiUser: false,
    marketing: false,
    advancedReports: false,
    accounting: false,
    clientPortal: false,
    integrations: false,
    
    // PREMIUM features
    aiChat: false,
    aiPredictions: false,
    aiEmailGeneration: false,
    aiReportGeneration: false,
    advancedWorkflows: false,
    whiteLabel: false,
    apiAccess: false,
  },
  PRO: {
    // Core features
    basicCRM: true,
    calendar: true,
    invoicing: true,
    inventory: true,
    
    // PRO features
    multiUser: true,
    marketing: true,
    advancedReports: true,
    accounting: true,
    clientPortal: true,
    integrations: true,
    
    // PREMIUM features
    aiChat: false,
    aiPredictions: false,
    aiEmailGeneration: false,
    aiReportGeneration: false,
    advancedWorkflows: false,
    whiteLabel: false,
    apiAccess: false,
  },
  PREMIUM: {
    // Core features
    basicCRM: true,
    calendar: true,
    invoicing: true,
    inventory: true,
    
    // PRO features
    multiUser: true,
    marketing: true,
    advancedReports: true,
    accounting: true,
    clientPortal: true,
    integrations: true,
    
    // PREMIUM features
    aiChat: true,
    aiPredictions: true,
    aiEmailGeneration: true,
    aiReportGeneration: true,
    advancedWorkflows: true,
    whiteLabel: true,
    apiAccess: true,
  },
} as const;

/**
 * Mapeo de features a límites de IA
 */
export const FEATURE_TO_LIMIT_KEY: Record<AIFeature, keyof typeof AI_LIMITS.PREMIUM> = {
  chat: 'chatMessagesPerMonth',
  email: 'emailGenerationsPerMonth',
  report: 'reportGenerationsPerMonth',
  prediction: 'predictionsPerMonth',
};

/**
 * Mensajes de error por feature
 */
export const FEATURE_UPGRADE_MESSAGES: Record<AIFeature, string> = {
  chat: '🔒 El Asistente de Chat con IA está disponible solo en el Plan PREMIUM.\n\n' +
        '✨ Ahorra 20 horas/mes con IA\n' +
        '📊 Predicciones inteligentes\n' +
        '✉️ Emails automáticos\n\n' +
        'Solo €9/mes',
  
  email: '🔒 La Generación Automática de Emails con IA está disponible solo en el Plan PREMIUM.\n\n' +
         'Genera emails personalizados en segundos y ahorra horas de trabajo.',
  
  report: '🔒 Los Informes de Servicio con IA están disponibles solo en el Plan PREMIUM.\n\n' +
          'Crea informes profesionales automáticamente después de cada servicio.',
  
  prediction: '🔒 Las Predicciones con IA están disponibles solo en el Plan PREMIUM.\n\n' +
              'Predice ingresos, identifica clientes en riesgo y optimiza tu negocio.',
};

/**
 * Normalizar nombre de plan
 */
export function normalizePlanName(plan: string | null | undefined): SubscriptionPlan {
  if (!plan) return 'FREE';
  
  const normalized = plan.toUpperCase();
  
  if (normalized.includes('PREMIUM')) {
    return 'PREMIUM';
  }
  
  if (normalized.includes('PRO') || normalized.includes('PROFESSIONAL')) {
    return 'PRO';
  }
  
  return 'FREE';
}

/**
 * Obtener límites de IA para un plan
 */
export function getAILimits(plan: SubscriptionPlan) {
  return AI_LIMITS[plan];
}

/**
 * Obtener límites de datos para un plan
 */
export function getDataLimits(plan: SubscriptionPlan) {
  return DATA_LIMITS[plan];
}

/**
 * Verificar si un plan tiene acceso a una feature
 */
export function hasFeatureAccess(plan: SubscriptionPlan, feature: keyof typeof FEATURE_ACCESS.PREMIUM): boolean {
  return FEATURE_ACCESS[plan][feature];
}

/**
 * Obtener el límite específico para una feature de IA
 */
export function getFeatureLimit(plan: SubscriptionPlan, feature: AIFeature): number {
  const limitKey = FEATURE_TO_LIMIT_KEY[feature];
  return AI_LIMITS[plan][limitKey];
}
