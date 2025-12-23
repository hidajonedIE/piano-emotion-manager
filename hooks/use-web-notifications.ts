import { useState, useEffect, useCallback } from 'react';
import { 
  notificationService, 
  NotificationItem, 
  NotificationSettings,
  NotificationType 
} from '@/services/notification-service';

/**
 * Hook para gestionar notificaciones en webapp
 */
export function useWebNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setIsLoading(true);
    try {
      await notificationService.initialize();
      setSettings(notificationService.getSettings());
      setBrowserPermission(notificationService.getBrowserPermissionStatus());

      // Suscribirse a cambios
      const unsubscribe = notificationService.subscribe((notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Solicitar permiso para notificaciones del navegador
   */
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestBrowserPermission();
    setBrowserPermission(notificationService.getBrowserPermissionStatus());
    setSettings(notificationService.getSettings());
    return granted;
  }, []);

  /**
   * Actualizar configuración
   */
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    await notificationService.saveSettings(newSettings);
    setSettings(notificationService.getSettings());
  }, []);

  /**
   * Enviar notificación
   */
  const sendNotification = useCallback(async (
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
    actionUrl?: string
  ): Promise<string> => {
    return notificationService.send(type, title, body, data || {}, actionUrl);
  }, []);

  /**
   * Marcar como leída
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    await notificationService.markAsRead(notificationId);
  }, []);

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    await notificationService.markAllAsRead();
  }, []);

  /**
   * Eliminar notificación
   */
  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    await notificationService.deleteNotification(notificationId);
  }, []);

  /**
   * Limpiar todas
   */
  const clearAll = useCallback(async (): Promise<void> => {
    await notificationService.clearAll();
  }, []);

  return {
    // Estado
    notifications,
    unreadCount,
    settings,
    browserPermission,
    isLoading,
    isBrowserSupported: notificationService.isBrowserNotificationSupported(),

    // Acciones
    requestBrowserPermission,
    updateSettings,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,

    // Accesos directos a métodos del servicio
    sendAppointmentReminder: notificationService.sendAppointmentReminder.bind(notificationService),
    sendMaintenanceReminder: notificationService.sendMaintenanceReminder.bind(notificationService),
    sendStockAlert: notificationService.sendStockAlert.bind(notificationService),
    sendInvoiceOverdueReminder: notificationService.sendInvoiceOverdueReminder.bind(notificationService),
    sendInvoicePaidNotification: notificationService.sendInvoicePaidNotification.bind(notificationService),
  };
}

export default useWebNotifications;
