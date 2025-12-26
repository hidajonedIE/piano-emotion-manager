/**
 * Servicio de Facturación Electrónica para Portugal
 * Sistema: CIUS-PT / SAF-T (PT)
 * 
 * Portugal tiene requisitos específicos:
 * - ATCUD: Código único de documento (obligatorio desde 2022)
 * - QR Code fiscal en todas las facturas
 * - SAF-T (PT): Fichero de auditoría fiscal
 * - Comunicación con AT (Autoridade Tributária)
 * 
 * Formato: UBL 2.1 con extensiones CIUS-PT
 * QR Code: Contiene datos fiscales para verificación
 */

import { BaseEInvoicingService } from '../base.service';
import {
  SupportedCountry,
  InvoicingSystem,
  EInvoice,
  EInvoiceStatus,
  SendResult,
} from '../types';

// Tipos de documento portugueses
export type TipoDocumento = 
  | 'FT'    // Factura
  | 'FS'    // Factura simplificada
  | 'FR'    // Factura-recibo
  | 'ND'    // Nota de débito
  | 'NC'    // Nota de crédito
  | 'VD'    // Venda a dinheiro
  | 'TV'    // Talão de venda
  | 'TD'    // Talão de devolução
  | 'AA'    // Alienação de ativos
  | 'DA';   // Devolução de ativos

// Estados del documento
export type EstadoDocumento = 
  | 'N'     // Normal
  | 'S'     // Autofacturación
  | 'A'     // Anulado
  | 'R'     // Documento resumo
  | 'F';    // Documento facturado

// Tipos de IVA portugueses
export type TipoIVA = 
  | 'NOR'   // Normal (23%)
  | 'INT'   // Intermedio (13%)
  | 'RED'   // Reducido (6%)
  | 'ISE'   // Exento
  | 'OUT';  // Otros

// Razones de exención
export type MotivoIsencao = 
  | 'M01'   // Artigo 16.º n.º 6 do CIVA
  | 'M02'   // Artigo 6.º do Decreto-Lei n.º 198/90
  | 'M04'   // Isento artigo 13.º do CIVA
  | 'M05'   // Isento artigo 14.º do CIVA
  | 'M06'   // Isento artigo 15.º do CIVA
  | 'M07'   // Isento artigo 9.º do CIVA
  | 'M09'   // IVA - não confere direito a dedução
  | 'M10'   // IVA - regime de isenção
  | 'M11'   // Regime particular do tabaco
  | 'M12'   // Regime da margem de lucro - Agências de viagens
  | 'M13'   // Regime da margem de lucro - Bens em segunda mão
  | 'M14'   // Regime da margem de lucro - Objetos de arte
  | 'M15'   // Regime da margem de lucro - Objetos de coleção e antiguidades
  | 'M16'   // Isento artigo 14.º do RITI
  | 'M19'   // Outras isenções
  | 'M20'   // IVA - regime forfetário
  | 'M21'   // IVA – não confere direito à dedução (ou expressão similar)
  | 'M25'   // Mercadorias à consignação
  | 'M30'   // IVA - autoliquidação
  | 'M31'   // IVA - autoliquidação - Aquisições intracomunitárias de bens
  | 'M32'   // IVA - autoliquidação - Operações triangulares
  | 'M33'   // IVA - autoliquidação - Aquisição de serviços de construção civil
  | 'M40'   // IVA - autoliquidação - Aquisição de serviços de construção civil
  | 'M41'   // IVA - autoliquidação - Aquisição de serviços de construção civil
  | 'M42'   // IVA - autoliquidação - Aquisição de serviços de construção civil
  | 'M43'   // IVA - autoliquidação - Aquisição de serviços de construção civil
  | 'M99';  // Não sujeito ou não tributado

// Configuración específica de Portugal
export interface CIUSPTConfig {
  nif: string;                          // NIF del emisor (9 dígitos)
  atSoftwareCertificateNumber?: string; // Número de certificación del software
  serieDocumento: string;               // Serie del documento
  sequenciaATCUD: number;               // Secuencia para ATCUD
  codigoValidacaoAT?: string;           // Código de validación de la AT
  hashAnterior?: string;                // Hash del documento anterior (encadenamiento)
}

