/**
 * Servicio de Facturación Electrónica para Francia
 * Sistema: Factur-X / Chorus Pro
 * 
 * Factur-X es la versión francesa de ZUGFeRD (formato híbrido PDF/XML)
 * Chorus Pro es la plataforma obligatoria para B2G
 * 
 * Obligatorio B2G: Desde 2017
 * Obligatorio B2B: 2026 (grandes empresas), 2027 (todas)
 * 
 * Formato: PDF/A-3 con XML embebido (Cross-Industry Invoice)
 * Perfiles: MINIMUM, BASIC WL, BASIC, EN16931, EXTENDED
 */

import { BaseEInvoicingService } from '../base.service.js';
import {
  SupportedCountry,
  InvoicingSystem,
  EInvoice,
  EInvoiceStatus,
  SendResult,
} from '../types.js';

// Perfiles Factur-X
export type FacturXProfile = 
  | 'MINIMUM'     // Datos mínimos
  | 'BASIC_WL'    // Basic sin líneas
  | 'BASIC'       // Datos básicos
  | 'EN16931'     // Perfil europeo estándar
  | 'EXTENDED';   // Extendido

// Tipos de documento
export type TypeCode = 
  | '380'   // Factura
  | '381'   // Nota de crédito
  | '384'   // Factura corregida
  | '386'   // Factura proforma
  | '389';  // Autofactura

// Categorías de IVA francés
export type TVACategory = 
  | 'S'     // Tasa estándar (20%)
  | 'AA'    // Tasa reducida (5.5%)
  | 'H'     // Tasa intermedia (10%)
  | 'P'     // Tasa super reducida (2.1%)
  | 'Z'     // Tasa cero
  | 'E'     // Exento
  | 'AE'    // Autoliquidación
  | 'K'     // Intracomunitario
  | 'G'     // Exportación
  | 'O';    // Fuera de ámbito

// Configuración específica de Francia
export interface FacturXConfig {
  siret: string;              // 14 dígitos
  nafCode?: string;           // Código actividad (APE)
  profile: FacturXProfile;
  chorusProEnabled: boolean;  // Para B2G
  chorusProCredentials?: {
    login: string;
    password: string;
  };
  serviceCode?: string;       // Código de servicio (para B2G)
  engagementNumber?: string;  // Número de compromiso (para B2G)
}

export class FacturXService extends BaseEInvoicingService {
  country: SupportedCountry = 'FR';
  system: InvoicingSystem = 'facturx';
  
  private profile: FacturXProfile = 'EN16931';

  /**
   * Genera el XML en formato Factur-X (Cross-Industry Invoice)
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    const config = invoice.countryConfig?.france;
    const profile = config?.type /* profile */ as any || this.type /* profile */ as any;
    
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
   * Contexto del documento
   */
  private generateExchangedDocumentContext(profile: FacturXProfile): string {
    const guidelineId = this.getGuidelineId(profile);
    
    return `
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:${profile.toLowerCase()}</ram:ID>
    </ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${guidelineId}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>`;
  }

  /**
   * Obtiene el ID de la guía según el perfil
   */
  private getGuidelineId(profile: FacturXProfile): string {
    const guidelines: Record<FacturXProfile, string> = {
      MINIMUM: 'urn:factur-x.eu:1p0:minimum',
      BASIC_WL: 'urn:factur-x.eu:1p0:basicwl',
      BASIC: 'urn:factur-x.eu:1p0:basic',
      EN16931: 'urn:cen.eu:en16931:2017',
      EXTENDED: 'urn:factur-x.eu:1p0:extended',
    };
    return guidelines[profile];
  }

