/**
 * Pianos Router
 * Gestión de pianos
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const pianosRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getPianos(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getPiano(ctx.user.openId, input.id)),
  
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ ctx, input }) => db.getPianosByClient(ctx.user.openId, input.clientId)),
  
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      brand: z.string().min(1).max(100),
      model: z.string().optional().nullable(),
      serialNumber: z.string().optional().nullable(),
      year: z.number().optional().nullable(),
      category: z.enum(["vertical", "grand"]),
      pianoType: z.string().min(1).max(50),
      condition: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).optional(),
      location: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(({ ctx, input }) => db.createPiano({ ...input, odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientId: z.number().optional(),
      brand: z.string().min(1).max(100).optional(),
      model: z.string().optional().nullable(),
      serialNumber: z.string().optional().nullable(),
      year: z.number().optional().nullable(),
      category: z.enum(["vertical", "grand"]).optional(),
      pianoType: z.string().min(1).max(50).optional(),
      condition: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).optional(),
      location: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updatePiano(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deletePiano(ctx.user.openId, input.id)),
});
