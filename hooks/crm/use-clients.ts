/**
 * Hooks de CRM - Gestión de Clientes
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export type ClientStatus = 'lead' | 'active' | 'inactive' | 'vip' | 'churned';
export type ClientSource = 'referral' | 'website' | 'social_media' | 'advertising' | 'cold_call' | 'event' | 'partner' | 'other';
export type CommunicationType = 'email' | 'phone' | 'sms' | 'whatsapp' | 'in_person' | 'video_call' | 'note';

export interface ClientFilters {
  search?: string;
  status?: ClientStatus[];
  tags?: number[];
  source?: ClientSource[];
  minScore?: number;
  maxScore?: number;
  hasMarketingConsent?: boolean;
}

// ============================================================================
// useClients Hook
// ============================================================================

export function useClients(initialFilters: ClientFilters = {}) {
  const [filters, setFilters] = useState<ClientFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error, refetch } = trpc.crm.getClients.useQuery({
    filters,
    page,
    pageSize,
    sortBy,
    sortOrder,
  });

  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changeSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  return {
    clients: data?.clients || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    filters,
    updateFilters,
    clearFilters,
    page,
    pageSize,
    setPageSize,
    goToPage,
    sortBy,
    sortOrder,
    changeSort,
    totalPages: Math.ceil((data?.total || 0) / pageSize),
  };
}

// ============================================================================
// useClientProfile Hook
// ============================================================================

export function useClientProfile(clientId: number | null) {
  const { data: profile, isLoading, error, refetch } = trpc.crm.getProfile.useQuery(
    { clientId: clientId! },
    { enabled: clientId !== null }
  );

  const { data: tags } = trpc.crm.getClientTags.useQuery(
    { clientId: clientId! },
    { enabled: clientId !== null }
  );

  const { data: communications } = trpc.crm.getCommunicationHistory.useQuery(
    { clientId: clientId!, limit: 20 },
    { enabled: clientId !== null }
  );

  const updateProfile = trpc.crm.updateProfile.useMutation({
    onSuccess: () => refetch(),
  });

  const assignTags = trpc.crm.assignTags.useMutation({
    onSuccess: () => refetch(),
  });

  const calculateScore = trpc.crm.calculateScore.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    profile,
    tags: tags || [],
    communications: communications || [],
    isLoading,
    error,
    refetch,
    updateProfile: updateProfile.mutateAsync,
    assignTags: (tagIds: number[]) => assignTags.mutateAsync({ clientId: clientId!, tagIds }),
    calculateScore: () => calculateScore.mutateAsync({ clientId: clientId! }),
    isUpdating: updateProfile.isPending || assignTags.isPending,
  };
}

// ============================================================================
// useTags Hook
// ============================================================================

export function useTags() {
  const { data: tags, isLoading, refetch } = trpc.crm.getTags.useQuery();

  const createTag = trpc.crm.createTag.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    tags: tags || [],
    isLoading,
    createTag: createTag.mutateAsync,
    isCreating: createTag.isPending,
  };
}

// ============================================================================
// useCommunications Hook
// ============================================================================

export function useCommunications(clientId: number | null) {
  const { data, isLoading, refetch } = trpc.crm.getCommunicationHistory.useQuery(
    { clientId: clientId!, limit: 100 },
    { enabled: clientId !== null }
  );

  const logCommunication = trpc.crm.logCommunication.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    communications: data || [],
    isLoading,
    refetch,
    logCommunication: logCommunication.mutateAsync,
    isLogging: logCommunication.isPending,
  };
}

// ============================================================================
// useCRMTasks Hook
// ============================================================================

export function useCRMTasks(assignedTo?: number) {
  const { data: tasks, isLoading, refetch } = trpc.crm.getPendingTasks.useQuery({ assignedTo });

  const createTask = trpc.crm.createTask.useMutation({
    onSuccess: () => refetch(),
  });

  const completeTask = trpc.crm.completeTask.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    tasks: tasks || [],
    isLoading,
    refetch,
    createTask: createTask.mutateAsync,
    completeTask: (taskId: number) => completeTask.mutateAsync({ taskId }),
    isCreating: createTask.isPending,
  };
}

// ============================================================================
// useFollowUps Hook
// ============================================================================

export function useFollowUps() {
  const { data, isLoading, refetch } = trpc.crm.getPendingFollowUps.useQuery();

  return {
    followUps: data || [],
    isLoading,
    refetch,
    count: data?.length || 0,
  };
}

// ============================================================================
// useCRMStats Hook
// ============================================================================

export function useCRMStats() {
  const { data, isLoading, error } = trpc.crm.getStats.useQuery();

  return {
    stats: data,
    isLoading,
    error,
  };
}

// ============================================================================
// useClientSegments Hook
// ============================================================================

export function useClientSegments() {
  const createSegment = trpc.crm.createSegment.useMutation();

  return {
    createSegment: createSegment.mutateAsync,
    isCreating: createSegment.isPending,
  };
}
