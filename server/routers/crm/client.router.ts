/**
 * Router de Clientes CRM
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc.js';
import { createClientService } from '../../services/crm/index.js';

// ============================================================================
// Input Schemas
// ============================================================================

const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.enum(['lead', 'active', 'inactive', 'vip', 'churned'])).optional(),
  tags: z.array(z.number()).optional(),
  source: z.array(z.enum(['referral', 'website', 'social_media', 'advertising', 'cold_call', 'event', 'partner', 'other'])).optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
  minLifetimeValue: z.number().optional(),
  maxLifetimeValue: z.number().optional(),
  hasMarketingConsent: z.boolean().optional(),
  lastServiceDaysAgo: z.number().optional(),
});

const profileInputSchema = z.object({
  clientId: z.number(),
  status: z.enum(['lead', 'active', 'inactive', 'vip', 'churned']).optional(),
  source: z.enum(['referral', 'website', 'social_media', 'advertising', 'cold_call', 'event', 'partner', 'other']).optional(),
  sourceDetails: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'sms', 'whatsapp', 'in_person', 'video_call', 'note']).optional(),
  preferredContactTime: z.string().optional(),
  internalNotes: z.string().optional(),
  specialRequirements: z.string().optional(),
  marketingConsent: z.boolean().optional(),
});

const communicationInputSchema = z.object({
  clientId: z.number(),
  type: z.enum(['email', 'phone', 'sms', 'whatsapp', 'in_person', 'video_call', 'note']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  phoneNumber: z.string().optional(),
  callDuration: z.number().optional(),
  requiresFollowUp: z.boolean().optional(),
  followUpDate: z.string().transform((s) => s ? new Date(s) : undefined).optional(),
  followUpNotes: z.string().optional(),
});

const taskInputSchema = z.object({
  clientId: z.number().optional(),
  assignedTo: z.number().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().transform((s) => s ? new Date(s) : undefined).optional(),
  reminderDate: z.string().transform((s) => s ? new Date(s) : undefined).optional(),
  relatedType: z.string().optional(),
  relatedId: z.number().optional(),
});

// ============================================================================
// Router
// ============================================================================

export const clientRouter = router({
  /**
   * Obtiene lista de clientes con filtros
   */
  getClients: protectedProcedure
    .input(z.object({
      filters: clientFiltersSchema.optional(),
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(20),
      sortBy: z.string().optional().default('name'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    }))
    .query(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.getClients(
        input.filters || {},
        input.page,
        input.pageSize,
        input.sortBy,
        input.sortOrder
      );
    }),

  /**
   * Obtiene perfil CRM de un cliente
   */
  getProfile: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.getOrCreateProfile(input.clientId);
    }),

  /**
   * Actualiza perfil CRM
   */
  updateProfile: protectedProcedure
    .input(profileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.updateProfile(input);
    }),

  /**
   * Calcula score de un cliente
   */
  calculateScore: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.calculateClientScore(input.clientId);
    }),

  // ============================================================================
  // Tags
  // ============================================================================

  /**
   * Obtiene todas las etiquetas
   */
  getTags: protectedProcedure.query(async ({ ctx }) => {
    const service = createClientService(ctx.organizationId, ctx.user.id);
    return service.getTags();
  }),

  /**
   * Crea una etiqueta
   */
  createTag: protectedProcedure
    .input(z.object({
      name: z.string(),
      color: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.createTag(input.name, input.color, input.description);
    }),

  /**
   * Asigna etiquetas a un cliente
   */
  assignTags: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      tagIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      await service.assignTags(input.clientId, input.tagIds);
      return { success: true };
    }),

  /**
   * Obtiene etiquetas de un cliente
   */
  getClientTags: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.getClientTags(input.clientId);
    }),

  // ============================================================================
  // Communications
  // ============================================================================

  /**
   * Registra una comunicación
   */
  logCommunication: protectedProcedure
    .input(communicationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.logCommunication(input as any);
    }),

  /**
   * Obtiene historial de comunicaciones
   */
  getCommunicationHistory: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.getCommunicationHistory(input.clientId, input.limit);
    }),

  /**
   * Obtiene seguimientos pendientes
   */
  getPendingFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const service = createClientService(ctx.organizationId, ctx.user.id);
    return service.getPendingFollowUps();
  }),

  // ============================================================================
  // Tasks
  // ============================================================================

  /**
   * Crea una tarea
   */
  createTask: protectedProcedure
    .input(taskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.createTask(input as any);
    }),

  /**
   * Obtiene tareas pendientes
   */
  getPendingTasks: protectedProcedure
    .input(z.object({ assignedTo: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.getPendingTasks(input.assignedTo);
    }),

  /**
   * Completa una tarea
   */
  completeTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      await service.completeTask(input.taskId);
      return { success: true };
    }),

  // ============================================================================
  // Segments
  // ============================================================================

  /**
   * Crea un segmento
   */
  createSegment: protectedProcedure
    .input(z.object({
      name: z.string(),
      filters: clientFiltersSchema,
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createClientService(ctx.organizationId, ctx.user.id);
      return service.createSegment(input.name, input.filters, input.description);
    }),

  /**
   * Obtiene estadísticas CRM
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const service = createClientService(ctx.organizationId, ctx.user.id);
    return service.getStats();
  }),
});

export type ClientRouter = typeof clientRouter;
