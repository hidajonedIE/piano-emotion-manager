/**
 * Router de API para Gestión de Stock
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc';
import { stockService } from '../../services/inventory';

// Schemas de validación
const stockMovementTypeSchema = z.enum([
  'purchase', 'sale', 'transfer_in', 'transfer_out',
  'adjustment_in', 'adjustment_out', 'return_customer',
  'return_supplier', 'damaged', 'expired', 'initial'
]);

const stockMovementSchema = z.object({
  productId: z.number().int(),
  warehouseId: z.number().int(),
  type: stockMovementTypeSchema,
  quantity: z.number().min(0.001),
  unitCost: z.number().min(0).optional(),
  referenceType: z.string().optional(),
  referenceId: z.number().int().optional(),
  relatedWarehouseId: z.number().int().optional(),
  batchNumber: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  expirationDate: z.date().optional(),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  productId: z.number().int(),
  fromWarehouseId: z.number().int(),
  toWarehouseId: z.number().int(),
  quantity: z.number().min(0.001),
  notes: z.string().optional(),
});

const adjustmentSchema = z.object({
  productId: z.number().int(),
  warehouseId: z.number().int(),
  newQuantity: z.number().min(0),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

const movementFiltersSchema = z.object({
  productId: z.number().int().optional(),
  warehouseId: z.number().int().optional(),
  type: stockMovementTypeSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export const stockRouter = router({
  // Registrar movimiento de stock
  recordMovement: protectedProcedure
    .input(stockMovementSchema)
    .mutation(async ({ input, ctx }) => {
      return stockService.recordMovement({
        ...input,
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Transferir stock entre almacenes
  transfer: protectedProcedure
    .input(transferSchema)
    .mutation(async ({ input, ctx }) => {
      return stockService.transfer({
        ...input,
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Ajustar stock (inventario físico)
  adjust: protectedProcedure
    .input(adjustmentSchema)
    .mutation(async ({ input, ctx }) => {
      return stockService.adjust({
        ...input,
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Registrar uso en servicio
  recordServiceUsage: protectedProcedure
    .input(z.object({
      serviceId: z.number().int(),
      productId: z.number().int(),
      warehouseId: z.number().int(),
      quantity: z.number().min(0.001),
    }))
    .mutation(async ({ input, ctx }) => {
      return stockService.recordServiceUsage(
        input.serviceId,
        input.productId,
        input.warehouseId,
        input.quantity,
        ctx.user.id,
        ctx.user.organizationId
      );
    }),

  // Obtener niveles de stock de un producto
  getStockLevels: protectedProcedure
    .input(z.object({ productId: z.number().int() }))
    .query(async ({ input }) => {
      return stockService.getStockLevels(input.productId);
    }),

  // Obtener stock total de un producto
  getTotalStock: protectedProcedure
    .input(z.object({ productId: z.number().int() }))
    .query(async ({ input }) => {
      return stockService.getTotalStock(input.productId);
    }),

  // Obtener stock disponible en un almacén
  getAvailableStock: protectedProcedure
    .input(z.object({
      productId: z.number().int(),
      warehouseId: z.number().int(),
    }))
    .query(async ({ input }) => {
      return stockService.getAvailableStock(input.productId, input.warehouseId);
    }),

  // Reservar stock
  reserveStock: protectedProcedure
    .input(z.object({
      productId: z.number().int(),
      warehouseId: z.number().int(),
      quantity: z.number().min(0.001),
    }))
    .mutation(async ({ input }) => {
      const success = await stockService.reserveStock(
        input.productId,
        input.warehouseId,
        input.quantity
      );
      return { success };
    }),

  // Liberar stock reservado
  releaseReservedStock: protectedProcedure
    .input(z.object({
      productId: z.number().int(),
      warehouseId: z.number().int(),
      quantity: z.number().min(0.001),
    }))
    .mutation(async ({ input }) => {
      await stockService.releaseReservedStock(
        input.productId,
        input.warehouseId,
        input.quantity
      );
      return { success: true };
    }),

  // Obtener historial de movimientos
  getMovementHistory: protectedProcedure
    .input(z.object({
      filters: movementFiltersSchema.optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      return stockService.getMovementHistory(
        { ...input.filters, organizationId: ctx.user.organizationId },
        input.page,
        input.pageSize
      );
    }),

  // Obtener alertas activas
  getActiveAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      return stockService.getActiveAlerts(ctx.user.organizationId);
    }),

  // Marcar alerta como leída
  markAlertAsRead: protectedProcedure
    .input(z.object({ alertId: z.number().int() }))
    .mutation(async ({ input }) => {
      await stockService.markAlertAsRead(input.alertId);
      return { success: true };
    }),

  // Resolver alerta
  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      await stockService.resolveAlert(input.alertId, ctx.user.id);
      return { success: true };
    }),

  // Obtener valoración del inventario
  getInventoryValuation: protectedProcedure
    .input(z.object({
      warehouseId: z.number().int().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      return stockService.getInventoryValuation(
        input?.warehouseId,
        ctx.user.organizationId
      );
    }),
});
