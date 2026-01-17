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
import { 
  filterByPartnerAndOrganization,
  filterByPartner,
  addOrganizationToInsert,
  validateWritePermission
} from "../utils/multi-tenant.js";
import { withOrganizationContext } from "../middleware/organization-context.js";
import { withCache, invalidatePath, invalidateUserCache } from "../lib/cache.middleware.js";

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
 * Calcula estadísticas de presupuestos con agregaciones SQL (OPTIMIZADO)
 */
async function calculateQuoteStatsOptimized(database: any, partnerId: string) {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Obtener conteos y sumas por status en una sola query
  const statsQuery = await database
    .select({
      status: quotes.status,
      count: count(),
      totalValue: sql<number>`COALESCE(SUM(CAST(${quotes.total} AS DECIMAL(10,2))), 0)`,
    })
    .from(quotes)
    .where(filterByPartner(quotes.partnerId, partnerId))
    .groupBy(quotes.status);
  
  // Procesar resultados
  let total = 0;
  let totalValue = 0;
  let acceptedValue = 0;
  const byStatus = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    converted: 0,
    negotiating: 0,
    viewed: 0,
  };
  
  statsQuery.forEach((row: any) => {
    const statusCount = Number(row.count);
    const statusValue = Number(row.totalValue);
    
    total += statusCount;
    totalValue += statusValue;
    
    if (row.status === 'accepted' || row.status === 'converted') {
      acceptedValue += statusValue;
    }
    
    if (row.status in byStatus) {
      byStatus[row.status as keyof typeof byStatus] = statusCount;
    }
  });
  
  // Calcular tasa de conversión
  const acceptedOrConverted = byStatus.accepted + byStatus.converted;
  const conversionRate = total > 0 ? (acceptedOrConverted / total) * 100 : 0;
  
  // Contar presupuestos que expiran pronto (requiere query separada por la lógica de fechas)
  const expiringSoonQuery = await database
    .select({ count: count() })
    .from(quotes)
    .where(
      and(
        filterByPartner(quotes.partnerId, partnerId),
        eq(quotes.status, 'sent'),
        gte(quotes.validUntil, today),
        lte(quotes.validUntil, sevenDaysFromNow)
      )
    );
  
  const expiringSoon = Number(expiringSoonQuery[0]?.count || 0);
  
  return {
    total,
    totalValue,
    acceptedValue,
    conversionRate,
    byStatus,
    expiringSoon,
  };
}

