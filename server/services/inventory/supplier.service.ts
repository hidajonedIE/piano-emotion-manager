/**
 * Servicio de Gestión de Proveedores
 * Piano Emotion Manager
 * 
 * Gestiona los proveedores de piezas de repuesto, herramientas y consumibles,
 * incluyendo órdenes de compra y relación de productos.
 */

import { eq, and, or, like, desc, asc, sql, isNull, inArray } from 'drizzle-orm';
import { getDb } from "../../db.js";

import {
  suppliers,
  supplierProducts,
  purchaseOrders,
  purchaseOrderLines,
  products,
  warehouses,
  type PurchaseOrderStatus,
} from '../../../drizzle/inventory-schema.js';
import { warehouseStock } from "../drizzle/inventory-schema.js";
import { stockService } from './stock.service.js';

// ============================================================================
// Types
// ============================================================================

export interface CreateSupplierInput {
  code: string;
  name: string;
  tradeName?: string;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  paymentTermsDays?: number;
  currency?: string;
  discountPercent?: number;
  minOrderAmount?: number;
  freeShippingAmount?: number;
  bankName?: string;
  bankAccount?: string;
  bankIban?: string;
  bankSwift?: string;
  productCategories?: string[];
  notes?: string;
  rating?: number;
  organizationId?: number;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: number;
}

export interface SupplierProductInput {
  supplierId: number;
  productId: number;
  supplierSku?: string;
  supplierProductName?: string;
  unitCost: number;
  currency?: string;
  minOrderQuantity?: number;
  packSize?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
}

export interface CreatePurchaseOrderInput {
  supplierId: number;
  warehouseId: number;
  expectedDeliveryDate?: Date;
  notes?: string;
  internalNotes?: string;
  lines: Array<{
    productId: number;
    quantity: number;
    unitCost: number;
    taxRate?: number;
    discountPercent?: number;
    notes?: string;
  }>;
  createdByUserId?: number;
  organizationId?: number;
}

export interface ReceivePurchaseOrderInput {
  purchaseOrderId: number;
  lines: Array<{
    lineId: number;
    receivedQuantity: number;
    batchNumber?: string;
    expirationDate?: Date;
  }>;
  userId?: number;
}

// ============================================================================
// Supplier Service
// ============================================================================

export class SupplierService {
  /**
   * Crear un nuevo proveedor
   */
  async create(input: CreateSupplierInput): Promise<typeof suppliers.$inferSelect> {
    // Verificar que el código no exista
    const existing = await (await getDb())!.query.suppliers.findFirst({
      where: and(
        eq(suppliers.code, input.code),
        input.organizationId 
          ? eq(suppliers.organizationId, input.organizationId)
          : isNull(suppliers.organizationId)
      ),
    });

    if (existing) {
      throw new Error(`Ya existe un proveedor con el código: ${input.code}`);
    }

    const [supplier] = await (await getDb())!.insert(suppliers).values({
      code: input.code,
      name: input.name,
      tradeName: input.tradeName,
      taxId: input.taxId,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      website: input.website,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country || 'ES',
      paymentTermsDays: input.paymentTermsDays || 30,
      currency: input.currency || 'EUR',
      discountPercent: input.discountPercent?.toString(),
      minOrderAmount: input.minOrderAmount?.toString(),
      freeShippingAmount: input.freeShippingAmount?.toString(),
      bankName: input.bankName,
      bankAccount: input.bankAccount,
      bankIban: input.bankIban,
      bankSwift: input.bankSwift,
      productCategories: input.productCategories,
      notes: input.notes,
      rating: input.rating,
      organizationId: input.organizationId,
    });

    return supplier;
  }

