/**
 * Subscription Context
 * Piano Emotion Manager
 * 
 * Global context for subscription state management.
 * Provides subscription info and upgrade modal state across the app.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { UpgradeModal } from '@/components/UpgradeModal';

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

// Plan hierarchy
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  'free': 0,
  'professional_basic': 1,
  'professional_advanced': 2,
  'enterprise_basic': 3,
  'enterprise_advanced': 4,
};

interface SubscriptionContextValue {
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
  
  // Upgrade modal
  openUpgradeModal: (feature: FeatureKey) => void;
  closeUpgradeModal: () => void;
  
  // Check and show modal if locked
  checkFeatureAccess: (feature: FeatureKey) => boolean;
  
  // Refresh subscription
  refreshSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  // State
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalFeature, setModalFeature] = useState<FeatureKey | null>(null);
  
  // Fetch subscription from backend
  // TODO: Replace with actual tRPC query
  useEffect(() => {
    // Simulate loading subscription
    const loadSubscription = async () => {
      try {
        // In production: const result = await trpc.subscription.getCurrent.query();
        // For now, default to free
        setCurrentPlan('free');
      } catch (error) {
        console.error('Failed to load subscription:', error);
        setCurrentPlan('free');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubscription();
  }, []);
  
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
  
  // Open upgrade modal
  const openUpgradeModal = useCallback((feature: FeatureKey) => {
    setModalFeature(feature);
    setShowUpgradeModal(true);
  }, []);
  
  // Close upgrade modal
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setModalFeature(null);
  }, []);
  
  // Check feature access and show modal if locked
  const checkFeatureAccess = useCallback((feature: FeatureKey): boolean => {
    if (hasFeature(feature)) {
      return true;
    }
    openUpgradeModal(feature);
    return false;
  }, [hasFeature, openUpgradeModal]);
  
  // Refresh subscription
  const refreshSubscription = useCallback(() => {
    // TODO: Implement refresh logic
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);
  
  const value: SubscriptionContextValue = {
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
    openUpgradeModal,
    closeUpgradeModal,
    checkFeatureAccess,
    refreshSubscription,
  };
  
  // Get modal data
  const modalFeatureInfo = modalFeature ? getFeatureInfo(modalFeature) : null;
  const modalRequiredPlan = modalFeature ? getMinimumPlanForFeature(modalFeature) : null;
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      
      {/* Global Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        feature={modalFeatureInfo || null}
        requiredPlan={modalRequiredPlan || null}
      />
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

// Re-export types
export type { FeatureInfo, PlanInfo };
export { FEATURES, PLANS, PLAN_HIERARCHY };
