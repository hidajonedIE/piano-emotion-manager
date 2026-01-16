import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * ENDPOINT TEMPORAL PARA PRUEBAS DE ESTRÉS
 * 
 * Este endpoint genera tokens de sesión válidos para pruebas de carga.
 * DEBE SER ELIMINADO DESPUÉS DE LA PRUEBA por razones de seguridad.
 * 
 * Uso:
 * POST /api/stress-test-token
 * Body: { "secret": "STRESS_TEST_SECRET_2026" }
 * Response: { "token": "...", "userId": "..." }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar secret
  const { secret } = req.body;
  console.log('[Stress Test Token] Received secret:', secret);
  console.log('[Stress Test Token] Expected secret:', process.env.STRESS_TEST_SECRET);
  
  if (secret !== process.env.STRESS_TEST_SECRET) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      debug: {
        received: secret,
        expected: process.env.STRESS_TEST_SECRET ? 'SET' : 'UNDEFINED'
      }
    });
  }

  try {
    // Obtener el primer usuario de la base de datos para usar como usuario de prueba
    // En una aplicación real, crearías usuarios de prueba específicos
    const users = await clerkClient.users.getUserList({ limit: 1 });
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    const user = users[0];

    // Crear una sesión temporal
    const session = await clerkClient.sessions.createSession({
      userId: user.id,
    });

    // Obtener el token de la sesión
    const token = await clerkClient.sessions.getToken(session.id, 'piano-emotion-manager');

    return res.status(200).json({
      token,
      userId: user.id,
      sessionId: session.id,
      expiresAt: session.expireAt,
    });
  } catch (error) {
    console.error('[Stress Test Token] Error generating token:', error);
    return res.status(500).json({ 
      error: 'Failed to generate token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
