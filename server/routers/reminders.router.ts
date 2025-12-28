/**
 * Reminders Router
 * Gestión de recordatorios
 */
import { z } from "zod";
import { protectedProcedure, router } from "../.core/trpc.js";
import * as db from "../db.js";

export const remindersRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getReminders(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getReminder(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      pianoId: z.number().optional().nullable(),
      reminderType: z.enum(["call", "visit", "email", "whatsapp", "follow_up"]),
      dueDate: z.string(),
      title: z.string().min(1).max(255),
      notes: z.string().optional().nullable(),
      isCompleted: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => db.createReminder({ ...input, dueDate: new Date(input.dueDate), odId: ctx.user.openId })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientId: z.number().optional(),
      pianoId: z.number().optional().nullable(),
      reminderType: z.enum(["call", "visit", "email", "whatsapp", "follow_up"]).optional(),
      dueDate: z.string().optional(),
      title: z.string().min(1).max(255).optional(),
      notes: z.string().optional().nullable(),
      isCompleted: z.boolean().optional(),
      completedAt: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, dueDate, completedAt, ...data } = input;
      return db.updateReminder(ctx.user.openId, id, { 
        ...data, 
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        ...(completedAt ? { completedAt: new Date(completedAt) } : {}),
      });
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteReminder(ctx.user.openId, input.id)),
});