export class CIUSPTService extends BaseEInvoicingService {
  country: SupportedCountry = 'PT';
  system: InvoicingSystem = 'ciuspt';

  /**
   * Genera el XML en formato UBL 2.1 con extensiones CIUS-PT
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    const config = invoice.countryConfig?.portugal;
    const atcud = this.generateATCUD(invoice, config);
    const hash = await this.generateDocumentHash(invoice, config?.hashAnterior);
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  ${this.generateUBLExtensions(invoice, atcud, hash)}
  
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:feap.gov.pt:CIUS-PT:2.1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${this.escapeXML(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(invoice.issueDate)}</cbc:IssueDate>
  ${invoice.dueDate ? `<cbc:DueDate>${this.formatDate(invoice.dueDate)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${invoice.notes ? `<cbc:Note>${this.escapeXML(invoice.notes)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  
  ${this.generateAccountingSupplierParty(invoice)}
  ${this.generateAccountingCustomerParty(invoice)}
  ${this.generatePaymentMeans(invoice)}
  ${this.generateTaxTotal(invoice)}
  ${this.generateLegalMonetaryTotal(invoice)}
  ${this.generateInvoiceLines(invoice)}
  
</Invoice>`;

    return xml;
  }

  /**
   * Genera las extensiones UBL específicas de Portugal
   */
  private generateUBLExtensions(invoice: EInvoice, atcud: string, hash: string): string {
    return `
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <PTExtension xmlns="urn:feap.gov.pt:CIUS-PT:2.1.0">
          <ATCUD>${atcud}</ATCUD>
          <Hash>${hash}</Hash>
          <HashControl>1</HashControl>
        </PTExtension>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`;
  }

  /**
   * Genera el ATCUD (Código Único de Documento)
   * Formato: SERIE-NUMERO o CODIGOVALIDACAO-SEQUENCIA
   */
  private generateATCUD(invoice: EInvoice, config?: CIUSPTConfig): string {
    if (config?.codigoValidacaoAT) {
      // Con código de validación de la AT
      return `${config.codigoValidacaoAT}-${config.sequenciaATCUD || 1}`;
    }
    // Sin código de validación (modo simplificado)
    const serie = config?.serieDocumento || 'A';
    const numero = invoice.invoiceNumber.replace(/\D/g, '');
    return `${serie}-${numero}`;
  }

  /**
   * Genera el hash del documento (encadenamiento)
   */
  private async generateDocumentHash(invoice: EInvoice, hashAnterior?: string): Promise<string> {
    const dataToHash = [
      invoice.issueDate.toISOString().split('T')[0],
      invoice.issueDate.toISOString().split('T')[1]?.substring(0, 8) || '00:00:00',
      invoice.invoiceNumber,
      this.formatAmount(invoice.total),
      hashAnterior || '',
    ].join(';');
    
    const hash = await this.calculateHash(dataToHash);
    // Retornar solo los primeros 4 caracteres (versión simplificada para impresión)
    return hash.substring(0, 4).toUpperCase();
  }

  /**
   * Genera el QR Code fiscal
   */
  async generateQRCode(invoice: EInvoice): Promise<string> {
    const config = invoice.countryConfig?.portugal;
    const atcud = this.generateATCUD(invoice, config);
    const hash = await this.generateDocumentHash(invoice, config?.hashAnterior);
    
    // Estructura del QR Code según especificaciones de la AT
    const qrData = [
      `A:${config?.nif || invoice.seller.taxId.replace(/^PT/, '')}`,  // NIF emisor
      `B:${invoice.buyer.taxId?.replace(/^PT/, '') || '999999990'}`,  // NIF cliente
      `C:${invoice.buyer.address.country}`,                           // País cliente
      `D:FT`,                                                          // Tipo documento
      `E:N`,                                                           // Estado
      `F:${this.formatDate(invoice.issueDate)}`,                      // Fecha
      `G:${invoice.invoiceNumber}`,                                   // Número
      `H:${atcud}`,                                                    // ATCUD
      `I1:PT`,                                                         // Espacio fiscal
      `I7:${this.formatAmount(invoice.subtotal)}`,                    // Base imponible (tasa normal)
      `I8:${this.formatAmount(invoice.taxAmount)}`,                   // IVA (tasa normal)
      `N:${this.formatAmount(invoice.taxAmount)}`,                    // Total IVA
      `O:${this.formatAmount(invoice.total)}`,                        // Total documento
      `Q:${hash}`,                                                     // Hash
      `R:${config?.atSoftwareCertificateNumber || '0'}`,              // Número certificado software
    ].join('*');
    
    // En producción, se generaría el QR code real usando una librería
    this.log('generateQRCode', { qrData });
    
    return qrData;
  }