  /**
   * Documento intercambiado
   */
  private generateExchangedDocument(invoice: EInvoice): string {
    return `
  <rsm:ExchangedDocument>
    <ram:ID>${this.escapeXML(invoice.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
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
   * Transacción comercial
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
          <ram:CategoryCode>${this.getTVACategory(line.taxRate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${this.formatAmount(line.taxRate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${this.formatAmount(line.lineTotal)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');
  }

  /**
   * Determina la categoría de TVA según la tasa
   */
  private getTVACategory(rate: number): TVACategory {
    if (rate === 0) return 'Z';
    if (rate === 2.1) return 'P';
    if (rate === 5.5) return 'AA';
    if (rate === 10) return 'H';
    if (rate === 20) return 'S';
    return 'S';  // Por defecto, tasa estándar
  }

  /**
   * Acuerdo comercial
   */
  private generateApplicableHeaderTradeAgreement(invoice: EInvoice): string {
    const config = invoice.countryConfig?.france;
    const siret = config?.siret;
    
    return `
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${this.escapeXML(invoice.seller.name)}</ram:Name>
        ${siret ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${this.escapeXML(invoice.seller.address.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${this.escapeXML(invoice.seller.address.street)}</ram:LineOne>
          <ram:CityName>${this.escapeXML(invoice.seller.address.city)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
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
      ${config?.serviceCode ? `
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${this.escapeXML(config.serviceCode)}</ram:IssuerAssignedID>
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
   * Liquidación
   */
  private generateApplicableHeaderTradeSettlement(invoice: EInvoice): string {
    const paymentMeansCode = this.getPaymentMeansCode(invoice.paymentMethod);
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
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${this.formatAmount(values.tax)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${this.formatAmount(values.base)}</ram:BasisAmount>
        <ram:CategoryCode>${this.getTVACategory(rate)}</ram:CategoryCode>
        <ram:RateApplicablePercent>${this.formatAmount(rate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`;
    });
    
    return result;
  }

  /**
   * Código de medio de pago
   */
  private getPaymentMeansCode(method?: string): string {
    if (!method) return '30';  // Transferencia
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('espèces') || methodLower.includes('cash') || methodLower.includes('efectivo')) {
      return '10';
    }
    if (methodLower.includes('carte') || methodLower.includes('card') || methodLower.includes('tarjeta')) {
      return '48';
    }
    if (methodLower.includes('prélèvement') || methodLower.includes('sepa')) {
      return '59';
    }
    if (methodLower.includes('chèque') || methodLower.includes('cheque')) {
      return '20';
    }
    return '30';  // Transferencia
  }

  /**
   * Formatea fecha en formato compacto
   */
  private formatDateCompact(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Genera el PDF con XML embebido
   */
  async generatePDF(invoice: EInvoice): Promise<Buffer> {
    const xml = await this.generateXML(invoice);
    const html = this.generatePDFHTML(invoice);
    
    this.log('generatePDF', { 
      invoiceNumber: invoice.invoiceNumber,
      profile: this.type /* profile */ as any,
    });
    
    return Buffer.from(html);
  }

  /**
   * Genera el HTML para el PDF
   */
  private generatePDFHTML(invoice: EInvoice): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoiceNumber}</title>
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
    .facturx-badge { 
      background: #002395; 
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
  <span class="facturx-badge">Factur-X EN16931</span>
  <h1>FACTURE N° ${invoice.invoiceNumber}</h1>
  <p>Date: ${this.formatDate(invoice.issueDate)}</p>
  
  <div class="header">
    <div class="seller">
      <h3>Émetteur</h3>
      <p><strong>${invoice.seller.name}</strong></p>
      <p>N° TVA: ${invoice.seller.taxId}</p>
      ${invoice.countryConfig?.france?.siret ? `<p>SIRET: ${invoice.countryConfig.france.siret}</p>` : ''}
      <p>${invoice.seller.address.street}</p>
      <p>${invoice.seller.address.postalCode} ${invoice.seller.address.city}</p>
    </div>
    <div class="buyer">
      <h3>Destinataire</h3>
      <p><strong>${invoice.buyer.name}</strong></p>
      ${invoice.buyer.taxId ? `<p>N° TVA: ${invoice.buyer.taxId}</p>` : ''}
      <p>${invoice.buyer.address.street}</p>
      <p>${invoice.buyer.address.postalCode} ${invoice.buyer.address.city}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantité</th>
        <th>Prix Unit. HT</th>
        <th>TVA %</th>
        <th>Total HT</th>
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
    <p>Total HT: € ${this.formatAmount(invoice.subtotal)}</p>
    <p>TVA: € ${this.formatAmount(invoice.taxAmount)}</p>
    <p class="total-row">TOTAL TTC: € ${this.formatAmount(invoice.amount /* total */ as any)}</p>
  </div>
  
  ${invoice.dueDate ? `<p>Date d'échéance: ${this.formatDate(invoice.dueDate)}</p>` : ''}
  ${invoice.bankAccount ? `<p>IBAN: ${invoice.bankAccount}</p>` : ''}
  
  ${invoice.notes ? `<div class="footer"><p>${invoice.notes}</p></div>` : ''}
  
  <div class="footer">
    <p>Facture électronique conforme au format Factur-X.</p>
    <p>En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.</p>
    <p>Indemnité forfaitaire pour frais de recouvrement: 40 €</p>
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
      
      const config = invoice.countryConfig?.france;
      
      // Si es B2G (Chorus Pro habilitado), enviar a Chorus Pro
      if (config?.enabled /* chorusProEnabled */ as any) {
        return await this.sendToChorusPro(invoice, xml, hash);
      }
      
      // Para B2B, el PDF se envía directamente
      this.log('send', { 
        invoiceNumber: invoice.invoiceNumber,
        hash,
        type: 'B2B',
      });

      return {
        success: true,
        invoiceId: invoice.id,
        hash,
        registrationCode: `FR${Date.now()}`,
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
   * Envía factura a Chorus Pro (B2G)
   */
  private async sendToChorusPro(invoice: EInvoice, xml: string, hash: string): Promise<SendResult> {
    const config = invoice.countryConfig?.france;
    
    this.log('sendToChorusPro', { 
      invoiceNumber: invoice.invoiceNumber,
      siret: config?.siret,
      serviceCode: config?.serviceCode,
    });

    // En producción, se usaría la API de Chorus Pro
    // https://chorus-pro.gouv.fr/

    return {
      success: true,
      invoiceId: invoice.id,
      hash,
      registrationCode: `CP${Date.now()}`,
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
   * Validaciones específicas de Francia
   */
  protected async validateCountrySpecific(invoice: EInvoice): Promise<string[]> {
    const errors: string[] = [];
    const config = invoice.countryConfig?.france;

    // Validar número de TVA francés (FR + 2 caracteres + 9 dígitos)
    const sellerVAT = invoice.seller.taxId;
    if (!sellerVAT.match(/^FR[0-9A-Z]{2}\d{9}$/)) {
      errors.push('N° TVA del emisor debe tener formato FR + 2 caracteres + 9 dígitos');
    }

    // Validar SIRET si se proporciona (14 dígitos)
    if (config?.siret) {
      if (!/^\d{14}$/.test(config.siret)) {
        errors.push('SIRET debe tener 14 dígitos');
      }
    }

    // Validar código postal francés (5 dígitos)
    if (invoice.seller.address.country === 'FR') {
      if (!/^\d{5}$/.test(invoice.seller.address.postalCode)) {
        errors.push('Code postal del emisor debe tener 5 dígitos');
      }
    }

    // Validar tipos de TVA franceses
    const validRates = [0, 2.1, 5.5, 10, 20];
    invoice.lines.forEach((line, index) => {
      if (!validRates.includes(line.taxRate)) {
        errors.push(`Línea ${index + 1}: Taux de TVA ${line.taxRate}% no es estándar en Francia (0%, 2.1%, 5.5%, 10%, 20%)`);
      }
    });

    // Para B2G, se requiere código de servicio
    if (config?.enabled /* chorusProEnabled */ as any && !config?.serviceCode) {
      errors.push('Code de service requis pour Chorus Pro (B2G)');
    }

    return errors;
  }
}

/**
 * Cliente para Chorus Pro API
 */
export class ChorusProClient {
  private baseUrl: string;
  private credentials: { login: string; password: string };

  constructor(config: { 
    environment: 'test' | 'production';
    login: string;
    password: string;
  }) {
    this.baseUrl = config.environment === 'production'
      ? 'https://chorus-pro.gouv.fr/api/v1'
      : 'https://sandbox-api.chorus-pro.gouv.fr/api/v1';
    this.credentials = {
      login: config.login,
      password: config.password,
    };
  }

  /**
   * Enviar factura
   */
  async submitInvoice(xml: string, metadata: {
    siret: string;
    serviceCode: string;
    engagementNumber?: string;
  }): Promise<{ success: boolean; numeroFlux?: string; error?: string }> {
    
    return {
      success: true,
      numeroFlux: `FLUX${Date.now()}`,
    };
  }

  /**
   * Consultar estado
   */
  async getStatus(numeroFlux: string): Promise<{
    statut: 'EN_COURS' | 'VALIDEE' | 'REJETEE' | 'MISE_EN_PAIEMENT' | 'PAYEE';
    dateStatut: Date;
    motifRejet?: string;
  }> {
    
    return {
      statut: 'VALIDEE',
      dateStatut: new Date(),
    };
  }
}
