/**
 * Hook para obtener la configuración del distribuidor
 * Piano Emotion Manager
 * 
 * Detecta si el usuario tiene un distribuidor asociado y obtiene
 * la configuración de módulos que el distribuidor ha definido.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export interface DistributorModuleConfig {
  // Módulos de Negocio
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  
  // Módulos Premium
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  
  // Configuración de Tienda
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
  
  // Configuración de Marca
  customBranding: boolean;
  hideCompetitorLinks: boolean;
}

export interface DistributorInfo {
  id: number;
  name: string;
  logoUrl?: string;
  hasWooCommerce: boolean;
}

export interface DistributorConfigResult {
  hasDistributor: boolean;
  distributor: DistributorInfo | null;
  moduleConfig: DistributorModuleConfig | null;
  accountTier: 'trial' | 'basic' | 'premium' | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// Default Config (Piano Emotion - sin distribuidor)
// ============================================================================

const DEFAULT_MODULE_CONFIG: DistributorModuleConfig = {
  // Módulos de Negocio - todos activos por defecto
  suppliersEnabled: true,
  inventoryEnabled: true,
  invoicingEnabled: true,
  advancedInvoicingEnabled: true,
  accountingEnabled: true,
  
  // Módulos Premium - todos activos por defecto
  teamEnabled: true,
  crmEnabled: true,
  reportsEnabled: true,
  
  // Configuración de Tienda - todos activos por defecto
  shopEnabled: true,
  showPrices: true,
  allowDirectOrders: true,
  showStock: true,
  stockAlertsEnabled: true,
  
  // Configuración de Marca - desactivados por defecto
  customBranding: false,
  hideCompetitorLinks: false,
};

// ============================================================================
// Hook
// ============================================================================

export function useDistributorConfig(): DistributorConfigResult {
  const { data, isLoading, error, refetch } = trpc.distributor.getMyDistributorConfig.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const result = useMemo(() => {
    if (isLoading) {
      return {
        hasDistributor: false,
        distributor: null,
        moduleConfig: null,
        accountTier: null,
        isLoading: true,
        error: null,
        refetch,
      };
    }

    if (error) {
      return {
        hasDistributor: false,
        distributor: null,
        moduleConfig: DEFAULT_MODULE_CONFIG,
        accountTier: null,
        isLoading: false,
        error: error as Error,
        refetch,
      };
    }

    if (!data || !data.hasDistributor) {
      // Usuario sin distribuidor - usa configuración de Piano Emotion
      return {
        hasDistributor: false,
        distributor: null,
        moduleConfig: DEFAULT_MODULE_CONFIG,
        accountTier: null,
        isLoading: false,
        error: null,
        refetch,
      };
    }

    // Usuario con distribuidor - usa configuración del distribuidor
    return {
      hasDistributor: true,
      distributor: data.distributor,
      moduleConfig: data.moduleConfig || DEFAULT_MODULE_CONFIG,
      accountTier: data.accountTier,
      isLoading: false,
      error: null,
      refetch,
    };
  }, [data, isLoading, error, refetch]);

  return result;
}

// ============================================================================
// Helper Hook: Check if module is available
// ============================================================================

export function useIsModuleAvailable(moduleCode: string): boolean {
  const { moduleConfig, isLoading } = useDistributorConfig();
  
  if (isLoading || !moduleConfig) {
    return false;
  }

  const moduleMap: Record<string, keyof DistributorModuleConfig> = {
    'suppliers': 'suppliersEnabled',
    'inventory': 'inventoryEnabled',
    'invoicing': 'invoicingEnabled',
    'basic_invoicing': 'invoicingEnabled',
    'advanced_invoicing': 'advancedInvoicingEnabled',
    'accounting': 'accountingEnabled',
    'team': 'teamEnabled',
    'team_management': 'teamEnabled',
    'crm': 'crmEnabled',
    'reports': 'reportsEnabled',
    'shop': 'shopEnabled',
  };

  const configKey = moduleMap[moduleCode];
  if (!configKey) {
    // Módulos no mapeados están disponibles por defecto
    return true;
  }

  return moduleConfig[configKey];
}

// ============================================================================
// Helper Hook: Get shop configuration
// ============================================================================

export interface ShopConfig {
  enabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
}

export function useShopConfig(): ShopConfig {
  const { moduleConfig, isLoading } = useDistributorConfig();
  
  if (isLoading || !moduleConfig) {
    return {
      enabled: true,
      showPrices: true,
      allowDirectOrders: true,
      showStock: true,
      stockAlertsEnabled: true,
    };
  }

  return {
    enabled: moduleConfig.shopEnabled,
    showPrices: moduleConfig.showPrices,
    allowDirectOrders: moduleConfig.allowDirectOrders,
    showStock: moduleConfig.showStock,
    stockAlertsEnabled: moduleConfig.stockAlertsEnabled,
  };
}

// ============================================================================
// Helper Hook: Check if suppliers module is available
// ============================================================================

export function useSuppliersAvailable(): boolean {
  const { moduleConfig, isLoading } = useDistributorConfig();
  
  if (isLoading || !moduleConfig) {
    return true; // Por defecto disponible
  }

  // Si hideCompetitorLinks está activo, proveedores está desactivado
  if (moduleConfig.hideCompetitorLinks) {
    return false;
  }

  return moduleConfig.suppliersEnabled;
}
