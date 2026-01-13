/**
 * Google Calendar OAuth - Initiation Route
 * Genera la URL de autorización de Google y redirige al usuario
 */

import { generateGoogleAuthUrl } from '@/server/_core/calendar/oauth-google';

export async function GET(request: Request) {
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

    // Generar URL de autorización de Google
    const authUrl = generateGoogleAuthUrl(userId);

    // Redirigir al usuario a Google para autorización
    return Response.redirect(authUrl, 302);
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    
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
