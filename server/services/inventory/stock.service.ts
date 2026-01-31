/**
 * Servicio de Gestión de Stock
 * Piano Emotion Manager
 * 
 * Gestiona los movimientos de stock: entradas, salidas, transferencias,
 * ajustes de inventario y alertas de stock bajo.
 */

import { eq, and, desc, sql, between, inArray, isNull } from 'drizzle-orm';
import { getDb } from "../../db.js";

import {
  products,
  warehouses,
  warehouseStock,
  stockMovements,
  stockAlerts,
  type StockMovementType,
} from '../../../drizzle/inventory-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface StockMovementInput {
  productId: number;
  warehouseId: number;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: number;
  relatedWarehouseId?: number;
  batchNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
  notes?: string;
  userId?: number;
  organizationId?: number;
}

export interface TransferInput {
  productId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
  notes?: string;
  userId?: number;
  organizationId?: number;
}

export interface AdjustmentInput {
  productId: number;
  warehouseId: number;
  newQuantity: number;
  reason: string;
  notes?: string;
  userId?: number;
  organizationId?: number;
}

export interface StockLevel {
  productId: number;
  productName: string;
  productSku: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStock: number;
  reorderPoint: number;
  status: 'ok' | 'low' | 'critical' | 'out_of_stock';
}

