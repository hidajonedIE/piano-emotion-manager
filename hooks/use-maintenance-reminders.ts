import { useEffect, useCallback } from 'react';
import { useNotifications } from './use-notifications';
import { usePianos, useClients, useServices } from './use-storage';
import { Piano } from '@/types';

const DEFAULT_MAINTENANCE_INTERVAL_MONTHS = 6;

export function useMaintenanceReminders() {
  const { scheduleMaintenanceReminder, cancelNotification, settings } = useNotifications();
  const { pianos, updatePiano } = usePianos();
  const { getClient } = useClients();
  const { services } = useServices();

  // Calcular la fecha del próximo mantenimiento basándose en el último servicio
  const calculateNextMaintenanceDate = useCallback(
    (piano: Piano): string | null => {
      // Obtener el último servicio de mantenimiento o afinación del piano
      const pianoServices = services
        .filter(
          (s) =>
            s.pianoId === piano.id &&
            (s.type === 'tuning' || s.type === 'maintenance' || s.type === 'regulation')
        )
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastServiceDate = pianoServices[0]?.date || piano.lastMaintenanceDate;
      
      if (!lastServiceDate) {
        return null;
      }

      const intervalMonths = piano.maintenanceIntervalMonths || DEFAULT_MAINTENANCE_INTERVAL_MONTHS;
      const lastDate = new Date(lastServiceDate);
      lastDate.setMonth(lastDate.getMonth() + intervalMonths);
      
      return lastDate.toISOString().split('T')[0];
    },
    [services]
  );

  // Programar recordatorio para un piano específico
  const scheduleReminderForPiano = useCallback(
    async (piano: Piano) => {
      if (!settings.enabled || !settings.maintenanceReminder) {
        return;
      }

      const client = getClient(piano.clientId);
      if (!client) return;

      const nextMaintenanceDate = calculateNextMaintenanceDate(piano);
      if (!nextMaintenanceDate) return;

      const dueDate = new Date(nextMaintenanceDate);
      
      // No programar si la fecha ya pasó
      if (dueDate <= new Date()) {
        return;
      }

      // Cancelar notificación anterior si existe
      if (piano.maintenanceNotificationId) {
        await cancelNotification(piano.maintenanceNotificationId);
      }

      // Programar nueva notificación
      const notificationId = await scheduleMaintenanceReminder(
        piano.id,
        `${piano.brand} ${piano.model}`,
        `${client.firstName} ${client.lastName1 || ''}`.trim(),
        dueDate
      );

      // Actualizar el piano con la nueva información
      if (notificationId) {
        await updatePiano(piano.id, {
          nextMaintenanceDate,
          maintenanceNotificationId: notificationId,
        });
      }
    },
    [settings, getClient, calculateNextMaintenanceDate, cancelNotification, scheduleMaintenanceReminder, updatePiano]
  );

  // Obtener pianos que necesitan mantenimiento pronto
  const getPianosNeedingMaintenance = useCallback(
    (daysAhead: number = 30): Piano[] => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      return pianos.filter((piano) => {
        const nextDate = piano.nextMaintenanceDate || calculateNextMaintenanceDate(piano);
        if (!nextDate) return false;

        const maintenanceDate = new Date(nextDate);
        return maintenanceDate >= today && maintenanceDate <= futureDate;
      });
    },
    [pianos, calculateNextMaintenanceDate]
  );

  // Obtener pianos con mantenimiento vencido
  const getPianosOverdueMaintenance = useCallback((): Piano[] => {
    const today = new Date().toISOString().split('T')[0];

    return pianos.filter((piano) => {
      const nextDate = piano.nextMaintenanceDate || calculateNextMaintenanceDate(piano);
      if (!nextDate) return false;
      return nextDate < today;
    });
  }, [pianos, calculateNextMaintenanceDate]);

  // Actualizar recordatorios para todos los pianos
  const updateAllReminders = useCallback(async () => {
    if (!settings.enabled || !settings.maintenanceReminder) {
      return;
    }

    for (const piano of pianos) {
      await scheduleReminderForPiano(piano);
    }
  }, [pianos, settings, scheduleReminderForPiano]);

  // Actualizar el último mantenimiento cuando se registra un servicio
  const updateLastMaintenance = useCallback(
    async (pianoId: string, serviceDate: string) => {
      const piano = pianos.find((p) => p.id === pianoId);
      if (!piano) return;

      const intervalMonths = piano.maintenanceIntervalMonths || DEFAULT_MAINTENANCE_INTERVAL_MONTHS;
      const nextDate = new Date(serviceDate);
      nextDate.setMonth(nextDate.getMonth() + intervalMonths);

      await updatePiano(pianoId, {
        lastMaintenanceDate: serviceDate,
        nextMaintenanceDate: nextDate.toISOString().split('T')[0],
      });

      // Reprogramar el recordatorio
      const updatedPiano = { ...piano, lastMaintenanceDate: serviceDate };
      await scheduleReminderForPiano(updatedPiano);
    },
    [pianos, updatePiano, scheduleReminderForPiano]
  );

  return {
    scheduleReminderForPiano,
    getPianosNeedingMaintenance,
    getPianosOverdueMaintenance,
    updateAllReminders,
    updateLastMaintenance,
    calculateNextMaintenanceDate,
  };
}
