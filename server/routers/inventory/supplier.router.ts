/**
 * Router de API para Gestión de Proveedores
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc.js';
import { supplierService } from '../../services/inventory.js';

// Schemas de validación
const purchaseOrderStatusSchema = z.enum([
  'draft', 'pending_approval', 'approved', 'ordered',
  'partial', 'received', 'cancelled'
]);

const createSupplierSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  tradeName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  contactName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  minOrderAmount: z.number().min(0).optional(),
  freeShippingAmount: z.number().min(0).optional(),
  bankName: z.string().max(100).optional(),
  bankAccount: z.string().max(50).optional(),
  bankIban: z.string().max(34).optional(),
  bankSwift: z.string().max(11).optional(),
  productCategories: z.array(z.string()).optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

const updateSupplierSchema = createSupplierSchema.partial().extend({
  id: z.number().int(),
});

const supplierProductSchema = z.object({
  supplierId: z.number().int(),
  productId: z.number().int(),
  supplierSku: z.string().max(50).optional(),
  supplierProductName: z.string().max(255).optional(),
  unitCost: z.number().min(0),
  currency: z.string().length(3).optional(),
  minOrderQuantity: z.number().int().min(1).optional(),
  packSize: z.number().int().min(1).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  isPreferred: z.boolean().optional(),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z.number().int(),
  warehouseId: z.number().int(),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.number().int(),
    quantity: z.number().min(0.001),
    unitCost: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  })).min(1),
});

const receivePurchaseOrderSchema = z.object({
  purchaseOrderId: z.number().int(),
  lines: z.array(z.object({
    lineId: z.number().int(),
    receivedQuantity: z.number().min(0.001),
    batchNumber: z.string().max(50).optional(),
    expirationDate: z.date().optional(),
  })).min(1),
});

const purchaseOrderFiltersSchema = z.object({
  supplierId: z.number().int().optional(),
  warehouseId: z.number().int().optional(),
  status: purchaseOrderStatusSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export const supplierRouter = router({
  // ========== Proveedores ==========

  // Crear proveedor
  create: protectedProcedure
    .input(createSupplierSchema)
    .mutation(async ({ input, ctx }) => {
      return supplierService.create({
        ...input,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Actualizar proveedor
  update: protectedProcedure
    .input(updateSupplierSchema)
    .mutation(async ({ input }) => {
      return supplierService.update(input);
    }),

  // Obtener proveedor por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return supplierService.getById(input.id);
    }),

  // Buscar proveedores
  search: protectedProcedure
    .input(z.object({
      filters: z.object({
        search: z.string().optional(),
        isActive: z.boolean().optional(),
        country: z.string().optional(),
      }).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return supplierService.search(
        { ...input.filters, organizationId: ctx.user.organizationId },
        input.page,
        input.pageSize
      );
    }),

  // Obtener todos los proveedores activos
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return supplierService.getAll(ctx.user.organizationId);
    }),

  // Desactivar proveedor
  deactivate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await supplierService.deactivate(input.id);
      return { success: true };
    }),

  // ========== Productos de Proveedor ==========

  // Añadir producto a proveedor
  addProduct: protectedProcedure
    .input(supplierProductSchema)
    .mutation(async ({ input }) => {
      return supplierService.addProduct(input);
    }),

  // Actualizar producto de proveedor
  updateProduct: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      data: supplierProductSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      return supplierService.updateProduct(input.id, input.data);
    }),

  // Obtener productos de un proveedor
  getProducts: protectedProcedure
    .input(z.object({ supplierId: z.number().int() }))
    .query(async ({ input }) => {
      return supplierService.getProducts(input.supplierId);
    }),

  // Obtener proveedores de un producto
  getProductSuppliers: protectedProcedure
    .input(z.object({ productId: z.number().int() }))
    .query(async ({ input }) => {
      return supplierService.getProductSuppliers(input.productId);
    }),

  // Obtener proveedor preferido de un producto
  getPreferredSupplier: protectedProcedure
    .input(z.object({ productId: z.number().int() }))
    .query(async ({ input }) => {
      return supplierService.getPreferredSupplier(input.productId);
    }),

  // ========== Órdenes de Compra ==========

  // Crear orden de compra
  createPurchaseOrder: protectedProcedure
    .input(createPurchaseOrderSchema)
    .mutation(async ({ input, ctx }) => {
      return supplierService.createPurchaseOrder({
        ...input,
        createdByUserId: ctx.user.id,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Actualizar estado de orden
  updateOrderStatus: protectedProcedure
    .input(z.object({
      orderId: z.number().int(),
      status: purchaseOrderStatusSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return supplierService.updateOrderStatus(
        input.orderId,
        input.status,
        ctx.user.id
      );
    }),

  // Recibir productos de orden
  receivePurchaseOrder: protectedProcedure
    .input(receivePurchaseOrderSchema)
    .mutation(async ({ input, ctx }) => {
      await supplierService.receivePurchaseOrder({
        ...input,
        userId: ctx.user.id,
      });
      return { success: true };
    }),

  // Obtener orden de compra por ID
  getPurchaseOrder: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return supplierService.getPurchaseOrder(input.id);
    }),

  // Buscar órdenes de compra
  searchPurchaseOrders: protectedProcedure
    .input(z.object({
      filters: purchaseOrderFiltersSchema.optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return supplierService.searchPurchaseOrders(
        { ...input.filters, organizationId: ctx.user.organizationId },
        input.page,
        input.pageSize
      );
    }),

  // Cancelar orden de compra
  cancelPurchaseOrder: protectedProcedure
    .input(z.object({ orderId: z.number().int() }))
    .mutation(async ({ input }) => {
      await supplierService.cancelPurchaseOrder(input.orderId);
      return { success: true };
    }),

  // Generar sugerencias de reposición
  getReorderSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      return supplierService.generateReorderSuggestions(ctx.user.organizationId);
    }),
});
