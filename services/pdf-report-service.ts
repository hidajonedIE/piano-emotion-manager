import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export type ReportType = 
  | 'client_summary'
  | 'piano_history'
  | 'service_report'
  | 'invoice'
  | 'monthly_summary'
  | 'inventory_report'
  | 'maintenance_schedule';

export interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  data: Record<string, any>;
}

export interface CompanyInfo {
  name: string;
  tradeName?: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
}

/**
 * Servicio de generación de informes PDF
 */
class PDFReportService {
  private companyInfo: CompanyInfo = {
    name: 'Inbound Emotion S.L.',
    tradeName: 'Piano Emotion',
    taxId: 'B66351685',
    address: 'Barcelona, España',
    phone: '+34 900 000 000',
    email: 'info@pianoemotion.es',
    website: 'https://pianoemotion.es',
  };

  /**
   * Configurar información de la empresa
   */
  setCompanyInfo(info: CompanyInfo): void {
    this.companyInfo = info;
  }

  /**
   * Generar estilos CSS comunes
   */
  private getCommonStyles(): string {
    return `
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
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e94560;
        }
        .logo-section {
          flex: 1;
        }
        .logo {
          max-width: 150px;
          max-height: 60px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a2e;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 10px;
          color: #666;
        }
        .report-info {
          text-align: right;
        }
        .report-title {
          font-size: 18px;
          font-weight: bold;
          color: #1a1a2e;
          margin-bottom: 5px;
        }
        .report-date {
          font-size: 11px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1a1a2e;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #1a1a2e;
          font-size: 11px;
          text-transform: uppercase;
        }
        tr:hover {
          background-color: #f8f9fa;
        }
        .highlight {
          background-color: #fff3cd;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .amount {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
        .status-paid { background-color: #d4edda; color: #155724; }
        .status-overdue { background-color: #f8d7da; color: #721c24; }
        .footer {
          position: fixed;
          bottom: 20px;
          left: 40px;
          right: 40px;
          text-align: center;
          font-size: 9px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        .page-break {
          page-break-after: always;
        }
        .summary-box {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #e94560;
        }
        .summary-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
        }
        .notes {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          font-style: italic;
          color: #666;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 200px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 60px;
          padding-top: 5px;
          font-size: 10px;
        }
      </style>
    `;
  }

  /**
   * Generar cabecera del documento
   */
  private generateHeader(title: string, subtitle?: string): string {
    return `
      <div class="header">
        <div class="logo-section">
          <div class="company-name">${this.companyInfo.tradeName || this.companyInfo.name}</div>
          <div class="company-info">
            ${this.companyInfo.name}<br>
            CIF: ${this.companyInfo.taxId}<br>
            ${this.companyInfo.address}<br>
            ${this.companyInfo.phone} | ${this.companyInfo.email}
          </div>
        </div>
        <div class="report-info">
          <div class="report-title">${title}</div>
          ${subtitle ? `<div class="report-date">${subtitle}</div>` : ''}
          <div class="report-date">Generado: ${new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
      </div>
    `;
  }

  /**
   * Generar pie de página
   */
  private generateFooter(): string {
    return `
      <div class="footer">
        ${this.companyInfo.tradeName || this.companyInfo.name} | ${this.companyInfo.website || this.companyInfo.email}
        <br>Este documento ha sido generado automáticamente por Piano Emotion Manager
      </div>
    `;
  }

  /**
   * Generar informe de resumen de cliente
   */
  async generateClientSummary(client: any, pianos: any[], services: any[], invoices: any[]): Promise<string> {
    const totalServices = services.length;
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('Ficha de Cliente', client.name)}
        
