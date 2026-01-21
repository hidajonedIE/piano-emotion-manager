/**
 * Hooks del Panel del Distribuidor
 * Piano Emotion Manager
 */

import { trpc } from '@/utils/trpc';

// ============================================================================
// useDistributorPanel Hook
// ============================================================================

export function useDistributorPanel() {
  // Queries
  const { data: wooConfig, isLoading: wooLoading, refetch: refetchWoo } = trpc.distributor.getWooCommerceConfig.useQuery();
  const { data: premiumConfig, isLoading: premiumLoading, refetch: refetchPremium } = trpc.distributor.getPremiumConfig.useQuery();
  const { data: moduleConfig, isLoading: moduleLoading, refetch: refetchModules } = trpc.distributor.getModuleConfig.useQuery();
  const { data: technicians, isLoading: techniciansLoading, refetch: refetchTechnicians } = trpc.distributor.listTechnicians.useQuery();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.distributor.getStats.useQuery();

  // Mutations
  const saveWooConfig = trpc.distributor.saveWooCommerceConfig.useMutation({
    onSuccess: () => refetchWoo(),
  });

  const testWooConnection = trpc.distributor.testWooCommerceConnection.useMutation();

  const savePremiumConfig = trpc.distributor.savePremiumConfig.useMutation({
    onSuccess: () => refetchPremium(),
  });

  const saveModuleConfig = trpc.distributor.saveModuleConfig.useMutation({
    onSuccess: () => refetchModules(),
  });

  const updateTechnicianTier = trpc.distributor.updateTechnicianTier.useMutation({
    onSuccess: () => {
      refetchTechnicians();
      refetchStats();
    },
  });

  const syncWithWooCommerce = trpc.distributor.syncWithWooCommerce.useMutation({
    onSuccess: () => {
      refetchTechnicians();
      refetchStats();
    },
  });

  const isLoading = wooLoading || premiumLoading || moduleLoading || techniciansLoading || statsLoading;

  return {
    // Data
    wooConfig: wooConfig || {
      url: '',
      consumerKey: '',
      consumerSecret: '',
      enabled: false,
      connectionStatus: 'disconnected' as const,
    },
    premiumConfig: premiumConfig || {
      minimumPurchaseAmount: 100,
      trialPeriodDays: 30,
      gracePeriodDays: 7,
      whatsappEnabled: true,
      portalEnabled: true,
      autoRemindersEnabled: true,
    },
    moduleConfig: moduleConfig || {
      suppliersEnabled: true,
      inventoryEnabled: true,
      invoicingEnabled: true,
      advancedInvoicingEnabled: false,
      accountingEnabled: false,
      teamEnabled: false,
      crmEnabled: false,
      reportsEnabled: false,
      shopEnabled: true,
      showPrices: true,
      allowDirectOrders: true,
      showStock: true,
      stockAlertsEnabled: true,
      customBranding: false,
      hideCompetitorLinks: false,
    },
    technicians: technicians || [],
    stats: stats || {
      totalTechnicians: 0,
      premiumTechnicians: 0,
      basicTechnicians: 0,
      trialTechnicians: 0,
      totalPurchasesLast30Days: 0,
      averagePurchasePerTechnician: 0,
    },

    // Loading states
    isLoading,
    isSavingWoo: saveWooConfig.isPending,
    isTestingWoo: testWooConnection.isPending,
    isSavingPremium: savePremiumConfig.isPending,
    isSavingModules: saveModuleConfig.isPending,
    isUpdatingTier: updateTechnicianTier.isPending,
    isSyncing: syncWithWooCommerce.isPending,

    // Actions
    saveWooCommerceConfig: saveWooConfig.mutateAsync,
    testWooCommerceConnection: testWooConnection.mutateAsync,
    savePremiumConfig: savePremiumConfig.mutateAsync,
    saveModuleConfig: saveModuleConfig.mutateAsync,
    updateTechnicianTier: updateTechnicianTier.mutateAsync,
    syncWithWooCommerce: syncWithWooCommerce.mutateAsync,

    // Refetch
    refetch: () => {
      refetchWoo();
      refetchPremium();
      refetchModules();
      refetchTechnicians();
      refetchStats();
    },
  };
}

// ============================================================================
// useTechnicianPurchases Hook
// ============================================================================

export function useTechnicianPurchases(technicianEmail: string | null, startDate?: string, endDate?: string) {
  const { data, isLoading } = trpc.distributor.getTechnicianPurchases.useQuery(
    {
      technicianEmail: technicianEmail!,
      startDate,
      endDate,
    },
    {
      enabled: technicianEmail !== null,
    }
  );

  return {
    purchases: data || [],
    isLoading,
  };
}

// ============================================================================
// useMyDistributorConfig Hook (for technicians/clients)
// ============================================================================

export function useMyDistributorConfig() {
  const { data, isLoading, refetch } = trpc.distributor.getMyDistributorConfig.useQuery();

  return {
    config: data,
    isLoading,
    refetch,
  };
}
