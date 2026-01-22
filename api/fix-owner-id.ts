/**
 * API endpoint para corregir datos de migración (DEPRECATED)
 * 
 * Este endpoint ya no es necesario ya que el schema actual usa partnerId y organizationId
 * en lugar de ownerId. Se mantiene por compatibilidad pero devuelve un mensaje informativo.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkSession } from '../server/_core/clerk.js';

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

    if (!clerkUser || !clerkUser.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in to execute this fix'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'This endpoint is deprecated. The schema now uses partnerId and organizationId instead of ownerId.',
      deprecated: true,
      user: {
        id: clerkUser.user.id || 'unknown',
        email: clerkUser.user.primaryEmailAddress?.emailAddress || 'unknown',
        name: `${clerkUser.user.firstName || ''} ${clerkUser.user.lastName || ''}`.trim() || 'unknown',
      },
    });
  } catch (error) {
    console.error('Error in deprecated endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
