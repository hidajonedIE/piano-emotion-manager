/**
 * Configuración de Verifactu
 * 
 * Variables de entorno necesarias:
 * - VERIFACTU_CERT_PATH: Ruta al certificado .p12
 * - VERIFACTU_CERT_PASSWORD: Contraseña del certificado
 * - VERIFACTU_ENVIRONMENT: 'test' | 'production'
 * - VERIFACTU_NIF_TITULAR: NIF del titular (empresa)
 * - VERIFACTU_NOMBRE_TITULAR: Nombre del titular (empresa)
 */

export interface VerifactuConfig {
  // Certificado digital
  certPath: string;
  certPassword: string;
  
  // Entorno
  environment: 'test' | 'production';
  
  // Datos del titular (empresa emisora)
  nifTitular: string;
  nombreTitular: string;
  
  // URLs de la AEAT
  aeatUrl: string;
  aeatTestUrl: string;
  
  // Configuración de facturación
  serieFactura: string;
  softwareId: string;
  softwareNombre: string;
  softwareVersion: string;
  softwareNIF: string;
}

// URLs oficiales de la AEAT para Verifactu
const AEAT_URLS = {
  // Entorno de pruebas
  test: 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
  // Entorno de producción
  production: 'https://www1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
};

// Configuración por defecto
export const verifactuConfig: VerifactuConfig = {
  // Certificado
  certPath: process.env.VERIFACTU_CERT_PATH || './server/certs/certificate.p12',
  certPassword: process.env.VERIFACTU_CERT_PASSWORD || '1234',
  
  // Entorno (por defecto pruebas)
  environment: (process.env.VERIFACTU_ENVIRONMENT as 'test' | 'production') || 'test',
  
  // Datos del titular - Inbound Emotion S.L.
  nifTitular: process.env.VERIFACTU_NIF_TITULAR || 'B66351685',
  nombreTitular: process.env.VERIFACTU_NOMBRE_TITULAR || 'INBOUND EMOTION S.L.',
  
  // URLs
  aeatUrl: AEAT_URLS.production,
  aeatTestUrl: AEAT_URLS.test,
  
  // Configuración del software
  serieFactura: 'PE', // Piano Emotion
  softwareId: 'PIANO-EMOTION-MANAGER',
  softwareNombre: 'Piano Emotion Manager',
  softwareVersion: '1.0.0',
  softwareNIF: 'B66351685', // NIF del desarrollador del software
};

/**
 * Obtiene la URL de la AEAT según el entorno configurado
 */
export function getAeatUrl(): string {
  return verifactuConfig.environment === 'production' 
    ? verifactuConfig.aeatUrl 
    : verifactuConfig.aeatTestUrl;
}

/**
 * Valida que la configuración de Verifactu esté completa
 */
export function validateVerifactuConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!verifactuConfig.certPath) {
    errors.push('Falta la ruta del certificado (VERIFACTU_CERT_PATH)');
  }
  
  if (!verifactuConfig.certPassword) {
    errors.push('Falta la contraseña del certificado (VERIFACTU_CERT_PASSWORD)');
  }
  
  if (!verifactuConfig.nifTitular) {
    errors.push('Falta el NIF del titular (VERIFACTU_NIF_TITULAR)');
  }
  
  if (!verifactuConfig.nombreTitular) {
    errors.push('Falta el nombre del titular (VERIFACTU_NOMBRE_TITULAR)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
