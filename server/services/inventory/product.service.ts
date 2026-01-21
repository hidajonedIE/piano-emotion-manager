/**
 * Servicio de Gestión de Productos
 * Piano Emotion Manager
 * 
 * Gestiona el catálogo de productos: piezas de repuesto, herramientas,
 * consumibles y accesorios para pianos.
 */

import { eq, and, or, like, desc, asc, sql, inArray, isNull } from 'drizzle-orm';
import { db } from '../../getDb().js';
import {
  products,
  warehouseStock,
  supplierProducts,
  stockAlerts,
  type ProductType,
  type ProductCategory,
} from '../../../drizzle/inventory-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface CreateProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  type?: ProductType;
  category?: ProductCategory;
  brand?: string;
  model?: string;
  costPrice: number;
  salePrice: number;
  currency?: string;
  taxRate?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  unitOfMeasure?: string;
  unitsPerPackage?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  primarySupplierId?: number;
  supplierSku?: string;
  leadTimeDays?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  documentUrls?: string[];
  compatibleBrands?: string[];
  compatibleModels?: string[];
  notes?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  isSerialTracked?: boolean;
  isBatchTracked?: boolean;
  organizationId?: number;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export interface ProductFilters {
  search?: string;
  type?: ProductType;
  category?: ProductCategory;
  brand?: string;
  supplierId?: number;
  isActive?: boolean;
  hasLowStock?: boolean;
  tags?: string[];
  organizationId?: number;
}

export interface ProductWithStock {
  product: typeof products.$inferSelect;
  totalStock: number;
  availableStock: number;
  stockByWarehouse: Array<{
    warehouseId: number;
    warehouseName: string;
    quantity: number;
    availableQuantity: number;
  }>;
}

