/**
 * Servicio de Facturación Electrónica para Alemania
 * Sistema: ZUGFeRD 2.1 / XRechnung
 * 
 * ZUGFeRD = Zentraler User Guide des Forums elektronische Rechnung Deutschland
 * 
 * Obligatorio para B2G desde 2020, B2B obligatorio desde 2025
 * 
 * Formato: PDF/A-3 con XML embebido (Cross-Industry Invoice - CII)
 * Perfiles: MINIMUM, BASIC, BASIC WL, EN16931 (COMFORT), EXTENDED, XRECHNUNG
 * 
 * Para administraciones públicas (B2G): XRechnung obligatorio
 * Para empresas (B2B): ZUGFeRD aceptado
 */

import { BaseEInvoicingService } from '../base.service.js';
import {
  SupportedCountry,
  InvoicingSystem,
  EInvoice,
  EInvoiceStatus,
  SendResult,
} from '../types.js';

// Perfiles ZUGFeRD
export type ZUGFeRDProfile = 
  | 'MINIMUM'     // Datos mínimos
  | 'BASIC'       // Datos básicos
  | 'BASIC_WL'    // Basic sin líneas
  | 'EN16931'     // Perfil europeo (antes COMFORT)
  | 'EXTENDED'    // Extendido
  | 'XRECHNUNG';  // Para administración pública alemana

// Tipos de documento alemanes
export type DocumentType = 
  | '380'   // Factura comercial
  | '381'   // Nota de crédito
  | '384'   // Factura corregida
  | '389'   // Autofactura
  | '751';  // Factura información

// Códigos de IVA
export type TaxCategoryCode = 
  | 'S'     // Standard rate
  | 'Z'     // Zero rated
  | 'E'     // Exempt
  | 'AE'    // Reverse charge
  | 'K'     // Intra-community supply
  | 'G'     // Export
  | 'O'     // Outside scope
  | 'L'     // Canary Islands
  | 'M';    // Ceuta/Melilla

export class ZUGFeRDService extends BaseEInvoicingService {
  country: SupportedCountry = 'DE';
  system: InvoicingSystem = 'zugferd';
  
  private profile: ZUGFeRDProfile = 'EN16931';

