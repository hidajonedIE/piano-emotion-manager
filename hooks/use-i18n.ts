import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import { translations, SupportedLanguage, supportedLanguages, defaultLanguage } from '@/locales';

const LANGUAGE_STORAGE_KEY = '@piano_emotion_language';

// Create i18n instance
const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = defaultLanguage;

/**
 * Get the best matching supported language from device locale
 */
function getDeviceLanguage(): SupportedLanguage {
  const deviceLocales = Localization.getLocales();
  
  if (deviceLocales && deviceLocales.length > 0) {
    for (const locale of deviceLocales) {
      const languageCode = locale.languageCode?.toLowerCase() as SupportedLanguage;
      if (supportedLanguages.some(lang => lang.code === languageCode)) {
        return languageCode;
      }
    }
  }
  
  return defaultLanguage;
}

/**
 * Hook for internationalization with language persistence
 */
export function useI18n() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  // Update i18n locale when language changes
  useEffect(() => {
    i18n.locale = currentLanguage;
  }, [currentLanguage]);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage as SupportedLanguage);
      } else {
        // Use device language if no saved preference
        const deviceLang = getDeviceLanguage();
        setCurrentLanguage(deviceLang);
      }
    } catch (error) {
      setCurrentLanguage(getDeviceLanguage());
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setCurrentLanguage(language);
      i18n.locale = language;
    } catch (error) {
    }
  }, []);

  /**
   * Translate a key with optional interpolation
   * @param key - Translation key (e.g., 'common.save' or 'clients.title')
   * @param options - Interpolation options
   */
  const t = useCallback((key: string, options?: Record<string, any>): string => {
    return i18n.t(key, options);
  }, [currentLanguage]);

  /**
   * Check if a translation key exists
   */
  const hasTranslation = useCallback((key: string): boolean => {
    const translation = i18n.t(key, { defaultValue: '__MISSING__' });
    return translation !== '__MISSING__';
  }, [currentLanguage]);

  /**
   * Get current language info
   */
  const currentLanguageInfo = useMemo(() => {
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  }, [currentLanguage]);

  return {
    t,
    currentLanguage,
    currentLanguageInfo,
    changeLanguage,
    supportedLanguages,
    isLoading,
    hasTranslation,
    i18n,
  };
}

/**
 * Get translation function for use outside of React components
 */
export function getTranslation(key: string, options?: Record<string, any>): string {
  return i18n.t(key, options);
}

/**
 * Set language for use outside of React components
 */
export async function setLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.locale = language;
  } catch (error) {
  }
}

/**
 * Get current language for use outside of React components
 */
export function getCurrentLanguage(): SupportedLanguage {
  return i18n.locale as SupportedLanguage;
}

export { i18n, SupportedLanguage, supportedLanguages, defaultLanguage };
