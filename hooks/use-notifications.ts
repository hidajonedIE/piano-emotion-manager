import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@piano_emotion_notification_settings';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  appointmentReminder: boolean; // Recordatorio de citas
  appointmentReminderTime: number; // Minutos antes de la cita (15, 30, 60, 120)
  maintenanceReminder: boolean; // Recordatorio de mantenimiento
  stockAlert: boolean; // Alerta de stock bajo
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  appointmentReminder: true,
  appointmentReminderTime: 60, // 1 hora antes por defecto
  maintenanceReminder: true,
  stockAlert: true,
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadSettings();
    checkPermissions();
    
    // Listener para notificaciones recibidas mientras la app está abierta
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      // Aquí se puede navegar a la pantalla correspondiente según el tipo de notificación
      if (data?.type === 'appointment' && data?.appointmentId) {
        // Navegar a la cita
        console.log('Navigate to appointment:', data.appointmentId);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS === 'web') {
      // En web, verificar si el navegador soporta notificaciones
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      } else {
        setPermissionStatus('unsupported');
      }
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status as string);
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        return permission === 'granted';
      }
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status as string);
    return status === 'granted';
  };

  // Programar notificación de recordatorio de cita
  const scheduleAppointmentReminder = async (
    appointmentId: string,
    clientName: string,
    appointmentDate: Date,
    minutesBefore: number = settings.appointmentReminderTime
  ): Promise<string | null> => {
    if (!settings.enabled || !settings.appointmentReminder) {
      return null;
    }

    const hasPermission = permissionStatus === 'granted' || (await requestPermissions());
    if (!hasPermission) {
      return null;
    }

    const triggerDate = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);
    
    // No programar si la fecha ya pasó
    if (triggerDate <= new Date()) {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Cita próxima',
          body: `Tienes una cita con ${clientName} en ${minutesBefore} minutos`,
          data: {
            type: 'appointment',
            appointmentId,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log('Scheduled appointment reminder:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return null;
    }
  };

  // Programar notificación de mantenimiento
  const scheduleMaintenanceReminder = async (
    pianoId: string,
    pianoName: string,
    clientName: string,
    dueDate: Date
  ): Promise<string | null> => {
    if (!settings.enabled || !settings.maintenanceReminder) {
      return null;
    }

    const hasPermission = permissionStatus === 'granted' || (await requestPermissions());
    if (!hasPermission) {
      return null;
    }

    // Notificar una semana antes
    const triggerDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (triggerDate <= new Date()) {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎹 Mantenimiento pendiente',
          body: `El piano ${pianoName} de ${clientName} necesita mantenimiento pronto`,
          data: {
            type: 'maintenance',
            pianoId,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling maintenance reminder:', error);
      return null;
    }
  };

  // Enviar notificación de stock bajo inmediatamente
  const sendStockAlert = async (
    materialName: string,
    currentStock: number,
    minStock: number
  ): Promise<string | null> => {
    if (!settings.enabled || !settings.stockAlert) {
      return null;
    }

    const hasPermission = permissionStatus === 'granted' || (await requestPermissions());
    if (!hasPermission) {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Stock bajo',
          body: `${materialName}: quedan ${currentStock} unidades (mínimo: ${minStock})`,
          data: {
            type: 'stock',
            materialName,
          },
          sound: true,
        },
        trigger: null, // Enviar inmediatamente
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending stock alert:', error);
      return null;
    }
  };

  // Cancelar una notificación programada
  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  // Cancelar todas las notificaciones programadas
  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  // Obtener todas las notificaciones programadas
  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  return {
    settings,
    saveSettings,
    permissionStatus,
    requestPermissions,
    loading,
    scheduleAppointmentReminder,
    scheduleMaintenanceReminder,
    sendStockAlert,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
  };
}
