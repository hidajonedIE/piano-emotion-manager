/**
 * Servicio de Exportación Contable
 * Genera exportaciones en CSV, Excel y PDF para contabilidad
 */

import { Invoice } from '@/types/business';

// Tipos de IVA en España
export const VAT_RATES = {
  general: 21,
  reduced: 10,
  superReduced: 4,
  exempt: 0,
};

// Tipos de exportación
export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type ExportPeriod = 'month' | 'quarter' | 'year' | 'custom';

// Estructura de una línea de factura para exportación
export interface InvoiceExportLine {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientTaxId: string;
  concept: string;
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
}

// Estructura del Libro de IVA
export interface VATBookEntry {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientTaxId: string;
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  type: 'issued' | 'received'; // Emitida o recibida
}

// Estructura del Modelo 303
export interface Model303Data {
  period: string; // "1T", "2T", "3T", "4T" o mes
  year: number;
  
  // Casillas del modelo
  baseImponibleGeneral: number;      // Casilla 01
  cuotaDevengadaGeneral: number;     // Casilla 02
  baseImponibleReducido: number;     // Casilla 03
  cuotaDevengadaReducido: number;    // Casilla 04
  baseImponibleSuperReducido: number; // Casilla 05
  cuotaDevengadaSuperReducido: number; // Casilla 06
  
  totalBaseImponible: number;        // Casilla 07
  totalCuotaDevengada: number;       // Casilla 08
  
  // IVA deducible
  cuotaDeducibleBienes: number;      // Casilla 28
  cuotaDeducibleServicios: number;   // Casilla 29
  totalCuotaDeducible: number;       // Casilla 45
  
  // Resultado
  diferencia: number;                // Casilla 46
  compensacionPeriodosAnteriores: number; // Casilla 67
  resultadoLiquidacion: number;      // Casilla 69
}

// Estructura del Modelo 130
export interface Model130Data {
  period: string; // "1T", "2T", "3T", "4T"
  year: number;
  
  // Ingresos
  ingresosTrimestre: number;         // Casilla 01
  ingresosAcumulados: number;        // Casilla 02
  
  // Gastos
  gastosTrimestre: number;           // Casilla 03
  gastosAcumulados: number;          // Casilla 04
  
  // Rendimiento neto
  rendimientoNetoTrimestre: number;  // Casilla 05
  rendimientoNetoAcumulado: number;  // Casilla 06
  
  // Cálculo del pago fraccionado (20%)
  porcentajeAplicable: number;       // 20%
  pagoFraccionado: number;           // Casilla 07
  
  // Deducciones
  retencionesIngresadas: number;     // Casilla 08
  pagosAnteriores: number;           // Casilla 09
  
  // Resultado
  resultadoLiquidacion: number;      // Casilla 12
}

/**
 * Formatea una fecha para exportación
 */
