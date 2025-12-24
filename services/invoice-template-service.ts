/**
 * Servicio de plantillas de factura personalizables
 */

const INVOICE_SETTINGS_KEY = 'piano_emotion_invoice_settings';

export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  // Logo
  logoUrl?: string;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  // Tipografía
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;
  // Layout
  showBorder: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderColor: string;
  showWatermark: boolean;
  watermarkText?: string;
  // Secciones
  showHeader: boolean;
  showFooter: boolean;
  footerText?: string;
  showPaymentInfo: boolean;
  showNotes: boolean;
  showTerms: boolean;
  termsText?: string;
  // Numeración
  numberPrefix: string;
  numberSuffix: string;
  numberPadding: number;
  numberSeparator: string;
  includeYear: boolean;
  resetYearly: boolean;
}

export interface InvoiceNumberingSettings {
  currentNumber: number;
  currentYear: number;
  prefix: string;
  suffix: string;
  padding: number;
  separator: string;
  includeYear: boolean;
  resetYearly: boolean;
}

export interface InvoiceSettings {
  templates: InvoiceTemplate[];
  numbering: InvoiceNumberingSettings;
  defaultTemplateId: string;
}

const DEFAULT_TEMPLATE: InvoiceTemplate = {
  id: 'default',
  name: 'Plantilla Estándar',
  isDefault: true,
  primaryColor: '#1a5f7a',
  secondaryColor: '#57c5b6',
  accentColor: '#159895',
  logoPosition: 'left',
  logoSize: 'medium',
  fontFamily: 'Helvetica',
  headerFontSize: 24,
  bodyFontSize: 10,
  showBorder: true,
  borderStyle: 'solid',
  borderColor: '#e0e0e0',
  showWatermark: false,
  showHeader: true,
  showFooter: true,
  footerText: 'Gracias por confiar en nuestros servicios',
  showPaymentInfo: true,
  showNotes: true,
  showTerms: true,
  termsText: 'Pago a 30 días. Transferencia bancaria o efectivo.',
  numberPrefix: 'F',
  numberSuffix: '',
  numberPadding: 4,
  numberSeparator: '-',
  includeYear: true,
  resetYearly: true,
};

const DEFAULT_NUMBERING: InvoiceNumberingSettings = {
  currentNumber: 1,
  currentYear: new Date().getFullYear(),
  prefix: 'F',
  suffix: '',
  padding: 4,
  separator: '-',
  includeYear: true,
  resetYearly: true,
};

const DEFAULT_SETTINGS: InvoiceSettings = {
  templates: [DEFAULT_TEMPLATE],
  numbering: DEFAULT_NUMBERING,
  defaultTemplateId: 'default',
};

class InvoiceTemplateService {
  private settings: InvoiceSettings = DEFAULT_SETTINGS;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.loadSettings();
    this.initialized = true;
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(INVOICE_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(INVOICE_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
    }
  }

  // ==================== PLANTILLAS ====================

  getTemplates(): InvoiceTemplate[] {
    return [...this.settings.templates];
  }

  getTemplate(id: string): InvoiceTemplate | null {
    return this.settings.templates.find(t => t.id === id) || null;
  }

  getDefaultTemplate(): InvoiceTemplate {
    return this.settings.templates.find(t => t.id === this.settings.defaultTemplateId) 
      || this.settings.templates[0] 
      || DEFAULT_TEMPLATE;
  }

  createTemplate(template: Omit<InvoiceTemplate, 'id'>): InvoiceTemplate {
    const newTemplate: InvoiceTemplate = {
      ...template,
      id: `template_${Date.now()}`,
    };
    this.settings.templates.push(newTemplate);
    this.saveSettings();
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<InvoiceTemplate>): void {
    this.settings.templates = this.settings.templates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    this.saveSettings();
  }

  deleteTemplate(id: string): void {
    if (id === 'default') return; // No eliminar plantilla por defecto
    this.settings.templates = this.settings.templates.filter(t => t.id !== id);
    if (this.settings.defaultTemplateId === id) {
      this.settings.defaultTemplateId = 'default';
    }
    this.saveSettings();
  }

  setDefaultTemplate(id: string): void {
    this.settings.defaultTemplateId = id;
    this.saveSettings();
  }

  // ==================== NUMERACIÓN ====================

  getNumberingSettings(): InvoiceNumberingSettings {
    return { ...this.settings.numbering };
  }