/**
 * Calcula estadísticas de presupuestos (LEGACY - mantener para compatibilidad)
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
// PROCEDURE CON CONTEXTO DE ORGANIZACIÓN
// ============================================================================

const orgProcedure = protectedProcedure.use(withOrganizationContext);

// ============================================================================
// ROUTER
// ============================================================================

export const quotesRouter = router({
  /**
   * Lista de presupuestos con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(withCache(
      async ({ ctx, input }) => {
      const { 
        limit = 30, 
        cursor, 
        sortBy = "date", 
        sortOrder = "desc", 
        search, 
        status, 
        clientId, 
        dateFrom, 
        dateTo,
        isExpired
      } = input || {};
      
      const database = await db.getDb();
      if (!database) return { items: [], total: 0, stats: null };

      // Construir condiciones WHERE con filtrado por organización
      const whereClauses = [
        filterByPartner(quotes.partnerId, ctx.partnerId)
      ];
      
      if (search) {
        whereClauses.push(
          or(
            ilike(quotes.quoteNumber, `%${search}%`),
            ilike(quotes.clientName, `%${search}%`),
            ilike(quotes.title, `%${search}%`)
          )!
        );
      }
      
      if (status) {
        whereClauses.push(eq(quotes.status, status));
      }
      
      if (clientId) {
        whereClauses.push(eq(quotes.clientId, clientId));
      }
      
      if (dateFrom) {
        whereClauses.push(gte(quotes.date, new Date(dateFrom).toISOString()));
      }
      
      if (dateTo) {
        whereClauses.push(lte(quotes.date, new Date(dateTo).toISOString()));
      }

      // Construir ORDER BY
      const sortColumn = quotes[sortBy as keyof typeof quotes] || quotes.date;
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Consulta principal con paginación
      const offset = cursor || 0;
      let items = await database
        .select()
        .from(quotes)
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Marcar presupuestos expirados
      items = markExpiredQuotes(items);

      // Aplicar filtro de expirados si se especificó
      if (isExpired !== undefined) {
        const today = new Date();
        items = items.filter(q => {
          const expired = q.validUntil && new Date(q.validUntil) < today;
          return isExpired ? expired : !expired;
        });
      }

      // Contar total
      const [{ total }] = await database
        .select({ total: count() })
        .from(quotes)
        .where(and(...whereClauses));

      // Calcular estadísticas con agregaciones SQL (optimizado)
      const stats = await calculateQuoteStatsOptimized(database, ctx.partnerId);

      let nextCursor: number | undefined = undefined;
      if (items.length === limit) {
        nextCursor = offset + limit;
      }

      return { items, nextCursor, total, stats };
    },
    { ttl: 300, prefix: 'quotes', includeUser: true, procedurePath: 'quotes.list' }
  )),
  
  /**
   * Lista completa sin paginación (para selects)
   */
  listAll: orgProcedure.query(withCache(
    async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    const items = await database
      .select()
      .from(quotes)
      .where(
        filterByPartner(quotes.partnerId, ctx.partnerId),
      )
      .orderBy(desc(quotes.date));

    return markExpiredQuotes(items);
  },
  { ttl: 300, prefix: 'quotes', includeUser: true, procedurePath: 'quotes.listAll' }
)),
  
  /**
   * Obtener presupuesto por ID
   */
  get: orgProcedure
    .input(z.object({ id: z.number() }))
    .query(withCache(
      async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [quote] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!quote) throw new Error("Presupuesto no encontrado");
      
      // Marcar como expirado si corresponde
      const [markedQuote] = markExpiredQuotes([quote]);
      return markedQuote;
    },
    { ttl: 300, prefix: 'quotes', includeUser: true, procedurePath: 'quotes.getById' }
  )),
  
  /**
   * Obtener presupuestos de un cliente
   */
  byClient: orgProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.clientId, input.clientId
          )
          )
        )
        .orderBy(desc(quotes.date));

      return markExpiredQuotes(items);
    }),
  
  /**
   * Obtener siguiente número de presupuesto
   */
  getNextNumber: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return "PRES-2025-0001";

    const year = new Date().getFullYear();
    
    const allQuotes = await database
      .select({ quoteNumber: quotes.quoteNumber })
      .from(quotes)
      .where(
        filterByPartner(quotes.partnerId, ctx.partnerId),
      )
      .orderBy(desc(quotes.createdAt));

    const lastNumber = allQuotes
      .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
      .map(q => {
        const match = q.quoteNumber.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);

    return `PRES-${year}-${String(lastNumber + 1).padStart(4, "0")}`;
  }),
  
  /**
   * Crear nuevo presupuesto
   */
  create: orgProcedure
    .input(quoteBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Preparar datos con partnerId, odId y organizationId
      const quoteData = addOrganizationToInsert(
        {
          quoteNumber: input.quoteNumber,
          clientId: input.clientId,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientAddress: input.clientAddress,
          pianoId: input.pianoId,
          pianoDescription: input.pianoDescription,
          title: input.title,
          description: input.description,
          date: new Date(input.date).toISOString(),
          validUntil: new Date(input.validUntil).toISOString(),
          status: input.status,
          items: input.items,
          subtotal: input.subtotal.toString(),
          totalDiscount: input.totalDiscount.toString(),
          taxAmount: input.taxAmount.toString(),
          total: input.total.toString(),
          currency: input.currency,
          notes: input.notes,
          termsAndConditions: input.termsAndConditions,
          businessInfo: input.businessInfo,
        },
        ctx.orgContext,
        "quotes"
      );
      
      const result = await database.insert(quotes).values(quoteData);
      
      await invalidateUserCache(ctx.user.id);
      await invalidatePath('quotes');
      
      return result[0].insertId;
    }),
  
  /**
   * Actualizar presupuesto existente
   */
  update: orgProcedure
    .input(z.object({
      id: z.number(),
    }).merge(quoteBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el presupuesto para verificar permisos
      const [existingQuote] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!existingQuote) {
        throw new Error("Presupuesto no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "quotes", existingQuote.odId);

      const { id, ...data } = input;
      
      // Preparar datos para actualización
      const updateData: any = {};
      if (data.quoteNumber !== undefined) updateData.quoteNumber = data.quoteNumber;
      if (data.clientId !== undefined) updateData.clientId = data.clientId;
      if (data.clientName !== undefined) updateData.clientName = data.clientName;
      if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
      if (data.clientAddress !== undefined) updateData.clientAddress = data.clientAddress;
      if (data.pianoId !== undefined) updateData.pianoId = data.pianoId;
      if (data.pianoDescription !== undefined) updateData.pianoDescription = data.pianoDescription;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = new Date(data.date);
      if (data.validUntil !== undefined) updateData.validUntil = new Date(data.validUntil);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.items !== undefined) updateData.items = data.items;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal.toString();
      if (data.totalDiscount !== undefined) updateData.totalDiscount = data.totalDiscount.toString();
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount.toString();
      if (data.total !== undefined) updateData.total = data.total.toString();
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.termsAndConditions !== undefined) updateData.termsAndConditions = data.termsAndConditions;
      if (data.businessInfo !== undefined) updateData.businessInfo = data.businessInfo;
      if (data.sentAt !== undefined) updateData.sentAt = data.sentAt ? new Date(data.sentAt) : null;
      if (data.viewedAt !== undefined) updateData.viewedAt = data.viewedAt ? new Date(data.viewedAt) : null;
      if (data.acceptedAt !== undefined) updateData.acceptedAt = data.acceptedAt ? new Date(data.acceptedAt) : null;
      if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt ? new Date(data.rejectedAt) : null;
      if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
      if (data.convertedToInvoiceId !== undefined) updateData.convertedToInvoiceId = data.convertedToInvoiceId;

      await database
        .update(quotes)
        .set(updateData)
        .where(eq(quotes.id, id));
      
      await invalidateUserCache(ctx.user.id);
      await invalidatePath('quotes');
      
      return { success: true };
    }),
  
  /**
   * Eliminar presupuesto
   */
  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el presupuesto para verificar permisos
      const [existingQuote] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!existingQuote) {
        throw new Error("Presupuesto no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "quotes", existingQuote.odId);

      await database.delete(quotes).where(eq(quotes.id, input.id));
      
      await invalidateUserCache(ctx.user.id);
      await invalidatePath('quotes');
      
      return { success: true };
    }),
  
  /**
   * Cambiar estado de presupuesto
   */
  updateStatus: orgProcedure
    .input(z.object({
      id: z.number(),
      status: quoteStatusSchema,
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el presupuesto para verificar permisos
      const [existingQuote] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!existingQuote) {
        throw new Error("Presupuesto no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "quotes", existingQuote.odId);

      const updateData: any = { status: input.status };
      const now = new Date();
      
      // Actualizar timestamps según el estado
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

      await database
        .update(quotes)
        .set(updateData)
        .where(eq(quotes.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Convertir presupuesto a factura
   */
  convertToInvoice: orgProcedure
    .input(z.object({
      id: z.number(),
      includeOptionalItems: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el presupuesto
      const [quote] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!quote) {
        throw new Error("Presupuesto no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "quotes", quote.odId);

      if (quote.status === "converted") {
        throw new Error("Este presupuesto ya ha sido convertido a factura");
      }

      // Filtrar items según opción
      const quoteItems = (quote.items as z.infer<typeof quoteItemSchema>[]) || [];
      const items = quoteItems.filter(item => 
        !item.optional || input.includeOptionalItems
      );

      // Recalcular totales
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const taxAmount = items.reduce((sum, item) => sum + (item.subtotal * item.taxRate / 100), 0);
      const total = subtotal + taxAmount;

      // Generar número de factura
      const allInvoices = await database
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(
          filterByPartnerAndOrganization(
            invoices,
            ctx.partnerId,
            ctx.orgContext,
            "invoices"
          )
        )
        .orderBy(desc(invoices.createdAt));

      const year = new Date().getFullYear();
      const lastNumber = allInvoices
        .filter(inv => inv.invoiceNumber.startsWith(`INV-${year}`))
        .map(inv => {
          const match = inv.invoiceNumber.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);

      const invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(4, "0")}`;

      // Preparar datos de factura
      const invoiceData = addOrganizationToInsert(
        {
          invoiceNumber,
          clientId: quote.clientId,
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          clientAddress: quote.clientAddress,
          date: new Date().toISOString(),
          status: "draft",
          items: items.map(item => ({
            description: item.name + (item.description ? ` - ${item.description}` : ""),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total,
          })),
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          notes: quote.notes,
          businessInfo: quote.businessInfo,
        },
        ctx.orgContext,
        "invoices"
      );

      // Crear factura
      const invoiceResult = await database.insert(invoices).values(invoiceData);
      const invoiceId = invoiceResult[0].insertId;

      // Actualizar presupuesto
      await database
        .update(quotes)
        .set({
          status: "converted",
          convertedToInvoiceId: invoiceId,
        })
        .where(eq(quotes.id, input.id));

      return {
        invoiceId,
        invoiceNumber,
      };
    }),
  
  /**
   * Duplicar presupuesto
   */
  duplicate: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el presupuesto original
      const [original] = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            eq(quotes.id, input.id
          )
          )
        );

      if (!original) {
        throw new Error("Presupuesto no encontrado");
      }

      // Generar nuevo número
      const year = new Date().getFullYear();
      const allQuotes = await database
        .select({ quoteNumber: quotes.quoteNumber })
        .from(quotes)
        .where(
          filterByPartner(quotes.partnerId, ctx.partnerId),
        )
        .orderBy(desc(quotes.createdAt));

      const lastNumber = allQuotes
        .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
        .map(q => {
          const match = q.quoteNumber.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);

      const newNumber = `PRES-${year}-${String(lastNumber + 1).padStart(4, "0")}`;

      // Calcular nueva fecha de validez (30 días desde hoy)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // Preparar datos del nuevo presupuesto
      const newQuoteData = addOrganizationToInsert(
        {
          quoteNumber: newNumber,
          clientId: original.clientId,
          clientName: original.clientName,
          clientEmail: original.clientEmail,
          clientAddress: original.clientAddress,
          pianoId: original.pianoId,
          pianoDescription: original.pianoDescription,
          title: original.title,
          description: original.description,
          date: new Date().toISOString(),
          validUntil,
          status: "draft",
          items: original.items,
          subtotal: original.subtotal,
          totalDiscount: original.totalDiscount,
          taxAmount: original.taxAmount,
          total: original.total,
          currency: original.currency,
          notes: original.notes,
          termsAndConditions: original.termsAndConditions,
          businessInfo: original.businessInfo,
        },
        ctx.orgContext,
        "quotes"
      );

      const result = await database.insert(quotes).values(newQuoteData);
      return result[0].insertId;
    }),
  
  /**
   * Obtener plantillas de presupuesto
   */
  getTemplates: orgProcedure.query(async ({ ctx }) => {
    // Por ahora devolver plantillas predefinidas
    // TODO: Permitir plantillas personalizadas por usuario/organización
    return DEFAULT_TEMPLATES;
  }),
  
  /**
   * Crear presupuesto desde plantilla
   */
  createFromTemplate: orgProcedure
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
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const template = DEFAULT_TEMPLATES.find(t => t.id === input.templateId);
      if (!template) {
        throw new Error("Plantilla no encontrada");
      }

      // Generar número
      const year = new Date().getFullYear();
      const allQuotes = await database
        .select({ quoteNumber: quotes.quoteNumber })
        .from(quotes)
        .where(
          filterByPartner(quotes.partnerId, ctx.partnerId),
        )
        .orderBy(desc(quotes.createdAt));

      const lastNumber = allQuotes
        .filter(q => q.quoteNumber.startsWith(`PRES-${year}`))
        .map(q => {
          const match = q.quoteNumber.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
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

      // Preparar datos del presupuesto
      const quoteData = addOrganizationToInsert(
        {
          quoteNumber,
          clientId: input.clientId,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientAddress: input.clientAddress,
          pianoId: input.pianoId,
          pianoDescription: input.pianoDescription,
          title: template.title,
          date: new Date().toISOString(),
          validUntil,
          status: "draft",
          items: template.items,
          subtotal: subtotal.toString(),
          totalDiscount: "0",
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          currency: "EUR",
          notes: template.notes,
          termsAndConditions: template.termsAndConditions,
        },
        ctx.orgContext,
        "quotes"
      );

      const result = await database.insert(quotes).values(quoteData);
      return result[0].insertId;
    }),
  
  /**
   * Obtener presupuestos que expiran pronto
   */
  getExpiringSoon: orgProcedure
    .input(z.object({
      daysAhead: z.number().int().min(1).max(30).default(7),
    }).optional())
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const daysAhead = input?.daysAhead || 7;
      const today = new Date();
      const cutoff = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const items = await database
        .select()
        .from(quotes)
        .where(
          and(
            filterByPartner(quotes.partnerId, ctx.partnerId),
            and(
              eq(quotes.status, "sent"
          ),
              gte(quotes.validUntil, today),
              lte(quotes.validUntil, cutoff)
            )
          )
        )
        .orderBy(asc(quotes.validUntil));

      return items;
    }),
  
  /**
   * Obtener estadísticas de presupuestos
   */
  getStats: orgProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return null;

      const whereClauses = [
        filterByPartner(quotes.partnerId, ctx.partnerId),
      ];

      if (input?.dateFrom) {
        whereClauses.push(gte(quotes.date, new Date(input.dateFrom).toISOString()));
      }

      if (input?.dateTo) {
        whereClauses.push(lte(quotes.date, new Date(input.dateTo).toISOString()));
      }

      const items = await database
        .select()
        .from(quotes)
        .where(and(...whereClauses));

      return calculateQuoteStats(items);
    }),
});
