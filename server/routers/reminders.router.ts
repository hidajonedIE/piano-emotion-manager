/**
 * Reminders Router
 * Gestión de recordatorios con paginación, filtros y seguimiento
 * Soporte completo para organizaciones con sharing configurable
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { reminders } from "../../drizzle/schema.js";
import { eq, and, or, gte, lte, asc, desc, count } from "drizzle-orm";
import { filterByPartner, filterByPartnerAnd, addPartnerToInsert, validateWritePermission } from "../utils/multi-tenant.js";


const orgProcedure = protectedProcedure;

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Tipos de recordatorio
 */
const reminderTypeSchema = z.enum([
  "call",
  "visit",
  "email",
  "whatsapp",
  "follow_up"
]);

/**
 * Esquema de paginación
 */
const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.number().optional(),
  sortBy: z.enum(["dueDate", "title", "reminderType", "createdAt"]).default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  clientId: z.number().optional(),
  pianoId: z.number().optional(),
  reminderType: reminderTypeSchema.optional(),
  isCompleted: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  overdue: z.boolean().optional(),
});

/**
 * Esquema base de recordatorio
 */
const reminderBaseSchema = z.object({
  clientId: z.number().int().positive(),
  pianoId: z.number().int().positive().optional().nullable(),
  reminderType: reminderTypeSchema,
  dueDate: z.string().or(z.date()),
  title: z.string().min(1, "El título es obligatorio").max(255),
  notes: z.string().max(2000).optional().nullable(),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().or(z.date()).optional().nullable(),
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Marca recordatorios como vencidos
 */
function markOverdueReminders(remindersList: any[]): any[] {
  const now = new Date();
  return remindersList.map(reminder => ({
    ...reminder,
    isOverdue: !reminder.isCompleted && new Date(reminder.dueDate) < now,
  }));
}

/**
 * Calcula estadísticas de recordatorios
 */
function calculateReminderStats(remindersList: any[]) {
  const now = new Date();
  const marked = markOverdueReminders(remindersList);
  
  const total = marked.length;
  const completed = marked.filter(r => r.isCompleted).length;
  const pending = marked.filter(r => !r.isCompleted).length;
  const overdue = marked.filter(r => r.isOverdue).length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const dueToday = marked.filter(r => {
    if (r.isCompleted) return false;
    const due = new Date(r.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }).length;
  
  const dueThisWeek = marked.filter(r => {
    if (r.isCompleted) return false;
    const due = new Date(r.dueDate);
    return due >= today && due < nextWeek;
  }).length;
  
  const byType: Record<string, number> = {};
  reminderTypeSchema.options.forEach(type => {
    byType[type] = marked.filter(r => r.reminderType === type).length;
  });

  return {
    total,
    completed,
    pending,
    overdue,
    dueToday,
    dueThisWeek,
    byType,
  };
}

// ============================================================================
// ROUTER
// ============================================================================

export const remindersRouter = router({
  /**
   * Lista de recordatorios con paginación y filtros
   */
  list: orgProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const { 
        limit = 30, 
        cursor, 
        sortBy = "dueDate", 
        sortOrder = "asc", 
        clientId,
        pianoId,
        reminderType,
        isCompleted,
        dateFrom,
        dateTo,
        overdue
      } = input || {};
      
      const database = await db.getDb();
      if (!database) return { items: [], total: 0, stats: null };

      const partnerId = ctx.partnerId;
      if (partnerId === undefined) {
        return { items: [], total: 0, stats: null };
      }

      const whereClauses: any[] = [];
      if (partnerId !== null) {
        whereClauses.push(filterByPartner(reminders.partnerId, partnerId));
      }
      
      if (clientId !== undefined) {
        whereClauses.push(eq(reminders.clientId, clientId));
      }
      
      if (pianoId !== undefined) {
        whereClauses.push(eq(reminders.pianoId, pianoId));
      }
      
      if (reminderType !== undefined) {
        whereClauses.push(eq(reminders.reminderType, reminderType));
      }
      
      if (isCompleted !== undefined) {
        whereClauses.push(eq(reminders.isCompleted, isCompleted));
      }
      
      if (dateFrom) {
        whereClauses.push(gte(reminders.dueDate, new Date(dateFrom)));
      }
      
      if (dateTo) {
        whereClauses.push(lte(reminders.dueDate, new Date(dateTo)));
      }

      // Construir ORDER BY
      const sortColumn = reminders[sortBy as keyof typeof reminders] || reminders.dueDate;
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Consulta principal con paginación
      const offset = cursor || 0;
      let items = await database
        .select()
        .from(reminders)
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Marcar vencidos y aplicar filtro de overdue si se especificó
      items = markOverdueReminders(items);
      if (overdue !== undefined) {
        items = items.filter(r => overdue ? r.isOverdue : !r.isOverdue);
      }

      // Contar total
      const [{ total }] = await database
        .select({ total: count() })
        .from(reminders)
        .where(and(...whereClauses));

      // Calcular estadísticas
      const statsWhereClauses: any[] = [];
      if (partnerId !== null) {
        statsWhereClauses.push(filterByPartner(reminders.partnerId, partnerId));
      }

      const allReminders = await database
        .select()
        .from(reminders)
        .where(and(...statsWhereClauses));

      const stats = calculateReminderStats(allReminders);

      let nextCursor: number | undefined = undefined;
      if (items.length === limit) {
        nextCursor = offset + limit;
      }

      return { items, nextCursor, total, stats };
    }),
  
  /**
   * Lista completa sin paginación (para selects)
   */
  listAll: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    const partnerId = ctx.partnerId;
    const whereClauses: any[] = [];
    if (partnerId !== null && partnerId !== undefined) {
      whereClauses.push(filterByPartner(reminders.partnerId, partnerId));
    }

    const items = await database
      .select()
      .from(reminders)
      .where(and(...whereClauses))
      .orderBy(asc(reminders.dueDate));

    return markOverdueReminders(items);
  }),
  
  /**
   * Obtener recordatorio por ID
   */
  get: orgProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [reminder] = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAnd(reminders.partnerId, ctx.partnerId, eq(reminders.id, input.id))
        );

      if (!reminder) throw new Error("Recordatorio no encontrado");
      
      const [marked] = markOverdueReminders([reminder]);
      return marked;
    }),
  
  /**
   * Obtener recordatorios de un cliente
   */
  byClient: orgProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAnd(reminders.partnerId, ctx.partnerId, eq(reminders.clientId, input.clientId))
        )
        .orderBy(asc(reminders.dueDate));

      return markOverdueReminders(items);
    }),
  
  /**
   * Obtener recordatorios de un piano
   */
  byPiano: orgProcedure
    .input(z.object({ pianoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAnd(reminders.partnerId, ctx.partnerId, eq(reminders.pianoId, input.pianoId))
        )
        .orderBy(asc(reminders.dueDate));

      return markOverdueReminders(items);
    }),
  
  /**
   * Obtener recordatorios pendientes
   */
  getPending: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const items = await database
      .select()
      .from(reminders)
      .where(
        filterByPartnerAnd(reminders.partnerId, ctx.partnerId, eq(reminders.isCompleted, false))
      )
      .orderBy(asc(reminders.dueDate));

    return markOverdueReminders(items);
  }),

  /**
   * Crear un nuevo recordatorio
   */
  create: orgProcedure
    .input(reminderBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const data = {
        ...addPartnerToInsert(
          {
            ...input,
            dueDate: new Date(input.dueDate),
          },
          ctx.partnerId
        ),
        odId: ctx.user.id,
      };

      const [newReminder] = await database.insert(reminders).values(data).returning();
      return newReminder;
    }),

  /**
   * Actualizar un recordatorio
   */
  update: orgProcedure
    .input(reminderBaseSchema.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const { id, ...data } = input;

      const [existing] = await database.select().from(reminders).where(eq(reminders.id, id));
      if (!existing) throw new Error("Recordatorio no encontrado");

      // validateWritePermission(ctx.orgContext, "reminders", existing.odId);

      const [updatedReminder] = await database
        .update(reminders)
        .set({ ...data, dueDate: new Date(data.dueDate), updatedAt: new Date() })
        .where(eq(reminders.id, id))
        .returning();

      return updatedReminder;
    }),

  /**
   * Marcar un recordatorio como completado
   */
  complete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [existing] = await database.select().from(reminders).where(eq(reminders.id, input.id));
      if (!existing) throw new Error("Recordatorio no encontrado");

      // validateWritePermission(ctx.orgContext, "reminders", existing.odId);

      const [completedReminder] = await database
        .update(reminders)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(eq(reminders.id, input.id))
        .returning();

      return completedReminder;
    }),

  /**
   * Posponer un recordatorio
   */
  snooze: orgProcedure
    .input(z.object({ id: z.number(), days: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [existing] = await database.select().from(reminders).where(eq(reminders.id, input.id));
      if (!existing) throw new Error("Recordatorio no encontrado");

      // validateWritePermission(ctx.orgContext, "reminders", existing.odId);

      const newDueDate = new Date(existing.dueDate);
      newDueDate.setDate(newDueDate.getDate() + input.days);

      const [snoozedReminder] = await database
        .update(reminders)
        .set({ dueDate: newDueDate })
        .where(eq(reminders.id, input.id))
        .returning();

      return snoozedReminder;
    }),

  /**
   * Eliminar un recordatorio
   */
  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [existing] = await database.select().from(reminders).where(eq(reminders.id, input.id));
      if (!existing) throw new Error("Recordatorio no encontrado");

      // validateWritePermission(ctx.orgContext, "reminders", existing.odId);

      await database.delete(reminders).where(eq(reminders.id, input.id));
      return { success: true };
    }),
});
