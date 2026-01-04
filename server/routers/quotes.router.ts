/**
 * Quotes Router
 * Gestión de presupuestos con paginación, plantillas y conversión a factura mejorada
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Estados de presupuesto
 */
const quoteStatusSchema = z.enum([
  "draft",
  "sent",
  "viewed", // El cliente ha visto el presupuesto
  "accepted",
  "rejected",
  "expired",
  "converted", // Convertido a factura
  "negotiating", // En negociación
]);

/**
 * Tipos de línea de presupuesto
 */
const quoteItemTypeSchema = z.enum([
  "service",
  "part",
  "labor",
  "travel",
  "material",
  "other",
]);

/**
 * Esquema de línea de presupuesto
 */
const quoteItemSchema = z.object({
  id: z.string(),
  type: quoteItemTypeSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(21),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  optional: z.boolean().default(false), // Línea opcional
});

/**
 * Esquema de información de negocio
 */
const businessInfoSchema = z.object({
  name: z.string().min(1).max(255),
  taxId: z.string().max(50),
  address: z.string().max(500),
  city: z.string().max(100),
  postalCode: z.string().max(20),
  phone: z.string().max(50),
  email: z.string().email(),
  bankAccount: z.string().max(50).optional(),
  logo: z.string().url().optional(),
}).optional();

/**
 * Esquema de paginación
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["quoteNumber", "date", "validUntil", "total", "status", "clientName"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: quoteStatusSchema.optional(),
  clientId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isExpired: z.boolean().optional(),
});

/**
 * Esquema base de presupuesto
 */
