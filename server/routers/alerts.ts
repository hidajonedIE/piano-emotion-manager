/**
 * Alert Management Router
 * APIs para gestión de configuración de alertas, historial y notificaciones
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/drizzle/db';
import { 
  alertSettings, 
  alertHistory, 
  alertNotifications,
  pianos,
  clients,
  services,
} from '@/drizzle/schema';

export const alertsRouter = router({
  /**
   * Obtener configuración global de alertas
   */
  getGlobalSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const settings = await db.query.alertSettings.findFirst({
        where: and(
          eq(alertSettings.partnerId, 1),
          sql`${alertSettings.userId} IS NULL`,
          sql`${alertSettings.organizationId} IS NULL`
        ),
      });

      // Si no existe, crear configuración por defecto
      if (!settings) {
        const [newSettings] = await db.insert(alertSettings).values({
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
      // Verificar que el usuario es admin
      // TODO: Implementar verificación de rol admin
      
      // Buscar configuración global existente
      const existing = await db.query.alertSettings.findFirst({
        where: and(
          eq(alertSettings.partnerId, 1),
          sql`${alertSettings.userId} IS NULL`,
          sql`${alertSettings.organizationId} IS NULL`
        ),
      });

      if (existing) {
        // Actualizar existente
        const [updated] = await db.update(alertSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(alertSettings.id, existing.id))
          .returning();
        return updated;
      } else {
        // Crear nueva
        const [created] = await db.insert(alertSettings)
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
      const settings = await db.query.alertSettings.findFirst({
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
      const existing = await db.query.alertSettings.findFirst({
        where: eq(alertSettings.userId, ctx.userId),
      });

      if (existing) {
        const [updated] = await db.update(alertSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(alertSettings.id, existing.id))
          .returning();
        return updated;
      } else {
        // Crear nueva configuración de usuario
        const [created] = await db.insert(alertSettings)
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
      const conditions = [eq(alertHistory.userId, ctx.userId)];
      
      if (input.status) {
        conditions.push(eq(alertHistory.status, input.status));
      }
      
      if (input.priority) {
        conditions.push(eq(alertHistory.priority, input.priority));
      }

      const alerts = await db.query.alertHistory.findMany({
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
      const [{ count }] = await db
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
      const [updated] = await db.update(alertHistory)
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
      const [updated] = await db.update(alertHistory)
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
      const [updated] = await db.update(alertHistory)
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
      // Contar alertas activas por prioridad
      const [urgentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'active'),
          eq(alertHistory.priority, 'urgent')
        ));

      const [pendingCount] = await db
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

      const [resolvedCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(alertHistory)
        .where(and(
          eq(alertHistory.userId, ctx.userId),
          eq(alertHistory.status, 'resolved'),
          sql`${alertHistory.resolvedAt} >= ${thirtyDaysAgo}`
        ));

      // Tiempo promedio de resolución (en días)
      const [avgResolutionTime] = await db
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
      const [alert] = await db.insert(alertHistory)
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
