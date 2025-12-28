/**
 * Inventory Router
 * Gestión de inventario con integración de servicios, lotes y alertas de stock
 */
import { z } from "zod";
import { protectedProcedure, router } from "../.core/trpc.js";
import * as db from "../db.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Categorías de inventario
 */
const inventoryCategorySchema = z.enum([
  "strings",        // Cuerdas
  "hammers",        // Martillos
  "dampers",        // Apagadores
  "keys",           // Teclas
  "action_parts",   // Piezas del mecanismo
  "pedals",         // Pedales
  "tuning_pins",    // Clavijas
  "felts",          // Fieltros
  "tools",          // Herramientas
  "chemicals",      // Productos químicos
  "wood",           // Madera
  "hardware",       // Tornillería
  "electronics",    // Electrónica (para pianos digitales)
  "consumables",    // Consumibles
  "other",          // Otros
]);

/**
 * Unidades de medida
 */
const unitSchema = z.enum([
  "units",    // Unidades
  "meters",   // Metros
  "kg",       // Kilogramos
  "grams",    // Gramos
  "liters",   // Litros
  "ml",       // Mililitros
  "sets",     // Juegos/Sets
  "pairs",    // Pares
  "boxes",    // Cajas
  "rolls",    // Rollos
]);

/**
 * Esquema de movimiento de stock
 */
const stockMovementSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["in", "out", "adjustment", "return", "transfer"]),
  quantity: z.number(),
  reason: z.string().max(500).optional(),
  serviceId: z.number().optional(), // Referencia al servicio si aplica
  supplierId: z.string().optional(),
  lotNumber: z.string().optional(),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Esquema de lote
 */
const lotSchema = z.object({
  id: z.string(),
  lotNumber: z.string().min(1).max(100),
  quantity: z.number().min(0),
  purchaseDate: z.string().or(z.date()),
  expirationDate: z.string().or(z.date()).optional(),
  costPerUnit: z.number().min(0),
  supplier: z.string().max(255).optional(),
  invoiceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Esquema de proveedor
 */
const supplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  contactName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  isPreferred: z.boolean().default(false),
});

/**
 * Esquema de paginación
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "category", "quantity", "minStock", "costPerUnit", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  category: inventoryCategorySchema.optional(),
  lowStock: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
});

/**
 * Esquema base de item de inventario
 */
const inventoryItemBaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  sku: z.string().max(50).optional(), // Código de referencia
  barcode: z.string().max(100).optional(), // Código de barras
  category: inventoryCategorySchema,
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().min(0).default(0),
  unit: unitSchema.default("units"),
  minStock: z.number().min(0).default(0), // Stock mínimo para alertas
  maxStock: z.number().min(0).optional(), // Stock máximo recomendado
  reorderPoint: z.number().min(0).optional(), // Punto de reorden
  reorderQuantity: z.number().min(0).optional(), // Cantidad a pedir
  costPerUnit: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).optional(), // Precio de venta
  supplier: z.string().max(255).optional().nullable(),
  supplierPartNumber: z.string().max(100).optional(), // Referencia del proveedor
  location: z.string().max(255).optional(), // Ubicación en almacén
  photo: z.string().url().optional(),
  notes: z.string().max(2000).optional().nullable(),
  // Campos para trazabilidad
  trackLots: z.boolean().default(false), // Seguimiento por lotes
  trackExpiration: z.boolean().default(false), // Seguimiento de caducidad
  lots: z.array(lotSchema).optional(),
  // Historial de movimientos
  movements: z.array(stockMovementSchema).optional(),
  // Compatibilidad con pianos
  compatibleBrands: z.array(z.string()).optional(),
  compatibleModels: z.array(z.string()).optional(),
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula el valor total del inventario
 */
function calculateInventoryValue(items: Array<{ quantity: number; costPerUnit: number }>): number {
  return items.reduce((total, item) => total + (item.quantity * item.costPerUnit), 0);
}

/**
 * Genera número de lote automático
 */
function generateLotNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOT-${year}${month}${day}-${random}`;
}

// ============================================================================
// ROUTER
// ============================================================================

export const inventoryRouter = router({
  /**
   * Lista de inventario con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "name", sortOrder: "asc" };
      
      const allItems = await db.getInventory(ctx.user.openId);
      
      // Filtrar
      let filtered = [...allItems];
      
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.supplier?.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.category) {
        filtered = filtered.filter(item => item.category === pagination.category);
      }
      
      if (pagination.lowStock) {
        filtered = filtered.filter(item => {
          const qty = Number(item.quantity) || 0;
          const min = Number(item.minStock) || 0;
          return qty > 0 && qty <= min;
        });
      }
      
      if (pagination.outOfStock) {
        filtered = filtered.filter(item => (Number(item.quantity) || 0) === 0);
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        let aVal = a[pagination.sortBy as keyof typeof a] ?? "";
        let bVal = b[pagination.sortBy as keyof typeof b] ?? "";
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return pagination.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return pagination.sortOrder === "asc" ? comparison : -comparison;
      });
      
      // Paginar
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const offset = (pagination.page - 1) * pagination.limit;
      const items = filtered.slice(offset, offset + pagination.limit);
      
      // Estadísticas
      const stats = {
        totalItems: allItems.length,
        totalValue: calculateInventoryValue(allItems.map(i => ({
          quantity: Number(i.quantity) || 0,
          costPerUnit: Number(i.costPerUnit) || 0,
        }))),
        lowStockCount: allItems.filter(item => {
          const qty = Number(item.quantity) || 0;
          const min = Number(item.minStock) || 0;
          return qty > 0 && qty <= min;
        }).length,
        outOfStockCount: allItems.filter(item => (Number(item.quantity) || 0) === 0).length,
        byCategory: Object.fromEntries(
          inventoryCategorySchema.options.map(cat => [
            cat,
            allItems.filter(item => item.category === cat).length,
          ])
        ),
      };
      
      return {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasMore: pagination.page < totalPages,
        },
        stats,
      };
    }),
  
  /**
   * Obtener item por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getInventoryItem(ctx.user.openId, input.id)),
  
  /**
   * Crear nuevo item de inventario
   */
  create: protectedProcedure
    .input(inventoryItemBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Generar SKU si no se proporciona
      const sku = input.sku || `INV-${Date.now().toString(36).toUpperCase()}`;
      
      return db.createInventoryItem({
        ...input,
        sku,
        quantity: String(input.quantity),
        minStock: String(input.minStock),
        costPerUnit: String(input.costPerUnit),
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar item de inventario
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(inventoryItemBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, quantity, minStock, costPerUnit, ...data } = input;
      
      const updateData: Record<string, unknown> = { ...data };
      if (quantity !== undefined) updateData.quantity = String(quantity);
      if (minStock !== undefined) updateData.minStock = String(minStock);
      if (costPerUnit !== undefined) updateData.costPerUnit = String(costPerUnit);
      
      return db.updateInventoryItem(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar item de inventario
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteInventoryItem(ctx.user.openId, input.id)),
  
  /**
   * Ajustar stock (entrada/salida)
   */
  adjustStock: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      type: z.enum(["in", "out", "adjustment"]),
      quantity: z.number().positive(),
      reason: z.string().max(500).optional(),
      serviceId: z.number().optional(),
      lotNumber: z.string().optional(),
      cost: z.number().min(0).optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getInventoryItem(ctx.user.openId, input.itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }
      
      const currentQty = Number(item.quantity) || 0;
      let newQty: number;
      
      switch (input.type) {
        case "in":
          newQty = currentQty + input.quantity;
          break;
        case "out":
          if (currentQty < input.quantity) {
            throw new Error(`Stock insuficiente. Disponible: ${currentQty}`);
          }
          newQty = currentQty - input.quantity;
          break;
        case "adjustment":
          newQty = input.quantity;
          break;
      }
      
      // Registrar movimiento
      const movement: z.infer<typeof stockMovementSchema> = {
        id: `MOV-${Date.now()}`,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        serviceId: input.serviceId,
        lotNumber: input.lotNumber,
        date: new Date().toISOString(),
        cost: input.cost,
        notes: input.notes,
      };
      
      const existingMovements = (item.movements as z.infer<typeof stockMovementSchema>[]) || [];
      
      await db.updateInventoryItem(ctx.user.openId, input.itemId, {
        quantity: String(newQty),
        movements: [...existingMovements, movement],
      });
      
      return {
        previousQuantity: currentQty,
        newQuantity: newQty,
        movement,
      };
    }),
  
  /**
   * Consumir materiales para un servicio
   */
  consumeForService: protectedProcedure
    .input(z.object({
      serviceId: z.number(),
      items: z.array(z.object({
        itemId: z.number(),
        quantity: z.number().positive(),
        lotNumber: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const consumption of input.items) {
        const item = await db.getInventoryItem(ctx.user.openId, consumption.itemId);
        if (!item) {
          throw new Error(`Item ${consumption.itemId} no encontrado`);
        }
        
        const currentQty = Number(item.quantity) || 0;
        if (currentQty < consumption.quantity) {
          throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${currentQty}`);
        }
        
        const newQty = currentQty - consumption.quantity;
        
        const movement: z.infer<typeof stockMovementSchema> = {
          id: `MOV-${Date.now()}-${consumption.itemId}`,
          type: "out",
          quantity: consumption.quantity,
          reason: "Consumo en servicio",
          serviceId: input.serviceId,
          lotNumber: consumption.lotNumber,
          date: new Date().toISOString(),
        };
        
        const existingMovements = (item.movements as z.infer<typeof stockMovementSchema>[]) || [];
        
        await db.updateInventoryItem(ctx.user.openId, consumption.itemId, {
          quantity: String(newQty),
          movements: [...existingMovements, movement],
        });
        
        results.push({
          itemId: consumption.itemId,
          itemName: item.name,
          consumed: consumption.quantity,
          remaining: newQty,
        });
      }
      
      return results;
    }),
  
  /**
   * Revertir consumo de materiales (devolución)
   */
  returnFromService: protectedProcedure
    .input(z.object({
      serviceId: z.number(),
      items: z.array(z.object({
        itemId: z.number(),
        quantity: z.number().positive(),
        reason: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const returnItem of input.items) {
        const item = await db.getInventoryItem(ctx.user.openId, returnItem.itemId);
        if (!item) {
          throw new Error(`Item ${returnItem.itemId} no encontrado`);
        }
        
        const currentQty = Number(item.quantity) || 0;
        const newQty = currentQty + returnItem.quantity;
        
        const movement: z.infer<typeof stockMovementSchema> = {
          id: `MOV-${Date.now()}-${returnItem.itemId}`,
          type: "return",
          quantity: returnItem.quantity,
          reason: returnItem.reason || "Devolución de servicio",
          serviceId: input.serviceId,
          date: new Date().toISOString(),
        };
        
        const existingMovements = (item.movements as z.infer<typeof stockMovementSchema>[]) || [];
        
        await db.updateInventoryItem(ctx.user.openId, returnItem.itemId, {
          quantity: String(newQty),
          movements: [...existingMovements, movement],
        });
        
        results.push({
          itemId: returnItem.itemId,
          itemName: item.name,
          returned: returnItem.quantity,
          newQuantity: newQty,
        });
      }
      
      return results;
    }),
  
  /**
   * Añadir lote a un item
   */
  addLot: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      lotNumber: z.string().optional(),
      quantity: z.number().positive(),
      purchaseDate: z.string().or(z.date()),
      expirationDate: z.string().or(z.date()).optional(),
      costPerUnit: z.number().min(0),
      supplier: z.string().optional(),
      invoiceNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getInventoryItem(ctx.user.openId, input.itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }
      
      const lotNumber = input.lotNumber || generateLotNumber();
      
      const newLot: z.infer<typeof lotSchema> = {
        id: `LOT-${Date.now()}`,
        lotNumber,
        quantity: input.quantity,
        purchaseDate: typeof input.purchaseDate === "string" ? input.purchaseDate : input.purchaseDate.toISOString(),
        expirationDate: input.expirationDate 
          ? (typeof input.expirationDate === "string" ? input.expirationDate : input.expirationDate.toISOString())
          : undefined,
        costPerUnit: input.costPerUnit,
        supplier: input.supplier,
        invoiceNumber: input.invoiceNumber,
        notes: input.notes,
      };
      
      const existingLots = (item.lots as z.infer<typeof lotSchema>[]) || [];
      const currentQty = Number(item.quantity) || 0;
      
      // Registrar movimiento de entrada
      const movement: z.infer<typeof stockMovementSchema> = {
        id: `MOV-${Date.now()}`,
        type: "in",
        quantity: input.quantity,
        reason: "Entrada de lote",
        lotNumber,
        date: new Date().toISOString(),
        cost: input.costPerUnit * input.quantity,
      };
      
      const existingMovements = (item.movements as z.infer<typeof stockMovementSchema>[]) || [];
      
      await db.updateInventoryItem(ctx.user.openId, input.itemId, {
        quantity: String(currentQty + input.quantity),
        lots: [...existingLots, newLot],
        movements: [...existingMovements, movement],
      });
      
      return newLot;
    }),
  
  /**
   * Obtener items con stock bajo
   */
  getLowStock: protectedProcedure.query(async ({ ctx }) => {
    const items = await db.getInventory(ctx.user.openId);
    
    return items.filter(item => {
      const qty = Number(item.quantity) || 0;
      const min = Number(item.minStock) || 0;
      return min > 0 && qty <= min;
    }).map(item => ({
      ...item,
      currentStock: Number(item.quantity) || 0,
      minStock: Number(item.minStock) || 0,
      deficit: (Number(item.minStock) || 0) - (Number(item.quantity) || 0),
    })).sort((a, b) => a.deficit - b.deficit);
  }),
  
  /**
   * Obtener items agotados
   */
  getOutOfStock: protectedProcedure.query(async ({ ctx }) => {
    const items = await db.getInventory(ctx.user.openId);
    return items.filter(item => (Number(item.quantity) || 0) === 0);
  }),
  
  /**
   * Obtener items con lotes próximos a caducar
   */
  getExpiringLots: protectedProcedure
    .input(z.object({
      daysAhead: z.number().int().min(1).max(365).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const daysAhead = input?.daysAhead || 30;
      const items = await db.getInventory(ctx.user.openId);
      const today = new Date();
      const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      const expiringItems = [];
      
      for (const item of items) {
        const lots = (item.lots as z.infer<typeof lotSchema>[]) || [];
        const expiringLots = lots.filter(lot => {
          if (!lot.expirationDate) return false;
          const expDate = new Date(lot.expirationDate);
          return expDate <= cutoff && expDate >= today;
        });
        
        if (expiringLots.length > 0) {
          expiringItems.push({
            item,
            expiringLots,
          });
        }
      }
      
      return expiringItems;
    }),
  
  /**
   * Obtener historial de movimientos de un item
   */
  getMovementHistory: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const item = await db.getInventoryItem(ctx.user.openId, input.itemId);
      if (!item) {
        throw new Error("Item no encontrado");
      }
      
      const movements = (item.movements as z.infer<typeof stockMovementSchema>[]) || [];
      
      return movements
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, input.limit);
    }),
  
  /**
   * Buscar items compatibles con un piano
   */
  findCompatible: protectedProcedure
    .input(z.object({
      brand: z.string(),
      model: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const items = await db.getInventory(ctx.user.openId);
      
      return items.filter(item => {
        const compatibleBrands = item.compatibleBrands as string[] | undefined;
        const compatibleModels = item.compatibleModels as string[] | undefined;
        
        if (!compatibleBrands || compatibleBrands.length === 0) {
          return true; // Item genérico, compatible con todos
        }
        
        const brandMatch = compatibleBrands.some(b => 
          b.toLowerCase() === input.brand.toLowerCase() || b === "*"
        );
        
        if (!brandMatch) return false;
        
        if (input.model && compatibleModels && compatibleModels.length > 0) {
          return compatibleModels.some(m => 
            m.toLowerCase() === input.model!.toLowerCase() || m === "*"
          );
        }
        
        return true;
      });
    }),
  
  /**
   * Generar informe de valoración de inventario
   */
  getValuationReport: protectedProcedure.query(async ({ ctx }) => {
    const items = await db.getInventory(ctx.user.openId);
    
    const byCategory: Record<string, { count: number; quantity: number; value: number }> = {};
    let totalValue = 0;
    let totalItems = 0;
    
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.costPerUnit) || 0;
      const value = qty * cost;
      
      totalValue += value;
      totalItems += qty;
      
      if (!byCategory[item.category]) {
        byCategory[item.category] = { count: 0, quantity: 0, value: 0 };
      }
      byCategory[item.category].count++;
      byCategory[item.category].quantity += qty;
      byCategory[item.category].value += value;
    }
    
    return {
      totalItems,
      totalValue,
      uniqueProducts: items.length,
      byCategory,
      generatedAt: new Date().toISOString(),
    };
  }),
});
