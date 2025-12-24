/**
 * Hook de Gestión de Organizaciones
 * Piano Emotion Manager
 * 
 * Proporciona acceso a las operaciones de organizaciones desde componentes React.
 */

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../utils/trpc';

// ==========================================
// TIPOS
// ==========================================

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  ownerId: number;
  subscriptionPlan: string;
  maxMembers: number;
  taxId?: string;
  legalName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  bankAccount?: string;
  bankName?: string;
  swiftBic?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultTaxRate: number;
  defaultCurrency: string;
  defaultServiceDuration: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: number;
  organizationId: number;
  userId: number;
  role: string;
  status: string;
  displayName: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  color: string;
  canBeAssigned: boolean;
  maxDailyAppointments: number;
  assignedZones?: number[];
  specialties?: string[];
  joinedAt?: Date;
  invitedBy?: number;
}

export interface CreateOrganizationInput {
  name: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

export interface UpdateOrganizationInput {
  id: number;
  name?: string;
  description?: string;
  logo?: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankAccount?: string;
  bankName?: string;
  swiftBic?: string;
  invoicePrefix?: string;
  defaultTaxRate?: number;
  defaultCurrency?: string;
  defaultServiceDuration?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: number[];
  timezone?: string;
}

// ==========================================
// HOOK: useOrganization
// ==========================================

export function useOrganization(organizationId?: number) {
  const utils = trpc.useUtils();
  
  // Queries
  const organizationsQuery = trpc.team.organizations.list.useQuery();
  
  const organizationQuery = trpc.team.organizations.get.useQuery(
    { id: organizationId! },
    { enabled: !!organizationId }
  );
  
  const organizationWithMembersQuery = trpc.team.organizations.getWithMembers.useQuery(
    { id: organizationId! },
    { enabled: !!organizationId }
  );
  
  // Mutations
  const createMutation = trpc.team.organizations.create.useMutation({
    onSuccess: () => {
      utils.team.organizations.list.invalidate();
    },
  });
  
  const updateMutation = trpc.team.organizations.update.useMutation({
    onSuccess: () => {
      if (organizationId) {
        utils.team.organizations.get.invalidate({ id: organizationId });
        utils.team.organizations.getWithMembers.invalidate({ id: organizationId });
      }
      utils.team.organizations.list.invalidate();
    },
  });
  
  // Actions
  const createOrganization = useCallback(async (input: CreateOrganizationInput) => {
    return createMutation.mutateAsync(input);
  }, [createMutation]);
  
  const updateOrganization = useCallback(async (input: UpdateOrganizationInput) => {
    return updateMutation.mutateAsync(input);
  }, [updateMutation]);
  
  const refetch = useCallback(() => {
    organizationsQuery.refetch();
    if (organizationId) {
      organizationQuery.refetch();
      organizationWithMembersQuery.refetch();
    }
  }, [organizationsQuery, organizationQuery, organizationWithMembersQuery, organizationId]);
  
  return {
    // Data
    organizations: organizationsQuery.data ?? [],
    organization: organizationQuery.data,
    organizationWithMembers: organizationWithMembersQuery.data,
    
    // Loading states
    isLoading: organizationsQuery.isLoading || organizationQuery.isLoading,
    isLoadingMembers: organizationWithMembersQuery.isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    
    // Errors
    error: organizationsQuery.error || organizationQuery.error,
    createError: createMutation.error,
    updateError: updateMutation.error,
    
    // Actions
    createOrganization,
    updateOrganization,
    refetch,
  };
}

// ==========================================
// HOOK: useCurrentOrganization
// ==========================================

/**
 * Hook para obtener y gestionar la organización actual del usuario.
 * Almacena la selección en localStorage.
 */
export function useCurrentOrganization() {
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentOrganizationId');
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });
  
  const { organizations, isLoading } = useOrganization();
  const orgHook = useOrganization(currentOrgId ?? undefined);
  
  // Auto-seleccionar primera organización si no hay ninguna seleccionada
  useEffect(() => {
    if (!isLoading && organizations.length > 0 && !currentOrgId) {
      const firstOrg = organizations[0];
      setCurrentOrgId(firstOrg.id);
      localStorage.setItem('currentOrganizationId', firstOrg.id.toString());
    }
  }, [organizations, isLoading, currentOrgId]);
  
  const switchOrganization = useCallback((orgId: number) => {
    setCurrentOrgId(orgId);
    localStorage.setItem('currentOrganizationId', orgId.toString());
  }, []);
  
  const clearOrganization = useCallback(() => {
    setCurrentOrgId(null);
    localStorage.removeItem('currentOrganizationId');
  }, []);
  
  return {
    currentOrganization: orgHook.organization,
    currentOrganizationId: currentOrgId,
    organizations,
    isLoading: isLoading || orgHook.isLoading,
    switchOrganization,
    clearOrganization,
    ...orgHook,
  };
}

// ==========================================
// HOOK: useOrganizationSettings
// ==========================================

/**
 * Hook para gestionar la configuración de una organización.
 */
export function useOrganizationSettings(organizationId: number) {
  const { organization, updateOrganization, isUpdating, updateError } = useOrganization(organizationId);
  
  const updateSettings = useCallback(async (settings: Partial<UpdateOrganizationInput>) => {
    return updateOrganization({
      id: organizationId,
      ...settings,
    });
  }, [organizationId, updateOrganization]);
  
  const updateWorkingHours = useCallback(async (start: string, end: string, days: number[]) => {
    return updateSettings({
      workingHoursStart: start,
      workingHoursEnd: end,
      workingDays: days,
    });
  }, [updateSettings]);
  
  const updateInvoiceSettings = useCallback(async (settings: {
    invoicePrefix?: string;
    defaultTaxRate?: number;
    defaultCurrency?: string;
  }) => {
    return updateSettings(settings);
  }, [updateSettings]);
  
  const updateBankInfo = useCallback(async (settings: {
    bankAccount?: string;
    bankName?: string;
    swiftBic?: string;
  }) => {
    return updateSettings(settings);
  }, [updateSettings]);
  
  return {
    settings: organization,
    isUpdating,
    error: updateError,
    updateSettings,
    updateWorkingHours,
    updateInvoiceSettings,
    updateBankInfo,
  };
}

export default useOrganization;
