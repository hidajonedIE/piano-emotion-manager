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

export interface StockAlertItem {
  name: string;
  currentStock: number;
  minStock: number;
  category?: string;
}

export interface StockAlertData {
  recipientEmail: string;
  criticalItems: StockAlertItem[];
  lowStockItems: StockAlertItem[];
  inventoryUrl?: string;
}

export interface StockReportData {
  recipientEmail: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalItems: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  recentMovements: number;
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
          to: options.to,
          subject: options.subject,
          messageId: result.messageId,
        });
        
        // Si es jsonTransport, el mensaje está en result.message
        if (result.message) {
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
  // NOTIFICACIONES DE STOCK
  // ==========================================
  
  async sendStockAlert(data: StockAlertData): Promise<{ success: boolean }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
    .alert-box.critical { background: #fee2e2; border-left-color: #ef4444; }
    .item-list { margin: 20px 0; }
    .item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .item-name { font-weight: 500; }
    .item-stock { color: #ef4444; font-weight: bold; }
    .item-stock.warning { color: #f59e0b; }
    .footer { padding: 20px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Alerta de Stock Bajo</h1>
    </div>
    <div class="content">
      <div class="alert-box ${data.criticalItems.length > 0 ? 'critical' : ''}">
        <strong>${data.criticalItems.length > 0 ? '¡Atención!' : 'Aviso:'}</strong>
        ${data.criticalItems.length > 0 
          ? `Hay ${data.criticalItems.length} artículo(s) con stock crítico que requieren atención inmediata.`
          : `Hay ${data.lowStockItems.length} artículo(s) con stock bajo.`
        }
      </div>
      
      ${data.criticalItems.length > 0 ? `
      <h3 style="color: #ef4444;">🚨 Stock Crítico (0 unidades)</h3>
      <div class="item-list">
        ${data.criticalItems.map(item => `
        <div class="item">
          <span class="item-name">${item.name}</span>
          <span class="item-stock">${item.currentStock} / ${item.minStock} mín.</span>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      ${data.lowStockItems.length > 0 ? `
      <h3 style="color: #f59e0b;">⚠️ Stock Bajo</h3>
      <div class="item-list">
        ${data.lowStockItems.map(item => `
        <div class="item">
          <span class="item-name">${item.name}</span>
          <span class="item-stock warning">${item.currentStock} / ${item.minStock} mín.</span>
        </div>
        `).join('')}
      </div>
      ` : ''}
      
      <p style="color: #6b7280; margin-top: 20px;">
        Este es un resumen automático generado el ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.
      </p>
      
      <a href="${data.inventoryUrl || '#'}" class="btn">Ver Inventario Completo</a>
    </div>
    <div class="footer">
      <p>Piano Emotion Manager - Gestión de Inventario</p>
      <p>Puedes configurar las alertas de stock en Ajustes > Inventario</p>
    </div>
  </div>
</body>
</html>
    `;
    
    return this.send({
      to: data.recipientEmail,
      subject: `⚠️ Alerta de Stock: ${data.criticalItems.length > 0 ? 'Artículos críticos' : 'Stock bajo'} - ${data.criticalItems.length + data.lowStockItems.length} artículo(s)`,
      html,
    });
  }
  
  async sendStockReportSummary(data: StockReportData): Promise<{ success: boolean }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    .stat-card.warning .stat-value { color: #f59e0b; }
    .stat-card.danger .stat-value { color: #ef4444; }
    .stat-card.success .stat-value { color: #10b981; }
    .footer { padding: 20px; background: #f9fafb; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Resumen de Inventario</h1>
    </div>
    <div class="content">
      <p>Hola, aquí tienes el resumen ${data.period === 'daily' ? 'diario' : data.period === 'weekly' ? 'semanal' : 'mensual'} de tu inventario:</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.totalItems}</div>
          <div class="stat-label">Total Artículos</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">${data.inStockItems}</div>
          <div class="stat-label">En Stock</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${data.lowStockItems}</div>
          <div class="stat-label">Stock Bajo</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${data.outOfStockItems}</div>
          <div class="stat-label">Sin Stock</div>
        </div>
      </div>
      
      <p style="color: #6b7280;">
        Valor total del inventario: <strong>€${data.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</strong>
      </p>
      
      ${data.recentMovements > 0 ? `
      <p style="color: #6b7280;">
        Movimientos en el período: <strong>${data.recentMovements}</strong>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      <p>Piano Emotion Manager - Gestión de Inventario</p>
    </div>
  </div>
</body>
</html>
    `;
    
    return this.send({
      to: data.recipientEmail,
      subject: `📊 Resumen de Inventario ${data.period === 'daily' ? 'Diario' : data.period === 'weekly' ? 'Semanal' : 'Mensual'} - ${new Date().toLocaleDateString('es-ES')}`,
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
