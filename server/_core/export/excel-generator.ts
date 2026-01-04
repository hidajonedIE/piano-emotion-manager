/**
 * Excel Generator
 * 
 * Generates Excel files for various export types
 */

import ExcelJS from 'exceljs';

// ============================================================================
// Specific Excel Generators
// ============================================================================

/**
 * Generate clients list Excel
 */
export async function generateClientsExcel(clients: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes');

  // Set columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Dirección', key: 'address', width: 40 },
    { header: 'Pianos', key: 'pianosCount', width: 10 },
    { header: 'Servicios', key: 'servicesCount', width: 10 },
    { header: 'Creado', key: 'createdAt', width: 15 },
  ];

  // Add data
  clients.forEach((client) => {
    worksheet.addRow({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      pianosCount: client.pianosCount || 0,
      servicesCount: client.servicesCount || 0,
      createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-ES') : '',
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2196F3' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add statistics sheet
  const statsSheet = workbook.addWorksheet('Estadísticas');
  statsSheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 15 },
  ];

  statsSheet.addRow({ metric: 'Total de clientes', value: clients.length });
  statsSheet.addRow({
    metric: 'Total de pianos',
    value: clients.reduce((sum, c) => sum + (c.pianosCount || 0), 0),
  });
  statsSheet.addRow({
    metric: 'Total de servicios',
    value: clients.reduce((sum, c) => sum + (c.servicesCount || 0), 0),
  });

  statsSheet.getRow(1).font = { bold: true };

  return (await workbook.xlsx.writeBuffer()) as Buffer;
}

/**
 * Generate services list Excel
 */
export async function generateServicesExcel(services: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Servicios');

  // Set columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Fecha', key: 'serviceDate', width: 15 },
    { header: 'Cliente', key: 'clientName', width: 30 },
    { header: 'Piano', key: 'pianoInfo', width: 30 },
    { header: 'Tipo de Servicio', key: 'serviceType', width: 20 },
    { header: 'Duración (h)', key: 'duration', width: 12 },
    { header: 'Costo', key: 'cost', width: 12 },
    { header: 'Estado', key: 'status', width: 15 },
    { header: 'Notas', key: 'notes', width: 40 },
  ];

  // Add data
  services.forEach((service) => {
    worksheet.addRow({
      id: service.id,
      serviceDate: service.serviceDate ? new Date(service.serviceDate).toLocaleDateString('es-ES') : '',
      clientName: service.clientName,
      pianoInfo: service.pianoInfo,
      serviceType: service.serviceType,
      duration: service.duration || 0,
      cost: service.cost || 0,
      status: service.status,
      notes: service.notes,
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Format cost column as currency
  worksheet.getColumn('cost').numFmt = '$#,##0.00';

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 15 },
  ];

  const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const avgCost = services.length > 0 ? totalCost / services.length : 0;

  summarySheet.addRow({ metric: 'Total de servicios', value: services.length });
  summarySheet.addRow({ metric: 'Costo total', value: `$${totalCost.toFixed(2)}` });
  summarySheet.addRow({ metric: 'Costo promedio', value: `$${avgCost.toFixed(2)}` });

  summarySheet.getRow(1).font = { bold: true };

  return (await workbook.xlsx.writeBuffer()) as Buffer;
}

/**
 * Generate invoices list Excel
 */
export async function generateInvoicesExcel(invoices: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Facturas');

  // Set columns
  worksheet.columns = [
    { header: 'Número', key: 'invoiceNumber', width: 15 },
    { header: 'Fecha', key: 'createdAt', width: 15 },
    { header: 'Cliente', key: 'clientName', width: 30 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'IVA', key: 'tax', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Estado', key: 'status', width: 15 },
    { header: 'Fecha de Pago', key: 'paidAt', width: 15 },
    { header: 'Notas', key: 'notes', width: 40 },
  ];

  // Add data
  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('es-ES') : '',
      clientName: invoice.clientName,
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      total: invoice.total || 0,
      status: invoice.status === 'paid' ? 'Pagada' : 'Pendiente',
      paidAt: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('es-ES') : '',
      notes: invoice.notes,
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF9800' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Format currency columns
  worksheet.getColumn('subtotal').numFmt = '$#,##0.00';
  worksheet.getColumn('tax').numFmt = '$#,##0.00';
  worksheet.getColumn('total').numFmt = '$#,##0.00';

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 15 },
  ];

  const totalAmount = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const pendingCount = invoices.length - paidCount;

  summarySheet.addRow({ metric: 'Total de facturas', value: invoices.length });
  summarySheet.addRow({ metric: 'Facturas pagadas', value: paidCount });
  summarySheet.addRow({ metric: 'Facturas pendientes', value: pendingCount });
  summarySheet.addRow({ metric: 'Total facturado', value: `$${totalAmount.toFixed(2)}` });
  summarySheet.addRow({ metric: 'Total cobrado', value: `$${paidAmount.toFixed(2)}` });
  summarySheet.addRow({ metric: 'Total pendiente', value: `$${pendingAmount.toFixed(2)}` });

  summarySheet.getRow(1).font = { bold: true };

  return (await workbook.xlsx.writeBuffer()) as Buffer;
}

/**
 * Generate inventory Excel
 */
export async function generateInventoryExcel(inventory: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventario');

  // Set columns
  worksheet.columns = [
    { header: 'Código', key: 'code', width: 15 },
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Stock Mínimo', key: 'minStock', width: 12 },
    { header: 'Precio Unitario', key: 'price', width: 15 },
    { header: 'Valor Total', key: 'totalValue', width: 15 },
    { header: 'Estado', key: 'status', width: 15 },
  ];

  // Add data
  inventory.forEach((item) => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const minStock = item.minStock || 5;
    const status = quantity < minStock ? 'Stock Bajo' : 'OK';

    worksheet.addRow({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity,
      minStock,
      price,
      totalValue: quantity * price,
      status,
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF795548' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Format currency columns
  worksheet.getColumn('price').numFmt = '$#,##0.00';
  worksheet.getColumn('totalValue').numFmt = '$#,##0.00';

  // Conditional formatting for low stock
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell('status');
      if (statusCell.value === 'Stock Bajo') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEBEE' },
          };
        });
      }
    }
  });

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Resumen');
  summarySheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 15 },
  ];

  const totalValue = inventory.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.price || 0),
    0
  );
  const lowStockCount = inventory.filter(
    (i) => (i.quantity || 0) < (i.minStock || 5)
  ).length;

  summarySheet.addRow({ metric: 'Total de items', value: inventory.length });
  summarySheet.addRow({ metric: 'Valor total', value: `$${totalValue.toFixed(2)}` });
  summarySheet.addRow({ metric: 'Items con stock bajo', value: lowStockCount });

  summarySheet.getRow(1).font = { bold: true };

  return (await workbook.xlsx.writeBuffer()) as Buffer;
}