  /**
   * Genera el XML en formato ZUGFeRD 2.1 (Cross-Industry Invoice)
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    const profile = invoice.countryConfig?.germany?.leitwegId ? 'XRECHNUNG' : this.type /* profile */ as any;
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  ${this.generateExchangedDocumentContext(profile)}
  ${this.generateExchangedDocument(invoice)}
  ${this.generateSupplyChainTradeTransaction(invoice)}
  
</rsm:CrossIndustryInvoice>`;

    return xml;
  }

  /**
   * Contexto del documento (perfil ZUGFeRD)
   */
  private generateExchangedDocumentContext(profile: ZUGFeRDProfile): string {
    const guidelineId = this.getGuidelineId(profile);
    
    return `
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${guidelineId}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>`;
  }

  /**
   * Obtiene el ID de la guía según el perfil
   */
  private getGuidelineId(profile: ZUGFeRDProfile): string {
    const guidelines: Record<ZUGFeRDProfile, string> = {
      MINIMUM: 'urn:factur-x.eu:1p0:minimum',
      BASIC: 'urn:factur-x.eu:1p0:basic',
      BASIC_WL: 'urn:factur-x.eu:1p0:basicwl',
      EN16931: 'urn:cen.eu:en16931:2017',
      EXTENDED: 'urn:factur-x.eu:1p0:extended',
      XRECHNUNG: 'urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.3',
    };
    return guidelines[profile];
  }

  /**
   * Documento intercambiado (cabecera)
   */
  private generateExchangedDocument(invoice: EInvoice): string {
    const typeCode = this.getDocumentTypeCode(invoice);
    
    return `
  <rsm:ExchangedDocument>
    <ram:ID>${this.escapeXML(invoice.invoiceNumber)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${this.formatDateCompact(invoice.issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${invoice.notes ? `
    <ram:IncludedNote>
      <ram:Content>${this.escapeXML(invoice.notes)}</ram:Content>
    </ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>`;
  }

  /**
   * Determina el código de tipo de documento
   */
  private getDocumentTypeCode(invoice: EInvoice): DocumentType {
    // Por defecto, factura comercial
    return '380';
  }

  /**
   * Transacción comercial (cuerpo principal)
   */
  private generateSupplyChainTradeTransaction(invoice: EInvoice): string {
    return `
  <rsm:SupplyChainTradeTransaction>
    ${this.generateIncludedSupplyChainTradeLineItems(invoice)}
    ${this.generateApplicableHeaderTradeAgreement(invoice)}
    ${this.generateApplicableHeaderTradeDelivery(invoice)}
    ${this.generateApplicableHeaderTradeSettlement(invoice)}
  </rsm:SupplyChainTradeTransaction>`;
  }

  /**
   * Líneas de factura
   */
  private generateIncludedSupplyChainTradeLineItems(invoice: EInvoice): string {
    return invoice.lines.map((line, index) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${this.escapeXML(line.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${this.formatAmount(line.unitPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${line.unitCode || 'C62'}">${this.formatAmount(line.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${this.getTaxCategoryCode(line.taxRate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${this.formatAmount(line.taxRate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${this.formatAmount(line.lineTotal)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');
  }

  /**
   * Determina el código de categoría de IVA
   */
  private getTaxCategoryCode(taxRate: number): TaxCategoryCode {
    if (taxRate === 0) return 'Z';
    if (taxRate === 19 || taxRate === 7) return 'S';
    return 'S';
  }

  /**
   * Acuerdo comercial (vendedor y comprador)
   */
  private generateApplicableHeaderTradeAgreement(invoice: EInvoice): string {
    const buyerReference = invoice.countryConfig?.germany?.buyerReference;
    const leitwegId = invoice.countryConfig?.germany?.leitwegId;
    
    return `
    <ram:ApplicableHeaderTradeAgreement>
      ${buyerReference ? `<ram:BuyerReference>${this.escapeXML(buyerReference)}</ram:BuyerReference>` : ''}
      <ram:SellerTradeParty>
        <ram:Name>${this.escapeXML(invoice.seller.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${this.escapeXML(invoice.seller.address.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${this.escapeXML(invoice.seller.address.street)}</ram:LineOne>
          <ram:CityName>${this.escapeXML(invoice.seller.address.city)}</ram:CityName>
          <ram:CountryID>${invoice.seller.address.country}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.seller.email ? `
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${this.escapeXML(invoice.seller.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${this.escapeXML(invoice.seller.taxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${this.escapeXML(invoice.buyer.name)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${this.escapeXML(invoice.buyer.address.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${this.escapeXML(invoice.buyer.address.street)}</ram:LineOne>
          <ram:CityName>${this.escapeXML(invoice.buyer.address.city)}</ram:CityName>
          <ram:CountryID>${invoice.buyer.address.country}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.buyer.taxId ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${this.escapeXML(invoice.buyer.taxId)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
      ${leitwegId ? `
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${this.escapeXML(leitwegId)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeAgreement>`;
  }

  /**
   * Entrega
   */
  private generateApplicableHeaderTradeDelivery(invoice: EInvoice): string {
    return `
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${this.formatDateCompact(invoice.issueDate)}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>`;
  }

  /**
   * Liquidación (totales y pago)
   */
  private generateApplicableHeaderTradeSettlement(invoice: EInvoice): string {
    const paymentMeansCode = this.getPaymentMeansCode(invoice.paymentMethod);
    
    // Agrupar impuestos
    const taxGroups = this.groupTaxes(invoice);
    
    return `
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoice.currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${paymentMeansCode}</ram:TypeCode>
        ${invoice.bankAccount ? `
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${this.escapeXML(invoice.bankAccount)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>
      ${taxGroups}
      ${invoice.dueDate ? `
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${this.formatDateCompact(invoice.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>` : ''}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${this.formatAmount(invoice.subtotal)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${this.formatAmount(invoice.subtotal)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${invoice.currency}">${this.formatAmount(invoice.taxAmount)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${this.formatAmount(invoice.amount /* total */ as any)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${this.formatAmount(invoice.amount /* total */ as any)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>`;
  }

  /**
   * Agrupa los impuestos por tipo
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
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${this.formatAmount(values.tax)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${this.formatAmount(values.base)}</ram:BasisAmount>
        <ram:CategoryCode>${this.getTaxCategoryCode(rate)}</ram:CategoryCode>
        <ram:RateApplicablePercent>${this.formatAmount(rate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
    });
    
    return result;
  }

  /**
   * Código de medio de pago
   */
  private getPaymentMeansCode(method?: string): string {
    if (!method) return '58';  // SEPA transfer
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('efectivo') || methodLower.includes('bar') || methodLower.includes('cash')) {
      return '10';  // Cash
    }
    if (methodLower.includes('tarjeta') || methodLower.includes('karte') || methodLower.includes('card')) {
      return '48';  // Card
    }
    if (methodLower.includes('sepa') || methodLower.includes('lastschrift')) {
      return '59';  // SEPA direct debit
    }
    return '58';  // SEPA credit transfer
  }

  /**
   * Formatea fecha en formato compacto YYYYMMDD
   */
  private formatDateCompact(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Genera el PDF con XML embebido (PDF/A-3)
   */
  async generatePDF(invoice: EInvoice): Promise<Buffer> {
    // Generar XML
    const xml = await this.generateXML(invoice);
    
    // Generar HTML para el PDF
    const html = this.generatePDFHTML(invoice);
    
    // En producción, se usaría una librería para crear PDF/A-3 con XML embebido
    // Por ahora retornamos el HTML como placeholder
    const pdfContent = Buffer.from(html);
    
    this.log('generatePDF', { 
      invoiceNumber: invoice.invoiceNumber,
      profile: this.type /* profile */ as any,
    });
    
    return pdfContent;
  }

  /**
   * Genera el HTML para el PDF
   */
  private generatePDFHTML(invoice: EInvoice): string {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Rechnung ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .seller, .buyer { width: 45%; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .totals { text-align: right; margin-top: 20px; }
    .amount /* total */ as any-row { font-weight: bold; font-size: 1.2em; }
    .footer { margin-top: 40px; font-size: 0.9em; color: #666; }
    .zugferd-badge { 
      background: #0066cc; 
      color: white; 
      padding: 5px 10px; 
      border-radius: 4px;
      font-size: 0.8em;
      display: inline-block;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <span class="zugferd-badge">ZUGFeRD 2.1 - EN16931</span>
  <h1>RECHNUNG Nr. ${invoice.invoiceNumber}</h1>
  <p>Datum: ${this.formatDate(invoice.issueDate)}</p>
  
  <div class="header">
    <div class="seller">
      <h3>Rechnungssteller</h3>
      <p><strong>${invoice.seller.name}</strong></p>
      <p>USt-IdNr.: ${invoice.seller.taxId}</p>
      <p>${invoice.seller.address.street}</p>
      <p>${invoice.seller.address.postalCode} ${invoice.seller.address.city}</p>
    </div>
    <div class="buyer">
      <h3>Rechnungsempfänger</h3>
      <p><strong>${invoice.buyer.name}</strong></p>
      ${invoice.buyer.taxId ? `<p>USt-IdNr.: ${invoice.buyer.taxId}</p>` : ''}
      <p>${invoice.buyer.address.street}</p>
      <p>${invoice.buyer.address.postalCode} ${invoice.buyer.address.city}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Pos.</th>
        <th>Beschreibung</th>
        <th>Menge</th>
        <th>Einzelpreis</th>
        <th>MwSt. %</th>
        <th>Gesamt</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lines.map((line, index) => `
      <tr>
        <td>${index + 1}</td>
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
    <p>Nettobetrag: € ${this.formatAmount(invoice.subtotal)}</p>
    <p>MwSt.: € ${this.formatAmount(invoice.taxAmount)}</p>
    <p class="total-row">GESAMTBETRAG: € ${this.formatAmount(invoice.amount /* total */ as any)}</p>
  </div>
  
  ${invoice.dueDate ? `<p>Zahlbar bis: ${this.formatDate(invoice.dueDate)}</p>` : ''}
  ${invoice.bankAccount ? `<p>Bankverbindung: ${invoice.bankAccount}</p>` : ''}
  
  ${invoice.notes ? `<div class="footer"><p>${invoice.notes}</p></div>` : ''}
  
  <div class="footer">
    <p>Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.</p>
    <p>ZUGFeRD-konforme elektronische Rechnung gemäß EN 16931.</p>
  </div>
</body>
</html>`;
  }

  /**
   * Envía la factura
   * ZUGFeRD no requiere envío a un sistema central (excepto XRechnung para B2G)
   */
  async send(invoice: EInvoice): Promise<SendResult> {
    try {
      // Validar
      const validation = await this.validate(invoice);
      if (!validation.valid) {
        return {
          success: false,
          invoiceId: invoice.id,
          errorCode: 'VALIDATION_ERROR',
          errorMessage: validation.errors.join('; '),
        };
      }

      // Generar XML
      const xml = await this.generateXML(invoice);
      const hash = await this.calculateHash(xml);
      
      // Si es XRechnung (B2G), enviar a PEPPOL/ZRE
      const leitwegId = invoice.countryConfig?.germany?.leitwegId;
      if (leitwegId) {
        return await this.sendToXRechnung(invoice, xml, hash);
      }
      
      // Para B2B, el PDF se envía directamente al cliente
      this.log('send', { 
        invoiceNumber: invoice.invoiceNumber,
        hash,
        type: 'B2B',
      });

      return {
        success: true,
        invoiceId: invoice.id,
        hash,
        registrationCode: `DE${Date.now()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        invoiceId: invoice.id,
        errorCode: 'SEND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Envía factura XRechnung a la administración pública
   */
  private async sendToXRechnung(invoice: EInvoice, xml: string, hash: string): Promise<SendResult> {
    // En producción, se enviaría vía PEPPOL o ZRE (Zentrale Rechnungseingangsplattform)
    this.log('sendToXRechnung', { 
      invoiceNumber: invoice.invoiceNumber,
      leitwegId: invoice.countryConfig?.germany?.leitwegId,
    });

    return {
      success: true,
      invoiceId: invoice.id,
      hash,
      registrationCode: `XR${Date.now()}`,
    };
  }

  /**
   * Consulta el estado (solo relevante para XRechnung)
   */
  async getStatus(invoiceId: string): Promise<EInvoiceStatus> {
    this.log('getStatus', { invoiceId });
    return 'sent';
  }

  /**
   * Validaciones específicas de Alemania
   */
  protected async validateCountrySpecific(invoice: EInvoice): Promise<string[]> {
    const errors: string[] = [];
    const config = invoice.countryConfig?.germany;

    // Validar USt-IdNr (formato: DE + 9 dígitos)
    const sellerVAT = invoice.seller.taxId;
    if (!sellerVAT.match(/^DE\d{9}$/)) {
      errors.push('USt-IdNr. del emisor debe tener formato DE + 9 dígitos (ej: DE123456789)');
    }

    // Si hay Leitweg-ID (B2G), validar formato
    if (config?.leitwegId) {
      // Formato: 04011000-12345-67 (varía según administración)
      if (config.leitwegId.length < 10) {
        errors.push('Leitweg-ID parece demasiado corto');
      }
    }

    // Validar código postal alemán (5 dígitos)
    if (invoice.seller.address.country === 'DE') {
      if (!/^\d{5}$/.test(invoice.seller.address.postalCode)) {
        errors.push('PLZ del emisor debe tener 5 dígitos');
      }
    }

    // Validar tipos de IVA alemanes
    invoice.lines.forEach((line, index) => {
      if (![0, 7, 19].includes(line.taxRate)) {
        errors.push(`Línea ${index + 1}: Tipo de IVA ${line.taxRate}% no es estándar en Alemania (0%, 7%, 19%)`);
      }
    });

    return errors;
  }
}

/**
 * Utilidades para XRechnung
 */
export class XRechnungUtils {
  /**
   * Valida un Leitweg-ID
   */
  static validateLeitwegId(id: string): boolean {
    // Formato básico: números y guiones
    return /^[\d-]+$/.test(id) && id.length >= 10;
  }

  /**
   * Obtiene el endpoint de ZRE según el estado federal
   */
  static getZREEndpoint(bundesland: string): string {
    // La mayoría usa la plataforma central
    return 'https://xrechnung.bund.de';
  }
}
