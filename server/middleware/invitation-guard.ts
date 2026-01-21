/**
 * Middleware para validar invitaciones en el registro
 * Piano Emotion Manager
 * 
 * Este middleware verifica que los usuarios tengan una invitación válida
 * antes de permitir el registro, con excepción del administrador.
 */

import { TRPCError } from '@trpc/server';
import * as db from '../getDb().js';
import { invitations } from '../../drizzle/invitations-schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Email del administrador que siempre tiene acceso
 */
const ADMIN_EMAIL = 'jnavarrete@inboundemotion.com';

/**
 * Verifica si un email tiene una invitación válida
 */
export async function validateInvitation(email: string): Promise<boolean> {
  // El administrador siempre tiene acceso
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  try {
    const database = await getDb().getDb();
    if (!database) {
      console.error('Database not available for invitation validation');
      return false;
    }

    // Buscar invitación válida para este email
    const invitation = await database
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email.toLowerCase()),
          eq(invitations.used, false)
        )
      )
      .limit(1);

    if (!invitation || invitation.length === 0) {
      return false;
    }

    const inv = invitation[0];

    // Verificar que no haya expirado
    if (new Date() > new Date(inv.expiresAt)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating invitation:', error);
    return false;
  }
}

/**
 * Marca una invitación como usada
 */
export async function markInvitationAsUsed(email: string): Promise<void> {
  // No marcar para el administrador (no tiene invitación)
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return;
  }

  try {
    const database = await getDb().getDb();
    if (!database) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Base de datos no disponible',
      });
    }

    await database
      .update(invitations)
      .set({
        used: true,
        usedAt: new Date(),
      })
      .where(
        and(
          eq(invitations.email, email.toLowerCase()),
          eq(invitations.used, false)
        )
      );
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'No se pudo marcar la invitación como usada',
    });
  }
}

/**
 * Verifica si un usuario es administrador
 */
export function isAdmin(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
