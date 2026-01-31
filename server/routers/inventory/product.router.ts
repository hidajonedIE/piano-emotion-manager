/**
 * Router de API para Productos de Inventario
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc.js';
// import InventoryService from '../../services/inventory.js'; // TODO: Implement service

// Schemas de validación
const productTypeSchema = z.enum([
  'spare_part', 'tool', 'consumable', 'accessory', 'other'
]);

const productCategorySchema = z.enum([
  'strings', 'tuning_pins', 'pin_blocks', 'hammers', 'dampers', 'keys',
  'action_parts', 'springs', 'felts', 'cloths', 'leather', 'soundboard',
  'bridges', 'pedals', 'cabinet_parts', 'tuning_tools', 'regulation_tools',
  'voicing_tools', 'general_tools', 'lubricants', 'cleaners', 'adhesives',
  'polishes', 'accessories', 'other'
]);

const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: productTypeSchema.optional(),
  category: productCategorySchema.optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  costPrice: z.number().min(0),
  salePrice: z.number().min(0),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(1).optional(),
  unitOfMeasure: z.string().max(20).optional(),
  unitsPerPackage: z.number().int().min(1).optional(),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  primarySupplierId: z.number().int().optional(),
  supplierSku: z.string().max(50).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  documentUrls: z.array(z.string().url()).optional(),
  compatibleBrands: z.array(z.string()).optional(),
  compatibleModels: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  isSerialTracked: z.boolean().optional(),
  isBatchTracked: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.number().int(),
});

const productFiltersSchema = z.object({
  search: z.string().optional(),
  type: productTypeSchema.optional(),
  category: productCategorySchema.optional(),
  brand: z.string().optional(),
  supplierId: z.number().int().optional(),
  isActive: z.boolean().optional(),
  hasLowStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const productRouter = router({
  // Crear producto
  create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
      return productService.create({
        ...input,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Actualizar producto
  update: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ input }) => {
      return productService.update(input);
    }),

  // Obtener producto por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return productService.getById(input.id);
    }),

  // Obtener producto por SKU
  getBySku: protectedProcedure
    .input(z.object({ sku: z.string() }))
    .query(async ({ input, ctx }) => {
      return productService.getBySku(input.sku, ctx.user.organizationId);
    }),

  // Obtener producto por código de barras
  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ input, ctx }) => {
      return productService.getByBarcode(input.barcode, ctx.user.organizationId);
    }),

  // Obtener producto con stock
  getWithStock: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return productService.getWithStock(input.id);
    }),

  // Buscar productos
  search: protectedProcedure
    .input(z.object({
      filters: productFiltersSchema.optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      sortBy: z.string().default('name'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    }))
    .query(async ({ input, ctx }) => {
      return productService.search(
        { ...input.filters, organizationId: ctx.user.organizationId },
        input.page,
        input.pageSize,
        input.sortBy,
        input.sortOrder
      );
    }),

  // Obtener productos con stock bajo
  getLowStock: protectedProcedure
    .query(async ({ ctx }) => {
      return productService.getLowStockProducts(ctx.user.organizationId);
    }),

  // Obtener productos por categoría
  getByCategory: protectedProcedure
    .input(z.object({ category: productCategorySchema }))
    .query(async ({ input, ctx }) => {
      return productService.getByCategory(input.category, ctx.user.organizationId);
    }),

  // Obtener marcas únicas
  getBrands: protectedProcedure
    .query(async ({ ctx }) => {
      return productService.getBrands(ctx.user.organizationId);
    }),

  // Desactivar producto
  deactivate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await productService.deactivate(input.id);
      return { success: true };
    }),

  // Eliminar producto (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await productService.delete(input.id);
      return { success: true };
    }),

  // Restaurar producto
  restore: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await productService.restore(input.id);
      return { success: true };
    }),

  // Duplicar producto
  duplicate: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      newSku: z.string().min(1).max(50),
    }))
    .mutation(async ({ input }) => {
      return productService.duplicate(input.id, input.newSku);
    }),

  // Importar productos en masa
  bulkCreate: protectedProcedure
    .input(z.object({
      products: z.array(createProductSchema),
    }))
    .mutation(async ({ input, ctx }) => {
      const productsWithOrg = input.products.map(p => ({
        ...p,
        organizationId: ctx.user.organizationId,
      }));
      return productService.bulkCreate(productsWithOrg);
    }),

  // Actualizar precios en masa
  bulkUpdatePrices: protectedProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.number().int(),
        costPrice: z.number().min(0).optional(),
        salePrice: z.number().min(0).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      return productService.bulkUpdatePrices(input.updates);
    }),

  // Obtener estadísticas
  getStatistics: protectedProcedure
    .query(async ({ ctx }) => {
      return productService.getStatistics(ctx.user.organizationId);
    }),
});
