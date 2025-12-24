/**
 * Hook de Asignaciones de Trabajo
 * Piano Emotion Manager
 * 
 * Proporciona acceso a las operaciones de asignaciones desde componentes React.
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '../utils/trpc';

// ==========================================
// TIPOS
// ==========================================

export interface WorkAssignment {
  id: number;
  organizationId: number;
  appointmentId?: number;
  serviceId?: number;
  technicianId: number;
  assignedBy?: number;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  scheduledDate: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  assignmentNotes?: string;
  technicianNotes?: string;
  completionNotes?: string;
  latitude?: number;
  longitude?: number;
  clientName?: string;
  clientAddress?: string;
  serviceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentStatus = 
  | 'unassigned'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'reassigned';

export type AssignmentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TechnicianAvailability {
  memberId: number;
  userId: number;
  displayName: string;
  color: string;
  isAvailable: boolean;
  currentLoad: number;
  maxLoad: number;
  nextAvailableSlot?: string;
  absenceReason?: string;
}

export interface DailySchedule {
  date: Date;
  technicians: {
    id: number;
    userId: number;
    displayName: string;
    color: string;
    assignments: WorkAssignment[];
  }[];
}

export interface CreateAssignmentInput {
  organizationId: number;
  appointmentId?: number;
  serviceId?: number;
  technicianId: number;
  scheduledDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  priority?: AssignmentPriority;
  assignmentNotes?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReassignInput {
  assignmentId: number;
  newTechnicianId: number;
  reason: string;
}

// ==========================================
// HOOK: useWorkAssignments
// ==========================================

export function useWorkAssignments(organizationId: number) {
  const utils = trpc.useUtils();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Queries
  const dailyScheduleQuery = trpc.team.assignments.dailySchedule.useQuery(
    { 
      organizationId, 
      date: selectedDate.toISOString().split('T')[0] 
    },
    { enabled: !!organizationId }
  );
  
  const availabilityQuery = trpc.team.assignments.availability.useQuery(
    { 
      organizationId, 
      date: selectedDate.toISOString().split('T')[0] 
    },
    { enabled: !!organizationId }
  );
  
  // Mutations
  const createMutation = trpc.team.assignments.create.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
      utils.team.assignments.availability.invalidate();
    },
  });
  
  const reassignMutation = trpc.team.assignments.reassign.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
      utils.team.assignments.availability.invalidate();
    },
  });
  
  const acceptMutation = trpc.team.assignments.accept.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
    },
  });
  
  const rejectMutation = trpc.team.assignments.reject.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
      utils.team.assignments.availability.invalidate();
    },
  });
  
  const startMutation = trpc.team.assignments.start.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
    },
  });
  
  const completeMutation = trpc.team.assignments.complete.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
      utils.team.assignments.availability.invalidate();
    },
  });
  
  const cancelMutation = trpc.team.assignments.cancel.useMutation({
    onSuccess: () => {
      utils.team.assignments.dailySchedule.invalidate();
      utils.team.assignments.availability.invalidate();
    },
  });
  
  // Actions
  const createAssignment = useCallback(async (input: Omit<CreateAssignmentInput, 'organizationId'>) => {
    return createMutation.mutateAsync({ ...input, organizationId });
  }, [createMutation, organizationId]);
  
  const reassignWork = useCallback(async (input: ReassignInput) => {
    return reassignMutation.mutateAsync(input);
  }, [reassignMutation]);
  
  const acceptAssignment = useCallback(async (assignmentId: number) => {
    return acceptMutation.mutateAsync({ assignmentId });
  }, [acceptMutation]);
  
  const rejectAssignment = useCallback(async (assignmentId: number, reason: string) => {
    return rejectMutation.mutateAsync({ assignmentId, reason });
  }, [rejectMutation]);
  
  const startWork = useCallback(async (assignmentId: number) => {
    return startMutation.mutateAsync({ assignmentId });
  }, [startMutation]);
  
  const completeWork = useCallback(async (assignmentId: number, notes?: string) => {
    return completeMutation.mutateAsync({ assignmentId, notes });
  }, [completeMutation]);
  
  const cancelAssignment = useCallback(async (assignmentId: number) => {
    return cancelMutation.mutateAsync({ assignmentId });
  }, [cancelMutation]);
  
  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);
  
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);
  
  const goToPreviousDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);
  
  const goToNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);
  
  const refetch = useCallback(() => {
    dailyScheduleQuery.refetch();
    availabilityQuery.refetch();
  }, [dailyScheduleQuery, availabilityQuery]);
  
  return {
    // Data
    dailySchedule: dailyScheduleQuery.data,
    availability: availabilityQuery.data ?? [],
    selectedDate,
    
    // Loading states
    isLoading: dailyScheduleQuery.isLoading,
    isLoadingAvailability: availabilityQuery.isLoading,
    isCreating: createMutation.isPending,
    isReassigning: reassignMutation.isPending,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isStarting: startMutation.isPending,
    isCompleting: completeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    
    // Errors
    error: dailyScheduleQuery.error,
    createError: createMutation.error,
    reassignError: reassignMutation.error,
    
    // Actions
    createAssignment,
    reassignWork,
    acceptAssignment,
    rejectAssignment,
    startWork,
    completeWork,
    cancelAssignment,
    goToDate,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    refetch,
  };
}

// ==========================================
// HOOK: useMyAssignments
// ==========================================

/**
 * Hook para obtener las asignaciones del técnico actual.
 */
