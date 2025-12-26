/**
 * Invoices Router
 * Gestión de facturas
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const invoicesRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getInvoices(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getInvoice(ctx.user.openId, input.id)),
  
  create: protectedProcedure
    .input(z.object({
      invoiceNumber: z.string().min(1).max(50),
      clientId: z.number(),
      clientName: z.string().min(1).max(255),
      clientEmail: z.string().optional().nullable(),
      clientAddress: z.string().optional().nullable(),
      date: z.string(),
      dueDate: z.string().optional().nullable(),
      status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.number(),
        total: z.number(),
      })).optional(),
      subtotal: z.string(),
      taxAmount: z.string(),
      total: z.string(),
      notes: z.string().optional().nullable(),
      businessInfo: z.object({
        name: z.string(),
        taxId: z.string(),
        address: z.string(),
        city: z.string(),
        postalCode: z.string(),
        phone: z.string(),
        email: z.string(),
        bankAccount: z.string(),
      }).optional(),
    }))
    .mutation(({ ctx, input }) => db.createInvoice({ 
      ...input, 
      date: new Date(input.date),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      odId: ctx.user.openId 
    })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.number(),
        total: z.number(),
      })).optional(),
      subtotal: z.string().optional(),
      taxAmount: z.string().optional(),
      total: z.string().optional(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateInvoice(ctx.user.openId, id, data);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteInvoice(ctx.user.openId, input.id)),
});
