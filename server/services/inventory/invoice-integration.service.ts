/**
 * Servicio de Integración de Inventario con Facturación
 * Piano Emotion Manager
 * 
 * Este servicio conecta el módulo de inventario con el sistema de facturación,
 * permitiendo incluir automáticamente las piezas usadas en las facturas.
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, inArray } from 'drizzle-orm';
import { products, stockMovements } from '../../../drizzle/inventory-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface InvoiceProductLine {
  type: 'product';
  productId: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface InvoiceServiceLine {
  type: 'service';
  serviceType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export type InvoiceLine = InvoiceProductLine | InvoiceServiceLine;

export interface InvoiceSummary {
  lines: InvoiceLine[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  taxBreakdown: Array<{
    rate: number;
    base: number;
    amount: number;
  }>;
}

export interface ProductForInvoice {
  productId: number;
  quantity: number;
  unitPrice?: number; // Si no se proporciona, se usa el precio del producto
  discount?: number; // Porcentaje de descuento
}

// ============================================================================
// Invoice Integration Service
// ============================================================================

export class InvoiceIntegrationService {
  private organizationId: number;

  constructor(organizationId: number) {
    this.organizationId = organizationId;
  }

  /**
   * Genera líneas de factura para productos
   */
  async generateProductLines(
    productInputs: ProductForInvoice[]
  ): Promise<InvoiceProductLine[]> {
    const productIds = productInputs.map((p) => p.productId);

    const productRecords = await getDb().query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.organizationId, this.organizationId)
      ),
    });

    const productMap = new Map(productRecords.map((p) => [p.id, p]));
    const lines: InvoiceProductLine[] = [];

    for (const input of productInputs) {
      const product = productMap.get(input.productId);
      if (!product) continue;

      const unitPrice = input.unitPrice ?? parseFloat(product.salePrice);
      const discount = input.discount ?? 0;
      const taxRate = parseFloat(product.taxRate);
      const quantity = input.quantity;

      const subtotal = unitPrice * quantity;
      const discountAmount = subtotal * (discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (taxRate / 100);
      const total = taxableAmount + taxAmount;

      lines.push({
        type: 'product',
        productId: product.id,
        sku: product.sku,
        description: product.name,
        quantity,
        unitPrice,
        discount,
        taxRate,
        taxAmount,
        subtotal,
        total,
      });
    }

    return lines;
  }

  /**
   * Genera líneas de factura a partir de movimientos de stock de un servicio
   */
  async generateLinesFromServiceMovements(
    serviceId: number
  ): Promise<InvoiceProductLine[]> {
    const movements = await getDb().query.stockMovements.findMany({
      where: and(
        eq(stockMovements.organizationId, this.organizationId),
        eq(stockMovements.referenceType, 'service'),
        eq(stockMovements.referenceId, serviceId),
        eq(stockMovements.type, 'service_usage')
      ),
      with: {
        product: true,
      },
    });

    const lines: InvoiceProductLine[] = [];

    for (const movement of movements) {
      if (!movement.product) continue;

      const quantity = Math.abs(movement.quantity);
      const unitPrice = parseFloat(movement.product.salePrice);
      const taxRate = parseFloat(movement.product.taxRate);

      const subtotal = unitPrice * quantity;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      lines.push({
        type: 'product',
        productId: movement.productId,
        sku: movement.product.sku,
        description: movement.product.name,
        quantity,
        unitPrice,
        discount: 0,
        taxRate,
        taxAmount,
        subtotal,
        total,
      });
    }

    return lines;
  }

  /**
   * Calcula el resumen de factura con desglose de impuestos
   */
  calculateInvoiceSummary(lines: InvoiceLine[]): InvoiceSummary {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const taxGroups = new Map<number, { base: number; amount: number }>();

    for (const line of lines) {
      const lineSubtotal = line.unitPrice * line.quantity;
      const lineDiscount = lineSubtotal * (line.discount / 100);
      const taxableAmount = lineSubtotal - lineDiscount;

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += line.taxAmount;

      // Agrupar por tasa de impuesto
      const existing = taxGroups.get(line.taxRate) || { base: 0, amount: 0 };
      taxGroups.set(line.taxRate, {
        base: existing.base + taxableAmount,
        amount: existing.amount + line.taxAmount,
      });
    }

    const taxBreakdown = Array.from(taxGroups.entries())
      .map(([rate, { base, amount }]) => ({
        rate,
        base,
        amount,
      }))
      .sort((a, b) => a.rate - b.rate);

    return {
      lines,
      subtotal,
      totalDiscount,
      totalTax,
      total: subtotal - totalDiscount + totalTax,
      taxBreakdown,
    };
  }

  /**
   * Formatea líneas para exportación a sistemas de facturación electrónica
   */
  formatForEInvoicing(
    summary: InvoiceSummary,
    countryCode: string
  ): {
    lines: Array<{
      lineNumber: number;
      itemCode: string;
      description: string;
      quantity: string;
      unitCode: string;
      unitPrice: string;
      discount: string;
      taxCategory: string;
      taxRate: string;
      lineTotal: string;
    }>;
    taxTotals: Array<{
      taxCategory: string;
      taxRate: string;
      taxableAmount: string;
      taxAmount: string;
    }>;
    totals: {
      lineExtensionAmount: string;
      taxExclusiveAmount: string;
      taxInclusiveAmount: string;
      payableAmount: string;
    };
  } {
    // Mapeo de tasas de IVA a categorías según país
    const getTaxCategory = (rate: number, country: string): string => {
      if (rate === 0) return 'Z'; // Zero rated
      if (country === 'ES' || country === 'IT' || country === 'FR' || country === 'DE') {
        if (rate === 21 || rate === 22 || rate === 20 || rate === 19) return 'S'; // Standard
        if (rate === 10 || rate === 5.5 || rate === 7) return 'AA'; // Reduced
        if (rate === 4 || rate === 2.1) return 'E'; // Super reduced
      }
      return 'S'; // Default to standard
    };

    const formattedLines = summary.lines.map((line, index) => ({
      lineNumber: index + 1,
      itemCode: line.type === 'product' ? line.sku : 'SERVICE',
      description: line.description,
      quantity: line.quantity.toFixed(2),
      unitCode: 'EA', // Each (unidad)
      unitPrice: line.unitPrice.toFixed(4),
      discount: line.discount.toFixed(2),
      taxCategory: getTaxCategory(line.taxRate, countryCode),
      taxRate: line.taxRate.toFixed(2),
      lineTotal: line.subtotal.toFixed(2),
    }));

    const taxTotals = summary.taxBreakdown.map((tax) => ({
      taxCategory: getTaxCategory(tax.rate, countryCode),
      taxRate: tax.rate.toFixed(2),
      taxableAmount: tax.base.toFixed(2),
      taxAmount: tax.amount.toFixed(2),
    }));

    const totals = {
      lineExtensionAmount: summary.subtotal.toFixed(2),
      taxExclusiveAmount: (summary.subtotal - summary.totalDiscount).toFixed(2),
      taxInclusiveAmount: summary.total.toFixed(2),
      payableAmount: summary.total.toFixed(2),
    };

    return { lines: formattedLines, taxTotals, totals };
  }

  /**
   * Obtiene productos frecuentemente facturados
   */
  async getFrequentlyInvoicedProducts(
    limit: number = 10
  ): Promise<Array<{
    productId: number;
    sku: string;
    name: string;
    timesInvoiced: number;
    totalQuantity: number;
    totalRevenue: number;
  }>> {
    // Obtener movimientos de tipo service_usage agrupados por producto
    const movements = await getDb().query.stockMovements.findMany({
      where: and(
        eq(stockMovements.organizationId, this.organizationId),
        eq(stockMovements.type, 'service_usage')
      ),
      with: {
        product: true,
      },
    });

    // Agrupar por producto
    const productStats = new Map<number, {
      product: typeof movements[0]['product'];
      count: number;
      quantity: number;
      revenue: number;
    }>();

    for (const movement of movements) {
      if (!movement.product) continue;

      const existing = productStats.get(movement.productId) || {
        product: movement.product,
        count: 0,
        quantity: 0,
        revenue: 0,
      };

      const quantity = Math.abs(movement.quantity);
      const revenue = quantity * parseFloat(movement.product.salePrice);

      productStats.set(movement.productId, {
        product: movement.product,
        count: existing.count + 1,
        quantity: existing.quantity + quantity,
        revenue: existing.revenue + revenue,
      });
    }

    // Ordenar por frecuencia y limitar
    return Array.from(productStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((stat) => ({
        productId: stat.product!.id,
        sku: stat.product!.sku,
        name: stat.product!.name,
        timesInvoiced: stat.count,
        totalQuantity: stat.quantity,
        totalRevenue: stat.revenue,
      }));
  }

  /**
   * Calcula el margen de beneficio de productos facturados
   */
  async calculateProductMargins(
    productIds: number[]
  ): Promise<Array<{
    productId: number;
    sku: string;
    name: string;
    costPrice: number;
    salePrice: number;
    marginAmount: number;
    marginPercent: number;
  }>> {
    const productRecords = await getDb().query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.organizationId, this.organizationId)
      ),
    });

    return productRecords.map((product) => {
      const costPrice = parseFloat(product.costPrice);
      const salePrice = parseFloat(product.salePrice);
      const marginAmount = salePrice - costPrice;
      const marginPercent = costPrice > 0 ? (marginAmount / costPrice) * 100 : 0;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        costPrice,
        salePrice,
        marginAmount,
        marginPercent,
      };
    });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createInvoiceIntegration(
  organizationId: number
): InvoiceIntegrationService {
  return new InvoiceIntegrationService(organizationId);
}
