/**
 * Servicio Verifactu
 * 
 * Gestiona la comunicación con la AEAT para el sistema Verifactu
 * de facturación electrónica española.
 * 
 * Documentación oficial:
 * https://sede.agenciatributaria.gob.es/Sede/iva/sistema-verifactu.html
 */

import * as https from 'https';
import * as fs from 'fs';
import { verifactuConfig, getAeatUrl } from '../config/verifactu.config.js';
import { digitalSignatureService } from './digital-signature.service.js';

// ============================================
// TIPOS
// ============================================

export interface InvoiceData {
  // Identificación de la factura
  serieFactura: string;
  numeroFactura: string;
  fechaExpedicion: Date;
  
  // Datos del emisor
  emisorNIF: string;
  emisorNombre: string;
  
  // Datos del receptor
  receptorNIF?: string;
  receptorNombre: string;
  receptorDireccion?: string;
  receptorCodigoPostal?: string;
  receptorPoblacion?: string;
  receptorProvincia?: string;
  receptorPais?: string;
  
  // Importes
  baseImponible: number;
  tipoIVA: number;
  cuotaIVA: number;
  totalFactura: number;
  
  // Desglose de conceptos
  conceptos: InvoiceConcept[];
  
  // Tipo de factura
  tipoFactura: 'F1' | 'F2' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  // F1: Factura normal
  // F2: Factura simplificada
  // R1: Factura rectificativa (error fundado en derecho)
  // R2: Factura rectificativa (artículo 80.3)
  // R3: Factura rectificativa (artículo 80.4)
  // R4: Factura rectificativa (resto)
  // R5: Factura rectificativa en facturas simplificadas
  
  // Descripción general
  descripcion: string;
  
  // Referencia a factura anterior (para encadenamiento)
  facturaAnteriorHash?: string;
}

export interface InvoiceConcept {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface VerifactuResponse {
  success: boolean;
  codigoRegistro?: string;
  csvFactura?: string;
  huella?: string;
  qrCode?: string;
  fechaHoraRegistro?: string;
  error?: string;
  errorCode?: string;
  xmlEnviado?: string;
  xmlRespuesta?: string;
}

export interface VerifactuStatus {
  connected: boolean;
  environment: 'test' | 'production';
  lastCheck: string;
  certificateValid: boolean;
  certificateExpiry?: string;
  pendingInvoices: number;
  sentToday: number;
}

// ============================================
// SERVICIO VERIFACTU
// ============================================

class VerifactuService {
  private lastInvoiceHash: string | null = null;
  private invoiceCounter: number = 0;

