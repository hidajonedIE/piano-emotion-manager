/**
 * Quotes Router
 * Gestión de presupuestos con paginación, plantillas y conversión a factura
 * Soporte completo para organizaciones con sharing configurable
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { quotes, invoices } from "../../drizzle/schema.js";
import { eq, and, or, gte, lte, ilike, asc, desc, count, sql } from "drizzle-orm";
import { filterByPartner, filterByPartnerAnd, addPartnerToInsert, validateWritePermission } from "../utils/multi-tenant.js";


const orgProcedure = protectedProcedure;

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
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.number().optional(),
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
// UTILIDADES
// ============================================================================

/**
 * Marca presupuestos como expirados si la fecha de validez ha pasado
 */
function markExpiredQuotes(quotesList: any[]): any[] {
  const now = new Date();
  return quotesList.map(quote => {
    if (quote.status === 'sent' && quote.validUntil && new Date(quote.validUntil) < now) {
      return { ...quote, status: 'expired' as const };
    }
    return quote;
  });
}

/**
 * Calcula estadísticas de presupuestos
 */
function calculateQuoteStats(quotesList: any[]) {
  const today = new Date();
  const markedQuotes = markExpiredQuotes(quotesList);
  
  const total = markedQuotes.length;
  const totalValue = markedQuotes.reduce((sum, q) => {
    const amount = typeof q.total === 'string' ? parseFloat(q.total) : q.total;
    return sum + (amount || 0);
  }, 0);
  
  const acceptedOrConverted = markedQuotes.filter(q => q.status === 'accepted' || q.status === 'converted');
  const acceptedValue = acceptedOrConverted.reduce((sum, q) => {
    const amount = typeof q.total === 'string' ? parseFloat(q.total) : q.total;
    return sum + (amount || 0);
  }, 0);
  
  const conversionRate = total > 0 ? (acceptedOrConverted.length / total) * 100 : 0;
  
  const byStatus = {
    draft: markedQuotes.filter(q => q.status === 'draft').length,
    sent: markedQuotes.filter(q => q.status === 'sent').length,
    accepted: markedQuotes.filter(q => q.status === 'accepted').length,
    rejected: markedQuotes.filter(q => q.status === 'rejected').length,
    expired: markedQuotes.filter(q => q.status === 'expired').length,
    converted: markedQuotes.filter(q => q.status === 'converted').length,
    negotiating: markedQuotes.filter(q => q.status === 'negotiating').length,
  };
  
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = quotesList.filter(q => {
    if (q.status !== 'sent' || !q.validUntil) return false;
    const validUntil = new Date(q.validUntil);
    return validUntil > today && validUntil <= sevenDaysFromNow;
  }).length;

  return {
    total,
    totalValue,
    acceptedValue,
    conversionRate,
    byStatus,
    expiringSoon,
  };
}

// ============================================================================
// ROUTER
// ============================================================================

