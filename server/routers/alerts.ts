/**
 * Alert Management Router
 * APIs para gestión de configuración de alertas, historial y notificaciones
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import * as db from '../db.js';
import { 
  alertSettings, 
  alertHistory, 
  alertNotifications,
  pianos,
  clients,
  services,
} from '../../drizzle/schema.js';
import { AlertSchedulingService } from '../services/alert-scheduling.service.js';
import { AutoSchedulingService } from '../services/auto-scheduling.service.js';
import { CalendarSyncService } from '../services/calendar-sync.service.js';
import { AlertAnalyticsService } from '../services/alert-analytics.service.js';

export const alertsRouter = router({
  /**
   * Obtener configuración global de alertas
   */
  getGlobalSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const settings = await database.query.alertSettings.findFirst({
        where: and(
          eq(alertSettings.partnerId, 1),
          sql`${alertSettings.userId} IS NULL`,
          sql`${alertSettings.organizationId} IS NULL`
        ),
      });

      // Si no existe, crear configuración por defecto
      if (!settings) {
        const [newSettings] = await database.insert(alertSettings).values({
          partnerId: 1,
          userId: null,
          organizationId: null,
          tuningPendingDays: 180,
          tuningUrgentDays: 270,
          regulationPendingDays: 730,
          regulationUrgentDays: 1095,
          emailNotificationsEnabled: true,
          pushNotificationsEnabled: false,
          weeklyDigestEnabled: true,
          weeklyDigestDay: 1,
        }).returning();
        return newSettings;
      }

      return settings;
    }),

  /**
   * Actualizar configuración global de alertas (solo admin)
   */
  updateGlobalSettings: protectedProcedure
    .input(z.object({
      tuningPendingDays: z.number().min(1).max(365),
      tuningUrgentDays: z.number().min(1).max(730),
      regulationPendingDays: z.number().min(1).max(1825),
      regulationUrgentDays: z.number().min(1).max(3650),
      emailNotificationsEnabled: z.boolean(),
      pushNotificationsEnabled: z.boolean(),
      weeklyDigestEnabled: z.boolean(),
      weeklyDigestDay: z.number().min(1).max(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verificar que el usuario es admin
      // TODO: Implementar verificación de rol admin
      
      // Buscar configuración global existente
      const existing = await database.query.alertSettings.findFirst({
        where: and(
          eq(alertSettings.partnerId, 1),
          sql`${alertSettings.userId} IS NULL`,
          sql`${alertSettings.organizationId} IS NULL`
        ),
      });

      if (existing) {
        // Actualizar existente
        const [updated] = await database.update(alertSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(alertSettings.id, existing.id))
          .returning();
        return updated;
      } else {
        // Crear nueva
        const [created] = await database.insert(alertSettings)
          .values({
            partnerId: 1,
            userId: null,
            organizationId: null,
            ...input,
          })
          .returning();
        return created;
      }
    }),

  /**
   * Obtener configuración de alertas del usuario actual
   */
  getUserSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const settings = await database.query.alertSettings.findFirst({
        where: eq(alertSettings.userId, ctx.userId),
      });

      return settings;
    }),

  /**
   * Actualizar configuración de alertas del usuario
   */
  updateUserSettings: protectedProcedure
    .input(z.object({
      emailNotificationsEnabled: z.boolean(),
      pushNotificationsEnabled: z.boolean(),
      weeklyDigestEnabled: z.boolean(),
      weeklyDigestDay: z.number().min(1).max(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const existing = await database.query.alertSettings.findFirst({
        where: eq(alertSettings.userId, ctx.userId),
      });

      if (existing) {
        const [updated] = await database.update(alertSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(alertSettings.id, existing.id))
          .returning();
        return updated;
      } else {
        // Crear nueva configuración de usuario
        const [created] = await database.insert(alertSettings)
          .values({
            partnerId: 1,
            userId: ctx.userId,
            ...input,
          })
          .returning();
        return created;
      }
    }),

  /**
   * Obtener historial de alertas del usuario
   */
  getAlertHistory: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'acknowledged', 'resolved', 'dismissed']).optional(),
      priority: z.enum(['urgent', 'pending', 'ok']).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = [eq(alertHistory.userId, ctx.userId)];
      
      if (input.status) {
        conditions.push(eq(alertHistory.status, input.status));
      }
      
      if (input.priority) {
        conditions.push(eq(alertHistory.priority, input.priority));
      }

      const alerts = await database.query.alertHistory.findMany({
        where: and(...conditions),
        orderBy: [desc(alertHistory.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          piano: {
            columns: {
              id: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
          },
          client: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Contar total
      const [{ count }] = await database
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(...conditions));

      return {
        alerts,
        total: count,
        hasMore: input.offset + input.limit < count,
      };
    }),

  /**
   * Marcar alerta como reconocida
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [updated] = await database.update(alertHistory)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(alertHistory.id, input.alertId),
          eq(alertHistory.userId, ctx.userId)
        ))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta no encontrada',
        });
      }

      return updated;
    }),

  /**
   * Marcar alerta como resuelta
   */
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      serviceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [updated] = await database.update(alertHistory)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedByServiceId: input.serviceId,
          updatedAt: new Date(),
        })
        .where(and(
          eq(alertHistory.id, input.alertId),
          eq(alertHistory.userId, ctx.userId)
        ))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta no encontrada',
        });
      }

      return updated;
    }),

  /**
   * Descartar alerta
   */
  dismissAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [updated] = await database.update(alertHistory)
        .set({
          status: 'dismissed',
          updatedAt: new Date(),
        })
        .where(and(
          eq(alertHistory.id, input.alertId),
          eq(alertHistory.userId, ctx.userId)
        ))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Alerta no encontrada',
        });
      }

      return updated;
    }),

  /**
   * Obtener estadísticas de alertas
   */
  getStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Contar alertas activas por prioridad
      const [urgentCount] = await database
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'active'),
          eq(alertHistory.priority, 'urgent')
        ));

      const [pendingCount] = await database
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'active'),
          eq(alertHistory.priority, 'pending')
        ));

      // Contar alertas resueltas en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [resolvedCount] = await database
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'resolved'),
          sql`${alertHistory.resolvedAt} >= ${thirtyDaysAgo}`
        ));

      // Tiempo promedio de resolución (en días)
      const [avgResolutionTime] = await database
        .select({
          avg: sql<number>`AVG(DATEDIFF(${alertHistory.resolvedAt}, ${alertHistory.createdAt}))`,
        })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'resolved'),
          sql`${alertHistory.resolvedAt} IS NOT NULL`
        ));

      return {
        activeUrgent: urgentCount.count,
        activePending: pendingCount.count,
        resolvedLast30Days: resolvedCount.count,
        avgResolutionDays: Math.round(avgResolutionTime.avg ?? 0),
      };
    }),

  /**
   * Obtener sugerencias de fechas para todas las alertas activas
   */
  getSuggestedDates: protectedProcedure
    .input(z.object({
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const suggestions = await AlertSchedulingService.getSuggestedDates(
        ctx.userId,
        input || {}
      );
      return suggestions;
    }),

  /**
   * Obtener sugerencia de fecha para una alerta específica
   */
  getSuggestionForAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { alertId, ...options } = input;
      const suggestion = await AlertSchedulingService.getSuggestionForAlert(
        ctx.userId,
        alertId,
        options
      );
      return suggestion;
    }),

  /**
   * Obtener múltiples opciones de fecha para una alerta
   */
  getMultipleDateOptions: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      numberOfOptions: z.number().min(1).max(10).default(3),
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { alertId, numberOfOptions, ...options } = input;
      const suggestions = await AlertSchedulingService.getMultipleDateOptions(
        ctx.userId,
        alertId,
        numberOfOptions,
        options
      );
      return suggestions;
    }),

  /**
   * Auto-programar servicio desde una alerta
   */
  autoScheduleFromAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
      createAppointment: z.boolean().optional(),
      createService: z.boolean().optional(),
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
      preferredDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { alertId, ...options } = input;
      const result = await AutoSchedulingService.scheduleFromAlert(
        ctx.userId,
        alertId,
        options
      );
      return result;
    }),

  /**
   * Auto-programar múltiples alertas
   */
  autoScheduleMultiple: protectedProcedure
    .input(z.object({
      alertIds: z.array(z.number()),
      createAppointment: z.boolean().optional(),
      createService: z.boolean().optional(),
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { alertIds, ...options } = input;
      const results = await AutoSchedulingService.scheduleMultipleAlerts(
        ctx.userId,
        alertIds,
        options
      );
      return results;
    }),

  /**
   * Auto-programar todas las alertas urgentes
   */
  autoScheduleAllUrgent: protectedProcedure
    .input(z.object({
      createAppointment: z.boolean().optional(),
      createService: z.boolean().optional(),
      includeWeekends: z.boolean().optional(),
      workingHoursStart: z.number().min(0).max(23).optional(),
      workingHoursEnd: z.number().min(0).max(23).optional(),
      minDaysAhead: z.number().min(0).max(365).optional(),
      maxDaysAhead: z.number().min(1).max(365).optional(),
      notes: z.string().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const results = await AutoSchedulingService.scheduleAllUrgentAlerts(
        ctx.userId,
        input || {}
      );
      return results;
    }),

  /**
   * Obtener estadísticas de auto-programación
   */
  getAutoScheduleStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await AutoSchedulingService.getAutoScheduleStatistics(ctx.userId);
      return stats;
    }),

  /**
   * Sincronizar cita con calendario externo
   */
  syncAppointmentToCalendar: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await CalendarSyncService.syncAppointment(
        ctx.userId,
        input.appointmentId
      );
      return result;
    }),

  /**
   * Sincronizar múltiples citas con calendario
   */
  syncMultipleAppointments: protectedProcedure
    .input(z.object({
      appointmentIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = await CalendarSyncService.syncMultipleAppointments(
        ctx.userId,
        input.appointmentIds
      );
      return results;
    }),

  /**
   * Actualizar evento en calendario externo
   */
  updateCalendarEvent: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      externalEventId: z.string(),
      provider: z.enum(['google', 'outlook']),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await CalendarSyncService.updateCalendarEvent(
        ctx.userId,
        input.appointmentId,
        input.externalEventId,
        input.provider
      );
      return result;
    }),

  /**
   * Eliminar evento de calendario externo
   */
  deleteCalendarEvent: protectedProcedure
    .input(z.object({
      externalEventId: z.string(),
      provider: z.enum(['google', 'outlook']),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await CalendarSyncService.deleteCalendarEvent(
        ctx.userId,
        input.externalEventId,
        input.provider
      );
      return result;
    }),

  /**
   * Verificar si el usuario tiene calendario conectado
   */
  hasCalendarConnected: protectedProcedure
    .query(async ({ ctx }) => {
      const result = await CalendarSyncService.hasCalendarConnected(ctx.userId);
      return result;
    }),

  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const metrics = await AlertAnalyticsService.getPerformanceMetrics(
        ctx.userId,
        input?.startDate,
        input?.endDate
      );
      return metrics;
    }),

  /**
   * Obtener datos de serie temporal
   */
  getTimeSeriesData: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      interval: z.enum(['day', 'week', 'month']).default('day'),
    }))
    .query(async ({ ctx, input }) => {
      const data = await AlertAnalyticsService.getTimeSeriesData(
        ctx.userId,
        input.startDate,
        input.endDate,
        input.interval
      );
      return data;
    }),

  /**
   * Obtener distribución de alertas por tipo
   */
  getAlertDistribution: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const distribution = await AlertAnalyticsService.getAlertDistribution(
        ctx.userId,
        input?.startDate,
        input?.endDate
      );
      return distribution;
    }),

  /**
   * Obtener análisis de tendencias
   */
  getTrendAnalysis: protectedProcedure
    .input(z.object({
      periods: z.number().min(1).max(24).default(12),
      interval: z.enum(['month', 'quarter', 'year']).default('month'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const trends = await AlertAnalyticsService.getTrendAnalysis(
        ctx.userId,
        input?.periods,
        input?.interval
      );
      return trends;
    }),

  /**
   * Obtener análisis por tipo de servicio
   */
  getServiceTypeAnalysis: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const analysis = await AlertAnalyticsService.getServiceTypeAnalysis(
        ctx.userId,
        input?.startDate,
        input?.endDate
      );
      return analysis;
    }),

  /**
   * Obtener top pianos con más alertas
   */
  getTopAlertPianos: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const topPianos = await AlertAnalyticsService.getTopAlertPianos(
        ctx.userId,
        input?.limit,
        input?.startDate,
        input?.endDate
      );
      return topPianos;
    }),

  /**
   * Obtener comparativa mensual
   */
  getMonthlyComparison: protectedProcedure
    .input(z.object({
      currentMonth: z.date(),
      previousMonth: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const comparison = await AlertAnalyticsService.getMonthlyComparison(
        ctx.userId,
        input.currentMonth,
        input.previousMonth
      );
      return comparison;
    }),

  /**
   * Crear alerta manualmente (para testing o casos especiales)
   */
  createAlert: protectedProcedure
    .input(z.object({
      pianoId: z.number(),
      clientId: z.number(),
      alertType: z.enum(['tuning', 'regulation', 'repair']),
      priority: z.enum(['urgent', 'pending', 'ok']),
      message: z.string(),
      daysSinceLastService: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [alert] = await database.insert(alertHistory)
        .values({
          ...input,
          userId: ctx.userId,
          partnerId: 1,
          status: 'active',
        })
        .returning();

      return alert;
    }),
});
