/**
 * Alert Notification Service
 * Gestiona el envío de notificaciones por email para alertas de mantenimiento
 */
import { getDb } from '../../drizzle/db.js';
import { UnifiedEmailService } from './unified-email.service';
import { pianos, clients, alertHistory, alertSettings, users } from '../../drizzle/schema.js';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';

interface AlertNotification {
  userId: string;
  userEmail: string;
  userName: string;
  alerts: {
    piano: {
      id: string;
      brand: string;
      model: string;
      serialNumber?: string;
    };
    client: {
      id: string;
      name: string;
      email?: string;
    };
    type: 'tuning' | 'regulation' | 'repair';
    priority: 'urgent' | 'pending';
    message: string;
    daysSinceLastService: number;
  }[];
}

export class AlertNotificationService {
  /**
   * Enviar notificación inmediata de alerta urgente
   */
  static async sendUrgentAlertEmail(
    userId: string,
    pianoId: string,
    alertType: 'tuning' | 'regulation' | 'repair',
    priority: 'urgent' | 'pending'
  ): Promise<boolean> {
    try {
      // Obtener configuración del usuario
      const userSettings = await getDb().query.alertSettings.findFirst({
        where: eq(alertSettings.userId, userId),
      });

      // Verificar si las notificaciones por email están habilitadas
      if (!userSettings?.emailNotificationsEnabled) {
        console.log(`Email notifications disabled for user ${userId}`);
        return false;
      }

      // Obtener datos del usuario
      const user = await getDb().query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user?.email) {
        console.error(`User ${userId} has no email address`);
        return false;
      }

      // Obtener datos del piano
      const piano = await getDb().query.pianos.findFirst({
        where: eq(pianos.id, pianoId),
      });

      if (!piano) {
        console.error(`Piano ${pianoId} not found`);
        return false;
      }

      // Obtener datos del cliente
      const client = await getDb().query.clients.findFirst({
        where: eq(clients.id, piano.clientId),
      });

      if (!client) {
        console.error(`Client ${piano.clientId} not found`);
        return false;
      }

      // Preparar datos para el email
      const emailData = {
        to: user.email,
        userName: user.name || user.email,
        piano: {
          brand: piano.brand,
          model: piano.model,
          serialNumber: piano.serialNumber,
        },
        client: {
          name: `${client.firstName} ${client.lastName}`.trim(),
          email: client.email,
        },
        alertType,
        priority,
      };

      // Enviar email
      await this.sendEmail(emailData);

      // Registrar en historial
      await getDb().insert(alertHistory).values({
        userId,
        pianoId,
        type: alertType,
        priority,
        status: 'sent',
        notificationMethod: 'email',
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error sending urgent alert email:', error);
      return false;
    }
  }

  /**
   * Enviar resumen semanal de alertas pendientes
   */
  static async sendWeeklyDigest(userId: string): Promise<boolean> {
    try {
      // Obtener configuración del usuario
      const userSettings = await getDb().query.alertSettings.findFirst({
        where: eq(alertSettings.userId, userId),
      });

      // Verificar si el resumen semanal está habilitado
      if (!userSettings?.weeklyDigestEnabled) {
        console.log(`Weekly digest disabled for user ${userId}`);
        return false;
      }

      // Obtener datos del usuario
      const user = await getDb().query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user?.email) {
        console.error(`User ${userId} has no email address`);
        return false;
      }

      // Obtener todas las alertas activas del usuario
      const userPianos = await getDb().query.pianos.findMany({
        where: eq(pianos.userId, userId),
      });

      if (userPianos.length === 0) {
        console.log(`User ${userId} has no pianos`);
        return false;
      }

      // Calcular alertas para cada piano
      const alerts: AlertNotification['alerts'] = [];

      for (const piano of userPianos) {
        // Obtener cliente
        const client = await getDb().query.clients.findFirst({
          where: eq(clients.id, piano.clientId),
        });

        if (!client) continue;

        // Calcular días desde último servicio
        const lastTuningDate = piano.lastTuningDate
          ? new Date(piano.lastTuningDate)
          : null;
        const lastRegulationDate = piano.lastRegulationDate
          ? new Date(piano.lastRegulationDate)
          : null;

        const now = new Date();

        // Verificar afinación
        if (lastTuningDate) {
          const daysSinceTuning = Math.floor(
            (now.getTime() - lastTuningDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const tuningThreshold = piano.customTuningInterval
            ? piano.customTuningInterval
            : userSettings.tuningUrgentDays;

          if (daysSinceTuning >= tuningThreshold) {
            alerts.push({
              piano: {
                id: piano.id,
                brand: piano.brand,
                model: piano.model,
                serialNumber: piano.serialNumber || undefined,
              },
              client: {
                id: client.id,
                name: `${client.firstName} ${client.lastName}`.trim(),
                email: client.email || undefined,
              },
              type: 'tuning',
              priority: daysSinceTuning >= tuningThreshold ? 'urgent' : 'pending',
              message: `El piano lleva ${daysSinceTuning} días sin afinar`,
              daysSinceLastService: daysSinceTuning,
            });
          }
        }

        // Verificar regulación
        if (lastRegulationDate) {
          const daysSinceRegulation = Math.floor(
            (now.getTime() - lastRegulationDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const regulationThreshold = piano.customRegulationInterval
            ? piano.customRegulationInterval
            : userSettings.regulationUrgentDays;

          if (daysSinceRegulation >= regulationThreshold) {
            alerts.push({
              piano: {
                id: piano.id,
                brand: piano.brand,
                model: piano.model,
                serialNumber: piano.serialNumber || undefined,
              },
              client: {
                id: client.id,
                name: `${client.firstName} ${client.lastName}`.trim(),
                email: client.email || undefined,
              },
              type: 'regulation',
              priority: daysSinceRegulation >= regulationThreshold ? 'urgent' : 'pending',
              message: `El piano lleva ${daysSinceRegulation} días sin regular`,
              daysSinceLastService: daysSinceRegulation,
            });
          }
        }
      }

      // Si no hay alertas, no enviar email
      if (alerts.length === 0) {
        console.log(`User ${userId} has no active alerts`);
        return false;
      }

      // Preparar datos para el email
      const emailData: AlertNotification = {
        userId,
        userEmail: user.email,
        userName: user.name || user.email,
        alerts,
      };

      // Enviar email de resumen
      await this.sendWeeklyDigestEmail(emailData);

      // Registrar en historial
      await getDb().insert(alertHistory).values({
        userId,
        pianoId: null,
        type: 'tuning', // Tipo genérico para resumen
        priority: 'pending',
        status: 'sent',
        notificationMethod: 'email',
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error sending weekly digest:', error);
      return false;
    }
  }

  /**
   * Enviar email individual de alerta
   */
  private static async sendEmail(data: {
    to: string;
    userName: string;
    piano: { brand: string; model: string; serialNumber?: string };
    client: { name: string; email?: string };
    alertType: 'tuning' | 'regulation' | 'repair';
    priority: 'urgent' | 'pending';
  }): Promise<void> {
    const { to, userName, piano, client, alertType, priority } = data;

    const typeLabels = {
      tuning: 'Afinación',
      regulation: 'Regulación',
      repair: 'Reparación',
    };

    const priorityLabels = {
      urgent: 'URGENTE',
      pending: 'Pendiente',
    };

    const subject = `[${priorityLabels[priority]}] Alerta de ${typeLabels[alertType]} - ${piano.brand} ${piano.model}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #2563EB;
            margin-bottom: 10px;
          }
          .alert-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
          }
          .alert-urgent {
            background-color: #FEE2E2;
            color: #EF4444;
          }
          .alert-pending {
            background-color: #FEF3C7;
            color: #F59E0B;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .alert-details {
            background-color: #F9FAFB;
            border-left: 4px solid ${priority === 'urgent' ? '#EF4444' : '#F59E0B'};
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .detail-row {
            margin-bottom: 12px;
          }
          .detail-label {
            font-weight: 600;
            color: #6B7280;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 16px;
            color: #111827;
            margin-top: 4px;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563EB;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            font-size: 13px;
            color: #6B7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎹 Piano Emotion</div>
            <div class="alert-badge ${priority === 'urgent' ? 'alert-urgent' : 'alert-pending'}">
              ${priorityLabels[priority]} - ${typeLabels[alertType]}
            </div>
          </div>

          <div class="greeting">
            Hola ${userName},
          </div>

          <p>
            ${priority === 'urgent' 
              ? 'Te informamos que uno de tus pianos requiere atención urgente.' 
              : 'Te recordamos que uno de tus pianos necesita servicio pronto.'}
          </p>

          <div class="alert-details">
            <div class="detail-row">
              <div class="detail-label">Piano</div>
              <div class="detail-value">${piano.brand} ${piano.model}</div>
              ${piano.serialNumber ? `<div style="font-size: 13px; color: #6B7280;">S/N: ${piano.serialNumber}</div>` : ''}
            </div>

            <div class="detail-row">
              <div class="detail-label">Cliente</div>
              <div class="detail-value">${client.name}</div>
              ${client.email ? `<div style="font-size: 13px; color: #6B7280;">${client.email}</div>` : ''}
            </div>

            <div class="detail-row">
              <div class="detail-label">Servicio Requerido</div>
              <div class="detail-value">${typeLabels[alertType]}</div>
            </div>
          </div>

          <p>
            ${priority === 'urgent'
              ? 'Te recomendamos programar este servicio lo antes posible para mantener el piano en óptimas condiciones.'
              : 'Te sugerimos programar este servicio en las próximas semanas.'}
          </p>

          <div style="text-align: center;">
            <a href="https://www.pianoemotion.com" class="cta-button">
              Ver en Piano Emotion
            </a>
          </div>

          <div class="footer">
            <p>
              Este es un email automático de Piano Emotion Manager.<br>
              Si no deseas recibir estas notificaciones, puedes desactivarlas en la configuración de tu cuenta.
            </p>
            <p style="margin-top: 10px;">
              © ${new Date().getFullYear()} Piano Emotion. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email usando el servicio unificado (Gmail o Outlook)
    const sent = await UnifiedEmailService.sendEmail({
      to,
      subject,
      html,
      userEmail: userName.includes('@') ? userName : undefined,
    });

    if (!sent) {
      console.error('Failed to send email');
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully to:', to);
  }

  /**
   * Enviar email de resumen semanal
   */
  private static async sendWeeklyDigestEmail(data: AlertNotification): Promise<void> {
    const { userEmail, userName, alerts } = data;

    const urgentCount = alerts.filter((a) => a.priority === 'urgent').length;
    const pendingCount = alerts.filter((a) => a.priority === 'pending').length;

    const subject = `Resumen Semanal de Alertas - ${alerts.length} ${alerts.length === 1 ? 'piano requiere' : 'pianos requieren'} atención`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #2563EB;
            margin-bottom: 10px;
          }
          .summary {
            display: flex;
            gap: 12px;
            margin: 20px 0;
          }
          .summary-card {
            flex: 1;
            padding: 16px;
            border-radius: 6px;
            text-align: center;
          }
          .summary-urgent {
            background-color: #FEE2E2;
            border: 2px solid #EF4444;
          }
          .summary-pending {
            background-color: #FEF3C7;
            border: 2px solid #F59E0B;
          }
          .summary-number {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .summary-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .alert-item {
            background-color: #F9FAFB;
            border-left: 4px solid #6B7280;
            padding: 16px;
            margin: 12px 0;
            border-radius: 4px;
          }
          .alert-item-urgent {
            border-left-color: #EF4444;
          }
          .alert-item-pending {
            border-left-color: #F59E0B;
          }
          .alert-piano {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
          }
          .alert-client {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 8px;
          }
          .alert-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            background-color: #E5E7EB;
            color: #374151;
            margin-right: 8px;
          }
          .alert-days {
            font-size: 13px;
            color: #6B7280;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563EB;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            font-size: 13px;
            color: #6B7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎹 Piano Emotion</div>
            <h2 style="margin: 0; color: #111827;">Resumen Semanal de Alertas</h2>
          </div>

          <p>Hola ${userName},</p>

          <p>
            Aquí está tu resumen semanal de alertas de mantenimiento. Actualmente tienes 
            <strong>${alerts.length}</strong> ${alerts.length === 1 ? 'piano que requiere' : 'pianos que requieren'} atención.
          </p>

          <div class="summary">
            <div class="summary-card summary-urgent">
              <div class="summary-number" style="color: #EF4444;">${urgentCount}</div>
              <div class="summary-label" style="color: #EF4444;">Urgentes</div>
            </div>
            <div class="summary-card summary-pending">
              <div class="summary-number" style="color: #F59E0B;">${pendingCount}</div>
              <div class="summary-label" style="color: #F59E0B;">Pendientes</div>
            </div>
          </div>

          <h3 style="margin-top: 30px; margin-bottom: 16px; color: #111827;">Detalles de Alertas</h3>

          ${alerts
            .map(
              (alert) => `
            <div class="alert-item ${alert.priority === 'urgent' ? 'alert-item-urgent' : 'alert-item-pending'}">
              <div class="alert-piano">${alert.piano.brand} ${alert.piano.model}</div>
              <div class="alert-client">${alert.client.name}</div>
              <div style="margin-top: 8px;">
                <span class="alert-type">${
                  alert.type === 'tuning'
                    ? 'Afinación'
                    : alert.type === 'regulation'
                    ? 'Regulación'
                    : 'Reparación'
                }</span>
                <span class="alert-days">${alert.daysSinceLastService} días desde último servicio</span>
              </div>
            </div>
          `
            )
            .join('')}

          <div style="text-align: center;">
            <a href="https://www.pianoemotion.com" class="cta-button">
              Ver todas las alertas
            </a>
          </div>

          <div class="footer">
            <p>
              Recibes este resumen semanal porque lo tienes activado en tu configuración.<br>
              Puedes modificar la frecuencia o desactivarlo en cualquier momento.
            </p>
            <p style="margin-top: 10px;">
              © ${new Date().getFullYear()} Piano Emotion. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email usando el servicio unificado (Gmail o Outlook)
    const sent = await UnifiedEmailService.sendEmail({
      to: userEmail,
      subject,
      html,
      userEmail,
    });

    if (!sent) {
      console.error('Failed to send weekly digest email');
      throw new Error('Failed to send weekly digest email');
    }

    console.log('Weekly digest email sent successfully to:', userEmail);
  }

  /**
   * Procesar resúmenes semanales para todos los usuarios
   * Esta función debe ser llamada por un cron job
   */
  static async processWeeklyDigests(): Promise<void> {
    try {
      // Obtener día actual (1 = Lunes, 7 = Domingo)
      const today = new Date().getDay() || 7;

      // Obtener todos los usuarios con resumen semanal habilitado para hoy
      const settings = await getDb().query.alertSettings.findMany({
        where: and(
          eq(alertSettings.weeklyDigestEnabled, true),
          eq(alertSettings.weeklyDigestDay, today)
        ),
      });

      console.log(`Processing weekly digests for ${settings.length} users`);

      for (const setting of settings) {
        try {
          await this.sendWeeklyDigest(setting.userId);
        } catch (error) {
          console.error(`Error sending weekly digest to user ${setting.userId}:`, error);
        }
      }

      console.log('Weekly digests processing completed');
    } catch (error) {
      console.error('Error processing weekly digests:', error);
    }
  }
}
