/**
 * Hook de traducción
 * Wrapper sobre useLanguage para compatibilidad con componentes que usan useTranslation
 * 
 * IMPORTANTE: Este hook usa importaciones estáticas para garantizar que las traducciones
 * funcionen correctamente en producción.
 */

import { useContext } from 'react';
import { useLanguage, LanguageProvider } from '@/contexts/language-context';
import { translations, defaultLanguage } from '@/locales';
import { I18n } from 'i18n-js';

// Crear instancia de i18n como fallback
const i18nFallback = new I18n(translations);
i18nFallback.enableFallback = true;
i18nFallback.defaultLocale = defaultLanguage;
i18nFallback.locale = defaultLanguage;

/**
 * Función de traducción fallback que usa i18n-js directamente
 */
function translateFallback(key: string, options?: Record<string, any>): string {
  return i18nFallback.t(key, options);
}

/**
 * Hook de traducción principal
 * Intenta usar el contexto de idioma, si no está disponible usa el fallback
 */
export function useTranslation() {
  try {
    // Intentar usar el contexto de idioma
    const context = useLanguage();
    
    return {
      t: context.t,
      i18n: {
        language: context.currentLanguage,
        changeLanguage: context.changeLanguage,
      },
    };
  } catch (error) {
    // Si el contexto no está disponible (componente fuera del provider),
    // usar el fallback con traducciones reales
    return {
      t: translateFallback,
      i18n: {
        language: defaultLanguage,
        changeLanguage: async (_lang: string) => {
          console.warn('useTranslation: LanguageProvider not found, language change ignored');
        },
      },
    };
  }
}

/**
 * Función de traducción standalone para uso fuera de componentes React
 * Usa el fallback de i18n-js directamente
 */
export function t(key: string, options?: Record<string, any>): string {
  return translateFallback(key, options);
}

export default useTranslation;
