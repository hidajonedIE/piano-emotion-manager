/**
 * Outlook Calendar OAuth - Initiation Route
 * Genera la URL de autorización de Microsoft y redirige al usuario
 */

import { generateMicrosoftAuthUrl } from '../server/_core/calendar/oauth-microsoft.js';

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generar URL de autorización de Microsoft
    const authUrl = generateMicrosoftAuthUrl(userId);

    // Redirigir al usuario a Microsoft para autorización
    return Response.redirect(authUrl, 302);
  } catch (error) {
    console.error('Error generating Microsoft auth URL:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
