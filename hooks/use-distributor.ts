import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  DistributorConfig, 
  defaultDistributorConfig,
  countryPresets,
  distributorConfigTemplate,
} from '@/config/distributor';
import { SupportedLanguage } from '@/locales';

const DISTRIBUTOR_CONFIG_KEY = '@piano_emotion_distributor_config';

/**
 * Hook para acceder y gestionar la configuración del distribuidor
 */
export function useDistributor() {
  const [config, setConfig] = useState<DistributorConfig>(defaultDistributorConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración al iniciar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const savedConfig = await AsyncStorage.getItem(DISTRIBUTOR_CONFIG_KEY);
      
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as DistributorConfig;
        setConfig({ ...defaultDistributorConfig, ...parsed });
      } else {
        // Usar configuración por defecto o detectar desde URL/env
        const detectedConfig = detectDistributorFromEnvironment();
        setConfig(detectedConfig);
      }
    } catch (err) {
      console.error('Error loading distributor config:', err);
      setError('Error al cargar la configuración del distribuidor');
      setConfig(defaultDistributorConfig);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Detectar distribuidor desde variables de entorno o URL
   */
  const detectDistributorFromEnvironment = (): DistributorConfig => {
    // En el futuro, esto podría leer de:
    // - Variables de entorno (process.env.DISTRIBUTOR_ID)
    // - Subdominio (app.distribuidor.com)
    // - Parámetro de URL (?distributor=xxx)
    // - Archivo de configuración local
    
    // Por ahora, retornamos la configuración por defecto
    return defaultDistributorConfig;
  };

  /**
   * Guardar configuración del distribuidor
   */
  const saveConfig = useCallback(async (newConfig: Partial<DistributorConfig>) => {
    try {
      const updatedConfig: DistributorConfig = {
        ...config,
        ...newConfig,
        metadata: {
          ...config.metadata,
          updatedAt: new Date().toISOString(),
        },
      };
      
      await AsyncStorage.setItem(DISTRIBUTOR_CONFIG_KEY, JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Error saving distributor config:', err);
      setError('Error al guardar la configuración');
      return false;
    }
  }, [config]);

  /**
   * Aplicar preset de país
   */
  const applyCountryPreset = useCallback(async (countryCode: string) => {
    const preset = countryPresets[countryCode];
    if (preset) {
      return saveConfig(preset);
    }
    return false;
  }, [saveConfig]);

  /**
   * Restablecer configuración por defecto
   */
  const resetConfig = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DISTRIBUTOR_CONFIG_KEY);
      setConfig(defaultDistributorConfig);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error resetting distributor config:', err);
      setError('Error al restablecer la configuración');
      return false;
    }
  }, []);

  /**
   * Verificar si una funcionalidad está habilitada
   */
  const isFeatureEnabled = useCallback((feature: keyof DistributorConfig['features']): boolean => {
    return config.features[feature] ?? false;
  }, [config.features]);

  /**
   * Obtener información formateada del distribuidor
   */
  const distributorInfo = useMemo(() => ({
    name: config.tradeName || config.companyName,
    fullName: config.companyName,
    taxId: config.taxId,
    fullAddress: `${config.address.street}, ${config.address.postalCode} ${config.address.city}, ${config.address.country}`,
    contactEmail: config.contact.email,
    supportEmail: config.contact.supportEmail || config.contact.email,
    dpoEmail: config.contact.dpoEmail || config.contact.email,
    phone: config.contact.phone,
    website: config.contact.website,
  }), [config]);

  /**
   * Obtener configuración de branding
   */
  const branding = useMemo(() => ({
    appName: config.branding.appName,
    primaryColor: config.branding.primaryColor,
    secondaryColor: config.branding.secondaryColor,
    accentColor: config.branding.accentColor,
    logoUrl: config.branding.logoUrl,
    logoDarkUrl: config.branding.logoDarkUrl || config.branding.logoUrl,
  }), [config.branding]);

  /**
   * Obtener configuración fiscal
   */
  const fiscal = useMemo(() => ({
    taxRate: config.fiscal.defaultTaxRate,
    invoicePrefix: config.fiscal.invoicePrefix,
    hasElectronicInvoicing: config.fiscal.electronicInvoicing?.enabled ?? false,
    invoicingSystem: config.fiscal.electronicInvoicing?.system,
    currency: config.ecommerce.currency,
    currencySymbol: config.ecommerce.currencySymbol,
  }), [config.fiscal, config.ecommerce]);

  /**
   * Obtener configuración regional
   */
  const locale = useMemo(() => ({
    dateFormat: config.locale.dateFormat,
    timeFormat: config.locale.timeFormat,
    timezone: config.locale.timezone,
    firstDayOfWeek: config.locale.firstDayOfWeek,
    defaultLanguage: config.defaultLanguage,
    availableLanguages: config.availableLanguages,
  }), [config.locale, config.defaultLanguage, config.availableLanguages]);

  /**
   * Formatear precio según configuración del distribuidor
   */
  const formatPrice = useCallback((amount: number): string => {
    return new Intl.NumberFormat(config.defaultLanguage, {
      style: 'currency',
      currency: config.ecommerce.currency,
    }).format(amount);
  }, [config.defaultLanguage, config.ecommerce.currency]);

  /**
   * Formatear fecha según configuración del distribuidor
   */
  const formatDate = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(config.defaultLanguage, {
      dateStyle: 'medium',
      timeZone: config.locale.timezone,
    }).format(d);
  }, [config.defaultLanguage, config.locale.timezone]);

  return {
    // Estado
    config,
    isLoading,
    error,
    
    // Información formateada
    distributorInfo,
    branding,
    fiscal,
    locale,
    
    // Acciones
    saveConfig,
    resetConfig,
    applyCountryPreset,
    isFeatureEnabled,
    
    // Utilidades
    formatPrice,
    formatDate,
    
    // Presets disponibles
    countryPresets,
    distributorConfigTemplate,
  };
}

/**
 * Obtener configuración del distribuidor (para uso fuera de componentes React)
 */
export async function getDistributorConfig(): Promise<DistributorConfig> {
  try {
    const savedConfig = await AsyncStorage.getItem(DISTRIBUTOR_CONFIG_KEY);
    if (savedConfig) {
      return { ...defaultDistributorConfig, ...JSON.parse(savedConfig) };
    }
  } catch (err) {
    console.error('Error getting distributor config:', err);
  }
  return defaultDistributorConfig;
}

export { DistributorConfig, defaultDistributorConfig, countryPresets };
