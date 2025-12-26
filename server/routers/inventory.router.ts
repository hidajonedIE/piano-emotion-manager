/**
 * Inventory Router
 * Gestión de inventario
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const inventoryRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getInventory(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getInventoryItem(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      category: z.enum(["strings", "hammers", "dampers", "keys", "action_parts", "pedals", "tuning_pins", "felts", "tools", "chemicals", "other"]),
      description: z.string().optional().nullable(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      minStock: z.string().optional(),
      costPerUnit: z.string().optional().nullable(),
      supplier: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => db.createInventoryItem({ ...input, odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      category: z.enum(["strings", "hammers", "dampers", "keys", "action_parts", "pedals", "tuning_pins", "felts", "tools", "chemicals", "other"]).optional(),
      description: z.string().optional().nullable(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      minStock: z.string().optional(),
      costPerUnit: z.string().optional().nullable(),
      supplier: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateInventoryItem(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteInventoryItem(ctx.user.openId, input.id)),
});
