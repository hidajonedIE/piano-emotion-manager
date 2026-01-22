/**
 * Servicio de Gestión de Almacenes
 * Piano Emotion Manager
 * 
 * Gestiona los almacenes: almacén central, talleres, vehículos de técnicos
 * y ubicaciones en consignación.
 */

import { eq, and, desc, asc, sql, isNull } from 'drizzle-orm';
import { db } from '../../db.js';
import {
  warehouses,
  warehouseStock,
  stockMovements,
  products,
  type WarehouseType,
  type ValuationMethod,
} from '../../../drizzle/inventory-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface CreateWarehouseInput {
  code: string;
  name: string;
  type?: WarehouseType;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  responsibleUserId?: number;
  isDefault?: boolean;
  allowNegativeStock?: boolean;
  valuationMethod?: ValuationMethod;
  organizationId?: number;
}

export interface UpdateWarehouseInput extends Partial<CreateWarehouseInput> {
  id: number;
}

export interface WarehouseWithStats {
  warehouse: typeof warehouses.$inferSelect;
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface WarehouseStockSummary {
  warehouseId: number;
  warehouseName: string;
  products: Array<{
    productId: number;
    productName: string;
    productSku: string;
    quantity: number;
    availableQuantity: number;
    totalValue: number;
    location?: string;
  }>;
  totalProducts: number;
  totalValue: number;
}

// ============================================================================
// Warehouse Service
// ============================================================================

export class WarehouseService {
  /**
   * Crear un nuevo almacén
   */
  async create(input: CreateWarehouseInput): Promise<typeof warehouses.$inferSelect> {
    // Verificar que el código no exista
    const existing = await getDb().query.warehouses.findFirst({
      where: and(
        eq(warehouses.code, input.code),
        input.organizationId 
          ? eq(warehouses.organizationId, input.organizationId)
          : isNull(warehouses.organizationId)
      ),
    });

    if (existing) {
      throw new Error(`Ya existe un almacén con el código: ${input.code}`);
    }

    // Si es el almacén por defecto, quitar el flag de otros
    if (input.isDefault) {
      await getDb().update(warehouses)
        .set({ isDefault: false })
        .where(input.organizationId 
          ? eq(warehouses.organizationId, input.organizationId)
          : isNull(warehouses.organizationId)
        );
    }

    const [warehouse] = await getDb().insert(warehouses).values({
      code: input.code,
      name: input.name,
      type: input.type || 'central',
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country || 'ES',
      latitude: input.latitude?.toString(),
      longitude: input.longitude?.toString(),
      responsibleUserId: input.responsibleUserId,
      isDefault: input.isDefault || false,
      allowNegativeStock: input.allowNegativeStock || false,
      valuationMethod: input.valuationMethod || 'average',
      organizationId: input.organizationId,
    });

    return warehouse;
  }

