/**
 * Servicio de Facturación Electrónica para Dinamarca
 * Sistema: OIOUBL / NemHandel / PEPPOL
 * 
 * Dinamarca fue pionera en facturación electrónica B2G (obligatoria desde 2005)
 * 
 * Sistemas:
 * - OIOUBL: Formato XML basado en UBL 2.0 (estándar danés)
 * - NemHandel: Infraestructura de intercambio (ahora integrada con PEPPOL)
 * - PEPPOL: Red europea de facturación electrónica
 * 
 * Obligatorio B2G: Desde 2005
 * B2B: Ampliamente adoptado, no obligatorio
 * 
 * Moneda: DKK (Corona danesa) - No Euro
 */

import { BaseEInvoicingService } from '../base.service';
import {
  SupportedCountry,
  InvoicingSystem,
  EInvoice,
  EInvoiceStatus,
  SendResult,
} from '../types';

// Tipos de documento OIOUBL
export type OIOUBLDocumentType = 
  | 'Invoice'           // Factura
  | 'CreditNote'        // Nota de crédito
  | 'Reminder'          // Recordatorio
  | 'ApplicationResponse';  // Respuesta

// Códigos de tipo de factura
export type InvoiceTypeCode = 
  | '380'   // Factura comercial
  | '381'   // Nota de crédito
  | '383'   // Nota de débito
  | '384'   // Factura corregida
  | '386'   // Factura proforma
  | '393'   // Factura factoring
  | '394'   // Factura de arrendamiento
  | '395';  // Factura consolidada

// Configuración específica de Dinamarca
export interface OIOUBLConfig {
  cvr: string;                    // CVR-nummer (8 dígitos)
  ean?: string;                   // EAN/GLN (13 dígitos) para B2G
  nemhandelEnabled: boolean;      // Usar NemHandel/PEPPOL
  peppolParticipantId?: string;   // ID PEPPOL (ej: 0088:5798000000001)
  orderReference?: string;        // Referencia de pedido
  contactId?: string;             // ID de contacto
}

export class OIOUBLService extends BaseEInvoicingService {
  country: SupportedCountry = 'DK';
  system: InvoicingSystem = 'oioubl';

