/**
 * Hook de traducción
 * Wrapper sobre useLanguage para compatibilidad con componentes que usan useTranslation
 */

import { useContext, createContext } from 'react';

// Contexto de idioma simplificado para cuando no hay provider
const defaultTranslation = {
  t: (key: string) => key,
  i18n: {
    language: 'es',
    changeLanguage: async (_lang: string) => {},
  },
};

// Intentar usar el contexto de idioma si está disponible
export function useTranslation() {
  try {
    // Importación dinámica para evitar errores si el contexto no está disponible
    const { useLanguage } = require('@/contexts/language-context');
    const { t, currentLanguage, changeLanguage } = useLanguage();
    
    return {
      t,
      i18n: {
        language: currentLanguage,
        changeLanguage,
      },
    };
  } catch (error) {
    // Si el contexto no está disponible, devolver traducción por defecto
    return defaultTranslation;
  }
}

// Función de traducción standalone para uso fuera de componentes React
export function t(key: string, _options?: Record<string, any>): string {
  return key;
}

export default useTranslation;
