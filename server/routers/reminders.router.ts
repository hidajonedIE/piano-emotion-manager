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
import { 
  filterByPartnerAndOrganization,
  addOrganizationToInsert,
  validateWritePermission
} from "../utils/multi-tenant.js";
import { withOrganizationContext } from "../middleware/organization-context.js";

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
// PROCEDURE CON CONTEXTO DE ORGANIZACIÓN
// ============================================================================

const orgProcedure = protectedProcedure.use(withOrganizationContext);

// ============================================================================
// ROUTER
// ============================================================================

export const remindersRouter = router({
  /**
   * Lista de recordatorios con paginación y filtros
   */
  list: protectedProcedure
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

      // Construir condiciones WHERE con filtrado por organización
      const whereClauses = [
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders"
        )
      ];
      
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
      const allReminders = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders"
          )
        );

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
    
    const items = await database
      .select()
      .from(reminders)
      .where(
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders"
        )
      )
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
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.id, input.id)
          )
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
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.clientId, input.clientId)
          )
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
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.pianoId, input.pianoId)
          )
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
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders",
          eq(reminders.isCompleted, false)
        )
      )
      .orderBy(asc(reminders.dueDate));

    return markOverdueReminders(items);
  }),
  
  /**
   * Obtener recordatorios vencidos
   */
  getOverdue: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const now = new Date();
    const items = await database
      .select()
      .from(reminders)
      .where(
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders",
          and(
            eq(reminders.isCompleted, false),
            lte(reminders.dueDate, now)
          )
        )
      )
      .orderBy(asc(reminders.dueDate));

    return markOverdueReminders(items);
  }),
  
  /**
   * Obtener recordatorios próximos (siguientes N días)
   */
  getUpcoming: orgProcedure
    .input(z.object({
      daysAhead: z.number().int().min(1).max(30).default(7),
    }).optional())
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const daysAhead = input?.daysAhead || 7;
      const now = new Date();
      const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const items = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            and(
              eq(reminders.isCompleted, false),
              gte(reminders.dueDate, now),
              lte(reminders.dueDate, cutoff)
            )
          )
        )
        .orderBy(asc(reminders.dueDate));

      return markOverdueReminders(items);
    }),
  
  /**
   * Obtener recordatorios de hoy
   */
  getToday: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const items = await database
      .select()
      .from(reminders)
      .where(
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders",
          and(
            eq(reminders.isCompleted, false),
            gte(reminders.dueDate, today),
            lte(reminders.dueDate, tomorrow)
          )
        )
      )
      .orderBy(asc(reminders.dueDate));

    return markOverdueReminders(items);
  }),
  
  /**
   * Crear nuevo recordatorio
   */
  create: orgProcedure
    .input(reminderBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Preparar datos con partnerId, odId y organizationId
      const reminderData = addOrganizationToInsert(
        {
          clientId: input.clientId,
          pianoId: input.pianoId,
          reminderType: input.reminderType,
          dueDate: new Date(input.dueDate),
          title: input.title,
          notes: input.notes,
          isCompleted: input.isCompleted,
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
        },
        ctx.orgContext,
        "reminders"
      );
      
      const result = await database.insert(reminders).values(reminderData);
      return result[0].insertId;
    }),
  
  /**
   * Actualizar recordatorio
   */
  update: orgProcedure
    .input(z.object({
      id: z.number(),
    }).merge(reminderBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el recordatorio para verificar permisos
      const [existingReminder] = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.id, input.id)
          )
        );

      if (!existingReminder) {
        throw new Error("Recordatorio no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "reminders", existingReminder.odId);

      const { id, ...data } = input;
      
      // Preparar datos para actualización
      const updateData: any = {};
      if (data.clientId !== undefined) updateData.clientId = data.clientId;
      if (data.pianoId !== undefined) updateData.pianoId = data.pianoId;
      if (data.reminderType !== undefined) updateData.reminderType = data.reminderType;
      if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
      if (data.title !== undefined) updateData.title = data.title;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
      if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;

      await database
        .update(reminders)
        .set(updateData)
        .where(eq(reminders.id, id));
      
      return { success: true };
    }),
  
  /**
   * Marcar recordatorio como completado
   */
  markAsCompleted: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el recordatorio para verificar permisos
      const [existingReminder] = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.id, input.id)
          )
        );

      if (!existingReminder) {
        throw new Error("Recordatorio no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "reminders", existingReminder.odId);

      await database
        .update(reminders)
        .set({
          isCompleted: true,
          completedAt: new Date(),
        })
        .where(eq(reminders.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Marcar recordatorio como pendiente
   */
  markAsPending: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el recordatorio para verificar permisos
      const [existingReminder] = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.id, input.id)
          )
        );

      if (!existingReminder) {
        throw new Error("Recordatorio no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "reminders", existingReminder.odId);

      await database
        .update(reminders)
        .set({
          isCompleted: false,
          completedAt: null,
        })
        .where(eq(reminders.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Eliminar recordatorio
   */
  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener el recordatorio para verificar permisos
      const [existingReminder] = await database
        .select()
        .from(reminders)
        .where(
          filterByPartnerAndOrganization(
            reminders,
            ctx.partnerId,
            ctx.orgContext,
            "reminders",
            eq(reminders.id, input.id)
          )
        );

      if (!existingReminder) {
        throw new Error("Recordatorio no encontrado");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "reminders", existingReminder.odId);

      await database.delete(reminders).where(eq(reminders.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Obtener estadísticas de recordatorios
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
        filterByPartnerAndOrganization(
          reminders,
          ctx.partnerId,
          ctx.orgContext,
          "reminders"
        )
      ];

      if (input?.dateFrom) {
        whereClauses.push(gte(reminders.dueDate, new Date(input.dateFrom)));
      }

      if (input?.dateTo) {
        whereClauses.push(lte(reminders.dueDate, new Date(input.dateTo)));
      }

      const items = await database
        .select()
        .from(reminders)
        .where(and(...whereClauses));

      return calculateReminderStats(items);
    }),
});
