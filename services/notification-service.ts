import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SCHEDULED_NOTIFICATIONS_KEY = '@piano_emotion_scheduled_notifications';
const NOTIFICATION_HISTORY_KEY = '@piano_emotion_notification_history';

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

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  scheduledFor: string;
  createdAt: string;
  entityId?: string;
  entityType?: 'appointment' | 'piano' | 'client' | 'invoice' | 'material';
}

export interface NotificationHistoryItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  sentAt: string;
  read: boolean;
  actionTaken?: string;
}

/**
 * Servicio centralizado de notificaciones push
 */
class NotificationService {
  private initialized = false;

  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Configurar handler de notificaciones
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Configurar canal de notificaciones para Android
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    this.initialized = true;
  }

  /**
   * Configurar canales de notificación para Android
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Citas',
      description: 'Recordatorios de citas programadas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e94560',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Mantenimiento',
      description: 'Recordatorios de mantenimiento de pianos',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#f39c12',
    });

    await Notifications.setNotificationChannelAsync('inventory', {
      name: 'Inventario',
      description: 'Alertas de stock bajo',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#e74c3c',
    });

    await Notifications.setNotificationChannelAsync('invoices', {
      name: 'Facturas',
      description: 'Notificaciones de facturas',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#27ae60',
    });

    await Notifications.setNotificationChannelAsync('sync', {
      name: 'Sincronización',
      description: 'Estado de sincronización de datos',
      importance: Notifications.AndroidImportance.LOW,
      lightColor: '#3498db',
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      description: 'Notificaciones generales',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Obtener el canal de Android según el tipo de notificación
   */
  private getChannelId(type: NotificationType): string {
    switch (type) {
      case 'appointment_reminder':
        return 'appointments';
      case 'maintenance_due':
        return 'maintenance';
      case 'stock_low':
        return 'inventory';
      case 'invoice_overdue':
      case 'invoice_paid':
        return 'invoices';
      case 'sync_completed':
      case 'sync_error':
        return 'sync';
      default:
        return 'general';
    }
  }

  /**
   * Obtener el icono/emoji según el tipo de notificación
   */
  private getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'appointment_reminder':
        return '📅';
      case 'maintenance_due':
        return '🎹';
      case 'stock_low':
        return '⚠️';
      case 'invoice_overdue':
        return '💰';
      case 'invoice_paid':
        return '✅';
      case 'service_completed':
        return '🔧';
      case 'client_birthday':
        return '🎂';
      case 'sync_completed':
        return '🔄';
      case 'sync_error':
        return '❌';
      default:
        return '📢';
    }
  }

  /**
   * Programar una notificación
   */
  async scheduleNotification(
    type: NotificationType,
    title: string,
    body: string,
    triggerDate: Date,
    data: Record<string, any> = {},
    entityId?: string,
    entityType?: ScheduledNotification['entityType']
  ): Promise<string | null> {
    try {
      // No programar si la fecha ya pasó
      if (triggerDate <= new Date()) {
        console.log('Notification date has passed, skipping');
        return null;
      }

      const icon = this.getNotificationIcon(type);
      const channelId = this.getChannelId(type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${icon} ${title}`,
          body,
          data: { type, ...data },
          sound: true,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      // Guardar en registro de notificaciones programadas
      await this.saveScheduledNotification({
        id: notificationId,
        type,
        title,
        body,
        data,
        scheduledFor: triggerDate.toISOString(),
        createdAt: new Date().toISOString(),
        entityId,
        entityType,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Enviar notificación inmediata
   */
  async sendImmediateNotification(
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const icon = this.getNotificationIcon(type);
      const channelId = this.getChannelId(type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${icon} ${title}`,
          body,
          data: { type, ...data },
          sound: true,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger: null, // Enviar inmediatamente
      });

      // Guardar en historial
      await this.addToHistory({
        id: notificationId,
        type,
        title,
        body,
        data,
        sentAt: new Date().toISOString(),
        read: false,
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }

  /**
   * Programar recordatorio de cita
   */
  async scheduleAppointmentReminder(
    appointmentId: string,
    clientName: string,
    serviceName: string,
    appointmentDate: Date,
    minutesBefore: number = 60
  ): Promise<string | null> {
    const triggerDate = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);
    
    const timeText = minutesBefore >= 60 
      ? `${Math.floor(minutesBefore / 60)} hora${minutesBefore >= 120 ? 's' : ''}`
      : `${minutesBefore} minutos`;

    return this.scheduleNotification(
      'appointment_reminder',
      'Cita próxima',
      `${serviceName} con ${clientName} en ${timeText}`,
      triggerDate,
      { appointmentId, clientName, serviceName },
      appointmentId,
      'appointment'
    );
  }

  /**
   * Programar recordatorio de mantenimiento
   */
  async scheduleMaintenanceReminder(
    pianoId: string,
    pianoName: string,
    clientName: string,
    dueDate: Date,
    daysBefore: number = 7
  ): Promise<string | null> {
    const triggerDate = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

    return this.scheduleNotification(
      'maintenance_due',
      'Mantenimiento pendiente',
      `${pianoName} de ${clientName} necesita mantenimiento`,
      triggerDate,
      { pianoId, pianoName, clientName, dueDate: dueDate.toISOString() },
      pianoId,
      'piano'
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
    return this.sendImmediateNotification(
      'stock_low',
      'Stock bajo',
      `${materialName}: ${currentStock} unidades (mínimo: ${minStock})`,
      { materialId, materialName, currentStock, minStock }
    );
  }

  /**
   * Programar recordatorio de factura vencida
   */
  async scheduleInvoiceOverdueReminder(
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    amount: number,
    dueDate: Date,
    currency: string = '€'
  ): Promise<string | null> {
    // Notificar el día después del vencimiento
    const triggerDate = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000);

    return this.scheduleNotification(
      'invoice_overdue',
      'Factura vencida',
      `Factura ${invoiceNumber} de ${clientName} (${amount}${currency}) está vencida`,
      triggerDate,
      { invoiceId, invoiceNumber, clientName, amount },
      invoiceId,
      'invoice'
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
    return this.sendImmediateNotification(
      'invoice_paid',
      'Pago recibido',
      `Factura ${invoiceNumber} de ${clientName} pagada (${amount}${currency})`,
      { invoiceId, invoiceNumber, clientName, amount }
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
    return this.sendImmediateNotification(
      'service_completed',
      'Servicio completado',
      `${serviceName} en ${pianoName} de ${clientName}`,
      { serviceId, serviceName, clientName, pianoName }
    );
  }

  /**
   * Programar recordatorio de cumpleaños de cliente
   */
  async scheduleClientBirthdayReminder(
    clientId: string,
    clientName: string,
    birthday: Date
  ): Promise<string | null> {
    // Programar para las 9:00 AM del día del cumpleaños
    const triggerDate = new Date(birthday);
    triggerDate.setHours(9, 0, 0, 0);

    return this.scheduleNotification(
      'client_birthday',
      'Cumpleaños de cliente',
      `Hoy es el cumpleaños de ${clientName}`,
      triggerDate,
      { clientId, clientName },
      clientId,
      'client'
    );
  }

  /**
   * Enviar notificación de sincronización completada
   */
  async sendSyncCompletedNotification(
    itemsCount: number,
    syncType: string = 'datos'
  ): Promise<string | null> {
    return this.sendImmediateNotification(
      'sync_completed',
      'Sincronización completada',
      `Se han sincronizado ${itemsCount} ${syncType}`,
      { itemsCount, syncType }
    );
  }

  /**
   * Enviar notificación de error de sincronización
   */
  async sendSyncErrorNotification(
    errorMessage: string
  ): Promise<string | null> {
    return this.sendImmediateNotification(
      'sync_error',
      'Error de sincronización',
      errorMessage,
      { errorMessage }
    );
  }

  /**
   * Cancelar una notificación programada
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancelar todas las notificaciones de una entidad
   */
  async cancelNotificationsForEntity(
    entityId: string,
    entityType: ScheduledNotification['entityType']
  ): Promise<void> {
    const scheduled = await this.getScheduledNotifications();
    const toCancel = scheduled.filter(
      n => n.entityId === entityId && n.entityType === entityType
    );

    for (const notification of toCancel) {
      await this.cancelNotification(notification.id);
    }
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Obtener notificaciones programadas
   */
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Guardar notificación programada
   */
  private async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      scheduled.push(notification);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduled));
    } catch (error) {
      console.error('Error saving scheduled notification:', error);
    }
  }

  /**
   * Eliminar notificación programada del registro
   */
  private async removeScheduledNotification(notificationId: string): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const filtered = scheduled.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing scheduled notification:', error);
    }
  }

  /**
   * Obtener historial de notificaciones
   */
  async getNotificationHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Añadir al historial de notificaciones
   */
  private async addToHistory(item: NotificationHistoryItem): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.unshift(item); // Añadir al principio
      
      // Mantener solo las últimas 100 notificaciones
      const trimmed = history.slice(0, 100);
      
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error adding to notification history:', error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map(item =>
        item.id === notificationId ? { ...item, read: true } : item
      );
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map(item => ({ ...item, read: true }));
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    const history = await this.getNotificationHistory();
    return history.filter(item => !item.read).length;
  }

  /**
   * Limpiar historial de notificaciones
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }

  /**
   * Limpiar notificaciones programadas expiradas
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const now = new Date();
      const valid = scheduled.filter(n => new Date(n.scheduledFor) > now);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(valid));
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();

export default notificationService;
