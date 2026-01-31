/**
 * PDF Generator
 * 
 * Generates PDF documents for various export types
 */

import PDFDocument from 'pdfkit';

// ============================================================================
// Types
// ============================================================================

export interface PDFGeneratorOptions {
  title: string;
  subtitle?: string;
  author?: string;
  subject?: string;
}

// ============================================================================
// Base PDF Generator
// ============================================================================

export class PDFGenerator {
  public doc: PDFKit.PDFDocument;
  private chunks: Buffer[] = [];

  constructor(options: PDFGeneratorOptions) {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: options.title,
        Author: options.author || 'Piano Emotion Manager',
        Subject: options.subject || options.title,
      },
    });

    this.doc.on('data', (chunk) => this.chunks.push(chunk));
  }

  /**
   * Add header to the document
   */
  addHeader(title: string, subtitle?: string) {
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title, { align: 'center' });

    if (subtitle) {
      this.doc
        .fontSize(14)
        .font('Helvetica')
        .text(subtitle, { align: 'center' });
    }

    this.doc.moveDown(2);
  }

  /**
   * Add section title
   */
  addSectionTitle(title: string) {
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(title);

    this.doc.moveDown(0.5);
  }

  /**
   * Add text
   */
  addText(text: string, options?: any) {
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .text(text, options);
  }

  /**
   * Add table
   */
  addTable(headers: string[], rows: string[][]) {
    const startX = 50;
    const startY = this.doc.y;
    const columnWidth = (this.doc.page.width - 100) / headers.length;
    const rowHeight = 20;

    // Draw headers
    this.doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, i) => {
      this.doc.text(
        header,
        startX + i * columnWidth,
        startY,
        { width: columnWidth, align: 'left' }
      );
    });

    // Draw line under headers
    this.doc
      .moveTo(startX, startY + rowHeight - 5)
      .lineTo(this.doc.page.width - 50, startY + rowHeight - 5)
      .stroke();

    // Draw rows
    this.doc.font('Helvetica').fontSize(9);
    rows.forEach((row, rowIndex) => {
      const y = startY + (rowIndex + 1) * rowHeight;

      // Check if we need a new page
      if (y > this.doc.page.height - 100) {
        this.doc.addPage();
        return;
      }

      row.forEach((cell, colIndex) => {
        this.doc.text(
          cell,
          startX + colIndex * columnWidth,
          y,
          { width: columnWidth, align: 'left' }
        );
      });
    });

    this.doc.moveDown(rows.length + 2);
  }

  /**
   * Add key-value pair
   */
  addKeyValue(key: string, value: string) {
    this.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(key + ': ', { continued: true })
      .font('Helvetica')
      .text(value);
  }

  /**
   * Add horizontal line
   */
  addLine() {
    const y = this.doc.y;
    this.doc
      .moveTo(50, y)
      .lineTo(this.doc.page.width - 50, y)
      .stroke();
    this.doc.moveDown();
  }

  /**
   * Add page break
   */
  addPageBreak() {
    this.doc.addPage();
  }

  /**
   * Add footer
   */
  addFooter(text: string) {
    const pages = this.doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      this.doc.switchToPage(i);
      this.doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          text,
          50,
          this.doc.page.height - 50,
          { align: 'center' }
        );
      this.doc.text(
        `Página ${i + 1} de ${pages.count}`,
        50,
        this.doc.page.height - 30,
        { align: 'center' }
      );
    }
  }

  /**
   * Generate and return PDF buffer
   */
  async generate(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => {
        resolve(Buffer.concat(this.chunks));
      });

      this.doc.on('error', reject);

      this.doc.end();
    });
  }
}

// ============================================================================
// Specific PDF Generators
// ============================================================================

/**
 * Generate clients list PDF
 */
export async function generateClientsPDF(clients: any[]): Promise<Buffer> {
  const pdf = new PDFGenerator({
    title: 'Lista de Clientes',
    subject: 'Clientes de Piano Emotion Manager',
  });

  pdf.addHeader('PIANO EMOTION MANAGER', 'Lista de Clientes');
  pdf.addText(`Generado: ${new Date().toLocaleString('es-ES')}`);
  pdf.addText(`Total de clientes: ${clients.length}`);
  pdf.doc.moveDown();

  // Add table
  const headers = ['Nombre', 'Teléfono', 'Email', 'Pianos'];
  const rows = clients.map((client) => [
    client.name || '',
    client.phone || '',
    client.email || '',
    client.pianosCount?.toString() || '0',
  ]);

  pdf.addTable(headers, rows);

  pdf.addFooter('Piano Emotion Manager - Gestión de Clientes');

  return await pdf.generate();
}