export function useMyAssignments(organizationId: number, userId: number) {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });
  
  const assignmentsQuery = trpc.team.assignments.byTechnician.useQuery(
    {
      organizationId,
      technicianId: userId,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
    { enabled: !!organizationId && !!userId }
  );
  
  // Computed values
  const assignments = assignmentsQuery.data ?? [];
  
  const todayAssignments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return assignments.filter(a => {
      const date = new Date(a.scheduledDate);
      return date >= today && date < tomorrow;
    });
  }, [assignments]);
  
  const pendingAssignments = useMemo(() => {
    return assignments.filter(a => 
      ['assigned', 'accepted'].includes(a.status)
    );
  }, [assignments]);
  
  const inProgressAssignments = useMemo(() => {
    return assignments.filter(a => a.status === 'in_progress');
  }, [assignments]);
  
  const completedAssignments = useMemo(() => {
    return assignments.filter(a => a.status === 'completed');
  }, [assignments]);
  
  const setRange = useCallback((start: Date, end: Date) => {
    setDateRange({ start, end });
  }, []);
  
  return {
    assignments,
    todayAssignments,
    pendingAssignments,
    inProgressAssignments,
    completedAssignments,
    dateRange,
    setRange,
    isLoading: assignmentsQuery.isLoading,
    error: assignmentsQuery.error,
    refetch: assignmentsQuery.refetch,
  };
}

// ==========================================
// HOOK: useTechnicianSuggestion
// ==========================================

/**
 * Hook para obtener sugerencias de técnicos para una asignación.
 */
export function useTechnicianSuggestion(
  organizationId: number,
  date: Date,
  postalCode?: string,
  serviceType?: string
) {
  const suggestionQuery = trpc.team.assignments.suggestTechnician.useQuery(
    {
      organizationId,
      date: date.toISOString().split('T')[0],
      postalCode,
      serviceType,
    },
    { enabled: !!organizationId && !!date }
  );
  
  return {
    suggestion: suggestionQuery.data,
    isLoading: suggestionQuery.isLoading,
    error: suggestionQuery.error,
    refetch: suggestionQuery.refetch,
  };
}

// ==========================================
// HOOK: useAssignmentStats
// ==========================================

/**
 * Hook para obtener estadísticas de asignaciones.
 */
export function useAssignmentStats(
  organizationId: number,
  startDate: Date,
  endDate: Date
) {
  const statsQuery = trpc.team.assignments.stats.useQuery(
    {
      organizationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    { enabled: !!organizationId }
  );
  
  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
}

export default useWorkAssignments;
