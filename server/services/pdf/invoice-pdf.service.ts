/**
 * Invoice PDF Service
 * Generación de facturas en formato PDF
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount?: number;
  total: number;
}

export interface BusinessInfo {
  name: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  bankAccount?: string;
  logo?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: Date | string;
  dueDate?: Date | string;
  // Cliente
  clientName: string;
  clientTaxId?: string;
  clientAddress?: string;
  clientEmail?: string;
  // Items
  items: InvoiceItem[];
  // Totales
  subtotal: number;
  totalDiscount?: number;
  taxAmount: number;
  total: number;
  // Información adicional
  currency?: string;
  notes?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  // Negocio
  businessInfo: BusinessInfo;
}

export interface PDFGenerationResult {
  success: boolean;
  html?: string;
  error?: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea un número como moneda
 */
function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formatea una fecha
 */
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Convierte número a palabras (para el total)
 */
function numberToWords(num: number): string {
  const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  if (num === 0) return "cero";
  if (num === 100) return "cien";

  let words = "";
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) {
      words += "mil ";
    } else {
      words += numberToWords(thousands) + " mil ";
    }
    num %= 1000;
  }

  if (num >= 100) {
    words += hundreds[Math.floor(num / 100)] + " ";
    num %= 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)];
    if (num % 10 !== 0) {
      words += " y " + units[num % 10];
    }
  } else if (num >= 10) {
    words += teens[num - 10];
  } else if (num > 0) {
    words += units[num];
  }

  return words.trim();
}

/**
 * Formatea el total en palabras
 */
function formatTotalInWords(total: number, currency: string = "EUR"): string {
  const euros = Math.floor(total);
  const cents = Math.round((total - euros) * 100);
  
  let result = numberToWords(euros);
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  if (currency === "EUR") {
    result += euros === 1 ? " euro" : " euros";
    if (cents > 0) {
      result += ` con ${numberToWords(cents)} céntimos`;
    }
  }
  
  return result;
}

// ============================================================================
// GENERACIÓN DE HTML
// ============================================================================

