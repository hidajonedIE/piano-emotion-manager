/**
 * Hook para gestionar la licencia del usuario
 * 
 * Proporciona acceso a la licencia activa del usuario,
 * configuración de módulos y estado de la suscripción.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export interface ModuleConfig {
  suppliersEnabled: boolean;
  inventoryEnabled: boolean;
  invoicingEnabled: boolean;
  advancedInvoicingEnabled: boolean;
  accountingEnabled: boolean;
  teamEnabled: boolean;
  crmEnabled: boolean;
  reportsEnabled: boolean;
  shopEnabled: boolean;
  showPrices: boolean;
  allowDirectOrders: boolean;
  showStock: boolean;
  stockAlertsEnabled: boolean;
}

export interface License {
  id: number;
  code: string;
  licenseType: 'trial' | 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'available' | 'active' | 'expired' | 'revoked' | 'suspended';
  distributorId?: number;
  distributorName?: string;
  moduleConfig: ModuleConfig;
  maxUsers: number;
  maxClients?: number;
  maxPianos?: number;
  validFrom: Date;
  validUntil?: Date;
  activatedAt?: Date;
}

export interface Distributor {
  id: number;
  name: string;
  logoUrl?: string;
  hasWooCommerce: boolean;
}

// Configuración por defecto para usuarios sin licencia
const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  suppliersEnabled: true,
  inventoryEnabled: true,
  invoicingEnabled: false,
  advancedInvoicingEnabled: false,
  accountingEnabled: false,
  teamEnabled: false,
  crmEnabled: false,
  reportsEnabled: false,
  shopEnabled: true, // La tienda siempre disponible (lead magnet)
  showPrices: true,
  allowDirectOrders: true,
  showStock: true,
  stockAlertsEnabled: true,
};

export function useLicense() {
  const queryClient = useQueryClient();
  
  // Obtener licencia del usuario
  const { data: license, isLoading, error, refetch } = trpc.license.getMyLicense.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  // Mutación para activar licencia
  const activateMutation = trpc.license.activate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license', 'getMyLicense'] });
    },
  });

  // Determinar la configuración de módulos efectiva
  const moduleConfig: ModuleConfig = license?.moduleConfig || DEFAULT_MODULE_CONFIG;

  // Verificar si tiene licencia activa
  const hasActiveLicense = license?.status === 'active';

  // Verificar si la licencia está próxima a expirar (7 días)
  const isExpiringSoon = license?.validUntil 
    ? new Date(license.validUntil).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  // Días restantes de licencia
  const daysRemaining = license?.validUntil
    ? Math.max(0, Math.ceil((new Date(license.validUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  // Verificar acceso a un módulo específico
  const hasModuleAccess = (module: keyof ModuleConfig): boolean => {
    return moduleConfig[module] === true;
  };

  // Verificar si puede añadir más clientes
  const canAddClients = (currentCount: number): boolean => {
    if (!license?.maxClients) return true;
    return currentCount < license.maxClients;
  };

  // Verificar si puede añadir más pianos
  const canAddPianos = (currentCount: number): boolean => {
    if (!license?.maxPianos) return true;
    return currentCount < license.maxPianos;
  };

  // Obtener el nombre del plan
  const planName = license?.licenseType 
    ? {
        trial: 'Trial',
        free: 'Gratuito',
        starter: 'Starter',
        professional: 'Professional',
        enterprise: 'Enterprise',
      }[license.licenseType]
    : 'Sin licencia';

  // Verificar si es un plan de pago
  const isPaidPlan = license?.licenseType && ['starter', 'professional', 'enterprise'].includes(license.licenseType);

  return {
    // Estado
    license,
    isLoading,
    error,
    
    // Configuración
    moduleConfig,
    hasActiveLicense,
    isExpiringSoon,
    daysRemaining,
    planName,
    isPaidPlan,
    
    // Distribuidor
    distributorId: license?.distributorId,
    distributorName: license?.distributorName,
    hasDistributor: !!license?.distributorId,
    
    // Límites
    maxClients: license?.maxClients,
    maxPianos: license?.maxPianos,
    maxUsers: license?.maxUsers || 1,
    
    // Funciones de verificación
    hasModuleAccess,
    canAddClients,
    canAddPianos,
    
    // Acciones
    activateLicense: activateMutation.mutate,
    isActivating: activateMutation.isPending,
    activationError: activateMutation.error,
    refetch,
  };
}

/**
 * Hook para verificar acceso a un módulo específico
 * Útil para componentes que solo necesitan verificar un módulo
 */
export function useModuleAccess(module: keyof ModuleConfig): boolean {
  const { moduleConfig } = useLicense();
  return moduleConfig[module] === true;
}

/**
 * Hook para obtener información del distribuidor
 */
export function useDistributor() {
  const { license, hasDistributor, distributorId, distributorName } = useLicense();
  
  return {
    hasDistributor,
    distributorId,
    distributorName,
    // Si tiene distribuidor con WooCommerce, usar su tienda
    // Si no, usar la tienda de Piano Emotion
    shopUrl: hasDistributor ? `/shop/distributor/${distributorId}` : '/shop',
  };
}

export default useLicense;
