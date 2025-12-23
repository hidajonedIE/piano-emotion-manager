import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, useMemo } from 'react';

import {
  Reminder,
  ReminderType,
  ContactMethod,
  generateId,
  isDueOrOverdue,
  isDueThisWeek,
  Client,
  Piano,
  Service,
  daysSince,
  RECOMMENDED_INTERVALS,
} from '@/types';

const STORAGE_KEY = 'piano_tech_reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const addReminder = useCallback(
    async (reminder: Omit<Reminder, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
      const newReminder: Reminder = {
        ...reminder,
        id: generateId(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveReminders([...reminders, newReminder]);
      return newReminder;
    },
    [reminders]
  );

  const updateReminder = useCallback(
    async (id: string, updates: Partial<Reminder>) => {
      const updated = reminders.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
      await saveReminders(updated);
    },
    [reminders]
  );

  const completeReminder = useCallback(
    async (id: string) => {
      await updateReminder(id, {
        completed: true,
        completedDate: new Date().toISOString(),
      });
    },
    [updateReminder]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      await saveReminders(reminders.filter((r) => r.id !== id));
    },
    [reminders]
  );

  const getReminder = useCallback(
    (id: string) => reminders.find((r) => r.id === id),
    [reminders]
  );

  const getRemindersByClient = useCallback(
    (clientId: string) =>
      reminders
        .filter((r) => r.clientId === clientId)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [reminders]
  );

  // Recordatorios pendientes (no completados)
  const pendingReminders = useMemo(
    () =>
      reminders
        .filter((r) => !r.completed)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [reminders]
  );

  // Recordatorios vencidos o para hoy
  const dueReminders = useMemo(
    () => pendingReminders.filter((r) => isDueOrOverdue(r.scheduledDate)),
    [pendingReminders]
  );

  // Recordatorios para esta semana
  const thisWeekReminders = useMemo(
    () => pendingReminders.filter((r) => isDueThisWeek(r.scheduledDate)),
    [pendingReminders]
  );

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    completeReminder,
    deleteReminder,
    getReminder,
    getRemindersByClient,
    pendingReminders,
    dueReminders,
    thisWeekReminders,
    refresh: loadReminders,
  };
}

// Hook para generar recordatorios automáticos basados en el historial
export function useAutoReminders(
  clients: Client[],
  pianos: Piano[],
  services: Service[],
  existingReminders: Reminder[]
) {
  const suggestedReminders = useMemo(() => {
    const suggestions: Array<{
      clientId: string;
      pianoId?: string;
      type: ReminderType;
      reason: string;
      suggestedDate: string;
    }> = [];

    clients.forEach((client) => {
      const clientPianos = pianos.filter((p) => p.clientId === client.id);
      const clientServices = services.filter((s) => s.clientId === client.id);

      // Si el cliente no tiene pianos registrados, sugerir contacto
      if (clientPianos.length === 0) {
        const hasReminder = existingReminders.some(
          (r) => r.clientId === client.id && r.type === 'new_client_contact' && !r.completed
        );
        if (!hasReminder) {
          suggestions.push({
            clientId: client.id,
            type: 'new_client_contact',
            reason: 'Cliente sin pianos registrados',
            suggestedDate: new Date().toISOString(),
          });
        }
        return;
      }

      // Si el cliente no tiene servicios recientes (más de 1 año), sugerir contacto
      if (clientServices.length === 0) {
        const hasReminder = existingReminders.some(
          (r) => r.clientId === client.id && r.type === 'inactive_client' && !r.completed
        );
        if (!hasReminder) {
          suggestions.push({
            clientId: client.id,
            type: 'inactive_client',
            reason: 'Cliente sin historial de servicios',
            suggestedDate: new Date().toISOString(),
          });
        }
        return;
      }

      // Verificar cada piano del cliente
      clientPianos.forEach((piano) => {
        const pianoServices = clientServices.filter((s) => s.pianoId === piano.id);
        const lastTuning = pianoServices
          .filter((s) => s.type === 'tuning' || s.type === 'maintenance')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (lastTuning) {
          const daysSinceLastTuning = daysSince(lastTuning.date);
          
          // Si han pasado más de 5 meses, sugerir recordatorio de afinación
          if (daysSinceLastTuning > 150) {
            const hasReminder = existingReminders.some(
              (r) =>
                r.pianoId === piano.id &&
                r.type === 'tuning_due' &&
                !r.completed
            );
            if (!hasReminder) {
              // Calcular fecha sugerida (6 meses desde última afinación)
              const lastDate = new Date(lastTuning.date);
              const suggestedDate = new Date(lastDate.getTime() + RECOMMENDED_INTERVALS.tuning * 24 * 60 * 60 * 1000);
              
              suggestions.push({
                clientId: client.id,
                pianoId: piano.id,
                type: 'tuning_due',
                reason: `Afinación pendiente (última hace ${Math.floor(daysSinceLastTuning / 30)} meses)`,
                suggestedDate: suggestedDate.toISOString(),
              });
            }
          }
        } else {
          // Piano sin afinaciones registradas
          const hasReminder = existingReminders.some(
            (r) =>
              r.pianoId === piano.id &&
              r.type === 'tuning_due' &&
              !r.completed
          );
          if (!hasReminder) {
            suggestions.push({
              clientId: client.id,
              pianoId: piano.id,
              type: 'tuning_due',
              reason: 'Piano sin historial de afinaciones',
              suggestedDate: new Date().toISOString(),
            });
          }
        }
      });
    });

    return suggestions;
  }, [clients, pianos, services, existingReminders]);

  return { suggestedReminders };
}