/**
 * Genera el HTML de la factura para conversión a PDF
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const currency = data.currency || "EUR";
  
  // Generar filas de items
  const itemRows = data.items.map((item, index) => `
    <tr>
      <td class="item-number">${index + 1}</td>
      <td class="item-description">${escapeHtml(item.description)}</td>
      <td class="item-quantity">${item.quantity}</td>
      <td class="item-price">${formatCurrency(item.unitPrice, currency)}</td>
      <td class="item-tax">${item.taxRate}%</td>
      ${item.discount ? `<td class="item-discount">${item.discount}%</td>` : ""}
      <td class="item-total">${formatCurrency(item.total, currency)}</td>
    </tr>
  `).join("");

  const hasDiscount = data.items.some(item => item.discount && item.discount > 0);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      background: #fff;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo {
      max-width: 200px;
      max-height: 80px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .invoice-title-section {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 32px;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .invoice-number {
      font-size: 16px;
      color: #64748b;
    }
    
    /* Info sections */
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .info-block {
      flex: 1;
    }
    
    .info-block.right {
      text-align: right;
    }
    
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 5px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1e293b;
    }
    
    .info-value.highlight {
      font-weight: 600;
      color: #1e40af;
    }
    
    /* Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table th {
      background: #1e40af;
      color: #fff;
      padding: 12px 10px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table th:first-child {
      border-radius: 4px 0 0 0;
    }
    
    .items-table th:last-child {
      border-radius: 0 4px 0 0;
    }
    
    .items-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .items-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .item-number {
      width: 40px;
      text-align: center;
      color: #64748b;
    }
    
    .item-description {
      min-width: 200px;
    }
    
    .item-quantity,
    .item-price,
    .item-tax,
    .item-discount,
    .item-total {
      text-align: right;
      white-space: nowrap;
    }
    
    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    
    .totals-table {
      width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #1e40af;
      margin-top: 10px;
      padding-top: 15px;
    }
    
    .totals-label {
      color: #64748b;
    }
    
    .totals-value {
      font-weight: 600;
    }
    
    .totals-row.total .totals-label,
    .totals-row.total .totals-value {
      font-size: 18px;
      color: #1e40af;
      font-weight: 700;
    }
    
    /* Total in words */
    .total-words {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 30px;
      font-style: italic;
      color: #475569;
    }
    
    /* Notes */
    .notes-section {
      margin-bottom: 30px;
    }
    
    .notes-title {
      font-size: 12px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .notes-content {
      background: #f8fafc;
      padding: 15px;
      border-radius: 4px;
      border-left: 3px solid #1e40af;
    }
    
    /* Payment info */
    .payment-section {
      background: #eff6ff;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 30px;
    }
    
    .payment-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .payment-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .payment-item {
      display: flex;
      gap: 10px;
    }
    
    .payment-label {
      color: #64748b;
      min-width: 100px;
    }
    
    .payment-value {
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }
    
    .footer p {
      margin-bottom: 5px;
    }
    
    /* Print styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .invoice {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        ${data.businessInfo.logo 
          ? `<img src="${data.businessInfo.logo}" alt="Logo" class="logo">`
          : `<div class="company-name">${escapeHtml(data.businessInfo.name)}</div>`
        }
      </div>
      <div class="invoice-title-section">
        <div class="invoice-title">FACTURA</div>
        <div class="invoice-number">Nº ${escapeHtml(data.invoiceNumber)}</div>
      </div>
    </div>
    
    <!-- Info Section -->
    <div class="info-section">
      <div class="info-block">
        <div class="info-label">Emisor</div>
        <div class="info-value highlight">${escapeHtml(data.businessInfo.name)}</div>
        <div class="info-value">NIF/CIF: ${escapeHtml(data.businessInfo.taxId)}</div>
        <div class="info-value">${escapeHtml(data.businessInfo.address)}</div>
        <div class="info-value">${escapeHtml(data.businessInfo.postalCode)} ${escapeHtml(data.businessInfo.city)}</div>
        <div class="info-value">Tel: ${escapeHtml(data.businessInfo.phone)}</div>
        <div class="info-value">${escapeHtml(data.businessInfo.email)}</div>
      </div>
      <div class="info-block right">
        <div class="info-label">Cliente</div>
        <div class="info-value highlight">${escapeHtml(data.clientName)}</div>
        ${data.clientTaxId ? `<div class="info-value">NIF/CIF: ${escapeHtml(data.clientTaxId)}</div>` : ""}
        ${data.clientAddress ? `<div class="info-value">${escapeHtml(data.clientAddress)}</div>` : ""}
        ${data.clientEmail ? `<div class="info-value">${escapeHtml(data.clientEmail)}</div>` : ""}
      </div>
    </div>
    
    <!-- Dates -->
    <div class="info-section">
      <div class="info-block">
        <div class="info-label">Fecha de emisión</div>
        <div class="info-value">${formatDate(data.date)}</div>
      </div>
      ${data.dueDate ? `
      <div class="info-block right">
        <div class="info-label">Fecha de vencimiento</div>
        <div class="info-value">${formatDate(data.dueDate)}</div>
      </div>
      ` : ""}
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Descripción</th>
          <th>Cant.</th>
          <th>Precio Unit.</th>
          <th>IVA</th>
          ${hasDiscount ? "<th>Dto.</th>" : ""}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">${formatCurrency(data.subtotal, currency)}</span>
        </div>
        ${data.totalDiscount && data.totalDiscount > 0 ? `
        <div class="totals-row">
          <span class="totals-label">Descuento</span>
          <span class="totals-value">-${formatCurrency(data.totalDiscount, currency)}</span>
        </div>
        ` : ""}
        <div class="totals-row">
          <span class="totals-label">IVA</span>
          <span class="totals-value">${formatCurrency(data.taxAmount, currency)}</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">TOTAL</span>
          <span class="totals-value">${formatCurrency(data.total, currency)}</span>
        </div>
      </div>
    </div>
    
    <!-- Total in words -->
    <div class="total-words">
      <strong>Total en letra:</strong> ${formatTotalInWords(data.total, currency)}
    </div>
    
    <!-- Payment Info -->
    ${data.businessInfo.bankAccount || data.paymentMethod || data.paymentTerms ? `
    <div class="payment-section">
      <div class="payment-title">Información de Pago</div>
      <div class="payment-details">
        ${data.businessInfo.bankAccount ? `
        <div class="payment-item">
          <span class="payment-label">Cuenta bancaria:</span>
          <span class="payment-value">${escapeHtml(data.businessInfo.bankAccount)}</span>
        </div>
        ` : ""}
        ${data.paymentMethod ? `
        <div class="payment-item">
          <span class="payment-label">Forma de pago:</span>
          <span class="payment-value">${escapeHtml(data.paymentMethod)}</span>
        </div>
        ` : ""}
        ${data.paymentTerms ? `
        <div class="payment-item">
          <span class="payment-label">Condiciones:</span>
          <span class="payment-value">${escapeHtml(data.paymentTerms)}</span>
        </div>
        ` : ""}
      </div>
    </div>
    ` : ""}
    
    <!-- Notes -->
    ${data.notes ? `
    <div class="notes-section">
      <div class="notes-title">Observaciones</div>
      <div class="notes-content">${escapeHtml(data.notes)}</div>
    </div>
    ` : ""}
    
    <!-- Footer -->
    <div class="footer">
      <p>${escapeHtml(data.businessInfo.name)} - NIF/CIF: ${escapeHtml(data.businessInfo.taxId)}</p>
      <p>${escapeHtml(data.businessInfo.address)}, ${escapeHtml(data.businessInfo.postalCode)} ${escapeHtml(data.businessInfo.city)}</p>
      <p>Tel: ${escapeHtml(data.businessInfo.phone)} | Email: ${escapeHtml(data.businessInfo.email)}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escapa caracteres HTML
 */
function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Genera el PDF de una factura
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<PDFGenerationResult> {
  try {
    const html = generateInvoiceHTML(data);
    
    return {
      success: true,
      html,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al generar PDF",
    };
  }
}

/**
 * Genera un PDF de factura simplificada (ticket)
 */
export function generateSimplifiedInvoiceHTML(data: InvoiceData): string {
  const currency = data.currency || "EUR";
  
  const itemRows = data.items.map(item => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="right">${item.quantity}</td>
      <td class="right">${formatCurrency(item.total, currency)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura Simplificada ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-width: 300px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
    }
    .company-name {
      font-size: 16px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 3px 0;
    }
    .right {
      text-align: right;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .total-row {
      font-weight: bold;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${escapeHtml(data.businessInfo.name)}</div>
    <div>NIF: ${escapeHtml(data.businessInfo.taxId)}</div>
    <div>${escapeHtml(data.businessInfo.address)}</div>
    <div>${escapeHtml(data.businessInfo.postalCode)} ${escapeHtml(data.businessInfo.city)}</div>
  </div>
  
  <div>
    <strong>FACTURA SIMPLIFICADA</strong><br>
    Nº: ${escapeHtml(data.invoiceNumber)}<br>
    Fecha: ${formatDate(data.date)}
  </div>
  
  <div class="divider"></div>
  
  <table>
    <tr>
      <th>Concepto</th>
      <th class="right">Ud.</th>
      <th class="right">Total</th>
    </tr>
    ${itemRows}
  </table>
  
  <div class="divider"></div>
  
  <table>
    <tr>
      <td>Base imponible:</td>
      <td class="right">${formatCurrency(data.subtotal, currency)}</td>
    </tr>
    <tr>
      <td>IVA:</td>
      <td class="right">${formatCurrency(data.taxAmount, currency)}</td>
    </tr>
    <tr class="total-row">
      <td>TOTAL:</td>
      <td class="right">${formatCurrency(data.total, currency)}</td>
    </tr>
  </table>
  
  <div class="footer">
    <p>Gracias por su confianza</p>
    <p>Tel: ${escapeHtml(data.businessInfo.phone)}</p>
  </div>
</body>
</html>
  `.trim();
}