export function formatDateForExport(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatea un número con 2 decimales
 */
export function formatNumber(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

/**
 * Convierte facturas a líneas de exportación
 */
export function invoicesToExportLines(invoices: Invoice[]): InvoiceExportLine[] {
  return invoices.map(invoice => {
    const baseAmount = invoice.subtotal || 0;
    const vatRate = invoice.vatRate || 21;
    const vatAmount = invoice.vatAmount || (baseAmount * vatRate / 100);
    const totalAmount = invoice.total || (baseAmount + vatAmount);

    return {
      invoiceNumber: invoice.number || '',
      date: invoice.date || '',
      clientName: invoice.clientName || '',
      clientTaxId: invoice.clientTaxId || '',
      concept: invoice.concept || invoice.items?.map(i => i.description).join(', ') || '',
      baseAmount,
      vatRate,
      vatAmount,
      totalAmount,
      status: invoice.status || 'pending',
    };
  });
}

/**
 * Genera CSV de facturas
 */
export function generateInvoicesCSV(invoices: Invoice[]): string {
  const lines = invoicesToExportLines(invoices);
  
  const headers = [
    'Nº Factura',
    'Fecha',
    'Cliente',
    'NIF/CIF',
    'Concepto',
    'Base Imponible',
    'Tipo IVA',
    'Cuota IVA',
    'Total',
    'Estado',
  ];

  const rows = lines.map(line => [
    line.invoiceNumber,
    formatDateForExport(line.date),
    `"${line.clientName}"`,
    line.clientTaxId,
    `"${line.concept}"`,
    formatNumber(line.baseAmount),
    `${line.vatRate}%`,
    formatNumber(line.vatAmount),
    formatNumber(line.totalAmount),
    line.status === 'paid' ? 'Pagada' : line.status === 'pending' ? 'Pendiente' : 'Cancelada',
  ]);

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');
}

/**
 * Genera Libro de IVA en CSV
 */
export function generateVATBookCSV(entries: VATBookEntry[], type: 'issued' | 'received'): string {
  const title = type === 'issued' ? 'LIBRO REGISTRO DE FACTURAS EMITIDAS' : 'LIBRO REGISTRO DE FACTURAS RECIBIDAS';
  
  const headers = [
    'Nº Factura',
    'Fecha',
    type === 'issued' ? 'Cliente' : 'Proveedor',
    'NIF/CIF',
    'Base Imponible',
    'Tipo IVA',
    'Cuota IVA',
    'Total',
  ];

  const rows = entries
    .filter(e => e.type === type)
    .map(entry => [
      entry.invoiceNumber,
      formatDateForExport(entry.date),
      `"${entry.clientName}"`,
      entry.clientTaxId,
      formatNumber(entry.baseAmount),
      `${entry.vatRate}%`,
      formatNumber(entry.vatAmount),
      formatNumber(entry.totalAmount),
    ]);

  // Totales
  const totalBase = entries.filter(e => e.type === type).reduce((sum, e) => sum + e.baseAmount, 0);
  const totalVAT = entries.filter(e => e.type === type).reduce((sum, e) => sum + e.vatAmount, 0);
  const totalAmount = entries.filter(e => e.type === type).reduce((sum, e) => sum + e.totalAmount, 0);

  return [
    title,
    '',
    headers.join(';'),
    ...rows.map(row => row.join(';')),
    '',
    `TOTALES;;;;;;${formatNumber(totalBase)};${formatNumber(totalVAT)};${formatNumber(totalAmount)}`,
  ].join('\n');
}

/**
 * Calcula datos del Modelo 303
 */
export function calculateModel303(
  issuedInvoices: Invoice[],
  receivedInvoices: Invoice[],
  period: string,
  year: number,
  compensacionAnterior: number = 0
): Model303Data {
  // Agrupar facturas emitidas por tipo de IVA
  const issuedByVAT = {
    general: issuedInvoices.filter(i => (i.vatRate || 21) === 21),
    reduced: issuedInvoices.filter(i => (i.vatRate || 21) === 10),
    superReduced: issuedInvoices.filter(i => (i.vatRate || 21) === 4),
  };

  // Calcular bases y cuotas devengadas
  const baseImponibleGeneral = issuedByVAT.general.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const cuotaDevengadaGeneral = baseImponibleGeneral * 0.21;

  const baseImponibleReducido = issuedByVAT.reduced.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const cuotaDevengadaReducido = baseImponibleReducido * 0.10;

  const baseImponibleSuperReducido = issuedByVAT.superReduced.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const cuotaDevengadaSuperReducido = baseImponibleSuperReducido * 0.04;

  const totalBaseImponible = baseImponibleGeneral + baseImponibleReducido + baseImponibleSuperReducido;
  const totalCuotaDevengada = cuotaDevengadaGeneral + cuotaDevengadaReducido + cuotaDevengadaSuperReducido;

  // Calcular IVA deducible (facturas recibidas)
  const cuotaDeducibleBienes = receivedInvoices
    .filter(i => i.type === 'goods' || !i.type)
    .reduce((sum, i) => sum + (i.vatAmount || (i.subtotal || 0) * (i.vatRate || 21) / 100), 0);

  const cuotaDeducibleServicios = receivedInvoices
    .filter(i => i.type === 'services')
    .reduce((sum, i) => sum + (i.vatAmount || (i.subtotal || 0) * (i.vatRate || 21) / 100), 0);

  const totalCuotaDeducible = cuotaDeducibleBienes + cuotaDeducibleServicios;

  // Resultado
  const diferencia = totalCuotaDevengada - totalCuotaDeducible;
  const resultadoLiquidacion = diferencia - compensacionAnterior;

  return {
    period,
    year,
    baseImponibleGeneral,
    cuotaDevengadaGeneral,
    baseImponibleReducido,
    cuotaDevengadaReducido,
    baseImponibleSuperReducido,
    cuotaDevengadaSuperReducido,
    totalBaseImponible,
    totalCuotaDevengada,
    cuotaDeducibleBienes,
    cuotaDeducibleServicios,
    totalCuotaDeducible,
    diferencia,
    compensacionPeriodosAnteriores: compensacionAnterior,
    resultadoLiquidacion,
  };
}

/**
 * Calcula datos del Modelo 130
 */
export function calculateModel130(
  ingresosTrimestre: number,
  ingresosAcumulados: number,
  gastosTrimestre: number,
  gastosAcumulados: number,
  retencionesIngresadas: number,
  pagosAnteriores: number,
  period: string,
  year: number
): Model130Data {
  const rendimientoNetoTrimestre = ingresosTrimestre - gastosTrimestre;
  const rendimientoNetoAcumulado = ingresosAcumulados - gastosAcumulados;
  
  const porcentajeAplicable = 20;
  const pagoFraccionado = Math.max(0, rendimientoNetoAcumulado * (porcentajeAplicable / 100));
  
  const resultadoLiquidacion = Math.max(0, pagoFraccionado - retencionesIngresadas - pagosAnteriores);

  return {
    period,
    year,
    ingresosTrimestre,
    ingresosAcumulados,
    gastosTrimestre,
    gastosAcumulados,
    rendimientoNetoTrimestre,
    rendimientoNetoAcumulado,
    porcentajeAplicable,
    pagoFraccionado,
    retencionesIngresadas,
    pagosAnteriores,
    resultadoLiquidacion,
  };
}

/**
 * Genera resumen del Modelo 303 en texto
 */
export function generateModel303Summary(data: Model303Data): string {
  return `
MODELO 303 - AUTOLIQUIDACIÓN IVA
================================
Período: ${data.period} - ${data.year}

IVA DEVENGADO
-------------
Base Imponible 21%: ${formatCurrency(data.baseImponibleGeneral)}
Cuota 21%: ${formatCurrency(data.cuotaDevengadaGeneral)}

Base Imponible 10%: ${formatCurrency(data.baseImponibleReducido)}
Cuota 10%: ${formatCurrency(data.cuotaDevengadaReducido)}

Base Imponible 4%: ${formatCurrency(data.baseImponibleSuperReducido)}
Cuota 4%: ${formatCurrency(data.cuotaDevengadaSuperReducido)}

TOTAL BASE IMPONIBLE: ${formatCurrency(data.totalBaseImponible)}
TOTAL CUOTA DEVENGADA: ${formatCurrency(data.totalCuotaDevengada)}

IVA DEDUCIBLE
-------------
Cuota deducible bienes: ${formatCurrency(data.cuotaDeducibleBienes)}
Cuota deducible servicios: ${formatCurrency(data.cuotaDeducibleServicios)}
TOTAL CUOTA DEDUCIBLE: ${formatCurrency(data.totalCuotaDeducible)}

RESULTADO
---------
Diferencia: ${formatCurrency(data.diferencia)}
Compensación períodos anteriores: ${formatCurrency(data.compensacionPeriodosAnteriores)}
RESULTADO LIQUIDACIÓN: ${formatCurrency(data.resultadoLiquidacion)}

${data.resultadoLiquidacion > 0 ? 'A INGRESAR' : data.resultadoLiquidacion < 0 ? 'A COMPENSAR' : 'SIN ACTIVIDAD'}
`.trim();
}

/**
 * Genera resumen del Modelo 130 en texto
 */
export function generateModel130Summary(data: Model130Data): string {
  return `
MODELO 130 - PAGO FRACCIONADO IRPF
==================================
Período: ${data.period} - ${data.year}

INGRESOS
--------
Ingresos del trimestre: ${formatCurrency(data.ingresosTrimestre)}
Ingresos acumulados: ${formatCurrency(data.ingresosAcumulados)}

GASTOS
------
Gastos del trimestre: ${formatCurrency(data.gastosTrimestre)}
Gastos acumulados: ${formatCurrency(data.gastosAcumulados)}

RENDIMIENTO NETO
----------------
Rendimiento neto trimestre: ${formatCurrency(data.rendimientoNetoTrimestre)}
Rendimiento neto acumulado: ${formatCurrency(data.rendimientoNetoAcumulado)}

CÁLCULO PAGO FRACCIONADO
------------------------
Porcentaje aplicable: ${data.porcentajeAplicable}%
Pago fraccionado: ${formatCurrency(data.pagoFraccionado)}

DEDUCCIONES
-----------
Retenciones ingresadas: ${formatCurrency(data.retencionesIngresadas)}
Pagos anteriores: ${formatCurrency(data.pagosAnteriores)}

RESULTADO
---------
RESULTADO LIQUIDACIÓN: ${formatCurrency(data.resultadoLiquidacion)}

${data.resultadoLiquidacion > 0 ? 'A INGRESAR' : 'SIN INGRESO'}
`.trim();
}

/**
 * Obtiene el trimestre de una fecha
 */
export function getQuarter(date: Date): string {
  const month = date.getMonth();
  if (month < 3) return '1T';
  if (month < 6) return '2T';
  if (month < 9) return '3T';
  return '4T';
}

/**
 * Filtra facturas por período
 */
export function filterInvoicesByPeriod(
  invoices: Invoice[],
  period: ExportPeriod,
  year: number,
  quarter?: string,
  month?: number,
  startDate?: string,
  endDate?: string
): Invoice[] {
  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    const invoiceYear = invoiceDate.getFullYear();
    const invoiceMonth = invoiceDate.getMonth();
    const invoiceQuarter = getQuarter(invoiceDate);

    switch (period) {
      case 'month':
        return invoiceYear === year && invoiceMonth === (month || 0);
      case 'quarter':
        return invoiceYear === year && invoiceQuarter === quarter;
      case 'year':
        return invoiceYear === year;
      case 'custom':
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return invoiceDate >= start && invoiceDate <= end;
      default:
        return true;
    }
  });
}
