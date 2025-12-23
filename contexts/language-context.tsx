import React, { createContext, useContext, ReactNode } from 'react';
import { useI18n, SupportedLanguage, supportedLanguages } from '@/hooks/use-i18n';

interface LanguageContextType {
  t: (key: string, options?: Record<string, any>) => string;
  currentLanguage: SupportedLanguage;
  currentLanguageInfo: {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
  };
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  supportedLanguages: typeof supportedLanguages;
  isLoading: boolean;
  hasTranslation: (key: string) => boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const i18nHook = useI18n();

  return (
    <LanguageContext.Provider value={i18nHook}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
}

// HOC for class components (if needed)
export function withLanguage<P extends object>(
  WrappedComponent: React.ComponentType<P & LanguageContextType>
) {
  return function WithLanguageComponent(props: P) {
    const languageContext = useLanguage();
    return <WrappedComponent {...props} {...languageContext} />;
  };
}

export { SupportedLanguage, supportedLanguages };