const quoteBaseSchema = z.object({
  quoteNumber: z.string().min(1).max(50),
  clientId: z.number().int().positive(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().optional().nullable(),
  clientAddress: z.string().max(500).optional().nullable(),
  clientTaxId: z.string().max(50).optional().nullable(),
  pianoId: z.number().int().positive().optional().nullable(),
  pianoDescription: z.string().max(500).optional().nullable(),
  title: z.string().min(1, "El título es obligatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
  date: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  status: quoteStatusSchema.default("draft"),
  items: z.array(quoteItemSchema).min(1, "Debe haber al menos una línea"),
  subtotal: z.number().min(0),
  totalDiscount: z.number().min(0).default(0),
  taxAmount: z.number().min(0),
  total: z.number().min(0),
  currency: z.string().max(3).default("EUR"),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  termsAndConditions: z.string().max(5000).optional().nullable(),
  businessInfo: businessInfoSchema,
  // Seguimiento
  sentAt: z.string().or(z.date()).optional().nullable(),
  viewedAt: z.string().or(z.date()).optional().nullable(),
  acceptedAt: z.string().or(z.date()).optional().nullable(),
  rejectedAt: z.string().or(z.date()).optional().nullable(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  // Referencia a factura si se convirtió
  convertedToInvoiceId: z.number().optional().nullable(),
  // Plantilla usada
  templateId: z.string().optional().nullable(),
});

/**
 * Esquema de plantilla de presupuesto
 */
const quoteTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  title: z.string().max(255),
  items: z.array(quoteItemSchema),
  notes: z.string().max(2000).optional(),
  termsAndConditions: z.string().max(5000).optional(),
  validityDays: z.number().int().min(1).max(365).default(30),
  isDefault: z.boolean().default(false),
});

// ============================================================================
// PLANTILLAS PREDEFINIDAS
// ============================================================================

const DEFAULT_TEMPLATES: z.infer<typeof quoteTemplateSchema>[] = [
  {
    id: "tuning-basic",
    name: "Afinación Básica",
    description: "Presupuesto estándar para afinación de piano",
    title: "Presupuesto de Afinación",
    items: [
      {
        id: "1",
        type: "service",
        name: "Afinación de piano",
        description: "Afinación completa del instrumento a 440Hz",
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
        subtotal: 80,
        total: 96.8,
        optional: false,
      },
    ],
    notes: "El precio incluye desplazamiento dentro del área metropolitana.",
    termsAndConditions: "Presupuesto válido por 30 días. El pago se realizará al finalizar el servicio.",
    validityDays: 30,
    isDefault: true,
  },
  {
    id: "maintenance-complete",
    name: "Mantenimiento Completo",
    description: "Presupuesto para mantenimiento integral del piano",
    title: "Presupuesto de Mantenimiento Completo",
    items: [
      {
        id: "1",
        type: "service",
        name: "Afinación de piano",
        quantity: 1,
        unitPrice: 80,
        discount: 0,
        taxRate: 21,
        subtotal: 80,
        total: 96.8,
        optional: false,
      },
      {
        id: "2",
        type: "service",
        name: "Regulación del mecanismo",
        description: "Ajuste de la mecánica para óptima respuesta",
        quantity: 1,
        unitPrice: 120,
        discount: 0,
        taxRate: 21,
        subtotal: 120,
        total: 145.2,
        optional: false,
      },
      {
        id: "3",
        type: "service",
        name: "Limpieza interior",
        description: "Limpieza profunda del interior del piano",
        quantity: 1,
        unitPrice: 50,
        discount: 0,
        taxRate: 21,
        subtotal: 50,
        total: 60.5,
        optional: true,
      },
    ],
    notes: "Se recomienda realizar este mantenimiento anualmente.",
    termsAndConditions: "Presupuesto válido por 30 días. Garantía de 6 meses en todos los trabajos.",
    validityDays: 30,
    isDefault: false,
  },
  {
    id: "repair-estimate",
    name: "Reparación",
    description: "Plantilla para presupuestos de reparación",
    title: "Presupuesto de Reparación",
    items: [
      {
        id: "1",
        type: "labor",
        name: "Mano de obra",
        description: "Horas de trabajo estimadas",
        quantity: 1,
        unitPrice: 45,
        discount: 0,
        taxRate: 21,
        subtotal: 45,
        total: 54.45,
        optional: false,
      },
      {
        id: "2",
        type: "part",
        name: "Piezas y materiales",
        description: "A determinar según diagnóstico",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 21,
        subtotal: 0,
        total: 0,
        optional: false,
      },
    ],
    notes: "El presupuesto final se confirmará tras la inspección del instrumento.",
    termsAndConditions: "Presupuesto orientativo. El precio final puede variar según el diagnóstico.",
    validityDays: 15,
    isDefault: false,
  },
];

// ============================================================================
// ROUTER
// ============================================================================

export const quotesRouter = router({
  /**
   * Lista de presupuestos con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "date", sortOrder: "desc" };
      
      const allQuotes = await db.getQuotes(ctx.user.openId);
      const today = new Date();
      
      // Marcar presupuestos expirados
      let filtered = allQuotes.map(quote => {
        if (quote.status === "sent" && quote.validUntil && new Date(quote.validUntil) < today) {
          return { ...quote, status: "expired" as const };
        }
        return quote;
      });
      
      // Filtrar
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(q => 
          q.quoteNumber.toLowerCase().includes(searchLower) ||
          q.clientName.toLowerCase().includes(searchLower) ||
          q.title?.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.status) {
        filtered = filtered.filter(q => q.status === pagination.status);
      }
      
      if (pagination.clientId) {
        filtered = filtered.filter(q => q.clientId === pagination.clientId);
      }
      
      if (pagination.dateFrom) {
        const fromDate = new Date(pagination.dateFrom);
        filtered = filtered.filter(q => new Date(q.date) >= fromDate);
      }
      
      if (pagination.dateTo) {
        const toDate = new Date(pagination.dateTo);
        filtered = filtered.filter(q => new Date(q.date) <= toDate);
      }
      
      if (pagination.isExpired !== undefined) {
        filtered = filtered.filter(q => {
          const isExpired = q.validUntil && new Date(q.validUntil) < today;
          return pagination.isExpired ? isExpired : !isExpired;
        });
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        let aVal: string | number | Date = a[pagination.sortBy as keyof typeof a] ?? "";
        let bVal: string | number | Date = b[pagination.sortBy as keyof typeof b] ?? "";
        
        if (pagination.sortBy === "date" || pagination.sortBy === "validUntil") {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return pagination.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return pagination.sortOrder === "asc" ? comparison : -comparison;
      });
      
      // Paginar
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const offset = (pagination.page - 1) * pagination.limit;
      const items = filtered.slice(offset, offset + pagination.limit);
      
      // Estadísticas
      const stats = {
        total: allQuotes.length,
        totalValue: allQuotes.reduce((sum, q) => sum + Number(q.total || 0), 0),
        acceptedValue: allQuotes.filter(q => q.status === "accepted" || q.status === "converted")
          .reduce((sum, q) => sum + Number(q.total || 0), 0),
        conversionRate: allQuotes.length > 0
          ? (allQuotes.filter(q => q.status === "accepted" || q.status === "converted").length / allQuotes.length) * 100
          : 0,
        byStatus: {
          draft: allQuotes.filter(q => q.status === "draft").length,
          sent: allQuotes.filter(q => q.status === "sent").length,
          accepted: allQuotes.filter(q => q.status === "accepted").length,
          rejected: allQuotes.filter(q => q.status === "rejected").length,
          expired: allQuotes.filter(q => q.status === "expired" || 
            (q.status === "sent" && q.validUntil && new Date(q.validUntil) < today)).length,
          converted: allQuotes.filter(q => q.status === "converted").length,
        },
        expiringSoon: allQuotes.filter(q => {
          if (q.status !== "sent" || !q.validUntil) return false;
          const validUntil = new Date(q.validUntil);
          const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return validUntil > today && validUntil <= sevenDaysFromNow;
        }).length,
      };
      
      return {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasMore: pagination.page < totalPages,
        },
        stats,
      };
    }),
  
  /**
   * Obtener presupuesto por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getQuote(ctx.user.openId, input.id)),
  
  /**
   * Obtener presupuestos de un cliente
   */
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ ctx, input }) => db.getQuotesByClient(ctx.user.openId, input.clientId)),
  
  /**
   * Obtener siguiente número de presupuesto
   */
  getNextNumber: protectedProcedure.query(async ({ ctx }) => {
    const quotes = await db.getQuotes(ctx.user.openId);
    const year = new Date().getFullYear();
    
    const lastNumber = quotes
      .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
      .map(q => {
        const match = q.quoteNumber.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    
    return `PRES-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
  }),
  
  /**
   * Crear nuevo presupuesto
   */
  create: protectedProcedure
    .input(quoteBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Recalcular totales
      const itemsTotal = input.items
        .filter(item => !item.optional)
        .reduce((sum, item) => sum + item.total, 0);
      
      const optionalTotal = input.items
        .filter(item => item.optional)
        .reduce((sum, item) => sum + item.total, 0);
      
      return db.createQuote({
        ...input,
        subtotal: Number(input.subtotal),
        taxAmount: Number(input.taxAmount),
        total: Number(input.total),
        date: new Date(input.date),
        validUntil: new Date(input.validUntil),
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar presupuesto existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(quoteBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, date, validUntil, sentAt, viewedAt, acceptedAt, rejectedAt, ...data } = input;
      
      const updateData: Record<string, unknown> = { ...data };
      
      if (date) updateData.date = new Date(date);
      if (validUntil) updateData.validUntil = new Date(validUntil);
      if (sentAt) updateData.sentAt = new Date(sentAt);
      if (viewedAt) updateData.viewedAt = new Date(viewedAt);
      if (acceptedAt) updateData.acceptedAt = new Date(acceptedAt);
      if (rejectedAt) updateData.rejectedAt = new Date(rejectedAt);
      
      return db.updateQuote(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar presupuesto
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteQuote(ctx.user.openId, input.id)),
  
  /**
   * Cambiar estado de presupuesto
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: quoteStatusSchema,
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { status: input.status };
      const now = new Date();
      
      switch (input.status) {
        case "sent":
          updateData.sentAt = now;
          break;
        case "viewed":
          updateData.viewedAt = now;
          break;
        case "accepted":
          updateData.acceptedAt = now;
          break;
        case "rejected":
          updateData.rejectedAt = now;
          if (input.rejectionReason) {
            updateData.rejectionReason = input.rejectionReason;
          }
          break;
      }
      
      return db.updateQuote(ctx.user.openId, input.id, updateData);
    }),
  
  /**
   * Convertir presupuesto a factura
   */
  convertToInvoice: protectedProcedure
    .input(z.object({
      id: z.number(),
      includeOptionalItems: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const quote = await db.getQuote(ctx.user.openId, input.id);
      if (!quote) {
        throw new Error("Presupuesto no encontrado");
      }
      
      if (quote.status === "converted") {
        throw new Error("Este presupuesto ya ha sido convertido a factura");
      }
      
      // Filtrar items según opción
      const items = (quote.items as z.infer<typeof quoteItemSchema>[])?.filter(item => 
        !item.optional || input.includeOptionalItems
      ) || [];
      
      // Recalcular totales
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const taxAmount = items.reduce((sum, item) => sum + (item.subtotal * item.taxRate / 100), 0);
      const total = subtotal + taxAmount;
      
      // Generar número de factura
      const invoices = await db.getInvoices(ctx.user.openId);
      const year = new Date().getFullYear();
      const lastNumber = invoices
        .filter(inv => inv.invoiceNumber.startsWith(String(year)))
        .map(inv => {
          const match = inv.invoiceNumber.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);
      
      const invoiceNumber = `${year}-${String(lastNumber + 1).padStart(4, "0")}`;
      
      // Crear factura
      const invoice = await db.createInvoice({
        odId: ctx.user.openId,
        invoiceNumber,
        clientId: quote.clientId,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientAddress: quote.clientAddress,
        date: new Date(),
        status: "draft",
        items: items.map(item => ({
          description: item.name + (item.description ? ` - ${item.description}` : ""),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total,
        })),
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: String(taxAmount.toFixed(2)),
        total: String(total.toFixed(2)),
        notes: quote.notes,
        businessInfo: quote.businessInfo,
        quoteId: quote.id,
      });
      
      // Actualizar presupuesto
      await db.updateQuote(ctx.user.openId, input.id, {
        status: "converted",
        convertedToInvoiceId: invoice.id || invoice,
      });
      
      return {
        invoiceId: invoice.id || invoice,
        invoiceNumber,
      };
    }),
  
  /**
   * Duplicar presupuesto
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const original = await db.getQuote(ctx.user.openId, input.id);
      if (!original) {
        throw new Error("Presupuesto no encontrado");
      }
      
      // Generar nuevo número
      const quotes = await db.getQuotes(ctx.user.openId);
      const year = new Date().getFullYear();
      const lastNumber = quotes
        .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
        .map(q => {
          const match = q.quoteNumber.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);
      
      const newNumber = `PRES-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
      
      // Calcular nueva fecha de validez
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      
      return db.createQuote({
        ...original,
        id: undefined,
        quoteNumber: newNumber,
        date: new Date(),
        validUntil,
        status: "draft",
        sentAt: null,
        viewedAt: null,
        acceptedAt: null,
        rejectedAt: null,
        convertedToInvoiceId: null,
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Obtener plantillas de presupuesto
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    // Por ahora devolver plantillas predefinidas
    // TODO: Permitir plantillas personalizadas por usuario
    return DEFAULT_TEMPLATES;
  }),
  
  /**
   * Crear presupuesto desde plantilla
   */
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      clientId: z.number(),
      clientName: z.string(),
      clientEmail: z.string().optional(),
      clientAddress: z.string().optional(),
      pianoId: z.number().optional(),
      pianoDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = DEFAULT_TEMPLATES.find(t => t.id === input.templateId);
      if (!template) {
        throw new Error("Plantilla no encontrada");
      }
      
      // Generar número
      const quotes = await db.getQuotes(ctx.user.openId);
      const year = new Date().getFullYear();
      const lastNumber = quotes
        .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
        .map(q => {
          const match = q.quoteNumber.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);
      
      const quoteNumber = `PRES-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
      
      // Calcular totales
      const subtotal = template.items.reduce((sum, item) => sum + item.subtotal, 0);
      const taxAmount = template.items.reduce((sum, item) => sum + (item.subtotal * item.taxRate / 100), 0);
      const total = subtotal + taxAmount;
      
      // Calcular fecha de validez
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + template.validityDays);
      
      return db.createQuote({
        odId: ctx.user.openId,
        quoteNumber,
        clientId: input.clientId,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientAddress: input.clientAddress,
        pianoId: input.pianoId,
        pianoDescription: input.pianoDescription,
        title: template.title,
        date: new Date(),
        validUntil,
        status: "draft",
        items: template.items,
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: String(taxAmount.toFixed(2)),
        total: String(total.toFixed(2)),
        notes: template.notes,
        termsAndConditions: template.termsAndConditions,
        templateId: template.id,
      });
    }),
  
  /**
   * Obtener presupuestos que expiran pronto
   */
  getExpiringSoon: protectedProcedure
    .input(z.object({
      daysAhead: z.number().int().min(1).max(30).default(7),
    }).optional())
    .query(async ({ ctx, input }) => {
      const daysAhead = input?.daysAhead || 7;
      const quotes = await db.getQuotes(ctx.user.openId);
      const today = new Date();
      const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      return quotes.filter(q => {
        if (q.status !== "sent" || !q.validUntil) return false;
        const validUntil = new Date(q.validUntil);
        return validUntil > today && validUntil <= cutoff;
      }).sort((a, b) => new Date(a.validUntil!).getTime() - new Date(b.validUntil!).getTime());
    }),
});
