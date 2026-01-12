/**
 * Alert Dismissals Router
 * Gestión de alertas desactivadas temporalmente
 */
import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db.js';
import { alertDismissals } from '../../drizzle/alerts-schema';
import { eq, and, or, isNull, gt } from 'drizzle-orm';

export const alertDismissalsRouter = router({
  /**
   * Desactivar una alerta
   * @param alertType - Tipo de alerta (appointment_reminder, piano_tuning, etc.)
   * @param alertKey - Clave única (appointmentId, pianoId, etc.)
   * @param reactivateAt - Fecha de reactivación (opcional)
   */
  dismiss: protectedProcedure
    .input(
      z.object({
        alertType: z.string().min(1).max(50),
        alertKey: z.string().min(1).max(255),
        reactivateAt: z.string().datetime().optional(), // ISO 8601 date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { alertType, alertKey, reactivateAt } = input;
      const database = await getDb();

      // Verificar si ya está desactivada
      const existing = await database
        .select()
        .from(alertDismissals)
        .where(
          and(
            eq(alertDismissals.alertType, alertType),
            eq(alertDismissals.alertKey, alertKey),
            eq(alertDismissals.userId, ctx.user.openId),
            eq(alertDismissals.partnerId, ctx.partnerId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Actualizar la fecha de reactivación
        await database
          .update(alertDismissals)
          .set({
            reactivateAt: reactivateAt ? new Date(reactivateAt) : null,
            updatedAt: new Date(),
          })
          .where(eq(alertDismissals.id, existing[0].id));

        return { success: true, updated: true, id: existing[0].id };
      }

      // Crear nueva desactivación
      const result = await database.insert(alertDismissals).values({
        alertType,
        alertKey,
        userId: ctx.user.openId,
        partnerId: ctx.partnerId,
        reactivateAt: reactivateAt ? new Date(reactivateAt) : null,
      });

      return { success: true, updated: false, id: result[0].insertId };
    }),

  /**
   * Reactivar una alerta (eliminar desactivación)
   */
  reactivate: protectedProcedure
    .input(
      z.object({
        alertType: z.string(),
        alertKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { alertType, alertKey } = input;
      const database = await getDb();

      await database
        .delete(alertDismissals)
        .where(
          and(
            eq(alertDismissals.alertType, alertType),
            eq(alertDismissals.alertKey, alertKey),
            eq(alertDismissals.userId, ctx.user.openId),
            eq(alertDismissals.partnerId, ctx.partnerId)
          )
        );

      return { success: true };
    }),

  /**
   * Verificar si una alerta está desactivada
   * Retorna true si está desactivada y no debe mostrarse
   */
  isDismissed: protectedProcedure
    .input(
      z.object({
        alertType: z.string(),
        alertKey: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { alertType, alertKey } = input;
      const now = new Date();
      const database = await getDb();

      const dismissed = await database
        .select()
        .from(alertDismissals)
        .where(
          and(
            eq(alertDismissals.alertType, alertType),
            eq(alertDismissals.alertKey, alertKey),
            eq(alertDismissals.userId, ctx.user.openId),
            eq(alertDismissals.partnerId, ctx.partnerId),
            // Solo considerar desactivadas si:
            // - No tiene fecha de reactivación (NULL = permanente)
            // - O la fecha de reactivación es futura
            or(
              isNull(alertDismissals.reactivateAt),
              gt(alertDismissals.reactivateAt, now)
            )
          )
        )
        .limit(1);

      return { isDismissed: dismissed.length > 0 };
    }),

  /**
   * Obtener todas las alertas desactivadas del usuario
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    const dismissed = await database
      .select()
      .from(alertDismissals)
      .where(
        and(
          eq(alertDismissals.userId, ctx.user.openId),
          eq(alertDismissals.partnerId, ctx.partnerId)
        )
      )
      .orderBy(alertDismissals.dismissedAt);

    return dismissed;
  }),

  /**
   * Limpiar alertas que ya deberían haberse reactivado
   * (Llamar periódicamente o al cargar el dashboard)
   */
  cleanExpired: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    const database = await getDb();

    const result = await database
      .delete(alertDismissals)
      .where(
        and(
          eq(alertDismissals.userId, ctx.user.openId),
          eq(alertDismissals.partnerId, ctx.partnerId),
          gt(now, alertDismissals.reactivateAt)
        )
      );

    return { success: true, cleaned: result[0].affectedRows || 0 };
  }),
});
