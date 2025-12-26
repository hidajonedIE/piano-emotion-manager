/**
 * Service Rates Router
 * Gestión de tarifas de servicios
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const serviceRatesRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getServiceRates(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getServiceRate(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      category: z.enum(["tuning", "maintenance", "regulation", "repair", "restoration", "inspection", "other"]),
      basePrice: z.string(),
      taxRate: z.number().optional(),
      estimatedDuration: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => db.createServiceRate({ ...input, odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      category: z.enum(["tuning", "maintenance", "regulation", "repair", "restoration", "inspection", "other"]).optional(),
      basePrice: z.string().optional(),
      taxRate: z.number().optional(),
      estimatedDuration: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateServiceRate(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteServiceRate(ctx.user.openId, input.id)),
});
