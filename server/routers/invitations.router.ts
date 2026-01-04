import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import * as db from '../db.js';
import { invitations, ADMIN_EMAILS } from '../../drizzle/invitations-schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { TRPCError } from '@trpc/server';
import { getCached, setCached, deleteCached } from '../cache.js';

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

      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de datos no disponible',
        });
      }

      // Verificar si ya existe una invitación para este email
      const existing = await database
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

      const id = crypto.randomUUID();
      const now = new Date();

      await database.insert(invitations).values({
        id,
        email: input.email,
        invitedBy: ctx.user.email,
        token,
        expiresAt,
      });

      // Construir respuesta en memoria sin segunda consulta
      const invitation = {
        id,
        email: input.email,
        invitedBy: ctx.user.email,
        token,
        expiresAt,
        used: false,
        usedAt: null,
        createdAt: now,
      };

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

    const database = await db.getDb();
    if (!database) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Base de datos no disponible',
      });
    }

    const allInvitations = await database
      .select()
      .from(invitations)
      .orderBy(desc(invitations.createdAt));

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

      // Intentar obtener del caché primero
      const cacheKey = `invitation:validate:${input.email}`;
      const cached = await getCached<{ valid: boolean; reason?: string; invitation?: any }>(cacheKey);
      if (cached) {
        return cached;
      }

      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de datos no disponible',
        });
      }

      const [invitation] = await database
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
        const result = { valid: false, reason: 'Invitación no encontrada' };
        // Cachear resultado negativo por 5 minutos
        await setCached(cacheKey, result, 300);
        return result;
      }

      if (new Date() > invitation.expiresAt) {
        const result = { valid: false, reason: 'Invitación expirada' };
        // Cachear resultado negativo por 5 minutos
        await setCached(cacheKey, result, 300);
        return result;
      }

      const result = { valid: true, invitation };
      // Cachear resultado positivo por 10 minutos
      await setCached(cacheKey, result, 600);
      return result;
    }),

  // Marcar invitación como usada
  markAsUsed: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de datos no disponible',
        });
      }

      // Obtener el email de la invitación antes de marcarla como usada
      const [invitation] = await database
        .select()
        .from(invitations)
        .where(eq(invitations.token, input.token))
        .limit(1);

      await database
        .update(invitations)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(invitations.token, input.token));

      // Invalidar caché de validación para este email
      if (invitation) {
        await deleteCached(`invitation:validate:${invitation.email}`);
      }

      return { success: true };
    }),

  // Revocar una invitación (solo admins)
  revoke: protectedProcedure
    .input(
      z.object({
        id: z.string(),
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

      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Base de datos no disponible',
        });
      }

      // Obtener el email de la invitación antes de revocarla
      const [invitation] = await database
        .select()
        .from(invitations)
        .where(eq(invitations.id, input.id))
        .limit(1);

      await database
        .update(invitations)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(invitations.id, input.id));

      // Invalidar caché de validación para este email
      if (invitation) {
        await deleteCached(`invitation:validate:${invitation.email}`);
      }

      return { success: true };
    }),
});
