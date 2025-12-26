/**
 * Quotes Router
 * Gestión de presupuestos
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

export const quotesRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getQuotes(ctx.user.openId)),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getQuote(ctx.user.openId, input.id)),
  
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ ctx, input }) => db.getQuotesByClient(ctx.user.openId, input.clientId)),
  
  getNextNumber: protectedProcedure.query(({ ctx }) => db.getNextQuoteNumber(ctx.user.openId)),
  
  create: protectedProcedure
    .input(z.object({
      quoteNumber: z.string().min(1).max(50),
      clientId: z.number(),
      clientName: z.string().min(1).max(255),
      clientEmail: z.string().optional().nullable(),
      clientAddress: z.string().optional().nullable(),
      pianoId: z.number().optional().nullable(),
      pianoDescription: z.string().optional().nullable(),
      title: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      date: z.string(),
      validUntil: z.string(),
      status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]).optional(),
      items: z.array(z.object({
        id: z.string(),
        type: z.enum(['service', 'part', 'labor', 'travel', 'other']),
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        discount: z.number(),
        taxRate: z.number(),
        subtotal: z.number(),
        total: z.number(),
      })).optional(),
      subtotal: z.string(),
      totalDiscount: z.string().optional(),
      taxAmount: z.string(),
      total: z.string(),
      currency: z.string().optional(),
      notes: z.string().optional().nullable(),
      termsAndConditions: z.string().optional().nullable(),
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
    .mutation(({ ctx, input }) => db.createQuote({ 
      ...input, 
      date: new Date(input.date),
      validUntil: new Date(input.validUntil),
      odId: ctx.user.openId 
    })),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]).optional(),
      items: z.array(z.object({
        id: z.string(),
        type: z.enum(['service', 'part', 'labor', 'travel', 'other']),
        name: z.string(),
        description: z.string().optional(),
        quantity: z.number(),
        unitPrice: z.number(),
        discount: z.number(),
        taxRate: z.number(),
        subtotal: z.number(),
        total: z.number(),
      })).optional(),
      subtotal: z.string().optional(),
      totalDiscount: z.string().optional(),
      taxAmount: z.string().optional(),
      total: z.string().optional(),
      notes: z.string().optional().nullable(),
      termsAndConditions: z.string().optional().nullable(),
      sentAt: z.string().optional().nullable(),
      acceptedAt: z.string().optional().nullable(),
      rejectedAt: z.string().optional().nullable(),
      convertedToInvoiceId: z.number().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => {
      const { id, sentAt, acceptedAt, rejectedAt, ...data } = input;
      return db.updateQuote(ctx.user.openId, id, {
        ...data,
        ...(sentAt ? { sentAt: new Date(sentAt) } : {}),
        ...(acceptedAt ? { acceptedAt: new Date(acceptedAt) } : {}),
        ...(rejectedAt ? { rejectedAt: new Date(rejectedAt) } : {}),
      });
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteQuote(ctx.user.openId, input.id)),
  
  convertToInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await db.getQuote(ctx.user.openId, input.id);
      if (!quote) throw new Error("Quote not found");
      
      // Create invoice from quote
      const invoiceId = await db.createInvoice({
        odId: ctx.user.openId,
        invoiceNumber: quote.quoteNumber.replace('PRES', 'FAC'),
        clientId: quote.clientId,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientAddress: quote.clientAddress,
        date: new Date(),
        status: 'draft',
        items: quote.items?.map(item => ({
          description: item.name + (item.description ? ` - ${item.description}` : ''),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total,
        })),
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        total: quote.total,
        notes: quote.notes,
        businessInfo: quote.businessInfo,
      });
      
      // Update quote status
      await db.updateQuote(ctx.user.openId, input.id, {
        status: 'converted',
        convertedToInvoiceId: invoiceId,
      });
      
      return { invoiceId };
    }),
});