  /**
   * Actualizar un proveedor existente
   */
  async update(input: UpdateSupplierInput): Promise<typeof suppliers.$inferSelect> {
    const { id, ...updateData } = input;

    const [updated] = await (await getDb())!.update(suppliers)
      .set({
        ...updateData,
        discountPercent: updateData.discountPercent?.toString(),
        minOrderAmount: updateData.minOrderAmount?.toString(),
        freeShippingAmount: updateData.freeShippingAmount?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      ;

    return updated;
  }

  /**
   * Obtener proveedor por ID
   */
  async getById(id: number): Promise<typeof suppliers.$inferSelect | null> {
    const supplier = await (await getDb())!.query.suppliers.findFirst({
      where: eq(suppliers.id, id),
    });

    return supplier || null;
  }

  /**
   * Buscar proveedores
   */
  async search(
    filters: {
      search?: string;
      isActive?: boolean;
      country?: string;
      organizationId?: number;
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    suppliers: typeof suppliers.$inferSelect[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const conditions = [];

    if (filters.organizationId) {
      conditions.push(eq(suppliers.organizationId, filters.organizationId));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(suppliers.name, searchTerm),
          like(suppliers.code, searchTerm),
          like(suppliers.tradeName, searchTerm),
          like(suppliers.contactName, searchTerm)
        )!
      );
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(suppliers.isActive, filters.isActive));
    }

    if (filters.country) {
      conditions.push(eq(suppliers.country, filters.country));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await (await getDb())!.select({ count: sql<number>`count(*)` })
      .from(suppliers)
      .where(whereClause);

    const total = Number(count);
    const offset = (page - 1) * pageSize;

    const supplierList = await (await getDb())!.query.suppliers.findMany({
      where: whereClause,
      limit: pageSize,
      offset,
      orderBy: [asc(suppliers.name)],
    });

    return {
      suppliers: supplierList,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Obtener todos los proveedores activos
   */
  async getAll(organizationId?: number): Promise<typeof suppliers.$inferSelect[]> {
    return (await getDb())!.query.suppliers.findMany({
      where: and(
        eq(suppliers.isActive, true),
        organizationId 
          ? eq(suppliers.organizationId, organizationId)
          : isNull(suppliers.organizationId)
      ),
      orderBy: [asc(suppliers.name)],
    });
  }

  /**
   * Desactivar proveedor
   */
  async deactivate(id: number): Promise<void> {
    await (await getDb())!.update(suppliers)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id));
  }

  // ==========================================================================
  // Productos de Proveedor
  // ==========================================================================

  /**
   * Añadir producto a proveedor
   */
  async addProduct(input: SupplierProductInput): Promise<typeof supplierProducts.$inferSelect> {
    // Verificar que no exista ya
    const existing = await (await getDb())!.query.supplierProducts.findFirst({
      where: and(
        eq(supplierProducts.supplierId, input.supplierId),
        eq(supplierProducts.productId, input.productId)
      ),
    });

    if (existing) {
      throw new Error('Este producto ya está asociado al proveedor');
    }

    // Si es preferido, quitar el flag de otros
    if (input.isPreferred) {
      await (await getDb())!.update(supplierProducts)
        .set({ isPreferred: false })
        .where(eq(supplierProducts.productId, input.productId));
    }

    const [supplierProduct] = await (await getDb())!.insert(supplierProducts).values({
      supplierId: input.supplierId,
      productId: input.productId,
      supplierSku: input.supplierSku,
      supplierProductName: input.supplierProductName,
      unitCost: input.unitCost.toString(),
      currency: input.currency || 'EUR',
      minOrderQuantity: input.minOrderQuantity || 1,
      packSize: input.packSize || 1,
      leadTimeDays: input.leadTimeDays,
      isPreferred: input.isPreferred || false,
    });

    return supplierProduct;
  }

  /**
   * Actualizar producto de proveedor
   */
  async updateProduct(
    id: number,
    input: Partial<SupplierProductInput>
  ): Promise<typeof supplierProducts.$inferSelect> {
    const [updated] = await (await getDb())!.update(supplierProducts)
      .set({
        supplierSku: input.supplierSku,
        supplierProductName: input.supplierProductName,
        unitCost: input.unitCost?.toString(),
        currency: input.currency,
        minOrderQuantity: input.minOrderQuantity,
        packSize: input.packSize,
        leadTimeDays: input.leadTimeDays,
        isPreferred: input.isPreferred,
        updatedAt: new Date(),
      })
      .where(eq(supplierProducts.id, id))
      ;

    return updated;
  }

  /**
   * Obtener productos de un proveedor
   */
  async getProducts(supplierId: number): Promise<Array<typeof supplierProducts.$inferSelect & {
    product: typeof products.$inferSelect;
  }>> {
    return (await getDb())!.query.supplierProducts.findMany({
      where: and(
        eq(supplierProducts.supplierId, supplierId),
        eq(supplierProducts.isActive, true)
      ),
      with: {
        product: true,
      },
      orderBy: [asc(products.name)],
    });
  }

  /**
   * Obtener proveedores de un producto
   */
  async getProductSuppliers(productId: number): Promise<Array<typeof supplierProducts.$inferSelect & {
    supplier: typeof suppliers.$inferSelect;
  }>> {
    return (await getDb())!.query.supplierProducts.findMany({
      where: and(
        eq(supplierProducts.productId, productId),
        eq(supplierProducts.isActive, true)
      ),
      with: {
        supplier: true,
      },
      orderBy: [desc(supplierProducts.isPreferred), asc(supplierProducts.unitCost)],
    });
  }

  /**
   * Obtener proveedor preferido de un producto
   */
  async getPreferredSupplier(productId: number): Promise<typeof supplierProducts.$inferSelect & {
    supplier: typeof suppliers.$inferSelect;
  } | null> {
    const preferred = await (await getDb())!.query.supplierProducts.findFirst({
      where: and(
        eq(supplierProducts.productId, productId),
        eq(supplierProducts.isPreferred, true),
        eq(supplierProducts.isActive, true)
      ),
      with: {
        supplier: true,
      },
    });

    return preferred || null;
  }

  // ==========================================================================
  // Órdenes de Compra
  // ==========================================================================

  /**
   * Crear orden de compra
   */
  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<typeof purchaseOrders.$inferSelect> {
    // Generar número de orden
    const orderNumber = await this.generateOrderNumber(input.organizationId);

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;

    const linesWithTotals = input.lines.map(line => {
      const lineSubtotal = line.quantity * line.unitCost;
      const discount = lineSubtotal * ((line.discountPercent || 0) / 100);
      const lineNet = lineSubtotal - discount;
      const lineTax = lineNet * ((line.taxRate || 21) / 100);
      const lineTotal = lineNet + lineTax;

      subtotal += lineNet;
      taxAmount += lineTax;

      return {
        ...line,
        lineTotal,
      };
    });

    const totalAmount = subtotal + taxAmount;

    // Crear orden
    const [order] = await (await getDb())!.insert(purchaseOrders).values({
      orderNumber,
      supplierId: input.supplierId,
      warehouseId: input.warehouseId,
      status: 'draft',
      expectedDeliveryDate: input.expectedDeliveryDate,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      notes: input.notes,
      internalNotes: input.internalNotes,
      createdByUserId: input.createdByUserId,
      organizationId: input.organizationId,
    });

    // Crear líneas
    for (const line of linesWithTotals) {
      await (await getDb())!.insert(purchaseOrderLines).values({
        purchaseOrderId: order.id,
        productId: line.productId,
        orderedQuantity: line.quantity.toString(),
        unitCost: line.unitCost.toString(),
        taxRate: (line.taxRate || 21).toString(),
        discountPercent: (line.discountPercent || 0).toString(),
        lineTotal: line.lineTotal.toString(),
        notes: line.notes,
      });
    }

    return order;
  }

  /**
   * Generar número de orden secuencial
   */
  private async generateOrderNumber(organizationId?: number): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}`;

    const [lastOrder] = await (await getDb())!.select({
      orderNumber: purchaseOrders.orderNumber,
    })
      .from(purchaseOrders)
      .where(and(
        like(purchaseOrders.orderNumber, `${prefix}%`),
        organizationId 
          ? eq(purchaseOrders.organizationId, organizationId)
          : isNull(purchaseOrders.organizationId)
      ))
      .orderBy(desc(purchaseOrders.orderNumber))
      .limit(1);

    let nextNumber = 1;
    if (lastOrder) {
      const lastNum = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
      nextNumber = lastNum + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Actualizar estado de orden de compra
   */
  async updateOrderStatus(
    orderId: number,
    status: PurchaseOrderStatus,
    userId?: number
  ): Promise<typeof purchaseOrders.$inferSelect> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'ordered') {
      updateData.orderDate = new Date();
    }

    if (status === 'approved') {
      updateData.approvedByUserId = userId;
    }

    const [updated] = await (await getDb())!.update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, orderId))
      ;

    return updated;
  }

  /**
   * Recibir productos de una orden de compra
   */
  async receivePurchaseOrder(input: ReceivePurchaseOrderInput): Promise<void> {
    const order = await (await getDb())!.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, input.purchaseOrderId),
      with: {
        lines: true,
      },
    });

    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    if (!['ordered', 'partial'].includes(order.status)) {
      throw new Error('La orden no está en estado para recibir productos');
    }

    let allReceived = true;

    for (const lineInput of input.lines) {
      const line = order.lines.find(l => l.id === lineInput.lineId);
      if (!line) continue;

      const newReceivedQty = parseFloat(line.receivedQuantity) + lineInput.receivedQuantity;
      const orderedQty = parseFloat(line.orderedQuantity);

      if (newReceivedQty > orderedQty) {
        throw new Error(`Cantidad recibida excede la cantidad ordenada para el producto`);
      }

      // Actualizar línea
      await (await getDb())!.update(purchaseOrderLines)
        .set({
          receivedQuantity: newReceivedQty.toString(),
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrderLines.id, line.id));

      // Registrar entrada de stock
      await stockService.recordPurchase(
        order.id,
        line.productId,
        order.warehouseId,
        lineInput.receivedQuantity,
        parseFloat(line.unitCost),
        lineInput.batchNumber,
        lineInput.expirationDate,
        input.userId,
        order.organizationId || undefined
      );

      if (newReceivedQty < orderedQty) {
        allReceived = false;
      }
    }

    // Actualizar estado de la orden
    const newStatus: PurchaseOrderStatus = allReceived ? 'received' : 'partial';
    await this.updateOrderStatus(order.id, newStatus);

    if (allReceived) {
      await (await getDb())!.update(purchaseOrders)
        .set({ actualDeliveryDate: new Date() })
        .where(eq(purchaseOrders.id, order.id));
    }
  }

  /**
   * Obtener orden de compra por ID
   */
  async getPurchaseOrder(id: number): Promise<typeof purchaseOrders.$inferSelect & {
    supplier: typeof suppliers.$inferSelect;
    warehouse: typeof warehouses.$inferSelect;
    lines: Array<typeof purchaseOrderLines.$inferSelect & {
      product: typeof products.$inferSelect;
    }>;
  } | null> {
    const order = await (await getDb())!.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
      with: {
        supplier: true,
        warehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    return order || null;
  }

  /**
   * Buscar órdenes de compra
   */
  async searchPurchaseOrders(
    filters: {
      supplierId?: number;
      warehouseId?: number;
      status?: PurchaseOrderStatus;
      dateFrom?: Date;
      dateTo?: Date;
      organizationId?: number;
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    orders: Array<typeof purchaseOrders.$inferSelect & {
      supplier: typeof suppliers.$inferSelect;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const conditions = [];

    if (filters.supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, filters.supplierId));
    }
    if (filters.warehouseId) {
      conditions.push(eq(purchaseOrders.warehouseId, filters.warehouseId));
    }
    if (filters.status) {
      conditions.push(eq(purchaseOrders.status, filters.status));
    }
    if (filters.organizationId) {
      conditions.push(eq(purchaseOrders.organizationId, filters.organizationId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await (await getDb())!.select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
      .where(whereClause);

    const total = Number(count);
    const offset = (page - 1) * pageSize;

    const orders = await (await getDb())!.query.purchaseOrders.findMany({
      where: whereClause,
      with: {
        supplier: true,
      },
      limit: pageSize,
      offset,
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    return {
      orders,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Cancelar orden de compra
   */
  async cancelPurchaseOrder(orderId: number): Promise<void> {
    const order = await (await getDb())!.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, orderId),
    });

    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    if (['received', 'cancelled'].includes(order.status)) {
      throw new Error('No se puede cancelar una orden recibida o ya cancelada');
    }

    await this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Generar sugerencia de reposición
   */
  async generateReorderSuggestions(organizationId?: number): Promise<Array<{
    product: typeof products.$inferSelect;
    currentStock: number;
    reorderPoint: number;
    suggestedQuantity: number;
    preferredSupplier: typeof suppliers.$inferSelect | null;
    estimatedCost: number;
  }>> {
    // Obtener productos con stock bajo
    const lowStockProducts = await (await getDb())!.select({
      product: products,
      totalStock: sql<number>`coalesce(sum(${warehouseStock.quantity}::numeric), 0)`,
    })
      .from(products)
      .leftJoin(warehouseStock, eq(products.id, warehouseStock.productId))
      .where(and(
        eq(products.isActive, true),
        organizationId 
          ? eq(products.organizationId, organizationId)
          : isNull(products.organizationId)
      ))
      .groupBy(products.id)
      .having(sql`coalesce(sum(${warehouseStock.quantity}::numeric), 0) <= ${products.reorderPoint}`);

    const suggestions = [];

    for (const item of lowStockProducts) {
      const currentStock = Number(item.totalStock);
      const suggestedQuantity = item.product.reorderQuantity || 
        (item.product.maxStock ? item.product.maxStock - currentStock : item.product.reorderPoint * 2);

      // Obtener proveedor preferido
      const preferred = await this.getPreferredSupplier(item.product.id);
      const estimatedCost = preferred 
        ? suggestedQuantity * parseFloat(preferred.unitCost)
        : suggestedQuantity * parseFloat(item.product.costPrice);

      suggestions.push({
        product: item.product,
        currentStock,
        reorderPoint: item.product.reorderPoint,
        suggestedQuantity,
        preferredSupplier: preferred?.supplier || null,
        estimatedCost,
      });
    }

    return suggestions;
  }
}

// Exportar instancia singleton
export const supplierService = new SupplierService();
