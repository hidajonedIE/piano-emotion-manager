/**
 * Invoices Router
 * Gestión de facturas con validación mejorada y paginación
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Estados de factura
 */
const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "cancelled", "overdue"]);

/**
 * Esquema de línea de factura
 */
const invoiceItemSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria").max(500),
  quantity: z.number().positive("La cantidad debe ser mayor que 0"),
  unitPrice: z.number().min(0, "El precio no puede ser negativo"),
  taxRate: z.number().min(0).max(100).default(21), // IVA por defecto 21%
  discount: z.number().min(0).max(100).default(0), // Descuento en porcentaje
  total: z.number().min(0),
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
 * Esquema de paginación para facturas
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["invoiceNumber", "date", "dueDate", "total", "status", "clientName"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  clientId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/**
 * Esquema base de factura
 */
const invoiceBaseSchema = z.object({
  invoiceNumber: z.string().min(1, "El número de factura es obligatorio").max(50),
  clientId: z.number().int().positive(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().optional().nullable(),
  clientAddress: z.string().max(500).optional().nullable(),
  clientTaxId: z.string().max(50).optional().nullable(), // NIF/CIF del cliente
  date: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  status: invoiceStatusSchema.default("draft"),
  items: z.array(invoiceItemSchema).min(1, "Debe haber al menos una línea"),
  subtotal: z.number().min(0), // Cambiado de string a number
  taxAmount: z.number().min(0), // Cambiado de string a number
  total: z.number().min(0), // Cambiado de string a number
  discount: z.number().min(0).default(0), // Descuento global
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(), // Notas internas (no visibles en factura)
  paymentTerms: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum(["cash", "transfer", "card", "check", "other"]).optional().nullable(),
  businessInfo: businessInfoSchema,
  // Campos para retenciones (IRPF)
  retentionRate: z.number().min(0).max(100).default(0),
  retentionAmount: z.number().min(0).default(0),
  // Referencia a presupuesto si se convirtió
  quoteId: z.number().optional().nullable(),
  // Referencia a servicio si se generó desde un servicio
  serviceId: z.number().optional().nullable(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const invoicesRouter = router({
  /**
   * Lista de facturas con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "date", sortOrder: "desc" };
      
      const allInvoices = await db.getInvoices(ctx.user.openId);
      
      // Filtrar
      let filtered = allInvoices;
      
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(inv => 
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.clientName.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.status) {
        filtered = filtered.filter(inv => inv.status === pagination.status);
      }
      
      if (pagination.clientId) {
        filtered = filtered.filter(inv => inv.clientId === pagination.clientId);
      }
      
      if (pagination.dateFrom) {
        const fromDate = new Date(pagination.dateFrom);
        filtered = filtered.filter(inv => new Date(inv.date) >= fromDate);
      }
      
      if (pagination.dateTo) {
        const toDate = new Date(pagination.dateTo);
        filtered = filtered.filter(inv => new Date(inv.date) <= toDate);
      }
      
      // Marcar facturas vencidas
      const today = new Date();
      filtered = filtered.map(inv => {
        if (inv.status === "sent" && inv.dueDate && new Date(inv.dueDate) < today) {
          return { ...inv, status: "overdue" as const };
        }
        return inv;
      });
      
      // Ordenar
      filtered.sort((a, b) => {
        let aVal: string | number | Date = a[pagination.sortBy as keyof typeof a] ?? "";
        let bVal: string | number | Date = b[pagination.sortBy as keyof typeof b] ?? "";
        
        // Convertir fechas para comparación
        if (pagination.sortBy === "date" || pagination.sortBy === "dueDate") {
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
      
      // Calcular estadísticas
      const stats = {
        totalInvoiced: allInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        totalPaid: allInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        totalPending: allInvoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        totalOverdue: allInvoices.filter(inv => inv.status === "sent" && inv.dueDate && new Date(inv.dueDate) < today).reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        count: {
          total: allInvoices.length,
          draft: allInvoices.filter(inv => inv.status === "draft").length,
          sent: allInvoices.filter(inv => inv.status === "sent").length,
          paid: allInvoices.filter(inv => inv.status === "paid").length,
          cancelled: allInvoices.filter(inv => inv.status === "cancelled").length,
        },
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
   * Obtener factura por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getInvoice(ctx.user.openId, input.id)),
  
  /**
   * Crear nueva factura
   */
  create: protectedProcedure
    .input(invoiceBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Validar que los totales sean correctos
      const calculatedSubtotal = input.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        return sum + itemTotal;
      }, 0);
      
      const calculatedTax = input.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
        return sum + (itemTotal * item.taxRate / 100);
      }, 0);
      
      // Aplicar descuento global
      let finalSubtotal = calculatedSubtotal;
      if (input.discount > 0) {
        if (input.discountType === "percentage") {
          finalSubtotal = calculatedSubtotal * (1 - input.discount / 100);
        } else {
          finalSubtotal = calculatedSubtotal - input.discount;
        }
      }
      
      // Calcular retención
      const retentionAmount = finalSubtotal * (input.retentionRate || 0) / 100;
      
      const finalTotal = finalSubtotal + calculatedTax - retentionAmount;
      
      return db.createInvoice({
        ...input,
        subtotal: String(finalSubtotal.toFixed(2)),
        taxAmount: String(calculatedTax.toFixed(2)),
        total: String(finalTotal.toFixed(2)),
        retentionAmount: retentionAmount,
        date: new Date(input.date),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar factura existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(invoiceBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, date, dueDate, ...data } = input;
      
      // Recalcular totales si se actualizan los items
      let updateData: Record<string, unknown> = { ...data };
      
      if (data.items) {
        const calculatedSubtotal = data.items.reduce((sum, item) => {
          const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
          return sum + itemTotal;
        }, 0);
        
        const calculatedTax = data.items.reduce((sum, item) => {
          const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
          return sum + (itemTotal * item.taxRate / 100);
        }, 0);
        
        let finalSubtotal = calculatedSubtotal;
        if (data.discount && data.discount > 0) {
          if (data.discountType === "percentage") {
            finalSubtotal = calculatedSubtotal * (1 - data.discount / 100);
          } else {
            finalSubtotal = calculatedSubtotal - data.discount;
          }
        }
        
        const retentionAmount = finalSubtotal * (data.retentionRate || 0) / 100;
        const finalTotal = finalSubtotal + calculatedTax - retentionAmount;
        
        updateData.subtotal = String(finalSubtotal.toFixed(2));
        updateData.taxAmount = String(calculatedTax.toFixed(2));
        updateData.total = String(finalTotal.toFixed(2));
        updateData.retentionAmount = retentionAmount;
      }
      
      if (date) {
        updateData.date = new Date(date);
      }
      
      if (dueDate) {
        updateData.dueDate = new Date(dueDate);
      }
      
      return db.updateInvoice(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar factura
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteInvoice(ctx.user.openId, input.id)),
  
  /**
   * Cambiar estado de factura
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: invoiceStatusSchema,
    }))
    .mutation(({ ctx, input }) => db.updateInvoice(ctx.user.openId, input.id, { status: input.status })),
  
  /**
   * Duplicar factura
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const original = await db.getInvoice(ctx.user.openId, input.id);
      if (!original) {
        throw new Error("Factura no encontrada");
      }
      
      // Generar nuevo número de factura
      const allInvoices = await db.getInvoices(ctx.user.openId);
      const lastNumber = allInvoices
        .map(inv => {
          const match = inv.invoiceNumber.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);
      
      const newNumber = `${new Date().getFullYear()}-${String(lastNumber + 1).padStart(4, "0")}`;
      
      return db.createInvoice({
        ...original,
        id: undefined,
        invoiceNumber: newNumber,
        date: new Date(),
        dueDate: null,
        status: "draft",
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Obtener siguiente número de factura
   */
  getNextNumber: protectedProcedure.query(async ({ ctx }) => {
    const allInvoices = await db.getInvoices(ctx.user.openId);
    const year = new Date().getFullYear();
    
    const lastNumber = allInvoices
      .filter(inv => inv.invoiceNumber.startsWith(String(year)))
      .map(inv => {
        const match = inv.invoiceNumber.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    
    return `${year}-${String(lastNumber + 1).padStart(4, "0")}`;
  }),
  
  /**
   * Obtener estadísticas de facturación por período
   */
  getStats: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("month"),
      year: z.number().optional(),
      month: z.number().min(1).max(12).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const allInvoices = await db.getInvoices(ctx.user.openId);
      const now = new Date();
      const year = input.year || now.getFullYear();
      const month = input.month || now.getMonth() + 1;
      
      let startDate: Date;
      let endDate: Date;
      
      switch (input.period) {
        case "month":
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0);
          break;
        case "quarter":
          const quarter = Math.ceil(month / 3);
          startDate = new Date(year, (quarter - 1) * 3, 1);
          endDate = new Date(year, quarter * 3, 0);
          break;
        case "year":
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
          break;
      }
      
      const periodInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= startDate && invDate <= endDate;
      });
      
      return {
        period: input.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalInvoiced: periodInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        totalPaid: periodInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        totalPending: periodInvoices.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        invoiceCount: periodInvoices.length,
        averageInvoice: periodInvoices.length > 0 
          ? periodInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0) / periodInvoices.length 
          : 0,
      };
    }),
});
