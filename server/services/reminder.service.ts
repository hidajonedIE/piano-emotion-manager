/**
 * Reminder Service
 * Gestiona recordatorios automáticos para citas y alertas
 */
import * as db from '../db.js';
import { getDb } from "../../db.js";
import { 
  appointments,
  alertHistory,
  users,
  pianos,
  clients,
} from '../../drizzle/schema.js';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { UnifiedEmailService } from './unified-email.service.js';

interface ReminderConfig {
  daysBeforeAppointment?: number[];  // Días antes de la cita para enviar recordatorio
  hoursBeforeAppointment?: number[]; // Horas antes de la cita para enviar recordatorio
  sendAlertReminders?: boolean;      // Enviar recordatorios de alertas pendientes
  alertReminderFrequency?: number;   // Días entre recordatorios de alertas
}

interface ReminderResult {
  sent: number;
  failed: number;
  details: {
    type: 'appointment' | 'alert';
    recipientEmail: string;
    success: boolean;
    error?: string;
  }[];
}

export class ReminderService {
  /**
   * Enviar recordatorios de citas próximas
   */
  static async sendAppointmentReminders(
    config: ReminderConfig = {}
  ): Promise<ReminderResult> {
    const database = await (await getDb())!.getDb();
    if (!database) {
      return {
        sent: 0,
        failed: 0,
        details: [],
      };
    }

    const daysBeforeList = config.daysBeforeAppointment || [1, 3, 7]; // Por defecto: 1 día, 3 días y 1 semana antes
    const results: ReminderResult = {
      sent: 0,
      failed: 0,
      details: [],
    };

    try {
      for (const daysBefore of daysBeforeList) {
        // Calcular rango de fechas
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        targetDate.setHours(0, 0, 0, 0);

        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        // Buscar citas en ese rango
        const upcomingAppointments = await database.query.appointments.findMany({
          where: and(
            gte(appointments.date, targetDate),
            lte(appointments.date, endDate),
            eq(appointments.status, 'scheduled')
          ),
          with: {
            piano: true,
            client: true,
          },
        });

        // Enviar recordatorio para cada cita
        for (const appointment of upcomingAppointments) {
          const result = await this.sendAppointmentReminder(
            appointment,
            daysBefore
          );
          
          results.details.push(result);
          
          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
          }
        }
      }

      return results;
    } catch (error: any) {
      console.error('[ReminderService] Error sending appointment reminders:', error);
      return results;
    }
  }

  /**
   * Enviar recordatorio de una cita específica
   */
  private static async sendAppointmentReminder(
    appointment: any,
    daysBefore: number
  ): Promise<{
    type: 'appointment';
    recipientEmail: string;
    success: boolean;
    error?: string;
  }> {
    const database = await (await getDb())!.getDb();
    if (!database) {
      return {
        type: 'appointment',
        recipientEmail: appointment.client.email || 'unknown',
        success: false,
        error: 'Database not available',
      };
    }

    try {
      // Obtener usuario
      const user = await database.query.users.findFirst({
        where: eq(users.openId, appointment.odId),
      });

      if (!user || !user.email) {
        return {
          type: 'appointment',
          recipientEmail: appointment.client.email || 'unknown',
          success: false,
          error: 'User email not found',
        };
      }

      // Preparar email
      const serviceType = this.getServiceTypeName(appointment.type);
      const piano = appointment.piano;
      const client = appointment.client;

      const appointmentDate = new Date(appointment.date);
      const appointmentTime = appointment.time || '09:00';
      
      const dateStr = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const subject = `Recordatorio: ${serviceType} en ${daysBefore} día${daysBefore > 1 ? 's' : ''}`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Recordatorio de Cita</h1>
              <p>Tienes una cita programada en ${daysBefore} día${daysBefore > 1 ? 's' : ''}</p>
            </div>
            <div class="content">
              <div class="info-box">
                <div class="info-row">
                  <span class="label">📅 Fecha:</span> ${dateStr}
                </div>
                <div class="info-row">
                  <span class="label">🕐 Hora:</span> ${appointmentTime}
                </div>
                <div class="info-row">
                  <span class="label">🎹 Piano:</span> ${piano.brand} ${piano.model}
                </div>
                ${piano.serialNumber ? `
                <div class="info-row">
                  <span class="label">🔢 Número de serie:</span> ${piano.serialNumber}
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="label">👤 Cliente:</span> ${client.name}
                </div>
                ${client.address ? `
                <div class="info-row">
                  <span class="label">📍 Dirección:</span> ${client.address}
                </div>
                ` : ''}
                ${client.phone ? `
                <div class="info-row">
                  <span class="label">📞 Teléfono:</span> ${client.phone}
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="label">🔧 Servicio:</span> ${serviceType}
                </div>
                ${appointment.notes ? `
                <div class="info-row">
                  <span class="label">📝 Notas:</span> ${appointment.notes}
                </div>
                ` : ''}
              </div>

              <p><strong>Duración estimada:</strong> ${appointment.duration || 60} minutos</p>

              <center>
                <a href="https://www.pianoemotion.com/appointments/${appointment.id}" class="button">
                  Ver Detalles de la Cita
                </a>
              </center>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                💡 <strong>Consejo:</strong> Asegúrate de tener todo el material necesario preparado antes de la cita.
              </p>
            </div>
            <div class="footer">
              <p>Este es un recordatorio automático de Piano Emotion Manager</p>
              <p>© ${new Date().getFullYear()} Piano Emotion. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar email
      const result = await UnifiedEmailService.sendEmail(
        user.email,
        user.email, // El recordatorio es para el técnico
        subject,
        htmlBody
      );

      return {
        type: 'appointment',
        recipientEmail: user.email,
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('[ReminderService] Error sending appointment reminder:', error);
      return {
        type: 'appointment',
        recipientEmail: appointment.client.email || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enviar recordatorios de alertas pendientes
   */
  static async sendAlertReminders(
    config: ReminderConfig = {}
  ): Promise<ReminderResult> {
    const database = await (await getDb())!.getDb();
    if (!database) {
      return {
        sent: 0,
        failed: 0,
        details: [],
      };
    }

    const reminderFrequency = config.alertReminderFrequency || 7; // Por defecto: cada 7 días
    const results: ReminderResult = {
      sent: 0,
      failed: 0,
      details: [],
    };

    try {
      // Buscar alertas activas que no han sido reconocidas
      const activeAlerts = await database.query.alertHistory.findMany({
        where: eq(alertHistory.status, 'active'),
        with: {
          piano: true,
          client: true,
        },
      });

      // Agrupar por usuario
      const alertsByUser = new Map<string, any[]>();
      for (const alert of activeAlerts) {
        if (!alertsByUser.has(alert.userId!)) {
          alertsByUser.set(alert.userId!, []);
        }
        alertsByUser.get(alert.userId!)!.push(alert);
      }

      // Enviar recordatorio a cada usuario
      for (const [userId, userAlerts] of alertsByUser) {
        const result = await this.sendAlertReminderToUser(userId, userAlerts);
        results.details.push(result);
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }
      }

      return results;
    } catch (error: any) {
      console.error('[ReminderService] Error sending alert reminders:', error);
      return results;
    }
  }

  /**
   * Enviar recordatorio de alertas a un usuario
   */
  private static async sendAlertReminderToUser(
    userId: string,
    alerts: any[]
  ): Promise<{
    type: 'alert';
    recipientEmail: string;
    success: boolean;
    error?: string;
  }> {
    const database = await (await getDb())!.getDb();
    if (!database) {
      return {
        type: 'alert',
        recipientEmail: 'unknown',
        success: false,
        error: 'Database not available',
      };
    }

    try {
      // Obtener usuario
      const user = await database.query.users.findFirst({
        where: eq(users.openId, userId),
      });

      if (!user || !user.email) {
        return {
          type: 'alert',
          recipientEmail: 'unknown',
          success: false,
          error: 'User email not found',
        };
      }

      // Contar alertas por prioridad
      const urgentCount = alerts.filter(a => a.priority === 'urgent').length;
      const pendingCount = alerts.filter(a => a.priority === 'pending').length;

      const subject = `⚠️ Recordatorio: Tienes ${alerts.length} alerta${alerts.length > 1 ? 's' : ''} pendiente${alerts.length > 1 ? 's' : ''}`;
      
      const alertsHtml = alerts.map(alert => {
        const priorityColor = alert.priority === 'urgent' ? '#dc3545' : '#ffc107';
        const priorityText = alert.priority === 'urgent' ? 'URGENTE' : 'PENDIENTE';
        const serviceType = this.getServiceTypeName(alert.alertType);

        return `
          <div style="background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${priorityColor}; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">
                  ${priorityText}
                </span>
                <h3 style="margin: 10px 0 5px 0;">${alert.piano.brand} ${alert.piano.model}</h3>
                <p style="margin: 5px 0; color: #666;">Cliente: ${alert.client.name}</p>
                <p style="margin: 5px 0; color: #666;">Servicio: ${serviceType}</p>
                <p style="margin: 5px 0; color: #dc3545; font-weight: bold;">
                  ${alert.daysSinceLastService} días desde el último servicio
                </p>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-box { background: white; padding: 20px; border-radius: 10px; text-align: center; flex: 1; margin: 0 10px; }
            .stat-number { font-size: 36px; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Recordatorio de Alertas Pendientes</h1>
              <p>Tienes ${alerts.length} alerta${alerts.length > 1 ? 's' : ''} que requiere${alerts.length > 1 ? 'n' : ''} tu atención</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${urgentCount}</div>
                  <div class="stat-label">Urgentes</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${pendingCount}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
              </div>

              <h2>Alertas Activas:</h2>
              ${alertsHtml}

              <center>
                <a href="https://www.pianoemotion.com/dashboard" class="button">
                  Ver Todas las Alertas
                </a>
              </center>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                💡 <strong>Consejo:</strong> Programa estas citas lo antes posible para mantener la satisfacción de tus clientes.
              </p>
            </div>
            <div class="footer">
              <p>Este es un recordatorio automático de Piano Emotion Manager</p>
              <p>© ${new Date().getFullYear()} Piano Emotion. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar email
      const result = await UnifiedEmailService.sendEmail(
        user.email,
        user.email,
        subject,
        htmlBody
      );

      return {
        type: 'alert',
        recipientEmail: user.email,
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('[ReminderService] Error sending alert reminder:', error);
      return {
        type: 'alert',
        recipientEmail: 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener nombre del tipo de servicio
   */
  private static getServiceTypeName(serviceType: string): string {
    switch (serviceType) {
      case 'tuning':
        return 'Afinación';
      case 'regulation':
        return 'Regulación';
      case 'repair':
        return 'Reparación';
      default:
        return 'Servicio';
    }
  }

  /**
   * Programar recordatorios automáticos (para cron job)
   */
  static async runScheduledReminders(
    config: ReminderConfig = {}
  ): Promise<{
    appointmentReminders: ReminderResult;
    alertReminders: ReminderResult;
  }> {
    console.log('[ReminderService] Running scheduled reminders...');

    const appointmentReminders = await this.sendAppointmentReminders(config);
    console.log(`[ReminderService] Appointment reminders sent: ${appointmentReminders.sent}, failed: ${appointmentReminders.failed}`);

    let alertReminders: ReminderResult = {
      sent: 0,
      failed: 0,
      details: [],
    };

    if (config.sendAlertReminders !== false) {
      alertReminders = await this.sendAlertReminders(config);
      console.log(`[ReminderService] Alert reminders sent: ${alertReminders.sent}, failed: ${alertReminders.failed}`);
    }

    return {
      appointmentReminders,
      alertReminders,
    };
  }
}