  updateNumberingSettings(updates: Partial<InvoiceNumberingSettings>): void {
    this.settings.numbering = { ...this.settings.numbering, ...updates };
    this.saveSettings();
  }

  /**
   * Generar el siguiente número de factura
   */
  generateNextInvoiceNumber(): string {
    const { currentNumber, currentYear, prefix, suffix, padding, separator, includeYear, resetYearly } = this.settings.numbering;
    const thisYear = new Date().getFullYear();

    let number = currentNumber;

    // Resetear si es un nuevo año y está configurado
    if (resetYearly && thisYear > currentYear) {
      number = 1;
      this.settings.numbering.currentYear = thisYear;
    }

    // Formatear número
    const paddedNumber = String(number).padStart(padding, '0');
    
    let invoiceNumber = prefix;
    if (includeYear) {
      invoiceNumber += thisYear + separator;
    }
    invoiceNumber += paddedNumber;
    if (suffix) {
      invoiceNumber += suffix;
    }

    // Incrementar contador
    this.settings.numbering.currentNumber = number + 1;
    this.saveSettings();

    return invoiceNumber;
  }

  /**
   * Previsualizar el siguiente número sin incrementar
   */
  previewNextInvoiceNumber(): string {
    const { currentNumber, currentYear, prefix, suffix, padding, separator, includeYear, resetYearly } = this.settings.numbering;
    const thisYear = new Date().getFullYear();

    let number = currentNumber;
    if (resetYearly && thisYear > currentYear) {
      number = 1;
    }

    const paddedNumber = String(number).padStart(padding, '0');
    
    let invoiceNumber = prefix;
    if (includeYear) {
      invoiceNumber += thisYear + separator;
    }
    invoiceNumber += paddedNumber;
    if (suffix) {
      invoiceNumber += suffix;
    }

    return invoiceNumber;
  }

  /**
   * Establecer manualmente el número actual
   */
  setCurrentNumber(number: number): void {
    this.settings.numbering.currentNumber = number;
    this.saveSettings();
  }

  // ==================== GENERACIÓN DE HTML ====================

