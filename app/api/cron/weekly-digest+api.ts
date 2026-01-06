/**
 * Cron Job API Endpoint - Weekly Digest
 * Este endpoint debe ser llamado por un servicio de cron (Vercel Cron, GitHub Actions, etc.)
 * para enviar los resúmenes semanales de alertas
 */
import { AlertNotificationService } from '@/server/services/alert-notification.service';

export async function GET(request: Request) {
  try {
    // Verificar autenticación del cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return Response.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Procesar resúmenes semanales
    await AlertNotificationService.processWeeklyDigests();

    return Response.json({
      success: true,
      message: 'Weekly digests processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in weekly digest cron job:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
