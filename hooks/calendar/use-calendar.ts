/**
 * Hooks de Calendario
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export type EventType = 'service' | 'appointment' | 'reminder' | 'block' | 'personal' | 'meeting';
export type EventStatus = 'tentative' | 'confirmed' | 'cancelled' | 'completed';
export type ReminderType = 'email' | 'sms' | 'push' | 'whatsapp';

export interface EventInput {
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay?: boolean;
  clientId?: number;
  pianoId?: number;
  serviceId?: number;
  assignedTo?: number;
  color?: string;
  reminders?: Array<{
    type: ReminderType;
    minutesBefore: number;
  }>;
}

export interface CalendarView {
  type: 'day' | 'week' | 'month';
  date: Date;
}

// ============================================================================
// useCalendar Hook
// ============================================================================

export function useCalendar(initialView: CalendarView = { type: 'week', date: new Date() }) {
  const [view, setView] = useState<CalendarView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calcular rango de fechas según la vista
  const dateRange = useMemo(() => {
    const start = new Date(view.date);
    const end = new Date(view.date);

    switch (view.type) {
      case 'day':
        // Un solo día
        break;
      case 'week':
        // Inicio de semana (lunes)
        const dayOfWeek = start.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start.setDate(start.getDate() + diff);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        // Inicio del mes
        start.setDate(1);
        // Fin del mes
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [view]);

  const { data: events, isLoading, refetch } = trpc.calendar.getEvents.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => refetch(),
  });

  const updateEvent = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => refetch(),
  });

  const cancelEvent = trpc.calendar.cancelEvent.useMutation({
    onSuccess: () => refetch(),
  });

  const completeEvent = trpc.calendar.completeEvent.useMutation({
    onSuccess: () => refetch(),
  });

  // Navegación
  const goToToday = useCallback(() => {
    setView((prev) => ({ ...prev, date: new Date() }));
  }, []);

  const goToPrevious = useCallback(() => {
    setView((prev) => {
      const newDate = new Date(prev.date);
      switch (prev.type) {
        case 'day':
          newDate.setDate(newDate.getDate() - 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() - 7);
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() - 1);
          break;
      }
      return { ...prev, date: newDate };
    });
  }, []);

  const goToNext = useCallback(() => {
    setView((prev) => {
      const newDate = new Date(prev.date);
      switch (prev.type) {
        case 'day':
          newDate.setDate(newDate.getDate() + 1);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
      }
      return { ...prev, date: newDate };
    });
  }, []);

  const changeView = useCallback((type: CalendarView['type']) => {
    setView((prev) => ({ ...prev, type }));
  }, []);

  return {
    events: events || [],
    isLoading,
    refetch,
    view,
    dateRange,
    selectedDate,
    setSelectedDate,
    goToToday,
    goToPrevious,
    goToNext,
    changeView,
    createEvent: createEvent.mutateAsync,
    updateEvent: (eventId: number, data: Partial<EventInput>) =>
      updateEvent.mutateAsync({ eventId, data }),
    cancelEvent: (eventId: number) => cancelEvent.mutateAsync({ eventId }),
    completeEvent: (eventId: number) => completeEvent.mutateAsync({ eventId }),
    isCreating: createEvent.isPending,
    isUpdating: updateEvent.isPending,
  };
}

// ============================================================================
// useTodayEvents Hook
// ============================================================================

export function useTodayEvents(userId?: number) {
  const { data, isLoading, refetch } = trpc.calendar.getTodayEvents.useQuery({ userId });

  return {
    events: data || [],
    isLoading,
    refetch,
    count: data?.length || 0,
  };
}

// ============================================================================
// useUpcomingEvents Hook
// ============================================================================

export function useUpcomingEvents(limit: number = 10, userId?: number) {
  const { data, isLoading, refetch } = trpc.calendar.getUpcomingEvents.useQuery({ limit, userId });

  return {
    events: data || [],
    isLoading,
    refetch,
  };
}

// ============================================================================
// useAvailability Hook
// ============================================================================

export function useAvailability(userId?: number) {
  const { data, isLoading, refetch } = trpc.calendar.getAvailability.useQuery({ userId });

  const setAvailability = trpc.calendar.setAvailability.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    availability: data || [],
    isLoading,
    refetch,
    setAvailability: setAvailability.mutateAsync,
    isSaving: setAvailability.isPending,
  };
}

// ============================================================================
// useAvailableSlots Hook
// ============================================================================

export function useAvailableSlots(date: string | null, userId?: number, slotDuration: number = 60) {
  const { data, isLoading, refetch } = trpc.calendar.getAvailableSlots.useQuery(
    { date: date!, userId, slotDuration },
    { enabled: date !== null }
  );

  return {
    slots: data || [],
    isLoading,
    refetch,
    availableCount: data?.filter((s) => s.available).length || 0,
  };
}

// ============================================================================
// useTimeBlocks Hook
// ============================================================================

export function useTimeBlocks(startDate: string, endDate: string, userId?: number) {
  const { data, isLoading, refetch } = trpc.calendar.getTimeBlocks.useQuery({
    startDate,
    endDate,
    userId,
  });

  const createTimeBlock = trpc.calendar.createTimeBlock.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteTimeBlock = trpc.calendar.deleteTimeBlock.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    blocks: data || [],
    isLoading,
    refetch,
    createTimeBlock: createTimeBlock.mutateAsync,
    deleteTimeBlock: (blockId: number) => deleteTimeBlock.mutateAsync({ blockId }),
    isCreating: createTimeBlock.isPending,
  };
}

// ============================================================================
// useReminderSettings Hook
// ============================================================================

export function useReminderSettings() {
  const { data, isLoading, refetch } = trpc.calendar.getReminderSettings.useQuery();

  const updateSettings = trpc.calendar.updateReminderSettings.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    settings: data,
    isLoading,
    refetch,
    updateSettings: updateSettings.mutateAsync,
    isSaving: updateSettings.isPending,
  };
}

// ============================================================================
// useCalendarSync Hook
// ============================================================================

export function useCalendarSync() {
  const { data: connections, isLoading, refetch } = trpc.calendar.getConnections.useQuery();

  const initiateConnection = trpc.calendar.initiateOAuthConnection.useMutation();
  const disconnectCalendar = trpc.calendar.disconnectCalendar.useMutation({
    onSuccess: () => refetch(),
  });
  const syncCalendars = trpc.calendar.syncCalendars.useMutation({
    onSuccess: () => refetch(),
  });

  return {
    connections: connections || [],
    isLoading,
    refetch,
    initiateConnection: initiateConnection.mutateAsync,
    disconnectCalendar: (connectionId: number) => disconnectCalendar.mutateAsync({ connectionId }),
    syncCalendars: syncCalendars.mutateAsync,
    isSyncing: syncCalendars.isPending,
  };
}
