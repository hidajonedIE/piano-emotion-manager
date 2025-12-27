/**
 * Hooks de Módulos y Suscripciones
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionPlan = 'free' | 'professional' | 'premium';

export interface ModuleInfo {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: 'core' | 'free' | 'premium' | 'addon';
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
  const { data: subscription, isLoading: subscriptionLoading } = trpc.modules.getCurrentSubscription.useQuery();
  const { data: planFromServer, isLoading: planLoading } = trpc.modules.getCurrentPlan.useQuery();
  const { data: plans, isLoading: plansLoading } = trpc.modules.getAvailablePlans.useQuery();
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = trpc.modules.getResourceUsage.useQuery();

  const changePlan = trpc.modules.changePlan.useMutation();

  // TEMPORARY: Forzar plan professional durante desarrollo
  const plan = 'professional';

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
