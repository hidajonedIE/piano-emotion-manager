/**
 * Servicio de Email
 * Piano Emotion Manager
 * 
 * Gestiona el envío de emails transaccionales para la aplicación.
 */

import nodemailer from 'nodemailer';

// ==========================================
// TIPOS
// ==========================================

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  organizationName: string;
  inviterName: string;
  role: string;
  invitationToken: string;
  customMessage?: string;
  expiresAt: Date;
}

export interface AssignmentNotificationData {
  technicianEmail: string;
  technicianName: string;
  clientName: string;
  clientAddress?: string;
  serviceType: string;
  scheduledDate: Date;
  scheduledTime?: string;
  priority: string;
  notes?: string;
}

export interface WorkCompletedNotificationData {
  managerEmail: string;
  technicianName: string;
  clientName: string;
  serviceType: string;
  completedAt: Date;
  duration: number;
  notes?: string;
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const getEmailConfig = (): EmailConfig => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const APP_URL = process.env.APP_URL || 'https://app.pianoemotion.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Piano Emotion <noreply@pianoemotion.com>';

// ==========================================
// SERVICIO DE EMAIL
// ==========================================

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  
  /**
   * Inicializa el transporter de nodemailer
   */
  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const config = getEmailConfig();
      
      // En desarrollo, usar ethereal.email para testing
      if (process.env.NODE_ENV === 'development' && !config.auth.user) {
        console.log('📧 Email service running in development mode (emails will be logged)');
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      } else {
        this.transporter = nodemailer.createTransport(config);
      }
    }
    
    return this.transporter;
  }
  
  /**
   * Envía un email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };
      
      const result = await transporter.sendMail(mailOptions);
      
      // En desarrollo, loguear el email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent (dev mode):', {
          to: options.to,
          subject: options.subject,
          messageId: result.messageId,
        });
        
        // Si es jsonTransport, el mensaje está en result.message
        if (result.message) {
          console.log('📧 Email content:', JSON.parse(result.message));
        }
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false };
    }
  }
  
  /**
   * Envía invitación a unirse a una organización
   */
  async sendInvitation(data: InvitationEmailData): Promise<{ success: boolean }> {
    const invitationUrl = `${APP_URL}/accept-invitation?token=${data.invitationToken}`;
    const roleLabel = this.getRoleLabel(data.role);
    const expiresFormatted = data.expiresAt.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a ${data.organizationName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .content { padding: 30px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #1d4ed8; }
    .info-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
    .expires { color: #ef4444; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎹 Piano Emotion</div>
    </div>
    
    <div class="content">
      <h1>¡Te han invitado a unirte!</h1>
      
      <p>Hola${data.recipientName ? ` ${data.recipientName}` : ''},</p>
      
      <p><strong>${data.inviterName}</strong> te ha invitado a unirte a <strong>${data.organizationName}</strong> como <strong>${roleLabel}</strong>.</p>
      
      ${data.customMessage ? `
      <div class="info-box">
        <p><em>"${data.customMessage}"</em></p>
        <p style="text-align: right; margin: 0;">— ${data.inviterName}</p>
      </div>
      ` : ''}
      
      <p>Haz clic en el siguiente botón para aceptar la invitación:</p>
      
      <p style="text-align: center;">
        <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
      </p>
      
      <p class="expires">⏰ Esta invitación expira el ${expiresFormatted}</p>
      
      <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${invitationUrl}</p>
    </div>
    
    <div class="footer">
      <p>Este email fue enviado por Piano Emotion Manager.</p>
      <p>Si no esperabas esta invitación, puedes ignorar este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const text = `
¡Te han invitado a unirte a ${data.organizationName}!

Hola${data.recipientName ? ` ${data.recipientName}` : ''},

${data.inviterName} te ha invitado a unirte a ${data.organizationName} como ${roleLabel}.

${data.customMessage ? `Mensaje: "${data.customMessage}"` : ''}

Para aceptar la invitación, visita este enlace:
${invitationUrl}

Esta invitación expira el ${expiresFormatted}.

---
Piano Emotion Manager
    `;
    
    return this.send({
      to: data.recipientEmail,
      subject: `Invitación a unirte a ${data.organizationName} - Piano Emotion`,
      html,
      text,
    });
  }
  
  /**
   * Envía notificación de nueva asignación al técnico
   */
  async sendAssignmentNotification(data: AssignmentNotificationData): Promise<{ success: boolean }> {
    const dateFormatted = data.scheduledDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    
    const priorityLabel = this.getPriorityLabel(data.priority);
    const priorityColor = this.getPriorityColor(data.priority);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Asignación de Trabajo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .content { padding: 30px 0; }
    .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .details { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; width: 120px; color: #666; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎹 Piano Emotion</div>
    </div>
    
    <div class="content">
      <h1>Nueva Asignación de Trabajo</h1>
      
      <p>Hola ${data.technicianName},</p>
      
      <p>Se te ha asignado un nuevo trabajo:</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Cliente:</span>
          <span>${data.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio:</span>
          <span>${data.serviceType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha:</span>
          <span>${dateFormatted}</span>
        </div>
        ${data.scheduledTime ? `
        <div class="detail-row">
          <span class="detail-label">Hora:</span>
          <span>${data.scheduledTime}</span>
        </div>
        ` : ''}
        ${data.clientAddress ? `
        <div class="detail-row">
          <span class="detail-label">Dirección:</span>
          <span>${data.clientAddress}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Prioridad:</span>
          <span class="priority" style="background: ${priorityColor}20; color: ${priorityColor};">${priorityLabel}</span>
        </div>
        ${data.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notas:</span>
          <span>${data.notes}</span>
        </div>
        ` : ''}
      </div>
      
      <p style="text-align: center;">
        <a href="${APP_URL}/team/calendar" class="button">Ver en Calendario</a>
      </p>
    </div>
    
    <div class="footer">
      <p>Piano Emotion Manager</p>
    </div>
  </div>
</body>
</html>
    `;
    
    return this.send({
      to: data.technicianEmail,
      subject: `Nueva asignación: ${data.serviceType} - ${data.clientName}`,
      html,
    });
  }
  
  /**
   * Envía notificación de trabajo completado al manager
   */
  async sendWorkCompletedNotification(data: WorkCompletedNotificationData): Promise<{ success: boolean }> {
    const completedFormatted = data.completedAt.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const durationFormatted = `${Math.floor(data.duration / 60)}h ${data.duration % 60}min`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
    .detail { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: 600; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">✅ Trabajo Completado</h2>
    </div>
    <div class="content">
      <div class="detail">
        <span class="label">Técnico:</span> ${data.technicianName}
      </div>
      <div class="detail">
        <span class="label">Cliente:</span> ${data.clientName}
      </div>
      <div class="detail">
        <span class="label">Servicio:</span> ${data.serviceType}
      </div>
      <div class="detail">
        <span class="label">Completado:</span> ${completedFormatted}
      </div>
      <div class="detail">
        <span class="label">Duración:</span> ${durationFormatted}
      </div>
      ${data.notes ? `
      <div class="detail">
        <span class="label">Notas:</span> ${data.notes}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;
    
    return this.send({
      to: data.managerEmail,
      subject: `✅ Trabajo completado: ${data.serviceType} - ${data.clientName}`,
      html,
    });
  }
  
  // ==========================================
  // HELPERS
  // ==========================================
  
  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      owner: 'Propietario',
      admin: 'Administrador',
      manager: 'Gestor',
      senior_tech: 'Técnico Senior',
      technician: 'Técnico',
      apprentice: 'Aprendiz',
      receptionist: 'Recepcionista',
      accountant: 'Contable',
      viewer: 'Observador',
    };
    return labels[role] || role;
  }
  
  private getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  }
  
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority] || '#6b7280';
  }
}

// ==========================================
// EXPORTACIÓN
// ==========================================

export const emailService = new EmailService();
export default emailService;
