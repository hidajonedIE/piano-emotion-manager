/**
 * Hook de Verifactu
 * 
 * Integra el sistema de facturación electrónica Verifactu
 * con el flujo de facturación existente de la aplicación.
 */

import { useState, useCallback } from 'react';

// ============================================
// TIPOS
// ============================================

export interface VerifactuInvoice {
  // Datos básicos de la factura
  id: string;
  serie: string;
  numero: string;
  fecha: Date;
  
  // Datos del emisor (técnico/empresa)
  emisorNIF: string;
  emisorNombre: string;
  emisorDireccion?: string;
  
  // Datos del receptor (cliente)
  receptorNIF?: string;
  receptorNombre: string;
  receptorDireccion?: string;
  
  // Importes
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  total: number;
  
  // Conceptos
  conceptos: {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
  }[];
  
  // Estado Verifactu
  verifactuStatus?: 'pending' | 'sent' | 'accepted' | 'rejected' | 'error';
  verifactuHuella?: string;
  verifactuCSV?: string;
  verifactuFechaEnvio?: Date;
  verifactuError?: string;
}

export interface VerifactuState {
  isEnabled: boolean;
  isConnected: boolean;
  environment: 'test' | 'production';
  certificateValid: boolean;
  certificateExpiry?: string;
  lastSync?: string;
}

export interface SendInvoiceResult {
  success: boolean;
  huella?: string;
  csv?: string;
  qrDataUrl?: string;
  error?: string;
}

// ============================================
// HOOK
// ============================================

export function useVerifactu() {
  const [state, setState] = useState<VerifactuState>({
    isEnabled: false,
    isConnected: false,
    environment: 'test',
    certificateValid: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verifica el estado del servicio Verifactu
   */
  const checkStatus = useCallback(async (): Promise<VerifactuState> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verifactu/status');
      const data = await response.json();
      
      const newState: VerifactuState = {
        isEnabled: data.enabled,
        isConnected: data.connected,
        environment: data.environment,
        certificateValid: data.certificateValid,
        certificateExpiry: data.certificateExpiry,
        lastSync: new Date().toISOString(),
      };
      
      setState(newState);
      return newState;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al verificar estado';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Envía una factura a la AEAT vía Verifactu
   */
  const sendInvoice = useCallback(async (invoice: VerifactuInvoice): Promise<SendInvoiceResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verifactu/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serieFactura: invoice.serie,
          numeroFactura: invoice.numero,
          fechaExpedicion: invoice.fecha.toISOString(),
          emisorNIF: invoice.emisorNIF,
          emisorNombre: invoice.emisorNombre,
          receptorNIF: invoice.receptorNIF,
          receptorNombre: invoice.receptorNombre,
          baseImponible: invoice.baseImponible,
          tipoIVA: invoice.tipoIVA,
          cuotaIVA: invoice.cuotaIVA,
          totalFactura: invoice.total,
          conceptos: invoice.conceptos,
          tipoFactura: 'F1', // Factura normal
          descripcion: invoice.conceptos.map(c => c.descripcion).join(', '),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          huella: data.huella,
          csv: data.csvFactura,
          qrDataUrl: data.qrDataUrl,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Error al enviar factura',
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Genera el código QR para una factura ya enviada
   */
  const generateQR = useCallback(async (invoice: VerifactuInvoice): Promise<string | null> => {
    if (!invoice.verifactuHuella) {
      setError('La factura no tiene huella Verifactu');
      return null;
    }
    
    try {
      const response = await fetch('/api/verifactu/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nifEmisor: invoice.emisorNIF,
          nombreEmisor: invoice.emisorNombre,
          serieFactura: invoice.serie,
          numeroFactura: invoice.numero,
          fechaExpedicion: formatDateForQR(invoice.fecha),
          importeTotal: invoice.total,
          huella: invoice.verifactuHuella,
          csv: invoice.verifactuCSV,
        }),
      });
      
      const data = await response.json();
      return data.success ? data.qrDataUrl : null;
    } catch (err) {
      setError('Error al generar código QR');
      return null;
    }
  }, []);

  /**
   * Consulta el estado de una factura en la AEAT
   */
  const checkInvoiceStatus = useCallback(async (invoice: VerifactuInvoice): Promise<string> => {
    try {
      const response = await fetch('/api/verifactu/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serieFactura: invoice.serie,
          numeroFactura: invoice.numero,
          fechaExpedicion: invoice.fecha.toISOString(),
        }),
      });
      
      const data = await response.json();
      return data.status || 'unknown';
    } catch (err) {
      return 'error';
    }
  }, []);

  /**
   * Reenvía una factura que falló
   */
  const retryInvoice = useCallback(async (invoice: VerifactuInvoice): Promise<SendInvoiceResult> => {
    return sendInvoice(invoice);
  }, [sendInvoice]);

  return {
    // Estado
    state,
    isLoading,
    error,
    
    // Acciones
    checkStatus,
    sendInvoice,
    generateQR,
    checkInvoiceStatus,
    retryInvoice,
    
    // Helpers
    isEnabled: state.isEnabled,
    isConnected: state.isConnected,
    isProd: state.environment === 'production',
  };
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea fecha para el QR (DD-MM-YYYY)
 */
function formatDateForQR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Valida un NIF/CIF español
 */
export function validateNIF(nif: string): boolean {
  if (!nif || nif.length < 9) return false;
  
  const nifRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
  
  return nifRegex.test(nif) || nieRegex.test(nif) || cifRegex.test(nif);
}

/**
 * Calcula la letra del NIF
 */
export function calculateNIFLetter(number: string): string {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const num = parseInt(number, 10);
  return letters[num % 23];
}

// ============================================
// COMPONENTE DE ESTADO VERIFACTU
// ============================================

/**
 * Ejemplo de uso del componente de estado:
 * 
 * ```tsx
 * function VerifactuStatusBadge() {
 *   const { state, isLoading, checkStatus } = useVerifactu();
 *   
 *   useEffect(() => {
 *     checkStatus();
 *   }, []);
 *   
 *   if (isLoading) return <span>Verificando...</span>;
 *   
 *   return (
 *     <div className={`badge ${state.isConnected ? 'badge-success' : 'badge-error'}`}>
 *       {state.isConnected ? '✓ Verifactu conectado' : '✗ Verifactu desconectado'}
 *       {state.environment === 'test' && ' (Pruebas)'}
 *     </div>
 *   );
 * }
 * ```
 */