export const quotesRouter = router({
  /**
   * Listar presupuestos con paginación y filtros
   */
  list: orgProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, sortBy, sortOrder, search, status, clientId, dateFrom, dateTo, isExpired } = input;

      const whereClauses: any[] = [
        filterByPartner(quotes.partnerId, ctx.partnerId),
      ];

      if (search) {
        whereClauses.push(
          or(
            ilike(quotes.quoteNumber, `%${search}%`),
            ilike(quotes.clientName, `%${search}%`),
            ilike(quotes.title, `%${search}%`)
          )
        );
      }

      if (status) {
        whereClauses.push(eq(quotes.status, status));
      }

      if (clientId) {
        whereClauses.push(eq(quotes.clientId, clientId));
      }

      if (dateFrom) {
        whereClauses.push(gte(quotes.date, dateFrom));
      }

      if (dateTo) {
        whereClauses.push(lte(quotes.date, dateTo));
      }

      if (isExpired) {
        whereClauses.push(and(eq(quotes.status, 'sent'), lte(quotes.validUntil, new Date().toISOString())));
      }

      const items = await db.query.quotes.findMany({
        where: and(...whereClauses),
        orderBy: [sortOrder === "asc" ? asc(quotes[sortBy]) : desc(quotes[sortBy])],
        limit: limit + 1,
        offset: cursor ? cursor * limit : 0,
      });

      let nextCursor: number | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = cursor ? cursor + 1 : 1;
      }

      return {
        items: markExpiredQuotes(items),
        nextCursor,
      };
    }),

  /**
   * Listar todos los presupuestos (para estadísticas, etc.)
   */
  listAll: orgProcedure
    .query(async ({ ctx }) => {
      return db.query.quotes.findMany({
        where: filterByPartner(quotes.partnerId, ctx.partnerId),
      });
    }),

  /**
   * Obtener un presupuesto por ID
   */
  byId: orgProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [quote] = await db.select().from(quotes).where(
        filterByPartnerAnd(quotes.partnerId, ctx.partnerId, eq(quotes.id, input.id))
      );
      return quote ? markExpiredQuotes([quote])[0] : null;
    }),

  /**
   * Obtener presupuestos por cliente
   */
  byClientId: orgProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const clientQuotes = await db.select().from(quotes).where(
filterByPartnerAnd(quotes.partnerId, ctx.partnerId, eq(quotes.clientId, input.clientId))
      );
      return markExpiredQuotes(clientQuotes);
    }),

  /**
   * Obtener estadísticas de presupuestos
   */
  getStats: orgProcedure
    .query(async ({ ctx }) => {
      const allQuotes = await db.query.quotes.findMany({
        where: filterByPartner(quotes.partnerId, ctx.partnerId),
        columns: { total: true, status: true, validUntil: true },
      });
      return calculateQuoteStats(allQuotes);
    }),

  /**
   * Obtener el siguiente número de presupuesto
   */
  getNextNumber: orgProcedure
    .query(async ({ ctx }) => {
      const [lastQuote] = await db.select({ quoteNumber: quotes.quoteNumber }).from(quotes).where(
        filterByPartner(quotes.partnerId, ctx.partnerId)
      ).orderBy(desc(quotes.createdAt)).limit(1);

      if (!lastQuote || !lastQuote.quoteNumber) {
        return `PRE-${new Date().getFullYear()}-0001`;
      }

      const match = lastQuote.quoteNumber.match(/(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `PRE-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;
      }

      return `PRE-${new Date().getFullYear()}-0001`;
    }),

  /**
   * Crear un nuevo presupuesto
   */
  create: orgProcedure
    .input(quoteBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const quoteData = {
        ...addPartnerToInsert(
          {
            ...input,
            date: new Date(input.date),
            validUntil: new Date(input.validUntil),
            subtotal: input.subtotal.toString(),
            totalDiscount: input.totalDiscount.toString(),
            taxAmount: input.taxAmount.toString(),
            total: input.total.toString(),
          },
          ctx.partnerId
        ),
        odId: ctx.user.id,
      };

      const [newQuote] = await db.insert(quotes).values(quoteData).returning();
      return newQuote;
    }),

  /**
   * Actualizar un presupuesto
   */
  update: orgProcedure
    .input(quoteBaseSchema.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [existingQuote] = await db.select().from(quotes).where(eq(quotes.id, id));
      if (!existingQuote) {
        throw new Error("Presupuesto no encontrado");
      }

      // validateWritePermission(ctx.orgContext, "quotes", existingQuote.odId);

      const [updatedQuote] = await db.update(quotes).set({
        ...data,
        date: new Date(data.date),
        validUntil: new Date(data.validUntil),
        subtotal: data.subtotal.toString(),
        totalDiscount: data.totalDiscount.toString(),
        taxAmount: data.taxAmount.toString(),
        total: data.total.toString(),
        updatedAt: new Date(),
      }).where(eq(quotes.id, id)).returning();

      return updatedQuote;
    }),

  /**
   * Eliminar un presupuesto
   */
  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [existingQuote] = await db.select().from(quotes).where(eq(quotes.id, input.id));
      if (!existingQuote) {
        throw new Error("Presupuesto no encontrado");
      }

      // validateWritePermission(ctx.orgContext, "quotes", existingQuote.odId);

      await db.delete(quotes).where(eq(quotes.id, input.id));
      return { success: true };
    }),

  /**
   * Convertir un presupuesto a factura
   */
  convertToInvoice: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, input.id));
      if (!quote) {
        throw new Error("Presupuesto no encontrado");
      }

      if (quote.status === 'converted') {
        throw new Error("Este presupuesto ya ha sido convertido a factura.");
      }

      const [{ count: invoiceCount }] = await db.select({ count: count() }).from(invoices).where(
        filterByPartnerAnd(
          invoices,
          ctx.partnerId,
          ctx.orgContext,
          "invoices"
        )
      );

      const invoiceData = {
          ...addPartnerToInsert(
            {
              invoiceNumber: `FACT-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`,
              clientId: quote.clientId,
              clientName: quote.clientName,
              clientEmail: quote.clientEmail,
              clientAddress: quote.clientAddress,
              clientTaxId: quote.clientTaxId,
              date: new Date(),
              dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
              status: "draft",
              items: quote.items.map(item => ({
                description: item.description || item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                discount: item.discount,
                total: item.total,
              })),
              subtotal: quote.subtotal,
              taxAmount: quote.taxAmount,
              total: quote.total,
              discount: quote.totalDiscount,
              discountType: "fixed",
              notes: `Factura generada desde el presupuesto ${quote.quoteNumber}`,
              quoteId: quote.id,
            },
            ctx.partnerId
          ),
          odId: ctx.user.id,
        };

      const [newInvoice] = await db.insert(invoices).values(invoiceData).returning();

      await db.update(quotes).set({ status: "converted", convertedToInvoiceId: newInvoice.id }).where(eq(quotes.id, quote.id));

      return newInvoice;
    }),

  /**
   * Duplicar un presupuesto
   */
  duplicate: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [originalQuote] = await db.select().from(quotes).where(eq(quotes.id, input.id));
      if (!originalQuote) {
        throw new Error("Presupuesto original no encontrado");
      }

      const { id, createdAt, updatedAt, ...rest } = originalQuote;

      const duplicatedQuoteData = {
        ...addPartnerToInsert(
          {
            ...rest,
            quoteNumber: `COPIA-${originalQuote.quoteNumber}`,
            status: "draft",
            date: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
          },
          ctx.partnerId
        ),
        odId: ctx.user.id,
      };

      const [newQuote] = await db.insert(quotes).values(duplicatedQuoteData).returning();
      return newQuote;
    }),

  // ============================================================================
  // GESTIÓN DE PLANTILLAS
  // ============================================================================

  /**
   * Obtener todas las plantillas de presupuesto
   */
  getTemplates: orgProcedure
    .query(async ({ ctx }) => {
      const customTemplates = await db.query.quote_templates.findMany({
        where: filterByPartnerAnd(
          db.quote_templates,
          ctx.partnerId,
          ctx.orgContext,
          "quote_templates"
        ),
      });
      return [...DEFAULT_TEMPLATES, ...customTemplates];
    }),

  /**
   * Crear una nueva plantilla de presupuesto
   */
  createTemplate: orgProcedure
    .input(quoteTemplateSchema.omit({ id: true, isDefault: true }))
    .mutation(async ({ ctx, input }) => {
      const templateData = {
        ...addPartnerToInsert(
          {
            ...input,
            isDefault: false,
          },
          ctx.partnerId
        ),
        odId: ctx.user.id,
      };
      const [newTemplate] = await db.insert(db.quote_templates).values(templateData).returning();
      return newTemplate;
    }),

  /**
   * Actualizar una plantilla de presupuesto
   */
  updateTemplate: orgProcedure
    .input(quoteTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [existingTemplate] = await db.select().from(db.quote_templates).where(eq(db.quote_templates.id, id));
      if (!existingTemplate) {
        throw new Error("Plantilla no encontrada");
      }

      // validateWritePermission(ctx.orgContext, "quote_templates", existingTemplate.odId);

      const [updatedTemplate] = await db.update(db.quote_templates).set(data).where(eq(db.quote_templates.id, id)).returning();
      return updatedTemplate;
    }),

  /**
   * Eliminar una plantilla de presupuesto
   */
  deleteTemplate: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existingTemplate] = await db.select().from(db.quote_templates).where(eq(db.quote_templates.id, input.id));
      if (!existingTemplate) {
        throw new Error("Plantilla no encontrada");
      }

      if (existingTemplate.isDefault) {
        throw new Error("No se pueden eliminar las plantillas por defecto");
      }

      // validateWritePermission(ctx.orgContext, "quote_templates", existingTemplate.odId);

      await db.delete(db.quote_templates).where(eq(db.quote_templates.id, input.id));
      return { success: true };
    }),
});