/**
 * Generate services list PDF
 */
export async function generateServicesPDF(services: any[]): Promise<Buffer> {
  const pdf = new PDFGenerator({
    title: 'Lista de Servicios',
    subject: 'Servicios realizados',
  });

  pdf.addHeader('PIANO EMOTION MANAGER', 'Servicios Realizados');
  pdf.addText(`Generado: ${new Date().toLocaleString('es-ES')}`);
  pdf.addText(`Total de servicios: ${services.length}`);
  pdf.doc.moveDown();

  // Add table
  const headers = ['Fecha', 'Cliente', 'Tipo', 'Piano', 'Costo'];
  const rows = services.map((service) => [
    new Date(service.serviceDate).toLocaleDateString('es-ES'),
    service.clientName || '',
    service.serviceType || '',
    service.pianoInfo || '',
    `$${service.cost || 0}`,
  ]);

  pdf.addTable(headers, rows);

  // Add summary
  const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  pdf.doc.moveDown();
  pdf.addSectionTitle('Resumen');
  pdf.addKeyValue('Total facturado', `$${totalCost.toFixed(2)}`);

  pdf.addFooter('Piano Emotion Manager - Servicios');

  return await pdf.generate();
}

/**
 * Generate invoices list PDF
 */
export async function generateInvoicesPDF(invoices: any[]): Promise<Buffer> {
  const pdf = new PDFGenerator({
    title: 'Lista de Facturas',
    subject: 'Facturas emitidas',
  });

  pdf.addHeader('PIANO EMOTION MANAGER', 'Lista de Facturas');
  pdf.addText(`Generado: ${new Date().toLocaleString('es-ES')}`);
  pdf.addText(`Total de facturas: ${invoices.length}`);
  pdf.doc.moveDown();

  // Add table
  const headers = ['#', 'Fecha', 'Cliente', 'Total', 'Estado'];
  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber || '',
    new Date(invoice.createdAt).toLocaleDateString('es-ES'),
    invoice.clientName || '',
    `$${invoice.total || 0}`,
    invoice.status === 'paid' ? 'Pagada' : 'Pendiente',
  ]);

  pdf.addTable(headers, rows);

  // Add summary
  const totalAmount = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  pdf.doc.moveDown();
  pdf.addSectionTitle('Resumen');
  pdf.addKeyValue('Total facturado', `$${totalAmount.toFixed(2)}`);
  pdf.addKeyValue('Total cobrado', `$${paidAmount.toFixed(2)}`);
  pdf.addKeyValue('Total pendiente', `$${pendingAmount.toFixed(2)}`);

  pdf.addFooter('Piano Emotion Manager - Facturas');

  return await pdf.generate();
}

/**
 * Generate inventory PDF
 */
export async function generateInventoryPDF(inventory: any[]): Promise<Buffer> {
  const pdf = new PDFGenerator({
    title: 'Inventario',
    subject: 'Inventario de repuestos y materiales',
  });

  pdf.addHeader('PIANO EMOTION MANAGER', 'Inventario');
  pdf.addText(`Generado: ${new Date().toLocaleString('es-ES')}`);
  pdf.addText(`Total de items: ${inventory.length}`);
  pdf.doc.moveDown();

  // Add table
  const headers = ['Código', 'Nombre', 'Stock', 'Precio', 'Total'];
  const rows = inventory.map((item) => [
    item.code || '',
    item.name || '',
    item.quantity?.toString() || '0',
    `$${item.price || 0}`,
    `$${(item.quantity || 0) * (item.price || 0)}`,
  ]);

  pdf.addTable(headers, rows);

  // Add summary
  const totalValue = inventory.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.price || 0),
    0
  );

  pdf.doc.moveDown();
  pdf.addSectionTitle('Resumen');
  pdf.addKeyValue('Valor total del inventario', `$${totalValue.toFixed(2)}`);

  // Low stock items
  const lowStock = inventory.filter((i) => (i.quantity || 0) < (i.minStock || 5));
  if (lowStock.length > 0) {
    pdf.doc.moveDown();
    pdf.addSectionTitle('Alertas de Stock Bajo');
    lowStock.forEach((item) => {
      pdf.addText(`- ${item.name}: ${item.quantity} unidades`);
    });
  }

  pdf.addFooter('Piano Emotion Manager - Inventario');

  return await pdf.generate();
}
