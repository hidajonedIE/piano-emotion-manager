/**
 * Contexto de Estado de Cuenta (Account Tier)
 * 
 * Este contexto provee el estado de la cuenta Premium a toda la aplicación
 * y centraliza la lógica de permisos para funcionalidades Premium.
 */

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================

export type AccountTier = 'trial' | 'basic' | 'premium';

export interface AccountTierData {
  tier: AccountTier;
  trialEndsAt: string | null;
  purchasesLast30Days: number;
  minimumPurchase: number;
  lastVerificationDate: string | null;
  distributor: {
    id: string;
    name: string;
    shopUrl: string;
    logoUrl?: string;
  };
}

export interface AccountTierContextValue extends AccountTierData {
  // Estado derivado
  isPremium: boolean;
  isBasic: boolean;
  isTrial: boolean;
  purchasesNeeded: number;
  progressPercent: number;
  daysLeftInTrial: number | null;
  
  // Funciones de verificación
  canUseFeature: (feature: PremiumFeature) => boolean;
  getFeatureBlockedReason: (feature: PremiumFeature) => string | null;
  
  // Acciones
  refreshAccountStatus: () => Promise<void>;
  openShop: () => void;
}

// Funcionalidades Premium
export type PremiumFeature = 
  | 'whatsapp'
  | 'portal'
  | 'reminders'
  | 'notifications'
  | 'whatsapp:send_message'
  | 'whatsapp:send_reminder'
  | 'portal:enable_access'
  | 'portal:send_invitation'
  | 'reminders:schedule'
  | 'notifications:push';

// ============================================
// CONTEXTO
// ============================================

const AccountTierContext = createContext<AccountTierContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AccountTierProviderProps {
  children: React.ReactNode;
  initialData: AccountTierData;
  onRefresh?: () => Promise<AccountTierData>;
}

export function AccountTierProvider({ 
  children, 
  initialData,
  onRefresh 
}: AccountTierProviderProps) {
  const [data, setData] = useState<AccountTierData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calcular estado derivado
  const derivedState = useMemo(() => {
    const isPremium = data.tier === 'premium';
    const isBasic = data.tier === 'basic';
    const isTrial = data.tier === 'trial';
    
    const purchasesNeeded = Math.max(0, data.minimumPurchase - data.purchasesLast30Days);
    const progressPercent = Math.min(100, (data.purchasesLast30Days / data.minimumPurchase) * 100);
    
    // Calcular días restantes de prueba
    let daysLeftInTrial: number | null = null;
    if (isTrial && data.trialEndsAt) {
      const trialEnd = new Date(data.trialEndsAt);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      daysLeftInTrial = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      isPremium,
      isBasic,
      isTrial,
      purchasesNeeded,
      progressPercent,
      daysLeftInTrial,
    };
  }, [data]);

  // Verificar si puede usar una funcionalidad
  const canUseFeature = useCallback((feature: PremiumFeature): boolean => {
    // Trial y Premium pueden usar todas las funcionalidades
    if (data.tier === 'premium' || data.tier === 'trial') {
      return true;
    }
    
    // Básico no puede usar funcionalidades Premium
    return false;
  }, [data.tier]);

  // Obtener razón de bloqueo
  const getFeatureBlockedReason = useCallback((feature: PremiumFeature): string | null => {
    if (canUseFeature(feature)) {
      return null;
    }

    const featureNames: Record<string, string> = {
      'whatsapp': 'WhatsApp Business',
      'portal': 'Portal del Cliente',
      'reminders': 'Recordatorios Automáticos',
      'notifications': 'Notificaciones Push',
    };

    const featureName = featureNames[feature.split(':')[0]] || feature;
    const purchasesNeeded = derivedState.purchasesNeeded;

    return `${featureName} requiere cuenta Premium. Compra ${purchasesNeeded.toFixed(2)}€ más este mes para desbloquear.`;
  }, [canUseFeature, derivedState.purchasesNeeded]);

  // Refrescar estado de cuenta
  const refreshAccountStatus = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const newData = await onRefresh();
      setData(newData);
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // Abrir tienda del distribuidor
  const openShop = useCallback(() => {
    if (data.distributor.shopUrl) {
      window.open(data.distributor.shopUrl, '_blank');
    }
  }, [data.distributor.shopUrl]);

  // Valor del contexto
  const value: AccountTierContextValue = useMemo(() => ({
    ...data,
    ...derivedState,
    canUseFeature,
    getFeatureBlockedReason,
    refreshAccountStatus,
    openShop,
  }), [data, derivedState, canUseFeature, getFeatureBlockedReason, refreshAccountStatus, openShop]);

  return (
    <AccountTierContext.Provider value={value}>
      {children}
    </AccountTierContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAccountTier(): AccountTierContextValue {
  const context = useContext(AccountTierContext);
  
  if (!context) {
    throw new Error('useAccountTier debe ser usado dentro de un AccountTierProvider');
  }
  
  return context;
}

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook para verificar acceso a una funcionalidad específica
 */
export function usePremiumFeature(feature: PremiumFeature) {
  const { canUseFeature, getFeatureBlockedReason, openShop, purchasesNeeded, progressPercent } = useAccountTier();
  
  const canUse = canUseFeature(feature);
  const blockedReason = getFeatureBlockedReason(feature);
  
  return {
    canUse,
    blockedReason,
    purchasesNeeded,
    progressPercent,
    openShop,
  };
}

/**
 * Hook para mostrar el estado de la cuenta en el dashboard
 */
export function useAccountStatus() {
  const { 
    tier, 
    isPremium, 
    isBasic, 
    isTrial,
    purchasesLast30Days,
    minimumPurchase,
    purchasesNeeded,
    progressPercent,
    daysLeftInTrial,
    distributor,
    refreshAccountStatus,
    openShop,
  } = useAccountTier();

  return {
    tier,
    isPremium,
    isBasic,
    isTrial,
    purchasesLast30Days,
    minimumPurchase,
    purchasesNeeded,
    progressPercent,
    daysLeftInTrial,
    distributorName: distributor.name,
    shopUrl: distributor.shopUrl,
    refresh: refreshAccountStatus,
    openShop,
  };
}
