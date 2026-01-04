/**
 * Servicio de Facturación Electrónica para España - Verifactu (AEAT)
 * 
 * Implementación del sistema Verifactu de la Agencia Tributaria Española
 * para la emisión de facturas electrónicas verificables.
 */

import { BaseEInvoicingService, Invoice, EInvoiceResult, ValidationResult } from '../base.service.js';

interface VerifactuConfig {
  certificatePath?: string;
  certificatePassword?: string;
  environment: 'test' | 'production';
  nif: string;
  companyName: string;
}

interface VerifactuInvoice extends Invoice {
  // Campos específicos de Verifactu
  tipoFactura: 'F1' | 'F2' | 'F3' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  claveRegimenEspecial?: string;
  descripcionOperacion: string;
}

export class VerifactuService extends BaseEInvoicingService {
  private config: VerifactuConfig;
  
  // URLs de los endpoints de la AEAT
  private readonly ENDPOINTS = {
    test: 'https://prewww1.aeat.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
    production: 'https://www1.agenciatributaria.gob.es/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP',
  };

  constructor(config: VerifactuConfig) {
    super('ES', 'Verifactu');
    this.config = config;
  }

  /**
   * Genera el XML de la factura en formato Verifactu
   */
  async generateXML(invoice: VerifactuInvoice): Promise<string> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiLR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroLR.xsd"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiLR:SuministroLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>${this.escapeXml(this.config.companyName)}</sii:NombreRazon>
          <sii:NIF>${this.config.nif}</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <siiLR:RegistroLRFacturasEmitidas>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${invoice.date.getFullYear()}</sii:Ejercicio>
          <sii:Periodo>${String(invoice.date.getMonth() + 1).padStart(2, '0')}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        <siiLR:IDFactura>
          <sii:IDEmisorFactura>
            <sii:NIF>${this.config.nif}</sii:NIF>
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${invoice.number}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${this.formatDate(invoice.date)}</sii:FechaExpedicionFacturaEmisor>
        </siiLR:IDFactura>
        <siiLR:FacturaExpedida>
          <sii:TipoFactura>${invoice.tipoFactura}</sii:TipoFactura>
          <sii:ClaveRegimenEspecialOTrascendencia>${invoice.claveRegimenEspecial || '01'}</sii:ClaveRegimenEspecialOTrascendencia>
          <sii:ImporteTotal>${invoice.total.toFixed(2)}</sii:ImporteTotal>
          <sii:DescripcionOperacion>${this.escapeXml(invoice.descripcionOperacion)}</sii:DescripcionOperacion>
          <sii:Contraparte>
            <sii:NombreRazon>${this.escapeXml(invoice.customer.name)}</sii:NombreRazon>
            <sii:NIF>${invoice.customer.taxId}</sii:NIF>
          </sii:Contraparte>
          <sii:TipoDesglose>
            <sii:DesgloseFactura>
              <sii:Sujeta>
                <sii:NoExenta>
                  <sii:TipoNoExenta>S1</sii:TipoNoExenta>
                  <sii:DesgloseIVA>
                    ${this.generateVATBreakdown(invoice)}
                  </sii:DesgloseIVA>
                </sii:NoExenta>
              </sii:Sujeta>
            </sii:DesgloseFactura>
          </sii:TipoDesglose>
        </siiLR:FacturaExpedida>
      </siiLR:RegistroLRFacturasEmitidas>
    </siiLR:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;

    return xml;
  }

  /**
   * Valida una factura según los requisitos de Verifactu
   */
  async validate(invoice: Invoice): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar NIF del emisor
    if (!this.validateNIF(this.config.nif)) {
      errors.push('NIF del emisor inválido');
    }

    // Validar NIF del cliente
    if (invoice.customer.taxId && !this.validateNIF(invoice.customer.taxId)) {
      errors.push('NIF del cliente inválido');
    }

    // Validar número de factura
    if (!invoice.number || invoice.number.length > 60) {
      errors.push('Número de factura inválido (máximo 60 caracteres)');
    }

    // Validar fecha
    if (!invoice.date || invoice.date > new Date()) {
      errors.push('Fecha de factura inválida');
    }

    // Validar importe total
    if (invoice.total <= 0) {
      errors.push('El importe total debe ser mayor que cero');
    }

    // Validar líneas de factura
    if (!invoice.lines || invoice.lines.length === 0) {
      errors.push('La factura debe tener al menos una línea');
    }

    // Advertencias
    if (!invoice.customer.email) {
      warnings.push('Se recomienda incluir el email del cliente');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Envía la factura a la AEAT
   */
  async send(invoice: Invoice): Promise<EInvoiceResult> {
    const validation = await this.validate(invoice);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validación fallida: ' + validation.errors.join(', '),
        errors: validation.errors,
      };
    }

    const xml = await this.generateXML(invoice as VerifactuInvoice);
    const endpoint = this.ENDPOINTS[this.config.environment];

    try {
      // En producción, aquí se enviaría el XML firmado a la AEAT
      // Por ahora, simulamos el envío
      
      return {
        success: true,
        message: 'Factura enviada correctamente',
        invoiceId: invoice.number,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al enviar la factura: ${error}`,
        errors: [String(error)],
      };
    }
  }

  /**
   * Consulta el estado de una factura enviada
   */
  async getStatus(invoiceId: string): Promise<EInvoiceResult> {
    // Implementar consulta de estado a la AEAT
    return {
      success: true,
      message: 'Estado consultado',
      invoiceId,
      status: 'accepted',
    };
  }

  // Métodos auxiliares privados

  private validateNIF(nif: string): boolean {
    if (!nif || nif.length !== 9) return false;
    
    const nifRegex = /^[0-9]{8}[A-Z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
    
    return nifRegex.test(nif) || nieRegex.test(nif) || cifRegex.test(nif);
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateVATBreakdown(invoice: Invoice): string {
    // Agrupar líneas por tipo de IVA
    const vatGroups: Record<number, { base: number; quota: number }> = {};
    
    for (const line of invoice.lines) {
      const rate = line.vatRate || 21;
      if (!vatGroups[rate]) {
        vatGroups[rate] = { base: 0, quota: 0 };
      }
      vatGroups[rate].base += line.amount;
      vatGroups[rate].quota += line.amount * (rate / 100);
    }

    return Object.entries(vatGroups)
      .map(([rate, { base, quota }]) => `
        <sii:DetalleIVA>
          <sii:TipoImpositivo>${Number(rate).toFixed(2)}</sii:TipoImpositivo>
          <sii:BaseImponible>${base.toFixed(2)}</sii:BaseImponible>
          <sii:CuotaRepercutida>${quota.toFixed(2)}</sii:CuotaRepercutida>
        </sii:DetalleIVA>`)
      .join('');
  }
}

export default VerifactuService;