  /**
   * Genera el XML en formato OIOUBL 2.1
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    const config = invoice.countryConfig?.denmark;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${this.escapeXML(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(invoice.issueDate)}</cbc:IssueDate>
  ${invoice.dueDate ? `<cbc:DueDate>${this.formatDate(invoice.dueDate)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${invoice.notes ? `<cbc:Note>${this.escapeXML(invoice.notes)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  ${config?.orderReference ? `
  <cac:OrderReference>
    <cbc:ID>${this.escapeXML(config.orderReference)}</cbc:ID>
  </cac:OrderReference>` : ''}
  
  ${this.generateAccountingSupplierParty(invoice)}
  ${this.generateAccountingCustomerParty(invoice)}
  ${this.generatePaymentMeans(invoice)}
  ${this.generatePaymentTerms(invoice)}
  ${this.generateTaxTotal(invoice)}
  ${this.generateLegalMonetaryTotal(invoice)}
  ${this.generateInvoiceLines(invoice)}
  
</Invoice>`;

    return xml;
  }

  /**
   * Emisor (Leverandør)
   */
  private generateAccountingSupplierParty(invoice: EInvoice): string {
    const config = invoice.countryConfig?.denmark;
    const cvr = config?.cvr || invoice.seller.taxId.replace(/^DK/, '');
    
    return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="0184">${cvr}</cbc:EndpointID>
      <cac:PartyIdentification>
        <cbc:ID schemeID="0184">${cvr}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${this.escapeXML(invoice.seller.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXML(invoice.seller.address.street)}</cbc:StreetName>
        <cbc:CityName>${this.escapeXML(invoice.seller.address.city)}</cbc:CityName>
        <cbc:PostalZone>${this.escapeXML(invoice.seller.address.postalCode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>DK</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>DK${cvr}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXML(invoice.seller.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="0184">${cvr}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${invoice.seller.email ? `
      <cac:Contact>
        <cbc:ElectronicMail>${this.escapeXML(invoice.seller.email)}</cbc:ElectronicMail>
        ${invoice.seller.phone ? `<cbc:Telephone>${this.escapeXML(invoice.seller.phone)}</cbc:Telephone>` : ''}
      </cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  }

  /**
   * Cliente (Kunde)
   */
  private generateAccountingCustomerParty(invoice: EInvoice): string {
    const config = invoice.countryConfig?.denmark;
    const buyerId = config?.ean || invoice.buyer.taxId?.replace(/^DK/, '') || '';
    const schemeId = config?.ean ? '0088' : '0184';  // 0088 = EAN/GLN, 0184 = CVR
    
    return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${buyerId ? `<cbc:EndpointID schemeID="${schemeId}">${buyerId}</cbc:EndpointID>` : ''}
      ${buyerId ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${schemeId}">${buyerId}</cbc:ID>
      </cac:PartyIdentification>` : ''}
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
      ${invoice.buyer.email ? `
      <cac:Contact>
        <cbc:ElectronicMail>${this.escapeXML(invoice.buyer.email)}</cbc:ElectronicMail>
      </cac:Contact>` : ''}
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
    ${invoice.dueDate ? `<cbc:PaymentDueDate>${this.formatDate(invoice.dueDate)}</cbc:PaymentDueDate>` : ''}
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
    if (!method) return '58';  // SEPA transfer
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('kontant') || methodLower.includes('cash')) {
      return '10';
    }
    if (methodLower.includes('kort') || methodLower.includes('card') || methodLower.includes('dankort')) {
      return '48';
    }
    if (methodLower.includes('mobilepay')) {
      return '68';  // Online payment service
    }
    if (methodLower.includes('betalingsservice') || methodLower.includes('pbs')) {
      return '59';  // Direct debit
    }
    return '58';  // SEPA credit transfer
  }

  /**
   * Términos de pago
   */
  private generatePaymentTerms(invoice: EInvoice): string {
    if (!invoice.paymentTerms && !invoice.dueDate) return '';
    
    return `
  <cac:PaymentTerms>
    ${invoice.paymentTerms ? `<cbc:Note>${this.escapeXML(invoice.paymentTerms)}</cbc:Note>` : ''}
  </cac:PaymentTerms>`;
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
        <cbc:ID>${rate === 0 ? 'Z' : 'S'}</cbc:ID>
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
        <cbc:ID>${line.taxRate === 0 ? 'Z' : 'S'}</cbc:ID>
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
   * Genera el PDF
   */
  async generatePDF(invoice: EInvoice): Promise<Buffer> {
    const html = this.generatePDFHTML(invoice);
    
    this.log('generatePDF', { 
      invoiceNumber: invoice.invoiceNumber,
      currency: invoice.currency,
    });
    
    return Buffer.from(html);
  }

  /**
   * Genera el HTML para el PDF
   */
  private generatePDFHTML(invoice: EInvoice): string {
    const config = invoice.countryConfig?.denmark;
    const cvr = config?.cvr || invoice.seller.taxId.replace(/^DK/, '');
    
    return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Faktura ${invoice.invoiceNumber}</title>
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
    .oioubl-badge { 
      background: #c60c30; 
      color: white; 
      padding: 5px 10px; 
      border-radius: 4px;
      font-size: 0.8em;
      display: inline-block;
      margin-bottom: 20px;
    }
    .cvr-info {
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <span class="oioubl-badge">OIOUBL / PEPPOL</span>
  <h1>FAKTURA Nr. ${invoice.invoiceNumber}</h1>
  <p>Dato: ${this.formatDate(invoice.issueDate)}</p>
  
  <div class="header">
    <div class="seller">
      <h3>Leverandør</h3>
      <p><strong>${invoice.seller.name}</strong></p>
      <p class="cvr-info">CVR: ${cvr}</p>
      <p>${invoice.seller.address.street}</p>
      <p>${invoice.seller.address.postalCode} ${invoice.seller.address.city}</p>
      ${invoice.seller.email ? `<p>Email: ${invoice.seller.email}</p>` : ''}
    </div>
    <div class="buyer">
      <h3>Kunde</h3>
      <p><strong>${invoice.buyer.name}</strong></p>
      ${config?.ean ? `<p class="cvr-info">EAN: ${config.ean}</p>` : ''}
      ${invoice.buyer.taxId ? `<p class="cvr-info">CVR/VAT: ${invoice.buyer.taxId}</p>` : ''}
      <p>${invoice.buyer.address.street}</p>
      <p>${invoice.buyer.address.postalCode} ${invoice.buyer.address.city}</p>
    </div>
  </div>
  
  ${config?.orderReference ? `<p><strong>Ordreref.:</strong> ${config.orderReference}</p>` : ''}
  
  <table>
    <thead>
      <tr>
        <th>Beskrivelse</th>
        <th>Antal</th>
        <th>Enhedspris</th>
        <th>Moms %</th>
        <th>Beløb</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lines.map(line => `
      <tr>
        <td>${line.description}</td>
        <td>${line.quantity}</td>
        <td>${this.formatCurrency(line.unitPrice, invoice.currency)}</td>
        <td>${line.taxRate}%</td>
        <td>${this.formatCurrency(line.lineTotal, invoice.currency)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <p>Subtotal ekskl. moms: ${this.formatCurrency(invoice.subtotal, invoice.currency)}</p>
    <p>Moms (25%): ${this.formatCurrency(invoice.taxAmount, invoice.currency)}</p>
    <p class="total-row">TOTAL INKL. MOMS: ${this.formatCurrency(invoice.total, invoice.currency)}</p>
  </div>
  
  ${invoice.dueDate ? `<p><strong>Betalingsfrist:</strong> ${this.formatDate(invoice.dueDate)}</p>` : ''}
  ${invoice.bankAccount ? `<p><strong>Kontonummer:</strong> ${invoice.bankAccount}</p>` : ''}
  
  ${invoice.notes ? `<div class="footer"><p>${invoice.notes}</p></div>` : ''}
  
  <div class="footer">
    <p>Elektronisk faktura i overensstemmelse med OIOUBL 2.1 / PEPPOL BIS Billing 3.0</p>
    <p>Ved forsinket betaling beregnes morarenter i henhold til renteloven.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Formatea moneda (DKK o EUR)
   */
  private formatCurrency(amount: number, currency: string): string {
    const symbol = currency === 'DKK' ? 'kr.' : '€';
    return `${this.formatAmount(amount)} ${symbol}`;
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
      
      const config = invoice.countryConfig?.denmark;
      
      // Si NemHandel/PEPPOL está habilitado, enviar por esa vía
      if (config?.nemhandelEnabled) {
        return await this.sendViaPEPPOL(invoice, xml, hash);
      }
      
      // Envío directo (email o descarga)
      this.log('send', { 
        invoiceNumber: invoice.invoiceNumber,
        hash,
        type: 'direct',
      });

      return {
        success: true,
        invoiceId: invoice.id,
        hash,
        registrationCode: `DK${Date.now()}`,
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
   * Envía factura vía PEPPOL/NemHandel
   */
  private async sendViaPEPPOL(invoice: EInvoice, xml: string, hash: string): Promise<SendResult> {
    const config = invoice.countryConfig?.denmark;
    
    this.log('sendViaPEPPOL', { 
      invoiceNumber: invoice.invoiceNumber,
      peppolId: config?.peppolParticipantId,
      ean: config?.ean,
    });

    // En producción, se usaría un Access Point PEPPOL certificado
    // Ejemplos: Pagero, Basware, Tradeshift, etc.

    return {
      success: true,
      invoiceId: invoice.id,
      hash,
      registrationCode: `PEPPOL${Date.now()}`,
    };
  }

  /**
   * Consulta el estado
   */
  async getStatus(invoiceId: string): Promise<EInvoiceStatus> {
    this.log('getStatus', { invoiceId });
    return 'sent';
  }

  /**
   * Validaciones específicas de Dinamarca
   */
  protected async validateCountrySpecific(invoice: EInvoice): Promise<string[]> {
    const errors: string[] = [];
    const config = invoice.countryConfig?.denmark;

    // Validar CVR-nummer (8 dígitos)
    const cvr = config?.cvr || invoice.seller.taxId.replace(/^DK/, '');
    if (!/^\d{8}$/.test(cvr)) {
      errors.push('CVR-nummer del emisor debe tener 8 dígitos');
    }

    // Validar algoritmo de control del CVR
    if (!this.validateCVR(cvr)) {
      errors.push('CVR-nummer del emisor no es válido (dígito de control incorrecto)');
    }

    // Validar EAN si se proporciona (13 dígitos)
    if (config?.ean) {
      if (!/^\d{13}$/.test(config.ean)) {
        errors.push('EAN/GLN debe tener 13 dígitos');
      }
    }

    // Validar código postal danés (4 dígitos)
    if (invoice.seller.address.country === 'DK') {
      if (!/^\d{4}$/.test(invoice.seller.address.postalCode)) {
        errors.push('Postnummer del emisor debe tener 4 dígitos');
      }
    }

    // Dinamarca solo tiene IVA al 25% (o 0% para exentos)
    invoice.lines.forEach((line, index) => {
      if (line.taxRate !== 0 && line.taxRate !== 25) {
        errors.push(`Linje ${index + 1}: Momssats ${line.taxRate}% er ikke standard i Danmark (0% eller 25%)`);
      }
    });

    // Validar moneda
    if (invoice.currency !== 'DKK' && invoice.currency !== 'EUR') {
      errors.push('Valuta skal være DKK eller EUR');
    }

    return errors;
  }

  /**
   * Valida el CVR-nummer danés usando el algoritmo de control (módulo 11)
   */
  private validateCVR(cvr: string): boolean {
    if (!/^\d{8}$/.test(cvr)) return false;
    
    const weights = [2, 7, 6, 5, 4, 3, 2, 1];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cvr[i]) * weights[i];
    }
    
    return sum % 11 === 0;
  }
}

/**
 * Cliente para NemHandel/PEPPOL
 */
export class NemHandelClient {
  private accessPointUrl: string;
  private credentials: { username: string; password: string };

  constructor(config: {
    accessPointUrl: string;
    username: string;
    password: string;
  }) {
    this.accessPointUrl = config.accessPointUrl;
    this.credentials = {
      username: config.username,
      password: config.password,
    };
  }

  /**
   * Enviar documento vía PEPPOL
   */
  async sendDocument(
    xml: string,
    recipientId: string,
    documentType: 'Invoice' | 'CreditNote'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[NemHandel] Enviando documento vía PEPPOL...');
    console.log('[NemHandel] Destinatario:', recipientId);
    
    return {
      success: true,
      messageId: `MSG${Date.now()}`,
    };
  }

  /**
   * Consultar estado de envío
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'REJECTED';
    timestamp: Date;
    error?: string;
  }> {
    console.log('[NemHandel] Consultando estado:', messageId);
    
    return {
      status: 'DELIVERED',
      timestamp: new Date(),
    };
  }

  /**
   * Buscar participante PEPPOL
   */
  async lookupParticipant(identifier: string): Promise<{
    found: boolean;
    participantId?: string;
    capabilities?: string[];
  }> {
    console.log('[NemHandel] Buscando participante:', identifier);
    
    return {
      found: true,
      participantId: `0184:${identifier}`,
      capabilities: ['urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'],
    };
  }
}
