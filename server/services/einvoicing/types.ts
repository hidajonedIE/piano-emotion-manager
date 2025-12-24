/**
 * Tipos base para facturación electrónica multi-país
 * Piano Emotion Manager
 */

// Países soportados
export type SupportedCountry = 'ES' | 'IT' | 'DE' | 'FR' | 'PT' | 'DK';

// Sistemas de facturación por país
export type InvoicingSystem = 
  | 'verifactu'   // España
  | 'sdi'         // Italia
  | 'zugferd'     // Alemania
  | 'facturx'     // Francia
  | 'ciuspt'      // Portugal
  | 'oioubl';     // Dinamarca

// Mapeo país -> sistema
export const COUNTRY_SYSTEM_MAP: Record<SupportedCountry, InvoicingSystem> = {
  ES: 'verifactu',
  IT: 'sdi',
  DE: 'zugferd',
  FR: 'facturx',
  PT: 'ciuspt',
  DK: 'oioubl',
};

// Estado de una factura electrónica
export type EInvoiceStatus = 
  | 'draft'           // Borrador
  | 'pending'         // Pendiente de envío
  | 'sent'            // Enviada al sistema
  | 'accepted'        // Aceptada por el sistema
  | 'rejected'        // Rechazada
  | 'delivered'       // Entregada al receptor
  | 'error';          // Error

// Datos comunes de factura (EN 16931)
export interface BaseInvoiceData {
  // Identificación
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  
  // Emisor
  seller: {
    name: string;
    taxId: string;           // NIF/CIF/VAT
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: SupportedCountry;
    };
    email?: string;
    phone?: string;
  };
  
  // Receptor
  buyer: {
    name: string;
    taxId?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    email?: string;
  };
  
  // Líneas de factura
  lines: InvoiceLine[];
  
  // Totales
  subtotal: number;
  taxAmount: number;
  total: number;
  
  // Notas
  notes?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  bankAccount?: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;        // Porcentaje (ej: 21 para 21%)
  taxAmount: number;
  lineTotal: number;
  unitCode?: string;      // UN/ECE Recommendation 20 (ej: "C62" para unidad)
}

// Configuración específica por país
export interface CountrySpecificConfig {
  // Italia
  italy?: {
    codiceDestinatario?: string;    // 7 caracteres
    pecDestinatario?: string;       // Email PEC
    regimeFiscale: string;          // Ej: "RF01"
  };
  
  // Alemania
  germany?: {
    leitwegId?: string;             // Para B2G
    buyerReference?: string;
  };
  
  // Francia
  france?: {
    siret?: string;                 // Identificador empresa
    serviceCode?: string;           // Código de servicio
  };
  
  // Portugal
  portugal?: {
    atcud?: string;                 // Código único documento
    hashAnterior?: string;          // Para encadenamiento
  };
  
  // Dinamarca
  denmark?: {
    ean?: string;                   // EAN/GLN
    orderReference?: string;
  };
}

// Factura completa con datos específicos del país
export interface EInvoice extends BaseInvoiceData {
  id: string;
  country: SupportedCountry;
  system: InvoicingSystem;
  status: EInvoiceStatus;
  countryConfig?: CountrySpecificConfig;
  
  // Metadatos del sistema
  xmlContent?: string;              // XML generado
  pdfContent?: string;              // PDF generado (base64)
  qrCode?: string;                  // QR code (base64)
  
  // Respuesta del sistema
  systemResponse?: {
    success: boolean;
    registrationCode?: string;      // Código de registro
    hash?: string;                  // Huella/hash
    timestamp?: Date;
    errorCode?: string;
    errorMessage?: string;
  };
  
  // Timestamps
  createdAt: Date;
  sentAt?: Date;
  updatedAt: Date;
}

// Resultado de envío
export interface SendResult {
  success: boolean;
  invoiceId: string;
  registrationCode?: string;
  hash?: string;
  qrCode?: string;
  pdfUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Interfaz común para todos los servicios de facturación
export interface IEInvoicingService {
  country: SupportedCountry;
  system: InvoicingSystem;
  
  // Generar XML según el formato del país
  generateXML(invoice: EInvoice): Promise<string>;
  
  // Generar PDF con el formato del país
  generatePDF(invoice: EInvoice): Promise<Buffer>;
  
  // Enviar al sistema del país
  send(invoice: EInvoice): Promise<SendResult>;
  
  // Consultar estado
  getStatus(invoiceId: string): Promise<EInvoiceStatus>;
  
  // Validar factura antes de enviar
  validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }>;
}

// Configuración del distribuidor para facturación
export interface DistributorEInvoicingConfig {
  distributorId: string;
  country: SupportedCountry;
  enabled: boolean;
  
  // Credenciales según el país
  credentials: {
    // España (Verifactu)
    verifactu?: {
      certificatePath: string;
      certificatePassword: string;
      environment: 'test' | 'production';
    };
    
    // Italia (SDI)
    sdi?: {
      username: string;
      password: string;
      channel: 'web' | 'ftp' | 'api';
      environment: 'test' | 'production';
    };
    
    // Alemania (ZUGFeRD) - No requiere credenciales, es directo
    zugferd?: {
      profile: 'BASIC' | 'COMFORT' | 'EXTENDED';
    };
    
    // Francia (Factur-X)
    facturx?: {
      siret: string;
      profile: 'MINIMUM' | 'BASIC' | 'EN16931' | 'EXTENDED';
      chorusProEnabled?: boolean;
      chorusProCredentials?: {
        username: string;
        password: string;
      };
    };
    
    // Portugal (CIUS-PT)
    ciuspt?: {
      nif: string;
      atSoftwareCertificateNumber?: string;
    };
    
    // Dinamarca (OIOUBL)
    oioubl?: {
      cvr: string;
      nemhandelEnabled?: boolean;
    };
  };
  
  // Configuración de numeración
  invoiceNumbering: {
    prefix: string;           // Ej: "PE", "IT", "DE"
    currentNumber: number;
    format: string;           // Ej: "{prefix}-{year}-{number:05d}"
  };
}

// Tasas de IVA por país
export const VAT_RATES: Record<SupportedCountry, { standard: number; reduced: number[]; superReduced?: number }> = {
  ES: { standard: 21, reduced: [10], superReduced: 4 },
  IT: { standard: 22, reduced: [10, 5], superReduced: 4 },
  DE: { standard: 19, reduced: [7] },
  FR: { standard: 20, reduced: [10, 5.5], superReduced: 2.1 },
  PT: { standard: 23, reduced: [13, 6] },
  DK: { standard: 25, reduced: [] },  // Dinamarca no tiene tipos reducidos
};

// Códigos de moneda por país
export const DEFAULT_CURRENCY: Record<SupportedCountry, string> = {
  ES: 'EUR',
  IT: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  PT: 'EUR',
  DK: 'DKK',
};