  /**
   * Genera el XML de alta de factura según formato Verifactu
   */
  private generateInvoiceXml(invoice: InvoiceData): string {
    const fechaExpedicion = this.formatDate(invoice.fechaExpedicion);
    const fechaHoraHusoHorario = this.formatDateTime(new Date());
    
    // Calcular huella de la factura
    const huellaData = `${invoice.emisorNIF}|${invoice.serieFactura}|${invoice.numeroFactura}|${fechaExpedicion}|${invoice.totalFactura.toFixed(2)}`;
    const huella = digitalSignatureService.calculateHash(huellaData);
    
    // Encadenamiento con factura anterior
    const huellaEncadenamiento = invoice.facturaAnteriorHash || this.lastInvoiceHash || huella;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:sist="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SistemaFacturacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <sist:RegFactuSistemaFacturacion>
      <sist:Cabecera>
        <sist:ObligadoEmision>
          <sist:NombreRazon>${this.escapeXml(verifactuConfig.nombreTitular)}</sist:NombreRazon>
          <sist:NIF>${verifactuConfig.nifTitular}</sist:NIF>
        </sist:ObligadoEmision>
      </sist:Cabecera>
      <sist:RegistroFactura>
        <sist:RegistroAlta>
          <sist:IDVersion>1.0</sist:IDVersion>
          <sist:IDFactura>
            <sist:IDEmisorFactura>${invoice.emisorNIF}</sist:IDEmisorFactura>
            <sist:NumSerieFactura>${invoice.serieFactura}${invoice.numeroFactura}</sist:NumSerieFactura>
            <sist:FechaExpedicionFactura>${fechaExpedicion}</sist:FechaExpedicionFactura>
          </sist:IDFactura>
          <sist:NombreRazonEmisor>${this.escapeXml(invoice.emisorNombre)}</sist:NombreRazonEmisor>
          <sist:TipoFactura>${invoice.tipoFactura}</sist:TipoFactura>
          <sist:DescripcionOperacion>${this.escapeXml(invoice.descripcion)}</sist:DescripcionOperacion>
          ${this.generateRecipientXml(invoice)}
          <sist:Desglose>
            <sist:DetalleDesglose>
              <sist:Impuesto>01</sist:Impuesto>
              <sist:ClaveRegimen>01</sist:ClaveRegimen>
              <sist:CalificacionOperacion>S1</sist:CalificacionOperacion>
              <sist:TipoImpositivo>${invoice.tipoIVA.toFixed(2)}</sist:TipoImpositivo>
              <sist:BaseImponibleOImporteNoSujeto>${invoice.baseImponible.toFixed(2)}</sist:BaseImponibleOImporteNoSujeto>
              <sist:CuotaRepercutida>${invoice.cuotaIVA.toFixed(2)}</sist:CuotaRepercutida>
            </sist:DetalleDesglose>
          </sist:Desglose>
          <sist:CuotaTotal>${invoice.cuotaIVA.toFixed(2)}</sist:CuotaTotal>
          <sist:ImporteTotal>${invoice.totalFactura.toFixed(2)}</sist:ImporteTotal>
          <sist:Encadenamiento>
            <sist:PrimerRegistro>${this.lastInvoiceHash ? 'N' : 'S'}</sist:PrimerRegistro>
            ${this.lastInvoiceHash ? `<sist:RegistroAnterior>
              <sist:Huella>${huellaEncadenamiento}</sist:Huella>
            </sist:RegistroAnterior>` : ''}
          </sist:Encadenamiento>
          <sist:SistemaInformatico>
            <sist:NombreRazon>${this.escapeXml(verifactuConfig.softwareNombre)}</sist:NombreRazon>
            <sist:NIF>${verifactuConfig.softwareNIF}</sist:NIF>
            <sist:IdSistemaInformatico>${verifactuConfig.softwareId}</sist:IdSistemaInformatico>
            <sist:Version>${verifactuConfig.softwareVersion}</sist:Version>
            <sist:NumeroInstalacion>1</sist:NumeroInstalacion>
          </sist:SistemaInformatico>
          <sist:FechaHoraHusoGenRegistro>${fechaHoraHusoHorario}</sist:FechaHoraHusoGenRegistro>
          <sist:Huella>${huella}</sist:Huella>
        </sist:RegistroAlta>
      </sist:RegistroFactura>
    </sist:RegFactuSistemaFacturacion>
  </soapenv:Body>
</soapenv:Envelope>`;

    return xml;
  }

  /**
   * Genera el XML del receptor según si tiene NIF o no
   */
  private generateRecipientXml(invoice: InvoiceData): string {
    if (invoice.receptorNIF) {
      // Receptor con NIF (empresa o autónomo español)
      return `<sist:Destinatarios>
        <sist:IDDestinatario>
          <sist:NombreRazon>${this.escapeXml(invoice.receptorNombre)}</sist:NombreRazon>
          <sist:NIF>${invoice.receptorNIF}</sist:NIF>
        </sist:IDDestinatario>
      </sist:Destinatarios>`;
    } else {
      // Receptor sin NIF (particular o extranjero)
      return `<sist:Destinatarios>
        <sist:IDDestinatario>
          <sist:NombreRazon>${this.escapeXml(invoice.receptorNombre)}</sist:NombreRazon>
          <sist:IDOtro>
            <sist:CodigoPais>${invoice.receptorPais || 'ES'}</sist:CodigoPais>
            <sist:IDType>07</sist:IDType>
            <sist:ID>NO_IDENTIFICADO</sist:ID>
          </sist:IDOtro>
        </sist:IDDestinatario>
      </sist:Destinatarios>`;
    }
  }

  /**
   * Envía una factura a la AEAT
   */
  async sendInvoice(invoice: InvoiceData): Promise<VerifactuResponse> {
    try {
      // Generar XML
      const xml = this.generateInvoiceXml(invoice);
      
      // Firmar XML
      const signResult = await digitalSignatureService.signXml(xml);
      if (!signResult.success || !signResult.signedXml) {
        return {
          success: false,
          error: `Error al firmar: ${signResult.error}`,
          xmlEnviado: xml,
        };
      }

      // Enviar a la AEAT
      const response = await this.sendToAeat(signResult.signedXml);
      
      // Si éxito, guardar huella para encadenamiento
      if (response.success && response.huella) {
        this.lastInvoiceHash = response.huella;
      }

      return {
        ...response,
        xmlEnviado: signResult.signedXml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Envía el XML firmado a la AEAT
   */
  private async sendToAeat(signedXml: string): Promise<VerifactuResponse> {
    return new Promise((resolve) => {
      const url = new URL(getAeatUrl());
      
      // Leer certificado para autenticación mutua TLS
      const certPath = verifactuConfig.certPath;
      const certPassword = verifactuConfig.certPassword;
      
      let pfx: Buffer;
      try {
        pfx = fs.readFileSync(certPath);
      } catch (error) {
        resolve({
          success: false,
          error: 'No se pudo leer el certificado digital',
        });
        return;
      }

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(signedXml),
        },
        pfx: pfx,
        passphrase: certPassword,
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const response = this.parseAeatResponse(data, res.statusCode || 0);
          response.xmlRespuesta = data;
          resolve(response);
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Error de conexión: ${error.message}`,
        });
      });

      req.write(signedXml);
      req.end();
    });
  }

  /**
   * Parsea la respuesta de la AEAT
   */
  private parseAeatResponse(xml: string, statusCode: number): VerifactuResponse {
    // Respuesta exitosa
    if (statusCode === 200 && xml.includes('Correcto')) {
      // Extraer datos de la respuesta
      const csvMatch = xml.match(/<CSV>([^<]+)<\/CSV>/);
      const huellaMatch = xml.match(/<Huella>([^<]+)<\/Huella>/);
      const codigoMatch = xml.match(/<CodigoRegistro>([^<]+)<\/CodigoRegistro>/);
      
      return {
        success: true,
        csvFactura: csvMatch?.[1],
        huella: huellaMatch?.[1],
        codigoRegistro: codigoMatch?.[1],
        fechaHoraRegistro: new Date().toISOString(),
      };
    }

    // Respuesta con error
    const errorMatch = xml.match(/<DescripcionErrorRegistro>([^<]+)<\/DescripcionErrorRegistro>/);
    const errorCodeMatch = xml.match(/<CodigoErrorRegistro>([^<]+)<\/CodigoErrorRegistro>/);
    
    return {
      success: false,
      error: errorMatch?.[1] || `Error HTTP ${statusCode}`,
      errorCode: errorCodeMatch?.[1],
    };
  }

  /**
   * Consulta el estado de una factura en la AEAT
   */
  async checkInvoiceStatus(serieFactura: string, numeroFactura: string, fechaExpedicion: Date): Promise<VerifactuResponse> {
    try {
      const fechaExpedicionStr = this.formatDate(fechaExpedicion);
      
      // Generar XML de consulta
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:sist="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SistemaFacturacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <sist:ConsultaFactura>
      <sist:Cabecera>
        <sist:ObligadoEmision>
          <sist:NombreRazon>${this.escapeXml(verifactuConfig.nombreTitular)}</sist:NombreRazon>
          <sist:NIF>${verifactuConfig.nifTitular}</sist:NIF>
        </sist:ObligadoEmision>
      </sist:Cabecera>
      <sist:IDFactura>
        <sist:IDEmisorFactura>${verifactuConfig.nifTitular}</sist:IDEmisorFactura>
        <sist:NumSerieFactura>${serieFactura}${numeroFactura}</sist:NumSerieFactura>
        <sist:FechaExpedicionFactura>${fechaExpedicionStr}</sist:FechaExpedicionFactura>
      </sist:IDFactura>
    </sist:ConsultaFactura>
  </soapenv:Body>
</soapenv:Envelope>`;

      // Firmar XML
      const signResult = await digitalSignatureService.signXml(xml);
      if (!signResult.success || !signResult.signedXml) {
        return {
          success: false,
          error: `Error al firmar consulta: ${signResult.error}`,
        };
      }

      // Enviar consulta a la AEAT
      const response = await this.sendToAeat(signResult.signedXml);
      
      return {
        ...response,
        xmlEnviado: signResult.signedXml,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en consulta',
      };
    }
  }

  /**
   * Obtiene el estado del servicio Verifactu
   */
  async getStatus(): Promise<VerifactuStatus> {
    const certInfo = digitalSignatureService.getCertificateInfo();
    
    // Verificar conexión real con la AEAT
    let connected = false;
    try {
      const url = new URL(getAeatUrl());
      const testConnection = await new Promise<boolean>((resolve) => {
        const req = https.request({
          hostname: url.hostname,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 5000,
        }, (res) => {
          resolve(res.statusCode !== undefined);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.end();
      });
      connected = testConnection;
    } catch {
      connected = false;
    }

    // Contar facturas pendientes y enviadas hoy
    const { pendingInvoices, sentToday } = await this.getInvoiceCounts();
    
    return {
      connected,
      environment: verifactuConfig.environment,
      lastCheck: new Date().toISOString(),
      certificateValid: certInfo?.isValid || false,
      certificateExpiry: certInfo?.validTo?.toISOString(),
      pendingInvoices,
      sentToday,
    };
  }

  /**
   * Obtiene contadores de facturas desde la base de datos
   */
  private async getInvoiceCounts(): Promise<{ pendingInvoices: number; sentToday: number }> {
    try {
      // Importar db y schema dinámicamente para evitar dependencias circulares
      const { db } = await import('@/drizzle/db');
      const { invoices } = await import('@/drizzle/schema');
      const { eq, and, gte, sql } = await import('drizzle-orm');

      // Contar facturas pendientes de envío a VeriFactu (estado draft)
      const [pendingResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(invoices)
        .where(eq(invoices.status, 'draft'));

      // Contar facturas enviadas hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [sentTodayResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'sent'),
            gte(invoices.createdAt, today)
          )
        );

      return {
        pendingInvoices: pendingResult?.count || 0,
        sentToday: sentTodayResult?.count || 0,
      };
    } catch (error) {
      console.error('Error al obtener contadores de facturas:', error);
      return { pendingInvoices: 0, sentToday: 0 };
    }
  }

  /**
   * Genera el número de factura siguiente
   */
  generateInvoiceNumber(): string {
    this.invoiceCounter++;
    const year = new Date().getFullYear();
    return `${year}${String(this.invoiceCounter).padStart(6, '0')}`;
  }

  // ============================================
  // UTILIDADES
  // ============================================

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatDateTime(date: Date): string {
    // Formato: YYYY-MM-DDTHH:MM:SS+01:00
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
    
    return date.toISOString().replace('Z', `${sign}${hours}:${minutes}`);
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Exportar instancia singleton
export const verifactuService = new VerifactuService();
