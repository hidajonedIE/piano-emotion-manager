/**
 * Appointment Reminder Service
 * Gestión de recordatorios automáticos de citas
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ============================================================================
// TIPOS
// ============================================================================

export interface Appointment {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  pianoId?: number;
  pianoDescription?: string;
  date: Date | string;
  time: string;
  duration: number; // minutos
  type: string;
  status: string;
  notes?: string;
  address?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  // Recordatorios antes de la cita (en minutos)
  reminderTimes: number[];
  // Notificaciones push
  pushEnabled: boolean;
  // Email
  emailEnabled: boolean;
  // SMS
  smsEnabled: boolean;
}

export interface ScheduledReminder {
  id: string;
  appointmentId: number;
  scheduledFor: Date;
  type: 'push' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  error?: string;
}

// ============================================================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================================================

/**
 * Configura el handler de notificaciones
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Solicita permisos de notificación
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// ============================================================================
// PROGRAMACIÓN DE RECORDATORIOS
// ============================================================================

/**
 * Programa recordatorios para una cita
 */
export async function scheduleAppointmentReminders(
  appointment: Appointment,
  settings: ReminderSettings
): Promise<ScheduledReminder[]> {
  if (!settings.enabled) {
    return [];
  }

  const scheduledReminders: ScheduledReminder[] = [];
  const appointmentDate = new Date(appointment.date);
  const [hours, minutes] = appointment.time.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);

  for (const minutesBefore of settings.reminderTimes) {
    const reminderDate = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);

    // Solo programar si la fecha es futura
    if (reminderDate > new Date()) {
      // Notificación push
      if (settings.pushEnabled) {
        try {
          const notificationId = await scheduleLocalNotification(appointment, reminderDate, minutesBefore);
          scheduledReminders.push({
            id: notificationId,
            appointmentId: appointment.id,
            scheduledFor: reminderDate,
            type: 'push',
            status: 'pending',
          });
        } catch (error) {
          console.error('Error scheduling push notification:', error);
        }
      }

      // Email (se procesaría en el backend)
      if (settings.emailEnabled && appointment.clientEmail) {
        scheduledReminders.push({
          id: `email-${appointment.id}-${minutesBefore}`,
          appointmentId: appointment.id,
          scheduledFor: reminderDate,
          type: 'email',
          status: 'pending',
        });
      }

      // SMS (se procesaría en el backend)
      if (settings.smsEnabled && appointment.clientPhone) {
        scheduledReminders.push({
          id: `sms-${appointment.id}-${minutesBefore}`,
          appointmentId: appointment.id,
          scheduledFor: reminderDate,
          type: 'sms',
          status: 'pending',
        });
      }
    }
  }

  return scheduledReminders;
}

/**
 * Programa una notificación local
 */
async function scheduleLocalNotification(
  appointment: Appointment,
  triggerDate: Date,
  minutesBefore: number
): Promise<string> {
  const timeText = formatReminderTime(minutesBefore);
  
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎹 Cita ${timeText}`,
      body: `${appointment.type} con ${appointment.clientName}${appointment.address ? ` en ${appointment.address}` : ''}`,
      data: {
        appointmentId: appointment.id,
        type: 'appointment_reminder',
      },
      sound: true,
      badge: 1,
    },
    trigger: {
      date: triggerDate,
    },
  });

  return notificationId;
}

/**
 * Cancela todos los recordatorios de una cita
 */
export async function cancelAppointmentReminders(appointmentId: number): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduledNotifications) {
    if (notification.content.data?.appointmentId === appointmentId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/**
 * Actualiza los recordatorios de una cita
 */
export async function updateAppointmentReminders(
  appointment: Appointment,
  settings: ReminderSettings
): Promise<ScheduledReminder[]> {
  // Cancelar recordatorios existentes
  await cancelAppointmentReminders(appointment.id);
  
  // Programar nuevos recordatorios
  return scheduleAppointmentReminders(appointment, settings);
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea el tiempo del recordatorio
 */
function formatReminderTime(minutes: number): string {
  if (minutes < 60) {
    return `en ${minutes} minutos`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `en ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `en ${hours}h ${remainingMinutes}min`;
  }
  
  const days = Math.floor(hours / 24);
  return `en ${days} día${days > 1 ? 's' : ''}`;
}

/**
 * Obtiene los tiempos de recordatorio predeterminados
 */
export function getDefaultReminderTimes(): number[] {
  return [
    15,      // 15 minutos antes
    60,      // 1 hora antes
    1440,    // 1 día antes (24 horas)
  ];
}

/**
 * Obtiene la configuración predeterminada de recordatorios
 */
export function getDefaultReminderSettings(): ReminderSettings {
  return {
    enabled: true,
    reminderTimes: getDefaultReminderTimes(),
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
  };
}

/**
 * Verifica si una cita necesita recordatorio
 */
export function appointmentNeedsReminder(appointment: Appointment): boolean {
  const appointmentDate = new Date(appointment.date);
  const now = new Date();
  
  // Solo citas futuras y no canceladas
  return (
    appointmentDate > now &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed'
  );
}

/**
 * Obtiene las citas que necesitan recordatorios para hoy
 */
export function getTodayAppointmentsForReminders(appointments: Appointment[]): Appointment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate >= today && aptDate < tomorrow && appointmentNeedsReminder(apt);
  });
}