  /**
   * Generar HTML de factura con plantilla
   */
  generateInvoiceHTML(invoice: {
    number: string;
    date: string;
    dueDate?: string;
    client: {
      name: string;
      taxId?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      email?: string;
    };
    issuer: {
      name: string;
      taxId?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      phone?: string;
      email?: string;
      bankAccount?: string;
    };
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      total: number;
    }[];
    subtotal: number;
    vatAmount: number;
    total: number;
    notes?: string;
  }, templateId?: string): string {
    const template = templateId ? this.getTemplate(templateId) : this.getDefaultTemplate();
    if (!template) return '';

    const logoHTML = template.logoUrl ? `
      <img src="${template.logoUrl}" 
           alt="Logo" 
           style="max-height: ${template.logoSize === 'small' ? '40px' : template.logoSize === 'medium' ? '60px' : '80px'}; 
                  max-width: 200px;" />
    ` : '';

    const headerAlignment = template.logoPosition === 'center' ? 'center' : 
                           template.logoPosition === 'right' ? 'flex-end' : 'flex-start';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${template.fontFamily}, sans-serif;
      font-size: ${template.bodyFontSize}pt;
      color: #333;
      line-height: 1.5;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      ${template.showBorder ? `border: 1px ${template.borderStyle} ${template.borderColor};` : ''}
    }
    .header {
      display: flex;
      justify-content: ${headerAlignment};
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${template.primaryColor};
    }
    .logo {
      flex: 1;
    }
    .invoice-title {
      font-size: ${template.headerFontSize}pt;
      color: ${template.primaryColor};
      font-weight: bold;
    }
    .invoice-number {
      font-size: 14pt;
      color: ${template.secondaryColor};
      margin-top: 5px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      width: 45%;
    }
    .party-title {
      font-size: 12pt;
      font-weight: bold;
      color: ${template.primaryColor};
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid ${template.accentColor};
    }
    .party-info {
      font-size: ${template.bodyFontSize}pt;
    }
    .party-info p {
      margin: 3px 0;
    }
    .dates {
      display: flex;
      gap: 30px;
      margin-bottom: 20px;
    }
    .date-item {
      font-size: ${template.bodyFontSize}pt;
    }
    .date-label {
      font-weight: bold;
      color: ${template.primaryColor};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: ${template.primaryColor};
      color: white;
      padding: 10px;
      text-align: left;
      font-size: ${template.bodyFontSize}pt;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      font-size: ${template.bodyFontSize}pt;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 250px;
    }
    .totals-table td {
      padding: 5px 10px;
    }
    .total-row {
      font-weight: bold;
      font-size: 14pt;
      color: ${template.primaryColor};
      border-top: 2px solid ${template.primaryColor};
    }
    .notes {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .notes-title {
      font-weight: bold;
      color: ${template.primaryColor};
      margin-bottom: 5px;
    }
    .payment-info {
      background-color: ${template.accentColor}15;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid ${template.accentColor};
      margin-bottom: 20px;
    }
    .payment-title {
      font-weight: bold;
      color: ${template.primaryColor};
      margin-bottom: 5px;
    }
    .terms {
      font-size: 9pt;
      color: #666;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #888;
      font-size: 9pt;
    }
    ${template.showWatermark && template.watermarkText ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(0, 0, 0, 0.05);
      pointer-events: none;
      z-index: -1;
    }
    ` : ''}
  </style>
</head>
<body>
  ${template.showWatermark && template.watermarkText ? `<div class="watermark">${template.watermarkText}</div>` : ''}
  
  <div class="invoice">
    ${template.showHeader ? `
    <div class="header">
      <div class="logo">${logoHTML}</div>
      <div>
        <div class="invoice-title">FACTURA</div>
        <div class="invoice-number">${invoice.number}</div>
      </div>
    </div>
    ` : ''}

    <div class="parties">
      <div class="party">
        <div class="party-title">Emisor</div>
        <div class="party-info">
          <p><strong>${invoice.issuer.name}</strong></p>
          ${invoice.issuer.taxId ? `<p>NIF/CIF: ${invoice.issuer.taxId}</p>` : ''}
          ${invoice.issuer.address ? `<p>${invoice.issuer.address}</p>` : ''}
          ${invoice.issuer.city || invoice.issuer.postalCode ? `<p>${[invoice.issuer.postalCode, invoice.issuer.city].filter(Boolean).join(' ')}</p>` : ''}
          ${invoice.issuer.phone ? `<p>Tel: ${invoice.issuer.phone}</p>` : ''}
          ${invoice.issuer.email ? `<p>${invoice.issuer.email}</p>` : ''}
        </div>
      </div>
      <div class="party">
        <div class="party-title">Cliente</div>
        <div class="party-info">
          <p><strong>${invoice.client.name}</strong></p>
          ${invoice.client.taxId ? `<p>NIF/CIF: ${invoice.client.taxId}</p>` : ''}
          ${invoice.client.address ? `<p>${invoice.client.address}</p>` : ''}
          ${invoice.client.city || invoice.client.postalCode ? `<p>${[invoice.client.postalCode, invoice.client.city].filter(Boolean).join(' ')}</p>` : ''}
          ${invoice.client.email ? `<p>${invoice.client.email}</p>` : ''}
        </div>
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <span class="date-label">Fecha emisión:</span> ${invoice.date}
      </div>
      ${invoice.dueDate ? `
      <div class="date-item">
        <span class="date-label">Fecha vencimiento:</span> ${invoice.dueDate}
      </div>
      ` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th class="text-right">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">IVA</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${item.unitPrice.toFixed(2)} €</td>
          <td class="text-right">${item.vatRate}%</td>
          <td class="text-right">${item.total.toFixed(2)} €</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">${invoice.subtotal.toFixed(2)} €</td>
        </tr>
        <tr>
          <td>IVA:</td>
          <td class="text-right">${invoice.vatAmount.toFixed(2)} €</td>
        </tr>
        <tr class="total-row">
          <td>TOTAL:</td>
          <td class="text-right">${invoice.total.toFixed(2)} €</td>
        </tr>
      </table>
    </div>

    ${template.showNotes && invoice.notes ? `
    <div class="notes">
      <div class="notes-title">Notas</div>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    ${template.showPaymentInfo && invoice.issuer.bankAccount ? `
    <div class="payment-info">
      <div class="payment-title">Datos de pago</div>
      <p>IBAN: ${invoice.issuer.bankAccount}</p>
    </div>
    ` : ''}

    ${template.showTerms && template.termsText ? `
    <div class="terms">
      <strong>Condiciones:</strong> ${template.termsText}
    </div>
    ` : ''}

    ${template.showFooter ? `
    <div class="footer">
      ${template.footerText || ''}
    </div>
    ` : ''}
  </div>
</body>
</html>
    `;
  }
}

export const invoiceTemplateService = new InvoiceTemplateService();
export default invoiceTemplateService;
