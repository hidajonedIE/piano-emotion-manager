/**
 * API endpoint para corregir el ownerId de los clientes
 * 
 * Este endpoint actualiza el ownerId de todos los clientes que tienen
 * 'jnavarrete-inboundemotion' al openId correcto del usuario autenticado en Clerk
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../server/db';
import { users, clients } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const TARGET_EMAIL = 'jnavarrete@inboundemotion.com';
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
    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: 'Could not connect to database'
      });
    }

    // 1. Buscar el usuario por email
    const targetUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, TARGET_EMAIL))
      .limit(1);

    if (targetUsers.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with email ${TARGET_EMAIL}. User must log in at least once.`
      });
    }

    const targetUser = targetUsers[0];
    const correctOpenId = targetUser.openId;

    if (!correctOpenId) {
      return res.status(400).json({
        error: 'Invalid user',
        message: 'User does not have an openId'
      });
    }

    // 2. Verificar cuántos clientes tienen el ownerId incorrecto
    const clientsToUpdate = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, OLD_OWNER_ID));

    if (clientsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No clients to update. ownerId is already correct.',
        user: {
          email: targetUser.email,
          openId: correctOpenId,
        },
        clientsUpdated: 0
      });
    }

    // 3. Actualizar los clientes
    await db
      .update(clients)
      .set({ ownerId: correctOpenId })
      .where(eq(clients.ownerId, OLD_OWNER_ID));

    // 4. Verificar la actualización
    const updatedClients = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, correctOpenId));

    return res.status(200).json({
      success: true,
      message: 'ownerId updated successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        openId: correctOpenId,
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
    });
  }
}
