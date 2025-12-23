import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { Appointment } from '@/types/business';
import { generateId } from '@/types';

const STORAGE_KEY = 'piano_tech_appointments';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAppointments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppointments = async (newAppointments: Appointment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
      setAppointments(newAppointments);
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  };

  const addAppointment = useCallback(
    async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newAppointment: Appointment = {
        ...appointment,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveAppointments([...appointments, newAppointment]);
      return newAppointment;
    },
    [appointments]
  );

  const updateAppointment = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      const updated = appointments.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
      await saveAppointments(updated);
    },
    [appointments]
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      await saveAppointments(appointments.filter((a) => a.id !== id));
    },
    [appointments]
  );

  const getAppointment = useCallback(
    (id: string) => appointments.find((a) => a.id === id),
    [appointments]
  );

  const getAppointmentsByClient = useCallback(
    (clientId: string) =>
      appointments
        .filter((a) => a.clientId === clientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments]
  );

  const getAppointmentsByDate = useCallback(
    (date: string) =>
      appointments
        .filter((a) => a.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments]
  );

  const getTodayAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return getAppointmentsByDate(today);
  }, [getAppointmentsByDate]);

  const getUpcomingAppointments = useCallback(
    (limit: number = 10) => {
      const today = new Date().toISOString().split('T')[0];
      return appointments
        .filter((a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'completed')
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        })
        .slice(0, limit);
    },
    [appointments]
  );

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointment,
    getAppointmentsByClient,
    getAppointmentsByDate,
    getTodayAppointments,
    getUpcomingAppointments,
    refresh: loadAppointments,
  };
}
