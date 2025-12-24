/**
 * Servicio de Integración de Inventario con Servicios de Piano
 * Piano Emotion Manager
 * 
 * Este servicio conecta el módulo de inventario con los servicios de piano,
 * permitiendo registrar el uso de piezas durante los servicios y actualizar
 * automáticamente el stock y la facturación.
 */

import { db } from '@/drizzle/db';
import { eq, and, sql } from 'drizzle-orm';
import {
  products,
  warehouseStock,
  stockMovements,
  stockAlerts,
} from '@/drizzle/inventory-schema';

// ============================================================================
// Types
// ============================================================================

export interface ServicePartUsage {
  productId: number;
  quantity: number;
  warehouseId: number;
  unitPrice?: number; // Si no se proporciona, se usa el precio de venta del producto
  notes?: string;
}

export interface ServicePartsResult {
  success: boolean;
  totalPartsValue: number;
  parts: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    stockRemaining: number;
  }>;
  errors?: string[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  productId?: number;
  sku?: string;
}

// ============================================================================
// Service Integration Service
// ============================================================================

export class ServiceIntegrationService {
  private organizationId: number;
  private userId: number;

  constructor(organizationId: number, userId: number) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Registra el uso de piezas en un servicio de piano
   * Actualiza el stock y prepara los datos para facturación
   */
  async recordPartsUsedInService(
    serviceId: number,
    parts: ServicePartUsage[]
  ): Promise<ServicePartsResult> {
    const result: ServicePartsResult = {
      success: true,
      totalPartsValue: 0,
      parts: [],
      errors: [],
    };

    // Procesar cada pieza en una transacción
    await db.transaction(async (tx) => {
      for (const part of parts) {
        try {
          // Obtener información del producto
          const product = await tx.query.products.findFirst({
            where: and(
              eq(products.id, part.productId),
              eq(products.organizationId, this.organizationId)
            ),
          });

          if (!product) {
            result.errors?.push(`Producto ${part.productId} no encontrado`);
            continue;
          }

          // Verificar stock disponible
          const stock = await tx.query.warehouseStock.findFirst({
            where: and(
              eq(warehouseStock.productId, part.productId),
              eq(warehouseStock.warehouseId, part.warehouseId)
            ),
          });

          const availableStock = stock 
            ? stock.quantity - stock.reservedQuantity 
            : 0;

          if (availableStock < part.quantity) {
            result.errors?.push(
              `Stock insuficiente para ${product.name}: disponible ${availableStock}, solicitado ${part.quantity}`
            );
            continue;
          }

          // Calcular precio
          const unitPrice = part.unitPrice || parseFloat(product.salePrice);
          const totalPrice = unitPrice * part.quantity;

          // Registrar movimiento de salida
          await tx.insert(stockMovements).values({
            organizationId: this.organizationId,
            productId: part.productId,
            warehouseId: part.warehouseId,
            type: 'service_usage',
            quantity: -part.quantity,
            unitCost: product.costPrice,
            totalCost: (parseFloat(product.costPrice) * part.quantity).toFixed(2),
            referenceType: 'service',
            referenceId: serviceId,
            notes: part.notes || `Usado en servicio #${serviceId}`,
            createdBy: this.userId,
          });

          // Actualizar stock
          await tx
            .update(warehouseStock)
            .set({
              quantity: sql`${warehouseStock.quantity} - ${part.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(warehouseStock.productId, part.productId),
                eq(warehouseStock.warehouseId, part.warehouseId)
              )
            );

          // Verificar si necesita alerta de stock bajo
          const newStock = availableStock - part.quantity;
          if (newStock <= product.reorderPoint) {
            await this.createStockAlert(
              tx,
              part.productId,
              part.warehouseId,
              newStock,
              product.reorderPoint,
              product.minStock
            );
          }

          // Añadir al resultado
          result.parts.push({
            productId: part.productId,
            productName: product.name,
            quantity: part.quantity,
            unitPrice,
            totalPrice,
            stockRemaining: newStock,
          });

          result.totalPartsValue += totalPrice;
        } catch (error) {
          result.errors?.push(`Error procesando producto ${part.productId}: ${(error as Error).message}`);
        }
      }
    });

    result.success = result.errors?.length === 0;
    return result;
  }

  /**
   * Revierte el uso de piezas (por ejemplo, si se cancela un servicio)
   */
  async revertPartsUsage(
    serviceId: number,
    parts: ServicePartUsage[]
  ): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = [];

    await db.transaction(async (tx) => {
      for (const part of parts) {
        try {
          // Registrar movimiento de entrada (devolución)
          await tx.insert(stockMovements).values({
            organizationId: this.organizationId,
            productId: part.productId,
            warehouseId: part.warehouseId,
            type: 'return',
            quantity: part.quantity,
            referenceType: 'service',
            referenceId: serviceId,
            notes: `Devolución por cancelación de servicio #${serviceId}`,
            createdBy: this.userId,
          });

          // Actualizar stock
          await tx
            .update(warehouseStock)
            .set({
              quantity: sql`${warehouseStock.quantity} + ${part.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(warehouseStock.productId, part.productId),
                eq(warehouseStock.warehouseId, part.warehouseId)
              )
            );
        } catch (error) {
          errors.push(`Error revirtiendo producto ${part.productId}: ${(error as Error).message}`);
        }
      }
    });

    return { success: errors.length === 0, errors };
  }

  /**
   * Genera líneas de factura a partir de las piezas usadas
   */
  async generateInvoiceLines(
    serviceId: number
  ): Promise<InvoiceLineItem[]> {
    // Obtener movimientos de stock asociados al servicio
    const movements = await db.query.stockMovements.findMany({
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

    const invoiceLines: InvoiceLineItem[] = [];

    for (const movement of movements) {
      if (!movement.product) continue;

      const quantity = Math.abs(movement.quantity);
      const unitPrice = parseFloat(movement.product.salePrice);
      const taxRate = parseFloat(movement.product.taxRate);

      invoiceLines.push({
        description: movement.product.name,
        quantity,
        unitPrice,
        taxRate,
        totalPrice: unitPrice * quantity,
        productId: movement.productId,
        sku: movement.product.sku,
      });
    }

    return invoiceLines;
  }

  /**
   * Obtiene el historial de piezas usadas en un servicio
   */
  async getServicePartsHistory(serviceId: number) {
    const movements = await db.query.stockMovements.findMany({
      where: and(
        eq(stockMovements.organizationId, this.organizationId),
        eq(stockMovements.referenceType, 'service'),
        eq(stockMovements.referenceId, serviceId)
      ),
      with: {
        product: true,
        warehouse: true,
      },
      orderBy: (movements, { desc }) => [desc(movements.createdAt)],
    });

    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name,
      productSku: m.product?.sku,
      warehouseName: m.warehouse?.name,
      type: m.type,
      quantity: Math.abs(m.quantity),
      unitCost: m.unitCost,
      totalCost: m.totalCost,
      notes: m.notes,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Verifica disponibilidad de piezas antes de un servicio
   */
  async checkPartsAvailability(
    parts: Array<{ productId: number; quantity: number; warehouseId: number }>
  ): Promise<{
    allAvailable: boolean;
    availability: Array<{
      productId: number;
      productName: string;
      requested: number;
      available: number;
      isAvailable: boolean;
    }>;
  }> {
    const availability = [];
    let allAvailable = true;

    for (const part of parts) {
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, part.productId),
          eq(products.organizationId, this.organizationId)
        ),
      });

      const stock = await db.query.warehouseStock.findFirst({
        where: and(
          eq(warehouseStock.productId, part.productId),
          eq(warehouseStock.warehouseId, part.warehouseId)
        ),
      });

      const availableQty = stock ? stock.quantity - stock.reservedQuantity : 0;
      const isAvailable = availableQty >= part.quantity;

      if (!isAvailable) {
        allAvailable = false;
      }

      availability.push({
        productId: part.productId,
        productName: product?.name || 'Producto desconocido',
        requested: part.quantity,
        available: availableQty,
        isAvailable,
      });
    }

    return { allAvailable, availability };
  }

  /**
   * Reserva piezas para un servicio programado
   */
  async reservePartsForService(
    serviceId: number,
    parts: Array<{ productId: number; quantity: number; warehouseId: number }>
  ): Promise<{ success: boolean; errors?: string[] }> {
    const errors: string[] = [];

    await db.transaction(async (tx) => {
      for (const part of parts) {
        try {
          // Verificar disponibilidad
          const stock = await tx.query.warehouseStock.findFirst({
            where: and(
              eq(warehouseStock.productId, part.productId),
              eq(warehouseStock.warehouseId, part.warehouseId)
            ),
          });

          const availableQty = stock ? stock.quantity - stock.reservedQuantity : 0;

          if (availableQty < part.quantity) {
            errors.push(`Stock insuficiente para producto ${part.productId}`);
            continue;
          }

          // Actualizar cantidad reservada
          await tx
            .update(warehouseStock)
            .set({
              reservedQuantity: sql`${warehouseStock.reservedQuantity} + ${part.quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(warehouseStock.productId, part.productId),
                eq(warehouseStock.warehouseId, part.warehouseId)
              )
            );
        } catch (error) {
          errors.push(`Error reservando producto ${part.productId}: ${(error as Error).message}`);
        }
      }
    });

    return { success: errors.length === 0, errors };
  }

  /**
   * Libera reservas de piezas
   */
  async releaseReservedParts(
    serviceId: number,
    parts: Array<{ productId: number; quantity: number; warehouseId: number }>
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (const part of parts) {
        await tx
          .update(warehouseStock)
          .set({
            reservedQuantity: sql`GREATEST(0, ${warehouseStock.reservedQuantity} - ${part.quantity})`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(warehouseStock.productId, part.productId),
              eq(warehouseStock.warehouseId, part.warehouseId)
            )
          );
      }
    });
  }

  /**
   * Crea alerta de stock bajo
   */
  private async createStockAlert(
    tx: any,
    productId: number,
    warehouseId: number,
    currentStock: number,
    reorderPoint: number,
    minStock: number
  ): Promise<void> {
    const alertType = currentStock <= minStock ? 'out_of_stock' : 'low_stock';
    const message = alertType === 'out_of_stock'
      ? `Stock agotado o por debajo del mínimo (${currentStock} unidades)`
      : `Stock bajo: ${currentStock} unidades (punto de reorden: ${reorderPoint})`;

    // Verificar si ya existe una alerta activa
    const existingAlert = await tx.query.stockAlerts.findFirst({
      where: and(
        eq(stockAlerts.productId, productId),
        eq(stockAlerts.warehouseId, warehouseId),
        eq(stockAlerts.isResolved, false)
      ),
    });

    if (!existingAlert) {
      await tx.insert(stockAlerts).values({
        organizationId: this.organizationId,
        productId,
        warehouseId,
        alertType,
        currentStock,
        threshold: alertType === 'out_of_stock' ? minStock : reorderPoint,
        message,
      });
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createServiceIntegration(
  organizationId: number,
  userId: number
): ServiceIntegrationService {
  return new ServiceIntegrationService(organizationId, userId);
}
