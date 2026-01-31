import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkSession } from '../../server/_core/clerk.js';
import { getDb } from '../../server/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Endpoint temporal para actualizar suscripción a premium
 * Solo funciona para jnavarrete@inboundemotion.com
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verificar autenticación con Clerk
    const clerkUser = await verifyClerkSession(req);
    
    if (!clerkUser) {
      return res.status(401).json({ 
        error: 'No autenticado',
        message: 'Debes estar logueado para usar este endpoint'
      });
    }

    // Verificar que es el usuario correcto
    if (clerkUser.user.email !== 'jnavarrete@inboundemotion.com') {
      return res.status(403).json({ 
        error: 'No autorizado',
        message: 'Este endpoint solo está disponible para el administrador'
      });
    }

    // Conectar a la base de datos
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        error: 'Error de base de datos',
        message: 'No se pudo conectar a la base de datos'
      });
    }

    // Buscar el usuario en la base de datos
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, clerkUser.user.email))
      .limit(1);

    if (userRows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario en la base de datos'
      });
    }

    const user = userRows[0];

    // Actualizar a premium
    await db
      .update(users)
      .set({
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, user.id));

    // Verificar la actualización
    const updatedUserRows = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const updatedUser = updatedUserRows[0];

    return res.status(200).json({
      success: true,
      message: 'Suscripción actualizada correctamente a Premium',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStatus: updatedUser.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('[Admin] Error updating subscription:', error);
    return res.status(500).json({ 
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
