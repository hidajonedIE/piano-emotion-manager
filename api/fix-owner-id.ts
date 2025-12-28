/**
 * API endpoint para corregir el ownerId de los clientes
 * 
 * Este endpoint actualiza el ownerId de todos los clientes que tienen
 * 'jnavarrete-inboundemotion' al openId del usuario autenticado en Clerk
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkSession } from '../server/.core/clerk';
import { getDb } from '../server/db';
import { users, clients } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const OLD_OWNER_ID = 'jnavarrete-inboundemotion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir método POST para evitar ejecuciones accidentales
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST to execute this fix'
    });
  }

  try {
    // 1. Verificar que el usuario esté autenticado con Clerk
    const clerkUser = await verifyClerkSession(req);

    if (!clerkUser) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in to execute this fix'
      });
    }

    const correctOpenId = clerkUser.id;

    // 2. Conectar a la base de datos
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: 'Could not connect to database'
      });
    }

    // 3. Verificar cuántos clientes tienen el ownerId incorrecto
    const clientsToUpdate = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, OLD_OWNER_ID));

    if (clientsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No clients to update. ownerId is already correct.',
        user: {
          id: clerkUser.id,
          email: clerkUser.email,
          name: clerkUser.name,
        },
        clientsUpdated: 0
      });
    }

    // 4. Actualizar los clientes
    await db
      .update(clients)
      .set({ ownerId: correctOpenId })
      .where(eq(clients.ownerId, OLD_OWNER_ID));

    // 5. Verificar la actualización
    const updatedClients = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, correctOpenId));

    return res.status(200).json({
      success: true,
      message: 'ownerId updated successfully',
      user: {
        id: clerkUser.id,
        email: clerkUser.email,
        name: clerkUser.name,
      },
      oldOwnerId: OLD_OWNER_ID,
      newOwnerId: correctOpenId,
      clientsUpdated: clientsToUpdate.length,
      totalClientsWithNewOwnerId: updatedClients.length,
    });
  } catch (error) {
    console.error('Error fixing ownerId:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
