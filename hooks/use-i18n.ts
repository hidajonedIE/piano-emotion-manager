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
  // En web, por defecto usar español
  if (typeof navigator !== 'undefined') {
    // Si no hay idioma guardado, usar español por defecto en web
    return 'es';
  }
  
  // Fallback a Localization.getLocales() para mobile
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
      // Try to load from backend first (if user is authenticated)
      let languageFromBackend: SupportedLanguage | null = null;
      try {
        const { trpc } = await import('@/utils/trpc');
        const result = await trpc.language.getUserLanguage.query();
        languageFromBackend = result.language as SupportedLanguage;
      } catch (backendError) {
        // User not authenticated or backend error - continue with local storage
        console.log('[i18n] Could not load language from backend:', backendError);
      }
      
      // Priority: Backend > Local Storage > Device > Default
      if (languageFromBackend && supportedLanguages.some(lang => lang.code === languageFromBackend)) {
        setCurrentLanguage(languageFromBackend);
        // Sync to local storage
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageFromBackend);
      } else {
        // Fallback to local storage
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
          setCurrentLanguage(savedLanguage as SupportedLanguage);
        } else {
          // Use device language if no saved preference
          const deviceLang = getDeviceLanguage();
          setCurrentLanguage(deviceLang);
        }
      }
    } catch (error) {
      console.error('[i18n] Error loading language:', error);
      setCurrentLanguage(getDeviceLanguage());
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      // Save locally first for immediate UI update
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setCurrentLanguage(language);
      i18n.locale = language;
      
      // Try to save to backend if user is authenticated
      try {
        const { trpc } = await import('@/utils/trpc');
        await trpc.language.updateUserLanguage.mutate({ language });
      } catch (backendError) {
        // Backend save failed, but local save succeeded
        // This is acceptable - language will sync next time user logs in
        console.log('[i18n] Could not sync language to backend:', backendError);
      }
    } catch (error) {
      console.error('[i18n] Error changing language:', error);
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
