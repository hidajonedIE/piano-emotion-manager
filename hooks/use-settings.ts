/**
 * Hook para gestionar la configuración de la aplicación
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@piano_emotion_settings';

export interface AppSettings {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessLogo?: string;
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultTaxRate: number;
  invoicePrefix: string;
  invoiceNextNumber: number;
  quotePrefix: string;
  quoteNextNumber: number;
  reminderDaysBefore: number;
  enableNotifications: boolean;
  enableEmailReminders: boolean;
  enableSmsReminders: boolean;
  theme: 'light' | 'dark' | 'system';
  primaryColor?: string;
  // Configuración de facturación electrónica
  einvoicingEnabled: boolean;
  einvoicingCountry?: string;
  vatNumber?: string;
  // Configuración de WhatsApp
  whatsappEnabled: boolean;
  whatsappPhoneNumber?: string;
}

const defaultSettings: AppSettings = {
  businessName: 'Piano Emotion Manager',
  currency: 'EUR',
  language: 'es',
  timezone: 'Europe/Madrid',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  defaultTaxRate: 21,
  invoicePrefix: 'FAC-',
  invoiceNextNumber: 1,
  quotePrefix: 'PRE-',
  quoteNextNumber: 1,
  reminderDaysBefore: 7,
  enableNotifications: true,
  enableEmailReminders: true,
  enableSmsReminders: false,
  theme: 'system',
  einvoicingEnabled: false,
  whatsappEnabled: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración al iniciar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
      return false;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      setSettings(defaultSettings);
      return true;
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Error al restablecer la configuración');
      return false;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    reloadSettings: loadSettings,
  };
}

export default useSettings;
