/**
 * Cron Job: Recordatorios Automáticos
 * Envía recordatorios de citas próximas y alertas pendientes
 */
import { ReminderService } from '../../../server/services/reminder.service';

export async function GET(request: Request) {
  try {
    // Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Cron] Starting reminders job...');

    // Ejecutar recordatorios
    const results = await ReminderService.runScheduledReminders({
      daysBeforeAppointment: [1, 3, 7], // 1 día, 3 días y 1 semana antes
      sendAlertReminders: true,
      alertReminderFrequency: 7, // Cada 7 días
    });

    const totalSent = results.appointmentReminders.sent + results.alertReminders.sent;
    const totalFailed = results.appointmentReminders.failed + results.alertReminders.failed;

    console.log(`[Cron] Reminders job completed. Sent: ${totalSent}, Failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: {
          appointmentReminders: {
            sent: results.appointmentReminders.sent,
            failed: results.appointmentReminders.failed,
          },
          alertReminders: {
            sent: results.alertReminders.sent,
            failed: results.alertReminders.failed,
          },
        },
        totalSent,
        totalFailed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Cron] Error in reminders job:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
