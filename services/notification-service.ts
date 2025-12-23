import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_HISTORY_KEY = '@piano_emotion_notification_history';
const NOTIFICATION_SETTINGS_KEY = '@piano_emotion_notification_settings';

export type NotificationType = 
  | 'appointment_reminder'
  | 'maintenance_due'
  | 'stock_low'
  | 'invoice_overdue'
  | 'invoice_paid'
  | 'service_completed'
  | 'client_birthday'
  | 'sync_completed'
  | 'sync_error'
  | 'general';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationSettings {
  browserNotifications: boolean;
  emailReminders: boolean;
  inAppNotifications: boolean;
  appointmentReminder: boolean;
  appointmentReminderTime: number; // minutos antes
  maintenanceReminder: boolean;
  stockAlert: boolean;
  invoiceReminder: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  browserNotifications: false,
  emailReminders: true,
  inAppNotifications: true,
  appointmentReminder: true,
  appointmentReminderTime: 60,
  maintenanceReminder: true,
  stockAlert: true,
  invoiceReminder: true,
};

type NotificationListener = (notifications: NotificationItem[]) => void;

/**
 * Servicio de notificaciones para webapp
 * - Web Notifications API para notificaciones del navegador
 * - Notificaciones in-app (centro de notificaciones)
 * - Preparado para integración con email
 */
class WebNotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private notifications: NotificationItem[] = [];
  private initialized = false;

  /**
   * Inicializar el servicio
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadSettings();
    await this.loadNotifications();
    this.initialized = true;
  }

  /**
   * Cargar configuración
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[Notifications] Error loading settings:', error);
    }
  }

  /**
   * Guardar configuración
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[Notifications] Error saving settings:', error);
    }
  }

  /**
   * Obtener configuración actual
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Cargar notificaciones del almacenamiento
   */
  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Notifications] Error loading notifications:', error);
    }
  }

  /**
   * Guardar notificaciones
   */
  private async saveNotifications(): Promise<void> {
    try {
      // Mantener solo las últimas 100 notificaciones
      const toSave = this.notifications.slice(0, 100);
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('[Notifications] Error saving notifications:', error);
    }
  }

  /**
   * Verificar si las notificaciones del navegador están soportadas
   */
  isBrowserNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Obtener estado del permiso de notificaciones del navegador
   */
  getBrowserPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isBrowserNotificationSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Solicitar permiso para notificaciones del navegador
   */
  async requestBrowserPermission(): Promise<boolean> {
    if (!this.isBrowserNotificationSupported()) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted) {
        await this.saveSettings({ browserNotifications: true });
      }
      
      return granted;
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Obtener icono según tipo de notificación
   */
  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'appointment_reminder': return '📅';
      case 'maintenance_due': return '🎹';
      case 'stock_low': return '⚠️';
      case 'invoice_overdue': return '💰';
      case 'invoice_paid': return '✅';
      case 'service_completed': return '🔧';
      case 'client_birthday': return '🎂';
      case 'sync_completed': return '🔄';
      case 'sync_error': return '❌';
      default: return '📢';
    }
  }

  /**
   * Enviar notificación
   */
  async send(
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, any> = {},
    actionUrl?: string
  ): Promise<string> {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const icon = this.getNotificationIcon(type);

    // Crear notificación in-app
    const notification: NotificationItem = {
      id,
      type,
      title: `${icon} ${title}`,
      body,
      data,
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl,
    };

    // Añadir al inicio de la lista
    this.notifications.unshift(notification);
    await this.saveNotifications();
    this.notifyListeners();

    // Enviar notificación del navegador si está habilitado
    if (this.settings.browserNotifications && this.getBrowserPermissionStatus() === 'granted') {
      this.showBrowserNotification(title, body, icon, actionUrl);
    }

    return id;
  }

  /**
   * Mostrar notificación del navegador
   */
  private showBrowserNotification(
    title: string,
    body: string,
    icon: string,
    actionUrl?: string
  ): void {
    try {
      const notification = new Notification(`${icon} ${title}`, {
        body,
        icon: '/icon.png', // Icono de la app
        badge: '/badge.png',
        tag: `piano-emotion-${Date.now()}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        if (actionUrl) {
          window.location.href = actionUrl;
        }
        notification.close();
      };

      // Auto-cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('[Notifications] Error showing browser notification:', error);
    }
  }

  /**
   * Enviar recordatorio de cita
   */
  async sendAppointmentReminder(
    appointmentId: string,
    clientName: string,
    serviceName: string,
    appointmentDate: Date,
    minutesBefore: number = this.settings.appointmentReminderTime
  ): Promise<string | null> {
    if (!this.settings.appointmentReminder) return null;

    const timeText = minutesBefore >= 60 
      ? `${Math.floor(minutesBefore / 60)} hora${minutesBefore >= 120 ? 's' : ''}`
      : `${minutesBefore} minutos`;

    return this.send(
      'appointment_reminder',
      'Cita próxima',
      `${serviceName} con ${clientName} en ${timeText}`,
      { appointmentId, clientName, serviceName, appointmentDate: appointmentDate.toISOString() },
      `/appointments/${appointmentId}`
    );
  }

  /**
   * Enviar recordatorio de mantenimiento
   */
  async sendMaintenanceReminder(
    pianoId: string,
    pianoName: string,
    clientName: string
  ): Promise<string | null> {
    if (!this.settings.maintenanceReminder) return null;

    return this.send(
      'maintenance_due',
      'Mantenimiento pendiente',
      `${pianoName} de ${clientName} necesita mantenimiento`,
      { pianoId, pianoName, clientName },
      `/pianos/${pianoId}`
    );
  }

  /**
   * Enviar alerta de stock bajo
   */
  async sendStockAlert(
    materialId: string,
    materialName: string,
    currentStock: number,
    minStock: number
  ): Promise<string | null> {
    if (!this.settings.stockAlert) return null;

    return this.send(
      'stock_low',
      'Stock bajo',
      `${materialName}: ${currentStock} unidades (mínimo: ${minStock})`,
      { materialId, materialName, currentStock, minStock },
      `/inventory`
    );
  }

  /**
   * Enviar recordatorio de factura vencida
   */
  async sendInvoiceOverdueReminder(
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    amount: number,
    currency: string = '€'
  ): Promise<string | null> {
    if (!this.settings.invoiceReminder) return null;

    return this.send(
      'invoice_overdue',
      'Factura vencida',
      `Factura ${invoiceNumber} de ${clientName} (${amount}${currency}) está vencida`,
      { invoiceId, invoiceNumber, clientName, amount },
      `/invoices/${invoiceId}`
    );
  }

  /**
   * Enviar notificación de factura pagada
   */
  async sendInvoicePaidNotification(
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    amount: number,
    currency: string = '€'
  ): Promise<string | null> {
    return this.send(
      'invoice_paid',
      'Pago recibido',
      `Factura ${invoiceNumber} de ${clientName} pagada (${amount}${currency})`,
      { invoiceId, invoiceNumber, clientName, amount },
      `/invoices/${invoiceId}`
    );
  }

  /**
   * Enviar notificación de servicio completado
   */
  async sendServiceCompletedNotification(
    serviceId: string,
    serviceName: string,
    clientName: string,
    pianoName: string
  ): Promise<string | null> {
    return this.send(
      'service_completed',
      'Servicio completado',
      `${serviceName} en ${pianoName} de ${clientName}`,
      { serviceId, serviceName, clientName, pianoName },
      `/services/${serviceId}`
    );
  }

  /**
   * Enviar notificación de cumpleaños
   */
  async sendClientBirthdayNotification(
    clientId: string,
    clientName: string
  ): Promise<string | null> {
    return this.send(
      'client_birthday',
      'Cumpleaños de cliente',
      `Hoy es el cumpleaños de ${clientName}`,
      { clientId, clientName },
      `/clients/${clientId}`
    );
  }

  /**
   * Obtener todas las notificaciones
   */
  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  /**
   * Obtener notificaciones no leídas
   */
  getUnreadNotifications(): NotificationItem[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Obtener conteo de no leídas
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    await this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Limpiar todas las notificaciones
   */
  async clearAll(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Suscribirse a cambios en las notificaciones
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    
    // Notificar estado actual
    listener(this.getNotifications());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notificar a los listeners
   */
  private notifyListeners(): void {
    const notifications = this.getNotifications();
    this.listeners.forEach(listener => listener(notifications));
  }
}

// Exportar instancia singleton
export const notificationService = new WebNotificationService();

export default notificationService;
