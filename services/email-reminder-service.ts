import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_REMINDER_SETTINGS_KEY = '@piano_emotion_email_reminder_settings';
const SCHEDULED_EMAILS_KEY = '@piano_emotion_scheduled_emails';

export type EmailReminderType = 
  | 'appointment_reminder'
  | 'maintenance_due'
  | 'invoice_overdue'
  | 'invoice_due_soon'
  | 'client_birthday'
  | 'weekly_summary'
  | 'monthly_report';

export interface EmailReminderSettings {
  enabled: boolean;
  recipientEmail: string;
  appointmentReminders: boolean;
  appointmentReminderHours: number; // horas antes
  maintenanceReminders: boolean;
  maintenanceReminderDays: number; // días antes
  invoiceReminders: boolean;
  invoiceReminderDays: number; // días antes del vencimiento
  clientBirthdays: boolean;
  weeklySummary: boolean;
  weeklySummaryDay: number; // 0-6 (domingo-sábado)
  monthlyReport: boolean;
  monthlyReportDay: number; // 1-28
}

export interface ScheduledEmailReminder {
  id: string;
  type: EmailReminderType;
  recipientEmail: string;
  subject: string;
  scheduledFor: string;
  entityId?: string;
  entityType?: string;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

const DEFAULT_SETTINGS: EmailReminderSettings = {
  enabled: true,
  recipientEmail: '',
  appointmentReminders: true,
  appointmentReminderHours: 24, // 1 día antes
  maintenanceReminders: true,
  maintenanceReminderDays: 7, // 1 semana antes
  invoiceReminders: true,
  invoiceReminderDays: 3, // 3 días antes del vencimiento
  clientBirthdays: true,
  weeklySummary: false,
  weeklySummaryDay: 1, // Lunes
  monthlyReport: false,
  monthlyReportDay: 1, // Día 1 del mes
};

/**
 * Servicio de recordatorios por email
 * 
 * NOTA: Este servicio prepara los datos para envío de emails.
 * El envío real se realizará desde el backend (server/src/routes/email.ts)
 * usando un servicio de email como SendGrid, Mailgun, o similar.
 */
class EmailReminderService {
  private settings: EmailReminderSettings = DEFAULT_SETTINGS;
  private scheduledEmails: ScheduledEmailReminder[] = [];
  private initialized = false;

  /**
   * Inicializar el servicio
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadSettings();
    await this.loadScheduledEmails();
    this.initialized = true;
  }

  /**
   * Cargar configuración
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(EMAIL_REMINDER_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[EmailReminder] Error loading settings:', error);
    }
  }

  /**
   * Guardar configuración
   */
  async saveSettings(settings: Partial<EmailReminderSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(EMAIL_REMINDER_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[EmailReminder] Error saving settings:', error);
    }
  }

  /**
   * Obtener configuración actual
   */
  getSettings(): EmailReminderSettings {
    return { ...this.settings };
  }

  /**
   * Cargar emails programados
   */
  private async loadScheduledEmails(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_EMAILS_KEY);
      if (stored) {
        this.scheduledEmails = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[EmailReminder] Error loading scheduled emails:', error);
    }
  }

  /**
   * Guardar emails programados
   */
  private async saveScheduledEmails(): Promise<void> {
    try {
      await AsyncStorage.setItem(SCHEDULED_EMAILS_KEY, JSON.stringify(this.scheduledEmails));
    } catch (error) {
      console.error('[EmailReminder] Error saving scheduled emails:', error);
    }
  }