  /**
   * Actualizar un almacén existente
   */
  async update(input: UpdateWarehouseInput): Promise<typeof warehouses.$inferSelect> {
    const { id, ...updateData } = input;

    // Verificar que el almacén existe
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Almacén no encontrado: ${id}`);
    }

    // Si se cambia el código, verificar que no exista
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await getDb().query.warehouses.findFirst({
        where: and(
          eq(warehouses.code, updateData.code),
          existing.organizationId 
            ? eq(warehouses.organizationId, existing.organizationId)
            : isNull(warehouses.organizationId)
        ),
      });

      if (codeExists) {
        throw new Error(`Ya existe un almacén con el código: ${updateData.code}`);
      }
    }

    // Si se establece como por defecto, quitar el flag de otros
    if (updateData.isDefault) {
      await getDb().update(warehouses)
        .set({ isDefault: false })
        .where(and(
          existing.organizationId 
            ? eq(warehouses.organizationId, existing.organizationId)
            : isNull(warehouses.organizationId),
          sql`${warehouses.id} != ${id}`
        ));
    }

    const [updated] = await getDb().update(warehouses)
      .set({
        ...updateData,
        latitude: updateData.latitude?.toString(),
        longitude: updateData.longitude?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      ;

    return updated;
  }

  /**
   * Obtener almacén por ID
   */
  async getById(id: number): Promise<typeof warehouses.$inferSelect | null> {
    const warehouse = await getDb().query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });

    return warehouse || null;
  }

  /**
   * Obtener almacén por código
   */
  async getByCode(code: string, organizationId?: number): Promise<typeof warehouses.$inferSelect | null> {
    const warehouse = await getDb().query.warehouses.findFirst({
      where: and(
        eq(warehouses.code, code),
        organizationId 
          ? eq(warehouses.organizationId, organizationId)
          : isNull(warehouses.organizationId)
      ),
    });

    return warehouse || null;
  }

  /**
   * Obtener almacén por defecto
   */
  async getDefault(organizationId?: number): Promise<typeof warehouses.$inferSelect | null> {
    const warehouse = await getDb().query.warehouses.findFirst({
      where: and(
        eq(warehouses.isDefault, true),
        eq(warehouses.isActive, true),
        organizationId 
          ? eq(warehouses.organizationId, organizationId)
          : isNull(warehouses.organizationId)
      ),
    });

    return warehouse || null;
  }

  /**
   * Obtener todos los almacenes
   */
  async getAll(organizationId?: number, includeInactive: boolean = false): Promise<typeof warehouses.$inferSelect[]> {
    const conditions = [
      organizationId 
        ? eq(warehouses.organizationId, organizationId)
        : isNull(warehouses.organizationId)
    ];

    if (!includeInactive) {
      conditions.push(eq(warehouses.isActive, true));
    }

    return getDb().query.warehouses.findMany({
      where: and(...conditions),
      orderBy: [desc(warehouses.isDefault), asc(warehouses.name)],
    });
  }

  /**
   * Obtener almacenes por tipo
   */
  async getByType(type: WarehouseType, organizationId?: number): Promise<typeof warehouses.$inferSelect[]> {
    return getDb().query.warehouses.findMany({
      where: and(
        eq(warehouses.type, type),
        eq(warehouses.isActive, true),
        organizationId 
          ? eq(warehouses.organizationId, organizationId)
          : isNull(warehouses.organizationId)
      ),
      orderBy: [asc(warehouses.name)],
    });
  }

  /**
   * Obtener almacén (vehículo) de un técnico
   */
  async getTechnicianWarehouse(userId: number): Promise<typeof warehouses.$inferSelect | null> {
    const warehouse = await getDb().query.warehouses.findFirst({
      where: and(
        eq(warehouses.type, 'vehicle'),
        eq(warehouses.responsibleUserId, userId),
        eq(warehouses.isActive, true)
      ),
    });

    return warehouse || null;
  }

  /**
   * Obtener almacén con estadísticas
   */
  async getWithStats(id: number): Promise<WarehouseWithStats | null> {
    const warehouse = await this.getById(id);
    if (!warehouse) return null;

    const [stats] = await getDb().select({
      totalProducts: sql<number>`count(distinct ${warehouseStock.productId})`,
      totalValue: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
    })
      .from(warehouseStock)
      .where(eq(warehouseStock.warehouseId, id));

    // Productos con stock bajo
    const lowStockResult = await getDb().select({
      count: sql<number>`count(*)`,
    })
      .from(warehouseStock)
      .innerJoin(products, eq(warehouseStock.productId, products.id))
      .where(and(
        eq(warehouseStock.warehouseId, id),
        sql`${warehouseStock.quantity}::numeric <= ${products.reorderPoint}::numeric`,
        sql`${warehouseStock.quantity}::numeric > 0`
      ));

    // Productos sin stock
    const outOfStockResult = await getDb().select({
      count: sql<number>`count(*)`,
    })
      .from(warehouseStock)
      .where(and(
        eq(warehouseStock.warehouseId, id),
        sql`${warehouseStock.quantity}::numeric = 0`
      ));

    return {
      warehouse,
      totalProducts: Number(stats.totalProducts),
      totalValue: Number(stats.totalValue),
      lowStockProducts: Number(lowStockResult[0]?.count || 0),
      outOfStockProducts: Number(outOfStockResult[0]?.count || 0),
    };
  }

  /**
   * Obtener resumen de stock de un almacén
   */
  async getStockSummary(
    warehouseId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<WarehouseStockSummary> {
    const warehouse = await this.getById(warehouseId);
    if (!warehouse) {
      throw new Error(`Almacén no encontrado: ${warehouseId}`);
    }

    const offset = (page - 1) * pageSize;

    const stockData = await getDb().query.warehouseStock.findMany({
      where: eq(warehouseStock.warehouseId, warehouseId),
      with: {
        product: true,
      },
      limit: pageSize,
      offset,
      orderBy: [asc(products.name)],
    });

    const [totals] = await getDb().select({
      totalProducts: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
    })
      .from(warehouseStock)
      .where(eq(warehouseStock.warehouseId, warehouseId));

    return {
      warehouseId,
      warehouseName: warehouse.name,
      products: stockData.map(s => ({
        productId: s.productId,
        productName: s.product.name,
        productSku: s.product.sku,
        quantity: parseFloat(s.quantity),
        availableQuantity: parseFloat(s.availableQuantity),
        totalValue: parseFloat(s.totalCost),
        location: s.location || undefined,
      })),
      totalProducts: Number(totals.totalProducts),
      totalValue: Number(totals.totalValue),
    };
  }

  /**
   * Actualizar ubicación de un producto en el almacén
   */
  async updateProductLocation(
    warehouseId: number,
    productId: number,
    location: string
  ): Promise<void> {
    await getDb().update(warehouseStock)
      .set({ 
        location,
        updatedAt: new Date(),
      })
      .where(and(
        eq(warehouseStock.warehouseId, warehouseId),
        eq(warehouseStock.productId, productId)
      ));
  }

  /**
   * Desactivar almacén
   */
  async deactivate(id: number): Promise<void> {
    // Verificar que no tenga stock
    const [stockCheck] = await getDb().select({
      totalStock: sql<number>`coalesce(sum(${warehouseStock.quantity}::numeric), 0)`,
    })
      .from(warehouseStock)
      .where(eq(warehouseStock.warehouseId, id));

    if (Number(stockCheck.totalStock) > 0) {
      throw new Error('No se puede desactivar un almacén con stock. Transfiera el stock primero.');
    }

    await getDb().update(warehouses)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id));
  }

  /**
   * Reactivar almacén
   */
  async activate(id: number): Promise<void> {
    await getDb().update(warehouses)
      .set({ 
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id));
  }

  /**
   * Crear almacén de vehículo para un técnico
   */
  async createTechnicianVehicle(
    userId: number,
    technicianName: string,
    organizationId?: number
  ): Promise<typeof warehouses.$inferSelect> {
    // Verificar si ya tiene un vehículo
    const existing = await this.getTechnicianWarehouse(userId);
    if (existing) {
      throw new Error('El técnico ya tiene un almacén de vehículo asignado');
    }

    return this.create({
      code: `VEH-${userId}`,
      name: `Vehículo de ${technicianName}`,
      type: 'vehicle',
      responsibleUserId: userId,
      allowNegativeStock: false,
      organizationId,
    });
  }

  /**
   * Obtener almacenes cercanos a una ubicación
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    organizationId?: number
  ): Promise<Array<typeof warehouses.$inferSelect & { distanceKm: number }>> {
    // Fórmula de Haversine para calcular distancia
    const warehouseList = await this.getAll(organizationId);
    
    const withDistance = warehouseList
      .filter(w => w.latitude && w.longitude)
      .map(w => {
        const lat1 = latitude * Math.PI / 180;
        const lat2 = parseFloat(w.latitude!) * Math.PI / 180;
        const dLat = (parseFloat(w.latitude!) - latitude) * Math.PI / 180;
        const dLon = (parseFloat(w.longitude!) - longitude) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = 6371 * c; // Radio de la Tierra en km

        return { ...w, distanceKm };
      })
      .filter(w => w.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
  }

  /**
   * Obtener estadísticas de todos los almacenes
   */
  async getAllStats(organizationId?: number): Promise<{
    totalWarehouses: number;
    byType: Record<string, number>;
    totalInventoryValue: number;
    totalProducts: number;
  }> {
    const orgCondition = organizationId 
      ? eq(warehouses.organizationId, organizationId)
      : isNull(warehouses.organizationId);

    // Total de almacenes
    const [totals] = await getDb().select({
      total: sql<number>`count(*)`,
    })
      .from(warehouses)
      .where(and(orgCondition, eq(warehouses.isActive, true)));

    // Por tipo
    const byTypeResult = await getDb().select({
      type: warehouses.type,
      count: sql<number>`count(*)`,
    })
      .from(warehouses)
      .where(and(orgCondition, eq(warehouses.isActive, true)))
      .groupBy(warehouses.type);

    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.type] = Number(row.count);
    }

    // Valor total y productos
    const [inventoryStats] = await getDb().select({
      totalValue: sql<number>`coalesce(sum(${warehouseStock.totalCost}::numeric), 0)`,
      totalProducts: sql<number>`count(distinct ${warehouseStock.productId})`,
    })
      .from(warehouseStock)
      .innerJoin(warehouses, eq(warehouseStock.warehouseId, warehouses.id))
      .where(and(orgCondition, eq(warehouses.isActive, true)));

    return {
      totalWarehouses: Number(totals.total),
      byType,
      totalInventoryValue: Number(inventoryStats.totalValue),
      totalProducts: Number(inventoryStats.totalProducts),
    };
  }
}

// Exportar instancia singleton
export const warehouseService = new WarehouseService();
