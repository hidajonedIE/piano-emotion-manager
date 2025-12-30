/**
 * Clerk Webhook Handler
 * Piano Emotion Manager
 * 
 * Maneja eventos de Clerk como registro de usuarios
 * y valida invitaciones antes de permitir el acceso.
 */

import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { validateInvitation, markInvitationAsUsed } from '../middleware/invitation-guard.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

/**
 * Verifica y procesa eventos de webhook de Clerk
 */
export async function handleClerkWebhook(
  payload: string,
  headers: Record<string, string>
): Promise<{ success: boolean; message?: string }> {
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET no está configurado');
    return { success: false, message: 'Webhook secret not configured' };
  }

  try {
    // Verificar la firma del webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers) as WebhookEvent;

    // Manejar evento de usuario creado
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail?.email_address) {
        return { success: false, message: 'No email address found' };
      }

      const email = primaryEmail.email_address;

      // Validar que el usuario tenga una invitación válida
      const hasValidInvitation = await validateInvitation(email);
      
      if (!hasValidInvitation) {
        // Si no tiene invitación válida, no permitir el registro
        // Nota: Clerk ya creó el usuario, pero podemos marcarlo como inactivo
        // o eliminarlo usando la API de Clerk
        console.error(`Usuario ${email} intentó registrarse sin invitación válida`);
        return { 
          success: false, 
          message: 'No tienes una invitación válida para registrarte' 
        };
      }

      // Marcar la invitación como usada
      await markInvitationAsUsed(email);

      // Crear el usuario en nuestra base de datos
      try {
        await db.insert(users).values({
          id,
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date(),
        });
      } catch (dbError) {
        console.error('Error creating user in database:', dbError);
        // Continuar aunque falle la creación en DB
      }

      return { success: true, message: 'User registered successfully' };
    }

    // Manejar evento de usuario actualizado
    if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const primaryEmail = email_addresses.find((e) => e.id === evt.data.primary_email_address_id);
      
      if (primaryEmail?.email_address) {
        // Actualizar datos del usuario en nuestra base de datos
        try {
          await db
            .update(users)
            .set({
              email: primaryEmail.email_address,
              firstName: first_name || '',
              lastName: last_name || '',
            })
            .where(eq(users.id, id));
        } catch (dbError) {
          console.error('Error updating user in database:', dbError);
        }
      }

      return { success: true, message: 'User updated successfully' };
    }

    // Manejar evento de usuario eliminado
    if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      
      if (id) {
        try {
          await db.delete(users).where(eq(users.id, id));
        } catch (dbError) {
          console.error('Error deleting user from database:', dbError);
        }
      }

      return { success: true, message: 'User deleted successfully' };
    }

    return { success: true, message: 'Event processed' };
  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return { success: false, message: 'Webhook verification failed' };
  }
}
