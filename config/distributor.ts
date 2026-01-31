import { SupportedLanguage } from '@/locales';

/**
 * Configuración de un distribuidor
 * Cada distribuidor tiene su propia instancia de la app con branding personalizado
 */
export interface DistributorConfig {
  /** Identificador único del distribuidor */
  id: string;
  
  /** Nombre de la empresa del distribuidor */
  companyName: string;
  
  /** Nombre comercial (marca) */
  tradeName: string;
  
  /** CIF/NIF/VAT del distribuidor */
  taxId: string;
  
  /** Dirección fiscal */
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    countryCode: string;
  };
  
  /** Información de contacto */
  contact: {
    email: string;
    phone: string;
    website?: string;
    supportEmail?: string;
    dpoEmail?: string;
  };
  
  /** Configuración de branding */
  branding: {
    /** URL del logo principal */
    logoUrl?: string;
    /** URL del logo para modo oscuro */
    logoDarkUrl?: string;
    /** Color primario (hex) */
    primaryColor: string;
    /** Color secundario (hex) */
    secondaryColor: string;
    /** Color de acento (hex) */
    accentColor: string;
    /** Nombre de la app personalizado */
    appName: string;
  };
  
  /** Configuración del ecommerce */
  ecommerce: {
    /** Tipo de plataforma */
    platform: 'woocommerce' | 'shopify' | 'prestashop' | 'custom';
    /** URL base del ecommerce */
    baseUrl: string;
    /** API Key para autenticación */
    apiKey?: string;
    /** API Secret para autenticación */
    apiSecret?: string;
    /** Prefijo de categorías de productos */
    categoryPrefix?: string;
    /** Moneda por defecto */
    currency: string;
    /** Símbolo de moneda */
    currencySymbol: string;
  };
  
  /** Configuración fiscal */
  fiscal: {
    /** Tipo de IVA por defecto */
    defaultTaxRate: number;
    /** Prefijo de facturas */
    invoicePrefix: string;
    /** Sistema de facturación electrónica */
    electronicInvoicing?: {
      enabled: boolean;
      system: 'verifactu' | 'sdi' | 'facturae' | 'peppol' | 'other';
      apiEndpoint?: string;
      credentials?: {
        certificatePath?: string;
        apiKey?: string;
      };
    };
  };
  
  /** Idioma por defecto del distribuidor */
  defaultLanguage: SupportedLanguage;
  
  /** Idiomas disponibles (todos por defecto) */
  availableLanguages: SupportedLanguage[];
  
  /** Configuración regional */
  locale: {
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '24h' | '12h';
    timezone: string;
    firstDayOfWeek: 0 | 1; // 0 = Domingo, 1 = Lunes
  };
  
  /** Funcionalidades habilitadas */
  features: {
    /** Tienda integrada */
    store: boolean;
    /** Facturación */
    invoicing: boolean;
    /** Facturación electrónica */
    electronicInvoicing: boolean;
    /** Inventario */
    inventory: boolean;
    /** Calendario/Citas */
    appointments: boolean;
    /** Notificaciones push */
    pushNotifications: boolean;
    /** Sincronización con ecommerce */
    ecommerceSync: boolean;
  };
  
  /** Metadatos */
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    isActive: boolean;
  };
}

/**
 * Configuración por defecto de Piano Emotion (distribuidor principal)
 */
export const defaultDistributorConfig: DistributorConfig = {
  id: 'piano-emotion',
  companyName: 'Inbound Emotion S.L.',
  tradeName: 'Piano Emotion',
  taxId: 'B66351685',
  address: {
    street: 'Calle Ejemplo 123',
    city: 'Barcelona',
    postalCode: '08001',
    country: 'España',
    countryCode: 'ES',
  },
  contact: {
    email: 'info@pianoemotion.es',
    phone: '+34 900 000 000',
    website: 'https://pianoemotion.es',
    supportEmail: 'soporte@pianoemotion.es',
    dpoEmail: 'dpo@pianoemotion.es',
  },
  branding: {
    primaryColor: '#1a1a2e',
    secondaryColor: '#16213e',
    accentColor: '#e94560',
    appName: 'Piano Emotion Manager',
  },
  ecommerce: {
    platform: 'woocommerce',
    baseUrl: 'https://pianoemotion.es',
    currency: 'EUR',
    currencySymbol: '€',
  },
  fiscal: {
    defaultTaxRate: 21,
    invoicePrefix: 'PE',
    electronicInvoicing: {
      enabled: true,
      system: 'verifactu',
    },
  },
  defaultLanguage: 'es',
  availableLanguages: ['es', 'pt', 'it', 'fr', 'de', 'da'],
  locale: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Europe/Madrid',
    firstDayOfWeek: 1,
  },
  features: {
    store: true,
    invoicing: true,
    electronicInvoicing: true,
    inventory: true,
    appointments: true,
    pushNotifications: true,
    ecommerceSync: true,
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    isActive: true,
  },
};

/**
 * Plantilla de configuración para nuevos distribuidores
 */
export const distributorConfigTemplate: Partial<DistributorConfig> = {
  availableLanguages: ['es', 'pt', 'it', 'fr', 'de', 'da'],
  locale: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Europe/Madrid',
    firstDayOfWeek: 1,
  },
  features: {
    store: true,
    invoicing: true,
    electronicInvoicing: false,
    inventory: true,
    appointments: true,
    pushNotifications: true,
    ecommerceSync: true,
  },
};

/**
 * Configuraciones predefinidas por país
 */
export const countryPresets: Record<string, Partial<DistributorConfig>> = {
  ES: {
    defaultLanguage: 'es',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Madrid',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 21,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: true,
        system: 'verifactu',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  PT: {
    defaultLanguage: 'pt',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Lisbon',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 23,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: false,
        system: 'other',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  IT: {
    defaultLanguage: 'it',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Rome',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 22,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: true,
        system: 'sdi',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  FR: {
    defaultLanguage: 'fr',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Paris',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 20,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: false,
        system: 'facturae',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  DE: {
    defaultLanguage: 'de',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Berlin',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 19,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: false,
        system: 'peppol',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'EUR',
      currencySymbol: '€',
    },
  },
  DK: {
    defaultLanguage: 'da',
    locale: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      timezone: 'Europe/Copenhagen',
      firstDayOfWeek: 1,
    },
    fiscal: {
      defaultTaxRate: 25,
      invoicePrefix: '',
      electronicInvoicing: {
        enabled: false,
        system: 'peppol',
      },
    },
    ecommerce: {
      platform: 'woocommerce',
      baseUrl: '',
      currency: 'DKK',
      currencySymbol: 'kr',
    },
  },
};

export default defaultDistributorConfig;