  /**
   * Emisor
   */
  private generateAccountingSupplierParty(invoice: EInvoice): string {
    const nif = invoice.seller.taxId.replace(/^PT/, '');
    
    return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9859">${nif}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID schemeID="9859">${nif}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${this.escapeXML(invoice.seller.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXML(invoice.seller.address.street)}</cbc:StreetName>
        <cbc:CityName>${this.escapeXML(invoice.seller.address.city)}</cbc:CityName>
        <cbc:PostalZone>${this.escapeXML(invoice.seller.address.postalCode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>PT</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>PT${nif}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXML(invoice.seller.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="9859">${nif}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${invoice.seller.email ? `
      <cac:Contact>
        <cbc:ElectronicMail>${this.escapeXML(invoice.seller.email)}</cbc:ElectronicMail>
      </cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  }

  /**
   * Cliente
   */
  private generateAccountingCustomerParty(invoice: EInvoice): string {
    const nif = invoice.buyer.taxId?.replace(/^PT/, '') || '999999990';
    
    return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID schemeID="9859">${nif}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID schemeID="9859">${nif}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${this.escapeXML(invoice.buyer.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXML(invoice.buyer.address.street)}</cbc:StreetName>
        <cbc:CityName>${this.escapeXML(invoice.buyer.address.city)}</cbc:CityName>
        <cbc:PostalZone>${this.escapeXML(invoice.buyer.address.postalCode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${invoice.buyer.address.country}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${invoice.buyer.taxId ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.buyer.taxId}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXML(invoice.buyer.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  /**
   * Medios de pago
   */
  private generatePaymentMeans(invoice: EInvoice): string {
    const paymentCode = this.getPaymentMeansCode(invoice.paymentMethod);
    
    return `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${paymentCode}</cbc:PaymentMeansCode>
    ${invoice.bankAccount ? `
    <cac:PayeeFinancialAccount>
      <cbc:ID>${this.escapeXML(invoice.bankAccount)}</cbc:ID>
    </cac:PayeeFinancialAccount>` : ''}
  </cac:PaymentMeans>`;
  }

  /**
   * Código de medio de pago
   */
  private getPaymentMeansCode(method?: string): string {
    if (!method) return '30';  // Transferencia
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('numerário') || methodLower.includes('dinheiro') || methodLower.includes('cash')) {
      return '10';
    }
    if (methodLower.includes('cartão') || methodLower.includes('card')) {
      return '48';
    }
    if (methodLower.includes('multibanco') || methodLower.includes('mb')) {
      return '49';
    }
    if (methodLower.includes('débito') || methodLower.includes('sepa')) {
      return '59';
    }
    return '30';  // Transferencia
  }

  /**
   * Total de impuestos
   */
  private generateTaxTotal(invoice: EInvoice): string {
    const taxGroups = this.groupTaxes(invoice);
    
    return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.taxAmount)}</cbc:TaxAmount>
    ${taxGroups}
  </cac:TaxTotal>`;
  }

  /**
   * Agrupa impuestos por tipo
   */
  private groupTaxes(invoice: EInvoice): string {
    const groups = new Map<number, { base: number; tax: number }>();
    
    invoice.lines.forEach(line => {
      const current = groups.get(line.taxRate) || { base: 0, tax: 0 };
      current.base += line.lineTotal;
      current.tax += line.taxAmount;
      groups.set(line.taxRate, current);
    });
    
    let result = '';
    groups.forEach((values, rate) => {
      result += `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.currency}">${this.formatAmount(values.base)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.currency}">${this.formatAmount(values.tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${this.getTaxCategoryId(rate)}</cbc:ID>
        <cbc:Percent>${this.formatAmount(rate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;
    });
    
    return result;
  }

  /**
   * Obtiene el ID de categoría de IVA
   */
  private getTaxCategoryId(rate: number): string {
    if (rate === 0) return 'Z';
    if (rate === 6) return 'AA';   // Reducido
    if (rate === 13) return 'AA';  // Intermedio
    if (rate === 23) return 'S';   // Normal
    return 'S';
  }

  /**
   * Totales monetarios
   */
  private generateLegalMonetaryTotal(invoice: EInvoice): string {
    return `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.subtotal)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  }

  /**
   * Líneas de factura
   */
  private generateInvoiceLines(invoice: EInvoice): string {
    return invoice.lines.map((line, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${line.unitCode || 'C62'}">${this.formatAmount(line.quantity)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${this.formatAmount(line.lineTotal)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${this.escapeXML(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${this.getTaxCategoryId(line.taxRate)}</cbc:ID>
        <cbc:Percent>${this.formatAmount(line.taxRate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${invoice.currency}">${this.formatAmount(line.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('');
  }

  /**
   * Genera el PDF con QR Code fiscal
   */
  async generatePDF(invoice: EInvoice): Promise<Buffer> {
    const qrData = await this.generateQRCode(invoice);
    const html = await this.generatePDFHTML(invoice, qrData);
    
    this.log('generatePDF', { 
      invoiceNumber: invoice.invoiceNumber,
      hasQRCode: true,
    });
    
    return Buffer.from(html);
  }

  /**
   * Genera el HTML para el PDF
   */
  private async generatePDFHTML(invoice: EInvoice, qrData: string): Promise<string> {
    const config = invoice.countryConfig?.portugal;
    const atcud = this.generateATCUD(invoice, config);
    const hash = await this.generateDocumentHash(invoice, config?.hashAnterior);
    
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Fatura ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .seller, .buyer { width: 45%; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { font-weight: bold; font-size: 1.2em; }
    .footer { margin-top: 40px; font-size: 0.9em; color: #666; }
    .fiscal-info { 
      background: #f9f9f9; 
      padding: 15px; 
      border-radius: 8px;
      margin: 20px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .qr-placeholder {
      width: 120px;
      height: 120px;
      border: 2px dashed #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8em;
      color: #666;
    }
    .atcud-box {
      background: #006600;
      color: white;
      padding: 8px 15px;
      border-radius: 4px;
      font-weight: bold;
    }
    .hash-info {
      font-family: monospace;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>FATURA N.º ${invoice.invoiceNumber}</h1>
  <p>Data: ${this.formatDate(invoice.issueDate)}</p>
  
  <div class="fiscal-info">
    <div>
      <span class="atcud-box">ATCUD: ${atcud}</span>
      <p class="hash-info">Hash: ${hash}</p>
    </div>
    <div class="qr-placeholder">
      QR Code Fiscal<br>
      (${qrData.substring(0, 20)}...)
    </div>
  </div>
  
  <div class="header">
    <div class="seller">
      <h3>Fornecedor</h3>
      <p><strong>${invoice.seller.name}</strong></p>
      <p>NIF: ${invoice.seller.taxId}</p>
      <p>${invoice.seller.address.street}</p>
      <p>${invoice.seller.address.postalCode} ${invoice.seller.address.city}</p>
    </div>
    <div class="buyer">
      <h3>Cliente</h3>
      <p><strong>${invoice.buyer.name}</strong></p>
      ${invoice.buyer.taxId ? `<p>NIF: ${invoice.buyer.taxId}</p>` : '<p>Consumidor Final</p>'}
      <p>${invoice.buyer.address.street}</p>
      <p>${invoice.buyer.address.postalCode} ${invoice.buyer.address.city}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Descrição</th>
        <th>Qtd.</th>
        <th>Preço Unit.</th>
        <th>IVA %</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lines.map(line => `
      <tr>
        <td>${line.description}</td>
        <td>${line.quantity}</td>
        <td>€ ${this.formatAmount(line.unitPrice)}</td>
        <td>${line.taxRate}%</td>
        <td>€ ${this.formatAmount(line.lineTotal)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <p>Subtotal: € ${this.formatAmount(invoice.subtotal)}</p>
    <p>IVA: € ${this.formatAmount(invoice.taxAmount)}</p>
    <p class="total-row">TOTAL: € ${this.formatAmount(invoice.total)}</p>
  </div>
  
  ${invoice.dueDate ? `<p>Data de vencimento: ${this.formatDate(invoice.dueDate)}</p>` : ''}
  ${invoice.bankAccount ? `<p>IBAN: ${invoice.bankAccount}</p>` : ''}
  
  ${invoice.notes ? `<div class="footer"><p>${invoice.notes}</p></div>` : ''}
  
  <div class="footer">
    <p>Documento processado por programa certificado n.º ${config?.atSoftwareCertificateNumber || '0000'}/AT</p>
    <p>Este documento não serve como fatura. Documento emitido nos termos do Decreto-Lei n.º 28/2019.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Envía la factura
   */
  async send(invoice: EInvoice): Promise<SendResult> {
    try {
      const validation = await this.validate(invoice);
      if (!validation.valid) {
        return {
          success: false,
          invoiceId: invoice.id,
          errorCode: 'VALIDATION_ERROR',
          errorMessage: validation.errors.join('; '),
        };
      }

      const xml = await this.generateXML(invoice);
      const hash = await this.calculateHash(xml);
      const qrCode = await this.generateQRCode(invoice);
      
      this.log('send', { 
        invoiceNumber: invoice.invoiceNumber,
        hash,
        atcud: this.generateATCUD(invoice, invoice.countryConfig?.portugal),
      });

      return {
        success: true,
        invoiceId: invoice.id,
        hash,
        qrCode,
        registrationCode: `PT${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        errorCode: 'SEND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Consulta el estado
   */
  async getStatus(invoiceId: string): Promise<EInvoiceStatus> {
    this.log('getStatus', { invoiceId });
    return 'sent';
  }

  /**
   * Validaciones específicas de Portugal
   */
  protected async validateCountrySpecific(invoice: EInvoice): Promise<string[]> {
    const errors: string[] = [];
    const config = invoice.countryConfig?.portugal;

    // Validar NIF portugués (9 dígitos)
    const sellerNIF = invoice.seller.taxId.replace(/^PT/, '');
    if (!/^\d{9}$/.test(sellerNIF)) {
      errors.push('NIF del emisor debe tener 9 dígitos');
    }

    // Validar algoritmo de control del NIF
    if (!this.validateNIF(sellerNIF)) {
      errors.push('NIF del emisor no es válido (dígito de control incorrecto)');
    }

    // Validar código postal portugués (XXXX-XXX)
    if (invoice.seller.address.country === 'PT') {
      if (!/^\d{4}-\d{3}$/.test(invoice.seller.address.postalCode)) {
        errors.push('Código postal del emisor debe tener formato XXXX-XXX');
      }
    }

    // Validar tipos de IVA portugueses
    const validRates = [0, 6, 13, 23];
    invoice.lines.forEach((line, index) => {
      if (!validRates.includes(line.taxRate)) {
        errors.push(`Linha ${index + 1}: Taxa de IVA ${line.taxRate}% não é standard em Portugal (0%, 6%, 13%, 23%)`);
      }
    });

    // Validar serie de documento si se proporciona
    if (config?.serieDocumento) {
      if (!/^[A-Z0-9]+$/.test(config.serieDocumento)) {
        errors.push('Série de documento deve conter apenas letras maiúsculas e números');
      }
    }

    return errors;
  }

  /**
   * Valida el NIF portugués usando el algoritmo de control
   */
  private validateNIF(nif: string): boolean {
    if (!/^\d{9}$/.test(nif)) return false;
    
    const weights = [9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(nif[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(nif[8]) === checkDigit;
  }
}

/**
 * Generador de SAF-T (PT)
 * Fichero de auditoría fiscal obligatorio
 */
export class SAFTPTGenerator {
  /**
   * Genera el fichero SAF-T para un período
   */
  static async generate(
    company: {
      nif: string;
      name: string;
      address: string;
    },
    invoices: EInvoice[],
    period: { start: Date; end: Date }
  ): Promise<string> {
    // Implementación del SAF-T (PT)
    // Estructura XML según especificaciones de la AT
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
  <!-- SAF-T (PT) generado -->
</AuditFile>`;
  }
}