  /**
   * Programar recordatorio de cita por email
   */
  async scheduleAppointmentReminder(appointment: {
    id: string;
    clientName: string;
    clientEmail?: string;
    serviceName: string;
    date: Date;
    location?: string;
    notes?: string;
  }): Promise<string | null> {
    if (!this.settings.enabled || !this.settings.appointmentReminders) {
      return null;
    }

    const reminderDate = new Date(appointment.date);
    reminderDate.setHours(reminderDate.getHours() - this.settings.appointmentReminderHours);

    // No programar si la fecha ya pasó
    if (reminderDate <= new Date()) {
      return null;
    }

    const email: ScheduledEmailReminder = {
      id: `apt_${appointment.id}_${Date.now()}`,
      type: 'appointment_reminder',
      recipientEmail: this.settings.recipientEmail,
      subject: `Recordatorio: Cita con ${appointment.clientName}`,
      scheduledFor: reminderDate.toISOString(),
      entityId: appointment.id,
      entityType: 'appointment',
      data: {
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.date.toISOString(),
        location: appointment.location,
        notes: appointment.notes,
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.scheduledEmails.push(email);
    await this.saveScheduledEmails();

    return email.id;
  }

  /**
   * Programar recordatorio de mantenimiento por email
   */
  async scheduleMaintenanceReminder(maintenance: {
    id: string;
    pianoName: string;
    clientName: string;
    clientEmail?: string;
    dueDate: Date;
    notes?: string;
  }): Promise<string | null> {
    if (!this.settings.enabled || !this.settings.maintenanceReminders) {
      return null;
    }

    const reminderDate = new Date(maintenance.dueDate);
    reminderDate.setDate(reminderDate.getDate() - this.settings.maintenanceReminderDays);

    if (reminderDate <= new Date()) {
      return null;
    }

    const email: ScheduledEmailReminder = {
      id: `maint_${maintenance.id}_${Date.now()}`,
      type: 'maintenance_due',
      recipientEmail: this.settings.recipientEmail,
      subject: `Mantenimiento pendiente: ${maintenance.pianoName}`,
      scheduledFor: reminderDate.toISOString(),
      entityId: maintenance.id,
      entityType: 'piano',
      data: {
        pianoName: maintenance.pianoName,
        clientName: maintenance.clientName,
        clientEmail: maintenance.clientEmail,
        dueDate: maintenance.dueDate.toISOString(),
        notes: maintenance.notes,
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.scheduledEmails.push(email);
    await this.saveScheduledEmails();

    return email.id;
  }

  /**
   * Programar recordatorio de factura por email
   */
  async scheduleInvoiceReminder(invoice: {
    id: string;
    number: string;
    clientName: string;
    clientEmail?: string;
    amount: number;
    currency: string;
    dueDate: Date;
  }): Promise<string | null> {
    if (!this.settings.enabled || !this.settings.invoiceReminders) {
      return null;
    }

    const reminderDate = new Date(invoice.dueDate);
    reminderDate.setDate(reminderDate.getDate() - this.settings.invoiceReminderDays);

    if (reminderDate <= new Date()) {
      return null;
    }

    const email: ScheduledEmailReminder = {
      id: `inv_${invoice.id}_${Date.now()}`,
      type: 'invoice_due_soon',
      recipientEmail: this.settings.recipientEmail,
      subject: `Factura próxima a vencer: ${invoice.number}`,
      scheduledFor: reminderDate.toISOString(),
      entityId: invoice.id,
      entityType: 'invoice',
      data: {
        invoiceNumber: invoice.number,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate.toISOString(),
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.scheduledEmails.push(email);
    await this.saveScheduledEmails();

    return email.id;
  }

  /**
   * Obtener emails pendientes de envío
   * El backend consultará esto para enviar los emails
   */
  async getPendingEmails(): Promise<ScheduledEmailReminder[]> {
    const now = new Date();
    return this.scheduledEmails.filter(
      email => email.status === 'pending' && new Date(email.scheduledFor) <= now
    );
  }

  /**
   * Marcar email como enviado
   */
  async markAsSent(emailId: string): Promise<void> {
    const email = this.scheduledEmails.find(e => e.id === emailId);
    if (email) {
      email.status = 'sent';
      email.sentAt = new Date().toISOString();
      await this.saveScheduledEmails();
    }
  }

  /**
   * Marcar email como fallido
   */
  async markAsFailed(emailId: string, error: string): Promise<void> {
    const email = this.scheduledEmails.find(e => e.id === emailId);
    if (email) {
      email.status = 'failed';
      email.error = error;
      await this.saveScheduledEmails();
    }
  }

  /**
   * Cancelar email programado
   */
  async cancelEmail(emailId: string): Promise<void> {
    this.scheduledEmails = this.scheduledEmails.filter(e => e.id !== emailId);
    await this.saveScheduledEmails();
  }

  /**
   * Cancelar emails de una entidad
   */
  async cancelEmailsForEntity(entityId: string, entityType: string): Promise<void> {
    this.scheduledEmails = this.scheduledEmails.filter(
      e => !(e.entityId === entityId && e.entityType === entityType && e.status === 'pending')
    );
    await this.saveScheduledEmails();
  }

  /**
   * Obtener todos los emails programados
   */
  getScheduledEmails(): ScheduledEmailReminder[] {
    return [...this.scheduledEmails];
  }

  /**
   * Limpiar emails antiguos (enviados o fallidos hace más de 30 días)
   */
  async cleanupOldEmails(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.scheduledEmails = this.scheduledEmails.filter(email => {
      if (email.status === 'pending') return true;
      const date = email.sentAt ? new Date(email.sentAt) : new Date(email.createdAt);
      return date > thirtyDaysAgo;
    });

    await this.saveScheduledEmails();
  }

  /**
   * Generar plantilla de email HTML
   * Esto se usará en el backend para generar el contenido del email
   */
  generateEmailTemplate(email: ScheduledEmailReminder): { subject: string; html: string; text: string } {
    const { type, data } = email;

    switch (type) {
      case 'appointment_reminder':
        return this.generateAppointmentReminderTemplate(data);
      case 'maintenance_due':
        return this.generateMaintenanceReminderTemplate(data);
      case 'invoice_due_soon':
      case 'invoice_overdue':
        return this.generateInvoiceReminderTemplate(data, type === 'invoice_overdue');
      case 'client_birthday':
        return this.generateBirthdayReminderTemplate(data);
      default:
        return {
          subject: email.subject,
          html: `<p>${JSON.stringify(data)}</p>`,
          text: JSON.stringify(data),
        };
    }
  }

  private generateAppointmentReminderTemplate(data: any): { subject: string; html: string; text: string } {
    const date = new Date(data.appointmentDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      subject: `Recordatorio: Cita con ${data.clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e94560;">📅 Recordatorio de Cita</h2>
          <p>Tienes una cita programada:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Servicio:</strong> ${data.serviceName}</p>
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            ${data.location ? `<p><strong>Ubicación:</strong> ${data.location}</p>` : ''}
            ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 12px;">Este es un recordatorio automático de Piano Emotion Manager.</p>
        </div>
      `,
      text: `Recordatorio de Cita\n\nCliente: ${data.clientName}\nServicio: ${data.serviceName}\nFecha: ${formattedDate}\n${data.location ? `Ubicación: ${data.location}\n` : ''}${data.notes ? `Notas: ${data.notes}` : ''}`,
    };
  }

  private generateMaintenanceReminderTemplate(data: any): { subject: string; html: string; text: string } {
    const date = new Date(data.dueDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return {
      subject: `🎹 Mantenimiento pendiente: ${data.pianoName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e94560;">🎹 Mantenimiento Pendiente</h2>
          <p>Un piano necesita mantenimiento próximamente:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Piano:</strong> ${data.pianoName}</p>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Fecha prevista:</strong> ${formattedDate}</p>
            ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ''}
          </div>
          <p style="color: #666; font-size: 12px;">Este es un recordatorio automático de Piano Emotion Manager.</p>
        </div>
      `,
      text: `Mantenimiento Pendiente\n\nPiano: ${data.pianoName}\nCliente: ${data.clientName}\nFecha prevista: ${formattedDate}\n${data.notes ? `Notas: ${data.notes}` : ''}`,
    };
  }

  private generateInvoiceReminderTemplate(data: any, isOverdue: boolean): { subject: string; html: string; text: string } {
    const date = new Date(data.dueDate);
    const formattedDate = date.toLocaleDateString('es-ES');

    const title = isOverdue ? '⚠️ Factura Vencida' : '💰 Factura Próxima a Vencer';
    const message = isOverdue 
      ? 'La siguiente factura está vencida:'
      : 'La siguiente factura vence pronto:';

    return {
      subject: `${isOverdue ? '⚠️' : '💰'} Factura ${data.invoiceNumber} - ${data.clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isOverdue ? '#e74c3c' : '#f39c12'};">${title}</h2>
          <p>${message}</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Factura:</strong> ${data.invoiceNumber}</p>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Importe:</strong> ${data.amount}${data.currency}</p>
            <p><strong>Vencimiento:</strong> ${formattedDate}</p>
          </div>
          <p style="color: #666; font-size: 12px;">Este es un recordatorio automático de Piano Emotion Manager.</p>
        </div>
      `,
      text: `${title}\n\nFactura: ${data.invoiceNumber}\nCliente: ${data.clientName}\nImporte: ${data.amount}${data.currency}\nVencimiento: ${formattedDate}`,
    };
  }

  private generateBirthdayReminderTemplate(data: any): { subject: string; html: string; text: string } {
    return {
      subject: `🎂 Cumpleaños de ${data.clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e94560;">🎂 Cumpleaños de Cliente</h2>
          <p>Hoy es el cumpleaños de uno de tus clientes:</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            ${data.clientEmail ? `<p><strong>Email:</strong> ${data.clientEmail}</p>` : ''}
            ${data.phone ? `<p><strong>Teléfono:</strong> ${data.phone}</p>` : ''}
          </div>
          <p>¡Es una buena oportunidad para enviarle una felicitación!</p>
          <p style="color: #666; font-size: 12px;">Este es un recordatorio automático de Piano Emotion Manager.</p>
        </div>
      `,
      text: `Cumpleaños de Cliente\n\nHoy es el cumpleaños de ${data.clientName}.\n¡Es una buena oportunidad para enviarle una felicitación!`,
    };
  }
}

// Exportar instancia singleton
export const emailReminderService = new EmailReminderService();

export default emailReminderService;
