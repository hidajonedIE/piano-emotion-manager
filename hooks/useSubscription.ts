/**
 * Subscription Hook
 * Piano Emotion Manager
 * 
 * Provides subscription state and feature access checks for the UI.
 * Handles the display of locked features and upgrade prompts.
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export type SubscriptionPlan = 
  | 'free' 
  | 'professional_basic' 
  | 'professional_advanced' 
  | 'enterprise_basic' 
  | 'enterprise_advanced';

export type FeatureKey = 
  | 'whatsapp_integration'
  | 'email_integration'
  | 'automatic_reminders'
  | 'appointment_confirmations'
  | 'marketing_automation'
  | 'advanced_marketing_campaigns'
  | 'unlimited_templates'
  | 'image_storage'
  | 'document_storage'
  | 'backup_cloud'
  | 'multi_technician'
  | 'admin_panel'
  | 'client_assignment'
  | 'team_reports'
  | 'technician_statistics'
  | 'priority_support'
  | 'premium_support'
  | 'advanced_analytics'
  | 'custom_reports'
  | 'export_data';

interface FeatureInfo {
  key: FeatureKey;
  name: string;
  description: string;
  availableFrom: SubscriptionPlan;
  icon?: string;
}

interface PlanInfo {
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

// Feature definitions
const FEATURES: FeatureInfo[] = [
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
  {
    key: 'technician_statistics',
    name: 'Estadísticas por técnico',
    description: 'Estadísticas detalladas de cada técnico',
    availableFrom: 'enterprise_advanced',
    icon: 'analytics',
  },
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

// Plan hierarchy
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  'free': 0,
  'professional_basic': 1,
  'professional_advanced': 2,
  'enterprise_basic': 3,
  'enterprise_advanced': 4,
};

// Plan info
const PLANS: PlanInfo[] = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para todos los técnicos',
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  {
    code: 'professional_basic',
    name: 'Profesional Básico',
    description: 'Para técnicos independientes',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
  },
  {
    code: 'professional_advanced',
    name: 'Profesional Avanzado',
    description: 'Para técnicos con alto volumen',
    monthlyPrice: 14.99,
    yearlyPrice: 149,
  },
  {
    code: 'enterprise_basic',
    name: 'Empresa Básico',
    description: 'Para equipos de técnicos',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
  },
  {
    code: 'enterprise_advanced',
    name: 'Empresa Avanzado',
    description: 'Para equipos con alto volumen',
    monthlyPrice: 14.99,
    yearlyPrice: 149,
  },
];

interface UseSubscriptionReturn {
  // Current plan
  currentPlan: SubscriptionPlan;
  planInfo: PlanInfo | undefined;
  isLoading: boolean;
  
  // Feature checks
  hasFeature: (feature: FeatureKey) => boolean;
  isFeatureLocked: (feature: FeatureKey) => boolean;
  getFeatureInfo: (feature: FeatureKey) => FeatureInfo | undefined;
  
  // Locked features
  getLockedFeatures: () => FeatureInfo[];
  getAvailableFeatures: () => FeatureInfo[];
  
  // Upgrade info
  getMinimumPlanForFeature: (feature: FeatureKey) => PlanInfo | undefined;
  getNextUpgradePlan: () => PlanInfo | undefined;
  
  // Upgrade modal state
  showUpgradeModal: boolean;
  upgradeModalFeature: FeatureKey | null;
  upgradeModalPlan: PlanInfo | null;
  openUpgradeModal: (feature: FeatureKey) => void;
  closeUpgradeModal: () => void;
  
  // Actions
  checkFeatureAndShowModal: (feature: FeatureKey) => boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  // Get current subscription from backend
  // For now, we'll use a default value - in production this would come from tRPC
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(false);
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<FeatureKey | null>(null);
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<PlanInfo | null>(null);
  
  // Get plan info
  const planInfo = useMemo(() => {
    return PLANS.find(p => p.code === currentPlan);
  }, [currentPlan]);
  
  // Check if user has access to a feature
  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    const featureInfo = FEATURES.find(f => f.key === feature);
    if (!featureInfo) return false;
    
    const requiredPlanLevel = PLAN_HIERARCHY[featureInfo.availableFrom];
    const currentPlanLevel = PLAN_HIERARCHY[currentPlan];
    
    return currentPlanLevel >= requiredPlanLevel;
  }, [currentPlan]);
  
  // Check if a feature is locked
  const isFeatureLocked = useCallback((feature: FeatureKey): boolean => {
    return !hasFeature(feature);
  }, [hasFeature]);
  
  // Get feature info
  const getFeatureInfo = useCallback((feature: FeatureKey): FeatureInfo | undefined => {
    return FEATURES.find(f => f.key === feature);
  }, []);
  
  // Get all locked features for current plan
  const getLockedFeatures = useCallback((): FeatureInfo[] => {
    return FEATURES.filter(f => isFeatureLocked(f.key));
  }, [isFeatureLocked]);
  
  // Get all available features for current plan
  const getAvailableFeatures = useCallback((): FeatureInfo[] => {
    return FEATURES.filter(f => hasFeature(f.key));
  }, [hasFeature]);
  
  // Get minimum plan required for a feature
  const getMinimumPlanForFeature = useCallback((feature: FeatureKey): PlanInfo | undefined => {
    const featureInfo = FEATURES.find(f => f.key === feature);
    if (!featureInfo) return undefined;
    return PLANS.find(p => p.code === featureInfo.availableFrom);
  }, []);
  
  // Get next upgrade plan
  const getNextUpgradePlan = useCallback((): PlanInfo | undefined => {
    const currentIndex = PLANS.findIndex(p => p.code === currentPlan);
    if (currentIndex === -1 || currentIndex >= PLANS.length - 1) return undefined;
    return PLANS[currentIndex + 1];
  }, [currentPlan]);
  
  // Open upgrade modal for a specific feature
  const openUpgradeModal = useCallback((feature: FeatureKey) => {
    const minimumPlan = getMinimumPlanForFeature(feature);
    setUpgradeModalFeature(feature);
    setUpgradeModalPlan(minimumPlan || null);
    setShowUpgradeModal(true);
  }, [getMinimumPlanForFeature]);
  
  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeModalFeature(null);
    setUpgradeModalPlan(null);
  }, []);
  
  // Check feature and show modal if locked
  // Returns true if feature is available, false if locked (and shows modal)
  const checkFeatureAndShowModal = useCallback((feature: FeatureKey): boolean => {
    if (hasFeature(feature)) {
      return true;
    }
    openUpgradeModal(feature);
    return false;
  }, [hasFeature, openUpgradeModal]);
  
  return {
    currentPlan,
    planInfo,
    isLoading,
    hasFeature,
    isFeatureLocked,
    getFeatureInfo,
    getLockedFeatures,
    getAvailableFeatures,
    getMinimumPlanForFeature,
    getNextUpgradePlan,
    showUpgradeModal,
    upgradeModalFeature,
    upgradeModalPlan,
    openUpgradeModal,
    closeUpgradeModal,
    checkFeatureAndShowModal,
  };
}

export { FEATURES, PLANS, PLAN_HIERARCHY };
export type { FeatureInfo, PlanInfo };
