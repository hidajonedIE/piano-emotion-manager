/**
 * Services Router
 * Gestión de servicios
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const servicesRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getServices(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getService(ctx.user.openId, input.id)),
  
  byPiano: protectedProcedure
    .input(z.object({ pianoId: z.number() }))
    .query(({ ctx, input }) => db.getServicesByPiano(ctx.user.openId, input.pianoId)),
  
  create: protectedProcedure
    .input(z.object({
      pianoId: z.number(),
      clientId: z.number(),
      serviceType: z.enum(["tuning", "repair", "regulation", "maintenance_basic", "maintenance_complete", "maintenance_premium", "inspection", "restoration", "other"]),
      date: z.string(),
      cost: z.string().optional().nullable(),
      duration: z.number().optional().nullable(),
      tasks: z.array(z.object({ name: z.string(), completed: z.boolean(), notes: z.string().optional() })).optional(),
      notes: z.string().optional().nullable(),
      technicianNotes: z.string().optional().nullable(),
      materialsUsed: z.array(z.object({ materialId: z.number(), quantity: z.number() })).optional(),
      photosBefore: z.array(z.string()).optional(),
      photosAfter: z.array(z.string()).optional(),
      clientSignature: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => db.createService({ ...input, date: new Date(input.date), odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      pianoId: z.number().optional(),
      clientId: z.number().optional(),
      serviceType: z.enum(["tuning", "repair", "regulation", "maintenance_basic", "maintenance_complete", "maintenance_premium", "inspection", "restoration", "other"]).optional(),
      date: z.string().optional(),
      cost: z.string().optional().nullable(),
      duration: z.number().optional().nullable(),
      tasks: z.array(z.object({ name: z.string(), completed: z.boolean(), notes: z.string().optional() })).optional(),
      notes: z.string().optional().nullable(),
      technicianNotes: z.string().optional().nullable(),
      materialsUsed: z.array(z.object({ materialId: z.number(), quantity: z.number() })).optional(),
      photosBefore: z.array(z.string()).optional(),
      photosAfter: z.array(z.string()).optional(),
      clientSignature: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, date, ...data } = input;
      return db.updateService(ctx.user.openId, id, { ...data, ...(date ? { date: new Date(date) } : {}) });
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteService(ctx.user.openId, input.id)),
});
