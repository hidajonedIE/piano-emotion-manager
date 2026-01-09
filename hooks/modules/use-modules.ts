/**
 * Hooks de Módulos y Suscripciones
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { trpc } from '@/utils/trpc';

// Hook personalizado que funciona en ambas plataformas
function useClerkUser() {
  if (Platform.OS === 'web') {
    try {
      const { useUser } = require('@clerk/clerk-react');
      return useUser();
    } catch (e) {
      console.error('[useClerkUser] Error loading useUser from @clerk/clerk-react:', e);
      return { user: null, isLoaded: false };
    }
  } else {
    try {
      const { useUser } = require('@clerk/clerk-expo');
      return useUser();
    } catch (e) {
      console.error('[useClerkUser] Error loading useUser from @clerk/clerk-expo:', e);
      return { user: null, isLoaded: false };
    }
  }
}

// ============================================================================
// Types
// ============================================================================

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface ModuleInfo {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: 'core' | 'free' | 'professional' | 'premium' | 'addon';
  isEnabled: boolean;
  isAvailable: boolean;
  requiresUpgrade: boolean;
  includedInCurrentPlan: boolean;
}

// ============================================================================
// useModuleAccess Hook
// ============================================================================

export function useModuleAccess() {
  const { data: modules, isLoading } = trpc.modules.getModulesWithStatus.useQuery();

  const hasModuleAccess = useCallback(
    (moduleCode: string): boolean => {
      if (!modules) return false;
      const module = modules.find((m) => m.code === moduleCode);
      return module?.isAvailable && module?.isEnabled;
    },
    [modules]
  );

  const isPremiumModule = useCallback(
    (moduleCode: string): boolean => {
      if (!modules) return false;
      const module = modules.find((m) => m.code === moduleCode);
      return module?.type === 'premium' || module?.type === 'addon';
    },
    [modules]
  );

  const requiresUpgrade = useCallback(
    (moduleCode: string): boolean => {
      if (!modules) return false;
      const module = modules.find((m) => m.code === moduleCode);
      return module?.requiresUpgrade ?? false;
    },
    [modules]
  );

  return {
    modules: modules || [],
    isLoading,
    hasModuleAccess,
    isPremiumModule,
    requiresUpgrade,
  };
}

// ============================================================================
// useModules Hook
// ============================================================================

export function useModules() {
  const { data: modules, isLoading, refetch } = trpc.modules.getModulesWithStatus.useQuery();

  const toggleModule = trpc.modules.toggleModule.useMutation({
    onSuccess: () => refetch(),
  });

  const coreModules = useMemo(
    () => modules?.filter((m) => m.type === 'core') || [],
    [modules]
  );

  const freeModules = useMemo(
    () => modules?.filter((m) => m.type === 'free') || [],
    [modules]
  );

  const professionalModules = useMemo(
    () => modules?.filter((m) => m.type === 'professional') || [],
    [modules]
  );

  const premiumModules = useMemo(
    () => modules?.filter((m) => m.type === 'premium') || [],
    [modules]
  );

  const addonModules = useMemo(
    () => modules?.filter((m) => m.type === 'addon') || [],
    [modules]
  );

  const enabledModules = useMemo(
    () => modules?.filter((m) => m.isEnabled) || [],
    [modules]
  );

  return {
    modules: modules || [],
    coreModules,
    freeModules,
    professionalModules,
    premiumModules,
    addonModules,
    enabledModules,
    isLoading,
    refetch,
    toggleModule: (moduleCode: string, enabled: boolean) =>
      toggleModule.mutateAsync({ moduleCode, enabled }),
    isToggling: toggleModule.isPending,
  };
}

// ============================================================================
// useSubscription Hook
// ============================================================================

export function useSubscription() {
  const { user: clerkUser } = useClerkUser();
  const { data: subscription, isLoading: subscriptionLoading } = trpc.modules.getCurrentSubscription.useQuery();
  const { data: planFromServer, isLoading: planLoading } = trpc.modules.getCurrentPlan.useQuery(
    clerkUser?.id ? { userId: clerkUser.id } : undefined,
    { enabled: !!clerkUser?.id }
  );
  const { data: plans, isLoading: plansLoading } = trpc.modules.getAvailablePlans.useQuery();
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = trpc.modules.getResourceUsage.useQuery();

  const changePlan = trpc.modules.changePlan.useMutation();

  // Usar el plan real del servidor
  console.log('[useSubscription] planFromServer:', planFromServer);
  
  const plan = useMemo(() => {
    const rawPlan = (planFromServer?.plan || 'free').toLowerCase();
    if (rawPlan.includes('premium')) return 'premium';
    if (rawPlan.includes('pro') || rawPlan.includes('starter')) return 'pro';
    return 'free';
  }, [planFromServer]);

  console.log('[useSubscription] final plan:', plan);

  const isLoading = subscriptionLoading || planLoading || plansLoading || usageLoading;

  const currentPlanInfo = useMemo(
    () => plans?.find((p) => p.code === plan),
    [plans, plan]
  );

  const canUpgrade = useMemo(() => {
    const planOrder: SubscriptionPlan[] = ['free', 'professional', 'premium'];
    const currentIndex = planOrder.indexOf(plan || 'free');
    return currentIndex < planOrder.length - 1;
  }, [plan]);

  const canDowngrade = useMemo(() => {
    const planOrder: SubscriptionPlan[] = ['free', 'professional', 'premium'];
    const currentIndex = planOrder.indexOf(plan || 'free');
    return currentIndex > 0;
  }, [plan]);

  return {
    subscription,
    currentPlan: plan || 'free',
    currentPlanInfo,
    plans: plans || [],
    usage,
    isLoading,
    refetchUsage,
    changePlan: (newPlan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly') =>
      changePlan.mutateAsync({ planCode: newPlan, billingCycle }),
    isChangingPlan: changePlan.isPending,
    canUpgrade,
    canDowngrade,
  };
}

// ============================================================================
// useResourceLimits Hook
// ============================================================================

export function useResourceLimits() {
  const { data: usage, isLoading, refetch } = trpc.modules.getResourceUsage.useQuery();

  const checkLimit = trpc.modules.canPerformAction.useMutation();

  const isNearLimit = useCallback(
    (resource: 'users' | 'clients' | 'pianos' | 'invoices' | 'storage'): boolean => {
      if (!usage) return false;
      return usage[resource].percentage >= 80;
    },
    [usage]
  );

  const isAtLimit = useCallback(
    (resource: 'users' | 'clients' | 'pianos' | 'invoices' | 'storage'): boolean => {
      if (!usage) return false;
      return usage[resource].percentage >= 100;
    },
    [usage]
  );

  return {
    usage,
    isLoading,
    refetch,
    isNearLimit,
    isAtLimit,
    checkLimit: (resource: 'users' | 'clients' | 'pianos' | 'invoices' | 'storage') =>
      checkLimit.mutateAsync({ resource }),
  };
}
