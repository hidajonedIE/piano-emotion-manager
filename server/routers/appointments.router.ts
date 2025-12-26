/**
 * Appointments Router
 * Gestión de citas
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const appointmentsRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getAppointments(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getAppointment(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      pianoId: z.number().optional().nullable(),
      title: z.string().min(1).max(255),
      date: z.string(),
      duration: z.number().optional(),
      serviceType: z.string().optional().nullable(),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
      notes: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => db.createAppointment({ ...input, date: new Date(input.date), odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientId: z.number().optional(),
      pianoId: z.number().optional().nullable(),
      title: z.string().min(1).max(255).optional(),
      date: z.string().optional(),
      duration: z.number().optional(),
      serviceType: z.string().optional().nullable(),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
      notes: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, date, ...data } = input;
      return db.updateAppointment(ctx.user.openId, id, { ...data, ...(date ? { date: new Date(date) } : {}) });
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteAppointment(ctx.user.openId, input.id)),
});
