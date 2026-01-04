/**
 * Router de Calendario
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { createCalendarService, createCalendarSyncService } from '../../services/calendar/index';

// ============================================================================
// Input Schemas
// ============================================================================

const eventInputSchema = z.object({
  type: z.enum(['service', 'appointment', 'reminder', 'block', 'personal', 'meeting']),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  startTime: z.string().optional(),
  endDate: z.string(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().optional(),
  clientId: z.number().optional(),
  pianoId: z.number().optional(),
  serviceId: z.number().optional(),
  assignedTo: z.number().optional(),
  color: z.string().optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'sms', 'push', 'whatsapp']),
    minutesBefore: z.number(),
  })).optional(),
  recurrence: z.object({
    frequency: z.string(),
    interval: z.number(),
    endDate: z.string().optional(),
    count: z.number().optional(),
    daysOfWeek: z.array(z.number()).optional(),
  }).optional(),
});

const eventFiltersSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  types: z.array(z.enum(['service', 'appointment', 'reminder', 'block', 'personal', 'meeting'])).optional(),
  statuses: z.array(z.enum(['tentative', 'confirmed', 'cancelled', 'completed'])).optional(),
  assignedTo: z.number().optional(),
  clientId: z.number().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const calendarRouter = router({
  // ============================================================================
  // Events
  // ============================================================================

  /**
   * Crea un nuevo evento
   */
  createEvent: protectedProcedure
    .input(eventInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.createEvent(input);
    }),

  /**
   * Actualiza un evento
   */
  updateEvent: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      data: eventInputSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.updateEvent(input.eventId, input.data);
    }),

  /**
   * Cancela un evento
   */
  cancelEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      await service.cancelEvent(input.eventId);
      return { success: true };
    }),

  /**
   * Completa un evento
   */
  completeEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      await service.completeEvent(input.eventId);
      return { success: true };
    }),

  /**
   * Obtiene eventos por filtros
   */
  getEvents: protectedProcedure
    .input(eventFiltersSchema)
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getEvents(input);
    }),

  /**
   * Obtiene un evento por ID
   */
  getEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getEvent(input.eventId);
    }),

  /**
   * Obtiene eventos de hoy
   */
  getTodayEvents: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getTodayEvents(input.userId);
    }),

  /**
   * Obtiene próximos eventos
   */
  getUpcomingEvents: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
      userId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getUpcomingEvents(input.limit, input.userId);
    }),

  // ============================================================================
  // Availability
  // ============================================================================

  /**
   * Configura disponibilidad
   */
  setAvailability: protectedProcedure
    .input(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      await service.setAvailability(
        input.dayOfWeek,
        input.startTime,
        input.endTime,
        input.isAvailable
      );
      return { success: true };
    }),

  /**
   * Obtiene disponibilidad
   */
  getAvailability: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getAvailability(input.userId);
    }),

  /**
   * Obtiene slots disponibles para un día
   */
  getAvailableSlots: protectedProcedure
    .input(z.object({
      date: z.string(),
      userId: z.number().optional(),
      slotDuration: z.number().optional().default(60),
    }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getAvailableSlots(input.date, input.userId, input.slotDuration);
    }),

  // ============================================================================
  // Time Blocks
  // ============================================================================

  /**
   * Crea un bloqueo de tiempo
   */
  createTimeBlock: protectedProcedure
    .input(z.object({
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAllDay: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.createTimeBlock(input.title, input.startDate, input.endDate, {
        reason: input.reason,
        startTime: input.startTime,
        endTime: input.endTime,
        isAllDay: input.isAllDay,
      });
    }),

  /**
   * Obtiene bloqueos de tiempo
   */
  getTimeBlocks: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      userId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.getTimeBlocks(input.startDate, input.endDate, input.userId);
    }),

  /**
   * Elimina un bloqueo de tiempo
   */
  deleteTimeBlock: protectedProcedure
    .input(z.object({ blockId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      await service.deleteTimeBlock(input.blockId);
      return { success: true };
    }),

  // ============================================================================
  // Reminder Settings
  // ============================================================================

  /**
   * Obtiene configuración de recordatorios
   */
  getReminderSettings: protectedProcedure.query(async ({ ctx }) => {
    const service = createCalendarService(ctx.organizationId, ctx.userId);
    return service.getReminderSettings();
  }),

  /**
   * Actualiza configuración de recordatorios
   */
  updateReminderSettings: protectedProcedure
    .input(z.object({
      defaultReminders: z.array(z.object({
        type: z.string(),
        minutesBefore: z.number(),
      })).optional(),
      clientReminderEnabled: z.boolean().optional(),
      clientReminderTypes: z.array(z.string()).optional(),
      clientReminderTiming: z.array(z.number()).optional(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      whatsappNotifications: z.boolean().optional(),
      quietHoursEnabled: z.boolean().optional(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createCalendarService(ctx.organizationId, ctx.userId);
      return service.updateReminderSettings(input as any);
    }),

  // ============================================================================
  // Sync
  // ============================================================================

  /**
   * Obtiene conexiones de calendario
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const syncService = createCalendarSyncService(ctx.userId, ctx.organizationId);
    return syncService.getConnections();
  }),

  /**
   * Inicia conexión OAuth
   */
  initiateOAuthConnection: protectedProcedure
    .input(z.object({
      provider: z.enum(['google', 'outlook', 'apple', 'caldav']),
    }))
    .mutation(async ({ ctx, input }) => {
      const syncService = createCalendarSyncService(ctx.userId, ctx.organizationId);
      const authUrl = await syncService.initiateOAuthConnection(input.provider);
      return { authUrl };
    }),

  /**
   * Desconecta calendario
   */
  disconnectCalendar: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const syncService = createCalendarSyncService(ctx.userId, ctx.organizationId);
      await syncService.disconnectCalendar(input.connectionId);
      return { success: true };
    }),

  /**
   * Sincroniza calendarios
   */
  syncCalendars: protectedProcedure.mutation(async ({ ctx }) => {
    const syncService = createCalendarSyncService(ctx.userId, ctx.organizationId);
    return syncService.syncAll();
  }),
});

export type CalendarRouter = typeof calendarRouter;