        <div class="summary-box">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${pianos.length}</div>
              <div class="summary-label">Pianos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalServices}</div>
              <div class="summary-label">Servicios</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalInvoiced.toFixed(2)}€</div>
              <div class="summary-label">Facturado</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${pendingInvoices}</div>
              <div class="summary-label">Facturas Pend.</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <table>
            <tr><td><strong>Nombre</strong></td><td>${client.name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${client.email || '-'}</td></tr>
            <tr><td><strong>Teléfono</strong></td><td>${client.phone || '-'}</td></tr>
            <tr><td><strong>Dirección</strong></td><td>${client.address || '-'}</td></tr>
            <tr><td><strong>NIF/CIF</strong></td><td>${client.taxId || '-'}</td></tr>
            <tr><td><strong>Tipo</strong></td><td>${client.type || 'Particular'}</td></tr>
          </table>
        </div>

        ${pianos.length > 0 ? `
        <div class="section">
          <div class="section-title">Pianos (${pianos.length})</div>
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Nº Serie</th>
                <th>Tipo</th>
                <th>Último Servicio</th>
              </tr>
            </thead>
            <tbody>
              ${pianos.map(piano => `
                <tr>
                  <td>${piano.brand || '-'}</td>
                  <td>${piano.model || '-'}</td>
                  <td>${piano.serialNumber || '-'}</td>
                  <td>${piano.type || '-'}</td>
                  <td>${piano.lastService ? new Date(piano.lastService).toLocaleDateString('es-ES') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${services.length > 0 ? `
        <div class="section">
          <div class="section-title">Últimos Servicios</div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Piano</th>
                <th>Estado</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${services.slice(0, 10).map(service => `
                <tr>
                  <td>${new Date(service.date).toLocaleDateString('es-ES')}</td>
                  <td>${service.type || '-'}</td>
                  <td>${service.pianoName || '-'}</td>
                  <td><span class="status-badge status-${service.status || 'pending'}">${service.status || 'Pendiente'}</span></td>
                  <td class="amount">${(service.cost || 0).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${client.notes ? `
        <div class="section">
          <div class="section-title">Notas</div>
          <div class="notes">${client.notes}</div>
        </div>
        ` : ''}

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar informe de historial de piano
   */
  async generatePianoHistory(piano: any, client: any, services: any[]): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('Historial de Piano', `${piano.brand} ${piano.model}`)}
        
        <div class="section">
          <div class="section-title">Datos del Piano</div>
          <table>
            <tr><td><strong>Marca</strong></td><td>${piano.brand || '-'}</td></tr>
            <tr><td><strong>Modelo</strong></td><td>${piano.model || '-'}</td></tr>
            <tr><td><strong>Número de Serie</strong></td><td>${piano.serialNumber || '-'}</td></tr>
            <tr><td><strong>Año</strong></td><td>${piano.year || '-'}</td></tr>
            <tr><td><strong>Tipo</strong></td><td>${piano.type || '-'}</td></tr>
            <tr><td><strong>Categoría</strong></td><td>${piano.category || '-'}</td></tr>
            <tr><td><strong>Ubicación</strong></td><td>${piano.location || '-'}</td></tr>
            <tr><td><strong>Propietario</strong></td><td>${client?.name || '-'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Historial de Servicios (${services.length})</div>
          ${services.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo de Servicio</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${services.map(service => `
                <tr>
                  <td>${new Date(service.date).toLocaleDateString('es-ES')}</td>
                  <td>${service.type || '-'}</td>
                  <td>${service.technician || '-'}</td>
                  <td><span class="status-badge status-${service.status || 'pending'}">${service.status || 'Pendiente'}</span></td>
                  <td class="amount">${(service.cost || 0).toFixed(2)}€</td>
                </tr>
                ${service.notes ? `
                <tr>
                  <td colspan="5" style="font-size: 10px; color: #666; padding-left: 20px;">
                    <em>Notas: ${service.notes}</em>
                  </td>
                </tr>
                ` : ''}
              `).join('')}
            </tbody>
          </table>
          ` : '<p>No hay servicios registrados para este piano.</p>'}
        </div>

        ${piano.notes ? `
        <div class="section">
          <div class="section-title">Notas del Piano</div>
          <div class="notes">${piano.notes}</div>
        </div>
        ` : ''}

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar informe de servicio
   */
  async generateServiceReport(service: any, client: any, piano: any): Promise<string> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('Informe de Servicio', `#${service.id?.slice(-6) || '000000'}`)}
        
        <div class="section">
          <div class="section-title">Datos del Servicio</div>
          <table>
            <tr><td><strong>Fecha</strong></td><td>${new Date(service.date).toLocaleDateString('es-ES')}</td></tr>
            <tr><td><strong>Tipo</strong></td><td>${service.type || '-'}</td></tr>
            <tr><td><strong>Estado</strong></td><td><span class="status-badge status-${service.status || 'pending'}">${service.status || 'Pendiente'}</span></td></tr>
            <tr><td><strong>Duración</strong></td><td>${service.duration || '-'} minutos</td></tr>
            <tr><td><strong>Técnico</strong></td><td>${service.technician || '-'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Cliente</div>
          <table>
            <tr><td><strong>Nombre</strong></td><td>${client?.name || '-'}</td></tr>
            <tr><td><strong>Teléfono</strong></td><td>${client?.phone || '-'}</td></tr>
            <tr><td><strong>Dirección</strong></td><td>${client?.address || '-'}</td></tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Piano</div>
          <table>
            <tr><td><strong>Marca/Modelo</strong></td><td>${piano?.brand || '-'} ${piano?.model || ''}</td></tr>
            <tr><td><strong>Nº Serie</strong></td><td>${piano?.serialNumber || '-'}</td></tr>
            <tr><td><strong>Ubicación</strong></td><td>${piano?.location || '-'}</td></tr>
          </table>
        </div>

        ${service.workPerformed ? `
        <div class="section">
          <div class="section-title">Trabajo Realizado</div>
          <div class="notes">${service.workPerformed}</div>
        </div>
        ` : ''}

        ${service.materialsUsed && service.materialsUsed.length > 0 ? `
        <div class="section">
          <div class="section-title">Materiales Utilizados</div>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${service.materialsUsed.map((mat: any) => `
                <tr>
                  <td>${mat.name || '-'}</td>
                  <td>${mat.quantity || 1}</td>
                  <td class="amount">${(mat.price || 0).toFixed(2)}€</td>
                  <td class="amount">${((mat.quantity || 1) * (mat.price || 0)).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${service.recommendations ? `
        <div class="section">
          <div class="section-title">Recomendaciones</div>
          <div class="notes">${service.recommendations}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Importe</div>
          <table>
            <tr class="total-row">
              <td><strong>Total del Servicio</strong></td>
              <td class="amount"><strong>${(service.cost || 0).toFixed(2)}€</strong></td>
            </tr>
          </table>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Firma del Técnico</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Firma del Cliente</div>
          </div>
        </div>

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar factura PDF
   */
  async generateInvoice(invoice: any, client: any, items: any[]): Promise<string> {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoice.taxRate || 21) / 100;
    const total = subtotal + taxAmount;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('FACTURA', `Nº ${invoice.number || invoice.id?.slice(-6)}`)}
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <div class="section-title">Datos del Cliente</div>
            <p><strong>${client?.name || '-'}</strong></p>
            <p>${client?.taxId ? `NIF/CIF: ${client.taxId}` : ''}</p>
            <p>${client?.address || ''}</p>
            <p>${client?.email || ''}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-ES')}</p>
            <p><strong>Vencimiento:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : '-'}</p>
            <p><strong>Estado:</strong> <span class="status-badge status-${invoice.status || 'pending'}">${invoice.status || 'Pendiente'}</span></p>
          </div>
        </div>

        <div class="section">
          <table>
            <thead>
              <tr>
                <th style="width: 50%">Descripción</th>
                <th style="width: 15%">Cantidad</th>
                <th style="width: 15%">Precio Unit.</th>
                <th style="width: 20%">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description || '-'}</td>
                  <td>${item.quantity || 1}</td>
                  <td class="amount">${(item.unitPrice || 0).toFixed(2)}€</td>
                  <td class="amount">${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <table style="width: 300px;">
            <tr>
              <td>Subtotal</td>
              <td class="amount">${subtotal.toFixed(2)}€</td>
            </tr>
            <tr>
              <td>IVA (${invoice.taxRate || 21}%)</td>
              <td class="amount">${taxAmount.toFixed(2)}€</td>
            </tr>
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td class="amount"><strong>${total.toFixed(2)}€</strong></td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
        <div class="section" style="margin-top: 30px;">
          <div class="section-title">Notas</div>
          <div class="notes">${invoice.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; font-size: 10px; color: #666;">
          <p><strong>Forma de pago:</strong> ${invoice.paymentMethod || 'Transferencia bancaria'}</p>
          <p><strong>IBAN:</strong> ES00 0000 0000 0000 0000 0000</p>
        </div>

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar resumen mensual
   */
  async generateMonthlySummary(
    month: number,
    year: number,
    services: any[],
    invoices: any[],
    newClients: number
  ): Promise<string> {
    const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
    const pendingRevenue = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total || 0), 0);

    const servicesByType = services.reduce((acc: any, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('Resumen Mensual', monthName)}
        
        <div class="summary-box">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${services.length}</div>
              <div class="summary-label">Servicios</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalRevenue.toFixed(0)}€</div>
              <div class="summary-label">Facturado</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${pendingRevenue.toFixed(0)}€</div>
              <div class="summary-label">Pendiente</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${newClients}</div>
              <div class="summary-label">Nuevos Clientes</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Servicios por Tipo</div>
          <table>
            <thead>
              <tr>
                <th>Tipo de Servicio</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(servicesByType).map(([type, count]) => `
                <tr>
                  <td>${type}</td>
                  <td>${count}</td>
                  <td>${((count as number / services.length) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Facturas del Mes</div>
          <table>
            <thead>
              <tr>
                <th>Nº Factura</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td>${inv.number || inv.id?.slice(-6)}</td>
                  <td>${inv.clientName || '-'}</td>
                  <td>${new Date(inv.date).toLocaleDateString('es-ES')}</td>
                  <td><span class="status-badge status-${inv.status || 'pending'}">${inv.status || 'Pendiente'}</span></td>
                  <td class="amount">${(inv.total || 0).toFixed(2)}€</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4"><strong>Total</strong></td>
                <td class="amount"><strong>${(totalRevenue + pendingRevenue).toFixed(2)}€</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar informe de inventario
   */
  async generateInventoryReport(materials: any[]): Promise<string> {
    const lowStock = materials.filter(m => m.currentStock <= m.minStock);
    const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * (m.costPrice || 0)), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.generateHeader('Informe de Inventario', `${materials.length} artículos`)}
        
        <div class="summary-box">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${materials.length}</div>
              <div class="summary-label">Total Artículos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: ${lowStock.length > 0 ? '#e74c3c' : '#27ae60'}">${lowStock.length}</div>
              <div class="summary-label">Stock Bajo</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalValue.toFixed(0)}€</div>
              <div class="summary-label">Valor Total</div>
            </div>
          </div>
        </div>

        ${lowStock.length > 0 ? `
        <div class="section">
          <div class="section-title" style="color: #e74c3c;">⚠️ Artículos con Stock Bajo</div>
          <table>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${lowStock.map(m => `
                <tr class="highlight">
                  <td>${m.name}</td>
                  <td>${m.category || '-'}</td>
                  <td>${m.currentStock}</td>
                  <td>${m.minStock}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Inventario Completo</div>
          <table>
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Precio Coste</th>
                <th>Precio Venta</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${materials.map(m => `
                <tr ${m.currentStock <= m.minStock ? 'class="highlight"' : ''}>
                  <td>${m.name}</td>
                  <td>${m.category || '-'}</td>
                  <td>${m.currentStock} ${m.unit || 'uds'}</td>
                  <td class="amount">${(m.costPrice || 0).toFixed(2)}€</td>
                  <td class="amount">${(m.salePrice || 0).toFixed(2)}€</td>
                  <td class="amount">${(m.currentStock * (m.costPrice || 0)).toFixed(2)}€</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5"><strong>Valor Total del Inventario</strong></td>
                <td class="amount"><strong>${totalValue.toFixed(2)}€</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        ${this.generateFooter()}
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generar PDF y compartir/guardar
   */
  async generateAndShare(html: string, filename: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // En web, abrir en nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      // En móvil, usar expo-print
      const { uri } = await Print.printToFileAsync({ html });
      
      // Renombrar archivo
      const newUri = `${FileSystem.documentDirectory}${filename}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });

      // Compartir
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Compartir ${filename}`,
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Previsualizar PDF
   */
  async preview(html: string): Promise<void> {
    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const pdfReportService = new PDFReportService();

export default pdfReportService;
