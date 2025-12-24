/**
 * Hook de traducción
 * Wrapper sobre useLanguage para compatibilidad con componentes que usan useTranslation
 */

import { useLanguage } from '@/contexts/language-context';

export function useTranslation() {
  const { t, currentLanguage } = useLanguage();
  
  return {
    t,
    i18n: {
      language: currentLanguage,
      changeLanguage: () => {}, // No-op, usar useLanguage().changeLanguage directamente
    },
  };
}