export interface MovementHistory {
  movements: Array<typeof stockMovements.$inferSelect & {
    product: typeof products.$inferSelect;
    warehouse: typeof warehouses.$inferSelect;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// Stock Service
// ============================================================================

export class StockService {
  /**
   * Registrar un movimiento de stock
   */
  async recordMovement(input: StockMovementInput): Promise<typeof stockMovements.$inferSelect> {
    // Obtener stock actual
    let currentStock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, input.productId!),
        eq(warehouseStock.warehouseId!, input.warehouseId!)
      ),
    });

    // Si no existe, crear registro de stock
    if (!currentStock) {
      const [newStock] = await (await getDb())!.insert(warehouseStock).values({
        productId: input.productId!,
        warehouseId: input.warehouseId!,
        quantity: '0',
        reservedQuantity: '0',
        availableQuantity: '0',
        totalCost: '0',
        averageCost: '0',
      });
      currentStock = newStock;
    }

    const stockBefore = parseFloat(currentStock.quantity);
    let stockAfter: number;
    let totalCost = parseFloat(currentStock.totalCost);
    const unitCost = input.unitCost || parseFloat(currentStock.averageCost) || 0;

    // Calcular nuevo stock según tipo de movimiento
    const isIncoming = ['purchase', 'transfer_in', 'adjustment_in', 'return_customer'].includes(input.type);
    const isOutgoing = ['sale', 'transfer_out', 'adjustment_out', 'return_supplier', 'damaged', 'expired'].includes(input.type);

    if (isIncoming) {
      stockAfter = stockBefore + input.quantity;
      totalCost += input.quantity * unitCost;
    } else if (isOutgoing) {
      stockAfter = stockBefore - input.quantity;
      totalCost -= input.quantity * unitCost;
      
      // Verificar stock negativo
      const warehouse = await (await getDb())!.query.warehouses.findFirst({
        where: eq(warehouses.id, input.warehouseId!),
      });
      
      if (!warehouse?.allowNegativeStock && stockAfter < 0) {
        throw new Error(`Stock insuficiente. Disponible: ${stockBefore}, Solicitado: ${input.quantity}`);
      }
    } else {
      stockAfter = stockBefore;
    }

    // Calcular coste medio
    const averageCost = stockAfter > 0 ? totalCost / stockAfter : unitCost;

    // Crear movimiento
    const [movement] = await (await getDb())!.insert(stockMovements).values({
      productId: input.productId!,
      warehouseId: input.warehouseId!,
      type: input.type,
      quantity: input.quantity.toString(),
      unitCost: unitCost.toString(),
      totalCost: (input.quantity * unitCost).toString(),
      stockBefore: stockBefore.toString(),
      stockAfter: stockAfter.toString(),
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      relatedWarehouseId: input.relatedWarehouseId,
      batchNumber: input.batchNumber,
      serialNumber: input.serialNumber,
      expirationDate: input.expirationDate,
      notes: input.notes,
      userId: input.userId,
      organizationId: input.organizationId,
    });

    // Actualizar stock
    await (await getDb())!.update(warehouseStock)
      .set({
        quantity: stockAfter.toString(),
        availableQuantity: stockAfter.toString(),
        totalCost: Math.max(0, totalCost).toString(),
        averageCost: averageCost.toString(),
        lastMovementAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, currentStock.id));

    // Verificar alertas de stock
    await this.checkStockAlerts(input.productId!, input.warehouseId!, stockAfter, input.organizationId);

    return movement;
  }

  /**
   * Realizar transferencia entre almacenes
   */
  async transfer(input: TransferInput): Promise<{
    outMovement: typeof stockMovements.$inferSelect;
    inMovement: typeof stockMovements.$inferSelect;
  }> {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new Error('El almacén origen y destino no pueden ser el mismo');
    }

    // Obtener coste del producto en el almacén origen
    const sourceStock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, input.productId!),
        eq(warehouseStock.warehouseId!, input.fromWarehouseId)
      ),
    });

    const unitCost = sourceStock ? parseFloat(sourceStock.averageCost) : 0;

    // Registrar salida del almacén origen
    const outMovement = await this.recordMovement({
      productId: input.productId!,
      warehouseId: input.fromWarehouseId,
      type: 'transfer_out',
      quantity: input.quantity,
      unitCost,
      relatedWarehouseId: input.toWarehouseId,
      notes: input.notes,
      userId: input.userId,
      organizationId: input.organizationId,
    });

    // Registrar entrada en el almacén destino
    const inMovement = await this.recordMovement({
      productId: input.productId!,
      warehouseId: input.toWarehouseId,
      type: 'transfer_in',
      quantity: input.quantity,
      unitCost,
      relatedWarehouseId: input.fromWarehouseId,
      relatedMovementId: outMovement.id,
      notes: input.notes,
      userId: input.userId,
      organizationId: input.organizationId,
    });

    // Actualizar referencia cruzada
    await (await getDb())!.update(stockMovements)
      .set({ relatedMovementId: inMovement.id })
      .where(eq(stockMovements.id, outMovement.id));

    return { outMovement, inMovement };
  }

  /**
   * Ajustar stock (inventario físico)
   */
  async adjust(input: AdjustmentInput): Promise<typeof stockMovements.$inferSelect> {
    // Obtener stock actual
    const currentStock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, input.productId!),
        eq(warehouseStock.warehouseId!, input.warehouseId!)
      ),
    });

    const currentQuantity = currentStock ? parseFloat(currentStock.quantity) : 0;
    const difference = input.newQuantity - currentQuantity;

    if (difference === 0) {
      throw new Error('La cantidad nueva es igual a la actual');
    }

    const type: StockMovementType = difference > 0 ? 'adjustment_in' : 'adjustment_out';
    const quantity = Math.abs(difference);

    return this.recordMovement({
      productId: input.productId!,
      warehouseId: input.warehouseId!,
      type,
      quantity,
      notes: `${input.reason}${input.notes ? ': ' + input.notes : ''}`,
      userId: input.userId,
      organizationId: input.organizationId,
    });
  }

  /**
   * Registrar uso de producto en un servicio
   */
  async recordServiceUsage(
    serviceId: number,
    productId: number,
    warehouseId: number,
    quantity: number,
    userId?: number,
    organizationId?: number
  ): Promise<typeof stockMovements.$inferSelect> {
    return this.recordMovement({
      productId,
      warehouseId,
      type: 'sale',
      quantity,
      referenceType: 'service',
      referenceId: serviceId,
      userId,
      organizationId,
    });
  }

  /**
   * Registrar compra de producto
   */
  async recordPurchase(
    purchaseOrderId: number,
    productId: number,
    warehouseId: number,
    quantity: number,
    unitCost: number,
    batchNumber?: string,
    expirationDate?: Date,
    userId?: number,
    organizationId?: number
  ): Promise<typeof stockMovements.$inferSelect> {
    return this.recordMovement({
      productId,
      warehouseId,
      type: 'purchase',
      quantity,
      unitCost,
      referenceType: 'purchase_order',
      referenceId: purchaseOrderId,
      batchNumber,
      expirationDate,
      userId,
      organizationId,
    });
  }

  /**
   * Obtener nivel de stock de un producto en todos los almacenes
   */
  async getStockLevels(productId: number): Promise<StockLevel[]> {
    const product = await (await getDb())!.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      throw new Error(`Producto no encontrado: ${productId}`);
    }

    const stockData = await (await getDb())!.query.warehouseStock.findMany({
      where: eq(warehouseStock.productId!, productId),
      with: {
        warehouse: true,
      },
    });

    return stockData.map(s => {
      const qty = parseFloat(s.quantity);
      const status = this.getStockStatus(qty, product.minStock, product.reorderPoint);
      
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        warehouseId: s.warehouseId!,
        warehouseName: s.warehouse.name,
        quantity: qty,
        reservedQuantity: parseFloat(s.reservedQuantity),
        availableQuantity: parseFloat(s.availableQuantity),
        minStock: product.minStock,
        reorderPoint: product.reorderPoint,
        status,
      };
    });
  }

  /**
   * Obtener stock total de un producto
   */
  async getTotalStock(productId: number): Promise<number> {
    const [result] = await (await getDb())!.select({
      total: sql<number>`coalesce(sum(${warehouseStock.quantity}::numeric), 0)`,
    })
      .from(warehouseStock)
      .where(eq(warehouseStock.productId!, productId));

    return Number(result.total);
  }

  /**
   * Obtener stock disponible de un producto en un almacén
   */
  async getAvailableStock(productId: number, warehouseId: number): Promise<number> {
    const stock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, productId),
        eq(warehouseStock.warehouseId!, warehouseId)
      ),
    });

    return stock ? parseFloat(stock.availableQuantity) : 0;
  }

  /**
   * Reservar stock para un pedido/servicio
   */
  async reserveStock(
    productId: number,
    warehouseId: number,
    quantity: number
  ): Promise<boolean> {
    const stock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, productId),
        eq(warehouseStock.warehouseId!, warehouseId)
      ),
    });

    if (!stock) return false;

    const available = parseFloat(stock.availableQuantity);
    if (available < quantity) return false;

    await (await getDb())!.update(warehouseStock)
      .set({
        reservedQuantity: (parseFloat(stock.reservedQuantity) + quantity).toString(),
        availableQuantity: (available - quantity).toString(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stock.id));

    return true;
  }

  /**
   * Liberar stock reservado
   */
  async releaseReservedStock(
    productId: number,
    warehouseId: number,
    quantity: number
  ): Promise<void> {
    const stock = await (await getDb())!.query.warehouseStock.findFirst({
      where: and(
        eq(warehouseStock.productId!, productId),
        eq(warehouseStock.warehouseId!, warehouseId)
      ),
    });

    if (!stock) return;

    const reserved = parseFloat(stock.reservedQuantity);
    const toRelease = Math.min(reserved, quantity);

    await (await getDb())!.update(warehouseStock)
      .set({
        reservedQuantity: (reserved - toRelease).toString(),
        availableQuantity: (parseFloat(stock.availableQuantity) + toRelease).toString(),
        updatedAt: new Date(),
      })
      .where(eq(warehouseStock.id, stock.id));
  }

  /**
   * Obtener historial de movimientos
   */
  async getMovementHistory(
    filters: {
      productId?: number;
      warehouseId?: number;
      type?: StockMovementType;
      dateFrom?: Date;
      dateTo?: Date;
      organizationId?: number;
    },
    page: number = 1,
    pageSize: number = 50
  ): Promise<MovementHistory> {
    const conditions = [];

    if (filters.productId!) {
      conditions.push(eq(stockMovements.productId!, filters.productId!));
    }
    if (filters.warehouseId!) {
      conditions.push(eq(stockMovements.warehouseId!, filters.warehouseId!));
    }
    if (filters.type) {
      conditions.push(eq(stockMovements.type, filters.type));
    }
    if (filters.dateFrom && filters.dateTo) {
      conditions.push(between(stockMovements.createdAt, filters.dateFrom, filters.dateTo));
    }
    if (filters.organizationId) {
      conditions.push(eq(stockMovements.organizationId, filters.organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Contar total
    const [{ count }] = await (await getDb())!.select({ count: sql<number>`count(*)` })
      .from(stockMovements)
      .where(whereClause);

    const total = Number(count);
    const offset = (page - 1) * pageSize;

    // Obtener movimientos
    const movements = await (await getDb())!.query.stockMovements.findMany({
      where: whereClause,
      with: {
        product: true,
        warehouse: true,
      },
      limit: pageSize,
      offset,
      orderBy: [desc(stockMovements.createdAt)],
    });

    return {
      movements,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Verificar y crear alertas de stock
   */
  private async checkStockAlerts(
    productId: number,
    warehouseId: number,
    currentQuantity: number,
    organizationId?: number
  ): Promise<void> {
    const product = await (await getDb())!.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) return;

    // Resolver alertas existentes si el stock es suficiente
    if (currentQuantity > product.reorderPoint) {
      await (await getDb())!.update(stockAlerts)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
        })
        .where(and(
          eq(stockAlerts.productId!, productId),
          eq(stockAlerts.warehouseId!, warehouseId),
          eq(stockAlerts.isResolved, false)
        ));
      return;
    }

    // Verificar si ya existe una alerta activa
    const existingAlert = await (await getDb())!.query.stockAlerts.findFirst({
      where: and(
        eq(stockAlerts.productId!, productId),
        eq(stockAlerts.warehouseId!, warehouseId),
        eq(stockAlerts.isResolved, false)
      ),
    });

    if (existingAlert) return;

    // Crear nueva alerta
    const alertType = currentQuantity === 0 ? 'out_of_stock' : 'low_stock';
    const message = currentQuantity === 0
      ? `Sin stock de ${product.name}`
      : `Stock bajo de ${product.name}: ${currentQuantity} unidades (mínimo: ${product.reorderPoint})`;

    await (await getDb())!.insert(stockAlerts).values({
      productId,
      warehouseId,
      alertType,
      currentQuantity: currentQuantity.toString(),
      thresholdQuantity: product.reorderPoint.toString(),
      message,
      organizationId,
    });
  }

  /**
   * Obtener alertas de stock activas
   */
  async getActiveAlerts(organizationId?: number): Promise<Array<typeof stockAlerts.$inferSelect & {
    product: typeof products.$inferSelect;
    warehouse: typeof warehouses.$inferSelect | null;
  }>> {
    return (await getDb())!.query.stockAlerts.findMany({
      where: and(
        eq(stockAlerts.isResolved, false),
        organizationId ? eq(stockAlerts.organizationId, organizationId) : undefined
      ),
      with: {
        product: true,
        warehouse: true,
      },
      orderBy: [desc(stockAlerts.createdAt)],
    });
  }

  /**
   * Marcar alerta como leída
   */
  async markAlertAsRead(alertId: number): Promise<void> {
    await (await getDb())!.update(stockAlerts)
      .set({ isRead: true })
      .where(eq(stockAlerts.id, alertId));
  }

  /**
   * Resolver alerta
   */
  async resolveAlert(alertId: number, userId?: number): Promise<void> {
    await (await getDb())!.update(stockAlerts)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      })
      .where(eq(stockAlerts.id, alertId));
  }

  /**
   * Determinar estado del stock
   */
  private getStockStatus(
    quantity: number,
    minStock: number,
    reorderPoint: number
  ): 'ok' | 'low' | 'critical' | 'out_of_stock' {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= minStock) return 'critical';
    if (quantity <= reorderPoint) return 'low';
    return 'ok';
  }

  /**
   * Obtener valoración del inventario
   */
  async getInventoryValuation(
    warehouseId?: number,
    organizationId?: number
  ): Promise<{
    totalValue: number;
    byCategory: Record<string, number>;
    byWarehouse: Array<{ warehouseId: number; warehouseName: string; value: number }>;
  }> {
    const conditions = [];
    if (warehouseId) {
      conditions.push(eq(warehouseStock.warehouseId!, warehouseId));
    }
    if (organizationId) {
      conditions.push(eq(products.organizationId, organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total
    const [totalResult] = await (await getDb())!.select({
      total: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
    })
      .from(warehouseStock)
      .innerJoin(products, eq(warehouseStock.productId!, products.id))
      .where(whereClause);

    // Por categoría
    const byCategoryResult = await (await getDb())!.select({
      category: products.category,
      value: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
    })
      .from(warehouseStock)
      .innerJoin(products, eq(warehouseStock.productId!, products.id))
      .where(whereClause)
      .groupBy(products.category);

    const byCategory: Record<string, number> = {};
    for (const row of byCategoryResult) {
      byCategory[row.category] = Number(row.value);
    }

    // Por almacén
    const byWarehouseResult = await (await getDb())!.select({
      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
      value: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
    })
      .from(warehouseStock)
      .innerJoin(warehouses, eq(warehouseStock.warehouseId!, warehouses.id))
      .innerJoin(products, eq(warehouseStock.productId!, products.id))
      .where(whereClause)
      .groupBy(warehouses.id, warehouses.name);

    return {
      totalValue: Number(totalResult.total),
      byCategory,
      byWarehouse: byWarehouseResult.map(r => ({
        warehouseId: r.warehouseId!,
        warehouseName: r.warehouseName,
        value: Number(r.value),
      })),
    };
  }
}

// Exportar instancia singleton
export const stockService = new StockService();
