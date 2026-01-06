/**
 * Quote Templates Router
 * Gestión de plantillas de presupuestos
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { addPartnerToInsert } from "../utils/multi-tenant.js";

export const quoteTemplatesRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getQuoteTemplates(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getQuoteTemplate(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      category: z.enum(["tuning", "repair", "restoration", "maintenance", "moving", "evaluation", "custom"]),
      items: z.array(z.object({
        type: z.enum(['service', 'part', 'labor', 'travel', 'other']),
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        discount: z.number(),
        taxRate: z.number(),
      })).optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => db.createQuoteTemplate({ ...input, odId: ctx.user.openId, partnerId: ctx.partnerId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      category: z.enum(["tuning", "repair", "restoration", "maintenance", "moving", "evaluation", "custom"]).optional(),
      items: z.array(z.object({
        type: z.enum(['service', 'part', 'labor', 'travel', 'other']),
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        discount: z.number(),
        taxRate: z.number(),
      })).optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateQuoteTemplate(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteQuoteTemplate(ctx.user.openId, input.id)),
});