export interface ProductSearchResult {
  products: ProductWithStock[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Product Service
// ============================================================================

export class ProductService {
  /**
   * Crear un nuevo producto
   */
  async create(input: CreateProductInput): Promise<typeof products.$inferSelect> {
    // Verificar que el SKU no exista
    const existing = await getDb().query.products.findFirst({
      where: and(
        eq(products.sku, input.sku),
        input.organizationId 
          ? eq(products.organizationId, input.organizationId)
          : isNull(products.organizationId)
      ),
    });

    if (existing) {
      throw new Error(`Ya existe un producto con el SKU: ${input.sku}`);
    }

    const [product] = await getDb().insert(products).values({
      sku: input.sku,
      barcode: input.barcode,
      name: input.name,
      description: input.description,
      type: input.type || 'spare_part',
      category: input.category || 'other',
      brand: input.brand,
      model: input.model,
      costPrice: input.costPrice.toString(),
      salePrice: input.salePrice.toString(),
      currency: input.currency || 'EUR',
      taxRate: (input.taxRate || 21).toString(),
      minStock: input.minStock || 0,
      maxStock: input.maxStock,
      reorderPoint: input.reorderPoint || 5,
      reorderQuantity: input.reorderQuantity || 10,
      unitOfMeasure: input.unitOfMeasure || 'unit',
      unitsPerPackage: input.unitsPerPackage || 1,
      weight: input.weight?.toString(),
      length: input.length?.toString(),
      width: input.width?.toString(),
      height: input.height?.toString(),
      primarySupplierId: input.primarySupplierId,
      supplierSku: input.supplierSku,
      leadTimeDays: input.leadTimeDays,
      imageUrl: input.imageUrl,
      thumbnailUrl: input.thumbnailUrl,
      documentUrls: input.documentUrls,
      compatibleBrands: input.compatibleBrands,
      compatibleModels: input.compatibleModels,
      notes: input.notes,
      tags: input.tags,
      customFields: input.customFields,
      isSerialTracked: input.isSerialTracked || false,
      isBatchTracked: input.isBatchTracked || false,
      organizationId: input.organizationId,
    }).returning();

    return product;
  }

  /**
   * Actualizar un producto existente
   */
  async update(input: UpdateProductInput): Promise<typeof products.$inferSelect> {
    const { id, ...updateData } = input;

    // Verificar que el producto existe
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Producto no encontrado: ${id}`);
    }

    // Si se cambia el SKU, verificar que no exista
    if (updateData.sku && updateData.sku !== existing.sku) {
      const skuExists = await getDb().query.products.findFirst({
        where: and(
          eq(products.sku, updateData.sku),
          existing.organizationId 
            ? eq(products.organizationId, existing.organizationId)
            : isNull(products.organizationId)
        ),
      });

      if (skuExists) {
        throw new Error(`Ya existe un producto con el SKU: ${updateData.sku}`);
      }
    }

    const [updated] = await getDb().update(products)
      .set({
        ...updateData,
        costPrice: updateData.costPrice?.toString(),
        salePrice: updateData.salePrice?.toString(),
        taxRate: updateData.taxRate?.toString(),
        weight: updateData.weight?.toString(),
        length: updateData.length?.toString(),
        width: updateData.width?.toString(),
        height: updateData.height?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  /**
   * Obtener producto por ID
   */
  async getById(id: number): Promise<typeof products.$inferSelect | null> {
    const product = await getDb().query.products.findFirst({
      where: and(
        eq(products.id, id),
        isNull(products.deletedAt)
      ),
    });

    return product || null;
  }

  /**
   * Obtener producto por SKU
   */
  async getBySku(sku: string, organizationId?: number): Promise<typeof products.$inferSelect | null> {
    const product = await getDb().query.products.findFirst({
      where: and(
        eq(products.sku, sku),
        organizationId 
          ? eq(products.organizationId, organizationId)
          : isNull(products.organizationId),
        isNull(products.deletedAt)
      ),
    });

    return product || null;
  }

  /**
   * Obtener producto por código de barras
   */
  async getByBarcode(barcode: string, organizationId?: number): Promise<typeof products.$inferSelect | null> {
    const product = await getDb().query.products.findFirst({
      where: and(
        eq(products.barcode, barcode),
        organizationId 
          ? eq(products.organizationId, organizationId)
          : isNull(products.organizationId),
        isNull(products.deletedAt)
      ),
    });

    return product || null;
  }

  /**
   * Obtener producto con información de stock
   */
  async getWithStock(id: number): Promise<ProductWithStock | null> {
    const product = await this.getById(id);
    if (!product) return null;

    const stockData = await getDb().query.warehouseStock.findMany({
      where: eq(warehouseStock.productId, id),
      with: {
        warehouse: true,
      },
    });

    let totalStock = 0;
    let availableStock = 0;
    const stockByWarehouse = stockData.map(s => {
      const qty = parseFloat(s.quantity);
      const availQty = parseFloat(s.availableQuantity);
      totalStock += qty;
      availableStock += availQty;
      return {
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        quantity: qty,
        availableQuantity: availQty,
      };
    });

    return {
      product,
      totalStock,
      availableStock,
      stockByWarehouse,
    };
  }

  /**
   * Buscar productos con filtros y paginación
   */
  async search(
    filters: ProductFilters,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<ProductSearchResult> {
    const conditions = [isNull(products.deletedAt)];

    // Filtro por organización
    if (filters.organizationId) {
      conditions.push(eq(products.organizationId, filters.organizationId));
    }

    // Búsqueda por texto
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(products.name, searchTerm),
          like(products.sku, searchTerm),
          like(products.barcode, searchTerm),
          like(products.description, searchTerm),
          like(products.brand, searchTerm)
        )!
      );
    }

    // Filtro por tipo
    if (filters.type) {
      conditions.push(eq(products.type, filters.type));
    }

    // Filtro por categoría
    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }

    // Filtro por marca
    if (filters.brand) {
      conditions.push(eq(products.brand, filters.brand));
    }

    // Filtro por estado activo
    if (filters.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }

    // Contar total
    const [{ count }] = await getDb().select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));

    const total = Number(count);
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Obtener productos
    const orderColumn = products[sortBy as keyof typeof products] || products.name;
    const orderFn = sortOrder === 'desc' ? desc : asc;

    const productList = await getDb().query.products.findMany({
      where: and(...conditions),
      limit: pageSize,
      offset,
      orderBy: [orderFn(orderColumn as any)],
    });

    // Obtener stock para cada producto
    const productIds = productList.map(p => p.id);
    const stockData = productIds.length > 0 
      ? await getDb().query.warehouseStock.findMany({
          where: inArray(warehouseStock.productId, productIds),
          with: {
            warehouse: true,
          },
        })
      : [];

    // Agrupar stock por producto
    const stockByProduct = new Map<number, typeof stockData>();
    for (const stock of stockData) {
      const existing = stockByProduct.get(stock.productId) || [];
      existing.push(stock);
      stockByProduct.set(stock.productId, existing);
    }

    // Combinar productos con stock
    const productsWithStock: ProductWithStock[] = productList.map(product => {
      const productStock = stockByProduct.get(product.id) || [];
      let totalStock = 0;
      let availableStock = 0;
      const stockByWarehouse = productStock.map(s => {
        const qty = parseFloat(s.quantity);
        const availQty = parseFloat(s.availableQuantity);
        totalStock += qty;
        availableStock += availQty;
        return {
          warehouseId: s.warehouseId,
          warehouseName: s.warehouse.name,
          quantity: qty,
          availableQuantity: availQty,
        };
      });

      return {
        product,
        totalStock,
        availableStock,
        stockByWarehouse,
      };
    });

    // Filtrar por stock bajo si es necesario
    let finalProducts = productsWithStock;
    if (filters.hasLowStock) {
      finalProducts = productsWithStock.filter(p => 
        p.totalStock <= p.product.reorderPoint
      );
    }

    return {
      products: finalProducts,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Obtener productos con stock bajo
   */
  async getLowStockProducts(organizationId?: number): Promise<ProductWithStock[]> {
    const result = await this.search(
      { organizationId, hasLowStock: true, isActive: true },
      1,
      1000
    );
    return result.products;
  }

  /**
   * Obtener productos por categoría
   */
  async getByCategory(
    category: ProductCategory,
    organizationId?: number
  ): Promise<typeof products.$inferSelect[]> {
    return getDb().query.products.findMany({
      where: and(
        eq(products.category, category),
        eq(products.isActive, true),
        organizationId 
          ? eq(products.organizationId, organizationId)
          : isNull(products.organizationId),
        isNull(products.deletedAt)
      ),
      orderBy: [asc(products.name)],
    });
  }

  /**
   * Obtener marcas únicas
   */
  async getBrands(organizationId?: number): Promise<string[]> {
    const result = await getDb().selectDistinct({ brand: products.brand })
      .from(products)
      .where(and(
        eq(products.isActive, true),
        organizationId 
          ? eq(products.organizationId, organizationId)
          : isNull(products.organizationId),
        isNull(products.deletedAt)
      ))
      .orderBy(asc(products.brand));

    return result
      .map(r => r.brand)
      .filter((b): b is string => b !== null);
  }

  /**
   * Desactivar producto (soft delete)
   */
  async deactivate(id: number): Promise<void> {
    await getDb().update(products)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  /**
   * Eliminar producto (soft delete)
   */
  async delete(id: number): Promise<void> {
    await getDb().update(products)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  /**
   * Restaurar producto eliminado
   */
  async restore(id: number): Promise<void> {
    await getDb().update(products)
      .set({ 
        deletedAt: null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  /**
   * Duplicar producto
   */
  async duplicate(id: number, newSku: string): Promise<typeof products.$inferSelect> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error(`Producto no encontrado: ${id}`);
    }

    const { id: _, sku: __, createdAt, updatedAt, deletedAt, ...productData } = original;

    return this.create({
      ...productData,
      sku: newSku,
      name: `${original.name} (copia)`,
      costPrice: parseFloat(original.costPrice),
      salePrice: parseFloat(original.salePrice),
      taxRate: parseFloat(original.taxRate),
      weight: original.weight ? parseFloat(original.weight) : undefined,
      length: original.length ? parseFloat(original.length) : undefined,
      width: original.width ? parseFloat(original.width) : undefined,
      height: original.height ? parseFloat(original.height) : undefined,
    });
  }

  /**
   * Importar productos desde CSV/Excel
   */
  async bulkCreate(
    productsData: CreateProductInput[]
  ): Promise<{ created: number; errors: Array<{ row: number; error: string }> }> {
    const errors: Array<{ row: number; error: string }> = [];
    let created = 0;

    for (let i = 0; i < productsData.length; i++) {
      try {
        await this.create(productsData[i]);
        created++;
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return { created, errors };
  }

  /**
   * Actualizar precios en masa
   */
  async bulkUpdatePrices(
    updates: Array<{ id: number; costPrice?: number; salePrice?: number }>
  ): Promise<number> {
    let updated = 0;

    for (const update of updates) {
      const setData: Record<string, unknown> = { updatedAt: new Date() };
      
      if (update.costPrice !== undefined) {
        setData.costPrice = update.costPrice.toString();
      }
      if (update.salePrice !== undefined) {
        setData.salePrice = update.salePrice.toString();
      }

      await getDb().update(products)
        .set(setData)
        .where(eq(products.id, update.id));
      
      updated++;
    }

    return updated;
  }

  /**
   * Obtener estadísticas de productos
   */
  async getStatistics(organizationId?: number): Promise<{
    totalProducts: number;
    activeProducts: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
  }> {
    const orgCondition = organizationId 
      ? eq(products.organizationId, organizationId)
      : isNull(products.organizationId);

    // Total y activos
    const [totals] = await getDb().select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${products.isActive} = true)`,
    })
      .from(products)
      .where(and(orgCondition, isNull(products.deletedAt)));

    // Por tipo
    const byTypeResult = await getDb().select({
      type: products.type,
      count: sql<number>`count(*)`,
    })
      .from(products)
      .where(and(orgCondition, isNull(products.deletedAt)))
      .groupBy(products.type);

    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.type] = Number(row.count);
    }

    // Por categoría
    const byCategoryResult = await getDb().select({
      category: products.category,
      count: sql<number>`count(*)`,
    })
      .from(products)
      .where(and(orgCondition, isNull(products.deletedAt)))
      .groupBy(products.category);

    const byCategory: Record<string, number> = {};
    for (const row of byCategoryResult) {
      byCategory[row.category] = Number(row.count);
    }

    // Stock bajo y sin stock
    const stockStats = await getDb().select({
      lowStock: sql<number>`count(*) filter (where ${warehouseStock.quantity}::numeric <= ${products.reorderPoint}::numeric and ${warehouseStock.quantity}::numeric > 0)`,
      outOfStock: sql<number>`count(*) filter (where ${warehouseStock.quantity}::numeric = 0)`,
      totalValue: sql<number>`sum(${warehouseStock.totalCost}::numeric)`,
    })
      .from(warehouseStock)
      .innerJoin(products, eq(warehouseStock.productId, products.id))
      .where(and(orgCondition, isNull(products.deletedAt)));

    return {
      totalProducts: Number(totals.total),
      activeProducts: Number(totals.active),
      byType,
      byCategory,
      lowStockCount: Number(stockStats[0]?.lowStock || 0),
      outOfStockCount: Number(stockStats[0]?.outOfStock || 0),
      totalInventoryValue: Number(stockStats[0]?.totalValue || 0),
    };
  }
}

// Exportar instancia singleton
export const productService = new ProductService();
