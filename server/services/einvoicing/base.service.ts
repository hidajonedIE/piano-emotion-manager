/**
 * Servicio base abstracto para facturación electrónica
 * Todos los servicios específicos de país heredan de este
 */

import {
  SupportedCountry,
  InvoicingSystem,
  EInvoice,
  EInvoiceStatus,
  SendResult,
  IEInvoicingService,
  BaseInvoiceData,
  VAT_RATES,
  DEFAULT_CURRENCY,
} from './types';

export abstract class BaseEInvoicingService implements IEInvoicingService {
  abstract country: SupportedCountry;
  abstract system: InvoicingSystem;

  // Métodos abstractos que cada país debe implementar
  abstract generateXML(invoice: EInvoice): Promise<string>;
  abstract generatePDF(invoice: EInvoice): Promise<Buffer>;
  abstract send(invoice: EInvoice): Promise<SendResult>;
  abstract getStatus(invoiceId: string): Promise<EInvoiceStatus>;

  /**
   * Validación común para todas las facturas
   */
  async validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validaciones básicas
    if (!invoice.invoiceNumber) {
      errors.push('Número de factura requerido');
    }

    if (!invoice.issueDate) {
      errors.push('Fecha de emisión requerida');
    }

    if (!invoice.seller?.name || !invoice.seller?.taxId) {
      errors.push('Datos del emisor incompletos (nombre y NIF requeridos)');
    }

    if (!invoice.buyer?.name) {
      errors.push('Nombre del receptor requerido');
    }

    if (!invoice.lines || invoice.lines.length === 0) {
      errors.push('La factura debe tener al menos una línea');
    }

    // Validar líneas
    invoice.lines?.forEach((line, index) => {
      if (!line.description) {
        errors.push(`Línea ${index + 1}: descripción requerida`);
      }
      if (line.quantity <= 0) {
        errors.push(`Línea ${index + 1}: cantidad debe ser mayor que 0`);
      }
      if (line.unitPrice < 0) {
        errors.push(`Línea ${index + 1}: precio unitario no puede ser negativo`);
      }
    });

    // Validar totales
    const calculatedSubtotal = invoice.lines?.reduce((sum, line) => sum + line.lineTotal, 0) || 0;
    if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
      errors.push('El subtotal no coincide con la suma de las líneas');
    }

    // Validaciones específicas del país (las subclases pueden añadir más)
    const countryErrors = await this.validateCountrySpecific(invoice);
    errors.push(...countryErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validaciones específicas del país (a implementar por cada subclase)
   */
  protected async validateCountrySpecific(invoice: EInvoice): Promise<string[]> {
    return [];
  }

  /**
   * Obtener tasa de IVA estándar del país
   */
  protected getStandardVATRate(): number {
    return VAT_RATES[this.country].standard;
  }

  /**
   * Obtener moneda por defecto del país
   */
  protected getDefaultCurrency(): string {
    return DEFAULT_CURRENCY[this.country];
  }

  /**
   * Formatear fecha según estándar ISO
   */
  protected formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Formatear importe con 2 decimales
   */
  protected formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Generar ID único para la factura
   */
  protected generateUniqueId(): string {
    return `${this.country}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Escapar caracteres especiales para XML
   */
  protected escapeXML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Calcular hash SHA-256 de un string
   */
  protected async calculateHash(content: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Log de operación para auditoría
   */
  protected log(operation: string, data: Record<string, unknown>): void {
    console.log(`[${this.system.toUpperCase()}] ${operation}:`, JSON.stringify(data, null, 2));
  }
}

/**
 * Factory para crear el servicio de facturación según el país
 */
export class EInvoicingServiceFactory {
  private static services: Map<SupportedCountry, IEInvoicingService> = new Map();

  static async getService(country: SupportedCountry): Promise<IEInvoicingService> {
    if (this.services.has(country)) {
      return this.services.get(country)!;
    }

    let service: IEInvoicingService;

    switch (country) {
      case 'ES':
        const { VerifactuService } = await import('./spain/verifactu.service');
        service = new VerifactuService();
        break;
      case 'IT':
        const { SDIService } = await import('./italy/sdi.service');
        service = new SDIService();
        break;
      case 'DE':
        const { ZUGFeRDService } = await import('./germany/zugferd.service');
        service = new ZUGFeRDService();
        break;
      case 'FR':
        const { FacturXService } = await import('./france/facturx.service');
        service = new FacturXService();
        break;
      case 'PT':
        const { CIUSPTService } = await import('./portugal/ciuspt.service');
        service = new CIUSPTService();
        break;
      case 'DK':
        const { OIOUBLService } = await import('./denmark/oioubl.service');
        service = new OIOUBLService();
        break;
      case 'BE':
        const { BelgiumPeppolService } = await import('./belgium/peppol.service');
        service = new BelgiumPeppolService();
        break;
      default:
        throw new Error(`País no soportado: ${country}`);
    }

    this.services.set(country, service);
    return service;
  }

  static clearCache(): void {
    this.services.clear();
  }
}
