import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { advancedModulesRouter } from "./routers/advanced-modules.router";
import { modulesRouter } from "./routers/modules.router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CLIENTS ============
  clients: router({
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
  }),

  // ============ PIANOS ============
  pianos: router({
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
  }),

  // ============ SERVICES ============
  services: router({
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
  }),

  // ============ INVENTORY ============
  inventory: router({
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
  }),

  // ============ APPOINTMENTS ============
  appointments: router({
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
  }),

  // ============ INVOICES ============
  invoices: router({
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
  }),

  // ============ SERVICE RATES ============
  serviceRates: router({
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
  }),

  // ============ BUSINESS INFO ============
  businessInfo: router({
    get: protectedProcedure.query(({ ctx }) => db.getBusinessInfo(ctx.user.openId)),
    
    save: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        taxId: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.saveBusinessInfo({ ...input, odId: ctx.user.openId })),
  }),

  // ============ REMINDERS ============
  reminders: router({
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
  }),

  // ============ MODULES ============
  // Gestión de módulos y suscripciones
  modules: modulesRouter,

  // ============ ADVANCED MODULES ============
  // Gestión de equipos, CRM, Reportes, Contabilidad, Tienda, Módulos, Calendario avanzado
  advanced: advancedModulesRouter,
});

export type AppRouter = typeof appRouter;
