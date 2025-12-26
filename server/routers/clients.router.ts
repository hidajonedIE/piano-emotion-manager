/**
 * Clients Router
 * Gestión de clientes
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getClients(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getClient(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      clientType: z.enum(["particular", "student", "professional", "music_school", "conservatory", "concert_hall"]).optional(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => db.createClient({ ...input, odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      clientType: z.enum(["particular", "student", "professional", "music_school", "conservatory", "concert_hall"]).optional(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateClient(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteClient(ctx.user.openId, input.id)),
});
