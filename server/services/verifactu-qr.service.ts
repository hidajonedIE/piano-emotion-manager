/**
 * Servicio de Código QR para Verifactu
 * 
 * Genera el código QR obligatorio en las facturas según la normativa Verifactu.
 * El QR contiene una URL que permite verificar la factura en la sede de la AEAT.
 * 
 * Formato del QR según especificación técnica de la AEAT:
 * https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/Verifactu_QR.pdf
 */

import QRCode from 'qrcode';
import { verifactuConfig } from '../config/verifactu.config';

// ============================================
// TIPOS
// ============================================

export interface QRData {
  // Datos del emisor
  nifEmisor: string;
  nombreEmisor: string;
  
  // Datos de la factura
  serieFactura: string;
  numeroFactura: string;
  fechaExpedicion: string; // Formato: DD-MM-YYYY
  
  // Importes
  importeTotal: number;
  
  // Huella de la factura
  huella: string;
  
  // CSV (Código Seguro de Verificación) - opcional, se obtiene de la AEAT
  csv?: string;
}

export interface QRResult {
  success: boolean;
  qrDataUrl?: string; // Base64 data URL para mostrar en HTML
  qrBuffer?: Buffer; // Buffer PNG para PDF
  verificationUrl?: string;
  error?: string;
}

// ============================================
// CONSTANTES
// ============================================

// URL base de verificación de la AEAT
const AEAT_VERIFICATION_URL = {
  test: 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ValidarQR',
  production: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
};

// ============================================
// SERVICIO QR
// ============================================

class VerifactuQRService {
  /**
   * Genera la URL de verificación según el formato de la AEAT
   * 
   * Formato: URL_BASE?nif=X&numserie=X&fecha=X&importe=X&huella=X
   */
  generateVerificationUrl(data: QRData): string {
    const baseUrl = verifactuConfig.environment === 'production'
      ? AEAT_VERIFICATION_URL.production
      : AEAT_VERIFICATION_URL.test;

    // Construir parámetros según especificación AEAT
    const params = new URLSearchParams({
      nif: data.nifEmisor,
      numserie: `${data.serieFactura}${data.numeroFactura}`,
      fecha: data.fechaExpedicion,
      importe: data.importeTotal.toFixed(2),
    });

    // Añadir huella (obligatorio en Verifactu)
    if (data.huella) {
      params.append('huella', data.huella);
    }

    // Añadir CSV si está disponible
    if (data.csv) {
      params.append('csv', data.csv);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Genera el código QR como Data URL (para mostrar en HTML/React)
   */
  async generateQRDataUrl(data: QRData): Promise<QRResult> {
    try {
      const verificationUrl = this.generateVerificationUrl(data);
      
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M', // Nivel medio de corrección de errores
        type: 'image/png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return {
        success: true,
        qrDataUrl,
        verificationUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar QR',
      };
    }
  }

  /**
   * Genera el código QR como Buffer PNG (para incluir en PDF)
   */
  async generateQRBuffer(data: QRData): Promise<QRResult> {
    try {
      const verificationUrl = this.generateVerificationUrl(data);
      
      const qrBuffer = await QRCode.toBuffer(verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 200,
        margin: 2,
      });

      return {
        success: true,
        qrBuffer,
        verificationUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar QR',
      };
    }
  }

  /**
   * Genera el código QR como string SVG (para renderizado vectorial)
   */
  async generateQRSvg(data: QRData): Promise<{ success: boolean; svg?: string; error?: string }> {
    try {
      const verificationUrl = this.generateVerificationUrl(data);
      
      const svg = await QRCode.toString(verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'svg',
        width: 200,
        margin: 2,
      });

      return {
        success: true,
        svg,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar QR',
      };
    }
  }

  /**
   * Genera el texto que debe aparecer junto al QR según normativa
   */
  generateQRLegend(data: QRData): string {
    return `Factura verificable en la Agencia Tributaria
NIF Emisor: ${data.nifEmisor}
Nº Factura: ${data.serieFactura}${data.numeroFactura}
Fecha: ${data.fechaExpedicion}
Importe: ${data.importeTotal.toFixed(2)} €
${data.csv ? `CSV: ${data.csv}` : ''}`;
  }

  /**
   * Formatea la fecha al formato requerido por el QR (DD-MM-YYYY)
   */
  formatDateForQR(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Valida los datos antes de generar el QR
   */
  validateQRData(data: QRData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.nifEmisor || data.nifEmisor.length < 9) {
      errors.push('NIF del emisor inválido');
    }

    if (!data.serieFactura) {
      errors.push('Serie de factura requerida');
    }

    if (!data.numeroFactura) {
      errors.push('Número de factura requerido');
    }

    if (!data.fechaExpedicion) {
      errors.push('Fecha de expedición requerida');
    }

    if (data.importeTotal === undefined || data.importeTotal < 0) {
      errors.push('Importe total inválido');
    }

    if (!data.huella || data.huella.length < 32) {
      errors.push('Huella de factura inválida');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Exportar instancia singleton
export const verifactuQRService = new VerifactuQRService();

// ============================================
// COMPONENTE REACT PARA MOSTRAR QR
// ============================================

/**
 * Ejemplo de uso en React:
 * 
 * ```tsx
 * import { VerifactuQR } from './verifactu-qr.service';
 * 
 * function InvoicePDF({ invoice }) {
 *   const [qrUrl, setQrUrl] = useState('');
 *   
 *   useEffect(() => {
 *     verifactuQRService.generateQRDataUrl({
 *       nifEmisor: invoice.emisorNIF,
 *       nombreEmisor: invoice.emisorNombre,
 *       serieFactura: invoice.serie,
 *       numeroFactura: invoice.numero,
 *       fechaExpedicion: verifactuQRService.formatDateForQR(invoice.fecha),
 *       importeTotal: invoice.total,
 *       huella: invoice.huellaVerifactu,
 *       csv: invoice.csvVerifactu,
 *     }).then(result => {
 *       if (result.success) {
 *         setQrUrl(result.qrDataUrl);
 *       }
 *     });
 *   }, [invoice]);
 *   
 *   return (
 *     <div className="verifactu-qr">
 *       <img src={qrUrl} alt="Código QR Verifactu" />
 *       <p>Factura verificable en la Agencia Tributaria</p>
 *     </div>
 *   );
 * }
 * ```
 */
