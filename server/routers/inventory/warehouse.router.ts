/**
 * Router de API para Gestión de Almacenes
 * Piano Emotion Manager
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../../trpc.js';
// import InventoryService from '../../services/inventory.js'; // TODO: Implement service

// Schemas de validación
const warehouseTypeSchema = z.enum([
  'central', 'workshop', 'vehicle', 'consignment', 'virtual'
]);

const valuationMethodSchema = z.enum(['fifo', 'lifo', 'average']);

const createWarehouseSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: warehouseTypeSchema.optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  responsibleUserId: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional(),
  valuationMethod: valuationMethodSchema.optional(),
});

const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  id: z.number().int(),
});

export const warehouseRouter = router({
  // Crear almacén
  create: protectedProcedure
    .input(createWarehouseSchema)
    .mutation(async ({ input, ctx }) => {
      return warehouseService.create({
        ...input,
        organizationId: ctx.user.organizationId,
      });
    }),

  // Actualizar almacén
  update: protectedProcedure
    .input(updateWarehouseSchema)
    .mutation(async ({ input }) => {
      return warehouseService.update(input);
    }),

  // Obtener almacén por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return warehouseService.getById(input.id);
    }),

  // Obtener almacén por código
  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      return warehouseService.getByCode(input.code, ctx.user.organizationId);
    }),

  // Obtener almacén por defecto
  getDefault: protectedProcedure
    .query(async ({ ctx }) => {
      return warehouseService.getDefault(ctx.user.organizationId);
    }),

  // Obtener todos los almacenes
  getAll: protectedProcedure
    .input(z.object({
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      return warehouseService.getAll(
        ctx.user.organizationId,
        input?.includeInactive
      );
    }),

  // Obtener almacenes por tipo
  getByType: protectedProcedure
    .input(z.object({ type: warehouseTypeSchema }))
    .query(async ({ input, ctx }) => {
      return warehouseService.getByType(input.type, ctx.user.organizationId);
    }),

  // Obtener almacén del técnico actual
  getMyVehicle: protectedProcedure
    .query(async ({ ctx }) => {
      return warehouseService.getTechnicianWarehouse(ctx.user.id);
    }),

  // Obtener almacén con estadísticas
  getWithStats: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return warehouseService.getWithStats(input.id);
    }),

  // Obtener resumen de stock de un almacén
  getStockSummary: protectedProcedure
    .input(z.object({
      warehouseId: z.number().int(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return warehouseService.getStockSummary(
        input.warehouseId,
        input.page,
        input.pageSize
      );
    }),

  // Actualizar ubicación de producto en almacén
  updateProductLocation: protectedProcedure
    .input(z.object({
      warehouseId: z.number().int(),
      productId: z.number().int(),
      location: z.string().max(50),
    }))
    .mutation(async ({ input }) => {
      await warehouseService.updateProductLocation(
        input.warehouseId,
        input.productId,
        input.location
      );
      return { success: true };
    }),

  // Desactivar almacén
  deactivate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await warehouseService.deactivate(input.id);
      return { success: true };
    }),

  // Reactivar almacén
  activate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await warehouseService.activate(input.id);
      return { success: true };
    }),

  // Crear almacén de vehículo para técnico
  createTechnicianVehicle: protectedProcedure
    .input(z.object({
      userId: z.number().int(),
      technicianName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return warehouseService.createTechnicianVehicle(
        input.userId,
        input.technicianName,
        ctx.user.organizationId
      );
    }),

  // Obtener almacenes cercanos
  getNearby: protectedProcedure
    .input(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusKm: z.number().min(1).max(500).default(50),
    }))
    .query(async ({ input, ctx }) => {
      return warehouseService.getNearby(
        input.latitude,
        input.longitude,
        input.radiusKm,
        ctx.user.organizationId
      );
    }),

  // Obtener estadísticas de todos los almacenes
  getAllStats: protectedProcedure
    .query(async ({ ctx }) => {
      return warehouseService.getAllStats(ctx.user.organizationId);
    }),
});
