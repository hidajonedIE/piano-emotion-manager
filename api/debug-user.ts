/**
 * Endpoint temporal para depuración: obtener información del usuario autenticado
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkSession } from '../server/_core/clerk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verificar sesión de Clerk
    const clerkUser = await verifyClerkSession(req);

    if (!clerkUser) {
      return res.status(401).json({
        error: 'No authenticated',
        message: 'No Clerk session found',
        headers: {
          authorization: req.headers.authorization,
          cookie: req.headers.cookie,
        }
      });
    }

    // Devolver información del usuario
    return res.status(200).json({
      success: true,
      user: {
        id: clerkUser.id,
        email: clerkUser.email,
        name: clerkUser.name,
      },
      message: 'This is the Clerk user ID that should be used as ownerId in the database'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
