import React, { createContext, useContext, ReactNode } from 'react';
import { useDistributor, DistributorConfig, countryPresets } from '@/hooks/use-distributor';

interface DistributorContextType {
  // Estado
  config: DistributorConfig;
  isLoading: boolean;
  error: string | null;
  
  // Información formateada
  distributorInfo: {
    name: string;
    fullName: string;
    taxId: string;
    fullAddress: string;
    contactEmail: string;
    supportEmail: string;
    dpoEmail: string;
    phone: string;
    website: string | undefined;
  };
  branding: {
    appName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string | undefined;
    logoDarkUrl: string | undefined;
  };
  fiscal: {
    taxRate: number;
    invoicePrefix: string;
    hasElectronicInvoicing: boolean;
    invoicingSystem: string | undefined;
    currency: string;
    currencySymbol: string;
  };
  locale: {
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    firstDayOfWeek: number;
    defaultLanguage: string;
    availableLanguages: string[];
  };
  
  // Acciones
  saveConfig: (newConfig: Partial<DistributorConfig>) => Promise<boolean>;
  resetConfig: () => Promise<boolean>;
  applyCountryPreset: (countryCode: string) => Promise<boolean>;
  isFeatureEnabled: (feature: keyof DistributorConfig['features']) => boolean;
  
  // Utilidades
  formatPrice: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  
  // Presets
  countryPresets: typeof countryPresets;
}

const DistributorContext = createContext<DistributorContextType | undefined>(undefined);

interface DistributorProviderProps {
  children: ReactNode;
}

export function DistributorProvider({ children }: DistributorProviderProps) {
  const distributorHook = useDistributor();

  return (
    <DistributorContext.Provider value={distributorHook}>
      {children}
    </DistributorContext.Provider>
  );
}

export function useDistributorContext(): DistributorContextType {
  const context = useContext(DistributorContext);
  
  if (context === undefined) {
    throw new Error('useDistributorContext must be used within a DistributorProvider');
  }
  
  return context;
}

// HOC para class components (si es necesario)
export function withDistributor<P extends object>(
  WrappedComponent: React.ComponentType<P & DistributorContextType>
) {
  return function WithDistributorComponent(props: P) {
    const distributorContext = useDistributorContext();
    return <WrappedComponent {...props} {...distributorContext} />;
  };
}

export { DistributorConfig };
