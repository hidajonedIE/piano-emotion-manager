/**
 * Utilidad para generar PDF de facturas
 * Genera un PDF profesional con los datos de la factura
 */

import { Invoice, InvoiceLine, Client, BusinessInfo } from '@/types';

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Generar HTML para el PDF de la factura
export function generateInvoiceHTML(
  invoice: Invoice,
  client: Client | null,
  businessInfo: BusinessInfo | null
): string {
  const lines = (invoice.lines as InvoiceLine[]) || [];
  
  const linesHTML = lines.map((line, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${line.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${line.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(line.unitPrice)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(line.quantity * line.unitPrice)}</td>
    </tr>
  `).join('');

  const clientName = client 
    ? `${client.firstName} ${client.lastName || ''} ${client.lastName2 || ''}`.trim()
    : 'Cliente no especificado';

  const clientAddress = client?.fiscalAddress 
    ? `${client.fiscalAddress.street || ''} ${client.fiscalAddress.number || ''}, ${client.fiscalAddress.floor || ''}<br>
       ${client.fiscalAddress.postalCode || ''} ${client.fiscalAddress.city || ''}, ${client.fiscalAddress.province || ''}`
    : '';

  const businessName = businessInfo?.businessName || 'Piano Emotion Manager';
  const businessNif = businessInfo?.nif || '';
  const businessAddress = businessInfo?.address 
    ? `${businessInfo.address.street || ''} ${businessInfo.address.number || ''}<br>
       ${businessInfo.address.postalCode || ''} ${businessInfo.address.city || ''}`
    : '';
  const businessPhone = businessInfo?.phone || '';
  const businessEmail = businessInfo?.email || '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoice.number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #C9A227;
    }
    .logo-section h1 {
      font-size: 28px;
      color: #2C3E50;
      margin-bottom: 5px;
    }
    .logo-section p {
      color: #7f8c8d;
      font-size: 12px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 32px;
      color: #C9A227;
      margin-bottom: 10px;
    }
    .invoice-info p {
      color: #7f8c8d;
      margin: 3px 0;
    }
    .invoice-info .number {
      font-size: 18px;
      font-weight: bold;
      color: #2C3E50;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .party {
      width: 45%;
    }
    .party h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #C9A227;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .party p {
      margin: 3px 0;
    }
    .party .name {
      font-weight: bold;
      font-size: 16px;
      color: #2C3E50;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #2C3E50;
      color: #fff;
    }
    thead th {
      padding: 12px;
      text-align: left;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th:nth-child(3),
    thead th:nth-child(4),
    thead th:nth-child(5) {
      text-align: right;
    }
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #2C3E50;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #2C3E50;
    }
    .totals-row .label {
      color: #7f8c8d;
    }
    .totals-row.total .label {
      color: #2C3E50;
    }
    .notes {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .notes h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: #C9A227;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .notes p {
      color: #666;
      font-size: 13px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #7f8c8d;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-draft { background: #f0f0f0; color: #666; }
    .status-sent { background: #e3f2fd; color: #1976d2; }
    .status-paid { background: #e8f5e9; color: #388e3c; }
    .status-cancelled { background: #ffebee; color: #d32f2f; }
    @media print {
      body { padding: 20px; }
      .invoice-container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <h1>🎹 ${businessName}</h1>
        <p>Técnico Afinador de Pianos</p>
      </div>
      <div class="invoice-info">
        <h2>FACTURA</h2>
        <p class="number">${invoice.number}</p>
        <p>Fecha: ${formatDate(invoice.date)}</p>
        ${invoice.dueDate ? `<p>Vencimiento: ${formatDate(invoice.dueDate)}</p>` : ''}
        <span class="status-badge status-${invoice.status}">${
          invoice.status === 'draft' ? 'Borrador' :
          invoice.status === 'sent' ? 'Enviada' :
          invoice.status === 'paid' ? 'Pagada' : 'Anulada'
        }</span>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Emisor</h3>
        <p class="name">${businessName}</p>
        ${businessNif ? `<p>NIF: ${businessNif}</p>` : ''}
        <p>${businessAddress}</p>
        ${businessPhone ? `<p>Tel: ${businessPhone}</p>` : ''}
        ${businessEmail ? `<p>${businessEmail}</p>` : ''}
      </div>
      <div class="party">
        <h3>Cliente</h3>
        <p class="name">${clientName}</p>
        ${client?.taxId ? `<p>NIF/CIF: ${client.taxId}</p>` : ''}
        <p>${clientAddress}</p>
        ${client?.phone ? `<p>Tel: ${client.phone}</p>` : ''}
        ${client?.email ? `<p>${client.email}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Descripción</th>
          <th style="width: 80px; text-align: center;">Cant.</th>
          <th style="width: 100px; text-align: right;">Precio</th>
          <th style="width: 100px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${linesHTML || '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #999;">Sin conceptos</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span class="label">Subtotal</span>
          <span>${formatCurrency(invoice.subtotal || 0)}</span>
        </div>
        <div class="totals-row">
          <span class="label">IVA (${invoice.taxRate || 21}%)</span>
          <span>${formatCurrency(invoice.taxAmount || 0)}</span>
        </div>
        <div class="totals-row total">
          <span class="label">TOTAL</span>
          <span>${formatCurrency(invoice.total || 0)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes ? `
    <div class="notes">
      <h4>Notas</h4>
      <p>${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Gracias por confiar en nuestros servicios</p>
      <p>${businessName} · ${businessPhone} · ${businessEmail}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Función para descargar el PDF (en web)
export async function downloadInvoicePDF(
  invoice: Invoice,
  client: Client | null,
  businessInfo: BusinessInfo | null
): Promise<void> {
  const html = generateInvoiceHTML(invoice, client, businessInfo);
  
  // Crear un iframe oculto para imprimir
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // Esperar a que se cargue el contenido
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Eliminar el iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
}

// Función para abrir vista previa del PDF
export function openInvoicePreview(
  invoice: Invoice,
  client: Client | null,
  businessInfo: BusinessInfo | null
): void {
  const html = generateInvoiceHTML(invoice, client, businessInfo);
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
