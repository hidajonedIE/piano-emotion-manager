/**
 * Clerk Webhook API Endpoint
 * Piano Emotion Manager
 * 
 * Endpoint para recibir webhooks de Clerk
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleClerkWebhook } from '../../webhooks/clerk.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener el payload como string
    const payload = JSON.stringify(req.body);
    
    // Obtener headers necesarios para verificación
    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    // Procesar el webhook
    const result = await handleClerkWebhook(payload, headers);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error in Clerk webhook endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
