import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { invitations, ADMIN_EMAILS } from '../../drizzle/invitations-schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { TRPCError } from '@trpc/server';

export const invitationsRouter = router({
  // Crear una nueva invitación (solo admins)
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar que el usuario es admin
      if (!ADMIN_EMAILS.includes(ctx.user.email)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo los administradores pueden enviar invitaciones',
        });
      }

      // Verificar si ya existe una invitación para este email
      const existing = await db
        .select()
        .from(invitations)
        .where(eq(invitations.email, input.email))
        .limit(1);

      if (existing.length > 0 && !existing[0].used) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya existe una invitación pendiente para este email',
        });
      }

      // Generar token único
      const token = randomBytes(32).toString('hex');

      // Crear invitación (expira en 7 días)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invitation] = await db
        .insert(invitations)
        .values({
          email: input.email,
          invitedBy: ctx.user.email,
          token,
          expiresAt,
        })
        .returning();

      return {
        success: true,
        invitation,
        invitationLink: `https://pianoemotion.com/sign-up?token=${token}`,
      };
    }),

  // Listar todas las invitaciones (solo admins)
  list: protectedProcedure.query(async ({ ctx }) => {
    // Verificar que el usuario es admin
    if (!ADMIN_EMAILS.includes(ctx.user.email)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Solo los administradores pueden ver las invitaciones',
      });
    }

    const allInvitations = await db
      .select()
      .from(invitations)
      .orderBy(invitations.createdAt);

    return allInvitations;
  }),

  // Validar un token de invitación (público)
  validate: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Los admins siempre tienen acceso
      if (ADMIN_EMAILS.includes(input.email)) {
        return { valid: true, isAdmin: true };
      }

      const [invitation] = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, input.email),
            eq(invitations.used, false)
          )
        )
        .limit(1);

      if (!invitation) {
        return { valid: false, reason: 'Invitación no encontrada' };
      }

      if (new Date() > invitation.expiresAt) {
        return { valid: false, reason: 'Invitación expirada' };
      }

      return { valid: true, invitation };
    }),

  // Marcar invitación como usada
  markAsUsed: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(invitations)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(invitations.token, input.token));

      return { success: true };
    }),

  // Revocar una invitación (solo admins)
  revoke: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar que el usuario es admin
      if (!ADMIN_EMAILS.includes(ctx.user.email)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo los administradores pueden revocar invitaciones',
        });
      }

      await db
        .update(invitations)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(invitations.id, input.id));

      return { success: true };
    }),
});
