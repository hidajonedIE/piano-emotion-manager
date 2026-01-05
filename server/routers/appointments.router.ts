/**
 * Appointments Router (OPTIMIZED)
 * Gestión de citas con paginación en DB, eager loading y caché
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { appointments, clients, pianos } from "../../drizzle/schema.js";
import { eq, and, or, gte, lte, asc, desc, count, sql } from "drizzle-orm";
// Cache system removed to resolve deployment issues

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
]);

const serviceTypeSchema = z.enum([
  "tuning",
  "repair",
  "regulation",
  "maintenance_basic",
  "maintenance_complete",
  "maintenance_premium",
  "inspection",
  "restoration",
  "transport",
  "appraisal",
  "voicing",
  "cleaning",
  "other",
]);

const reminderSchema = z.object({
  type: z.enum(["email", "sms", "whatsapp", "push"]),
  minutesBefore: z.number().int().min(0).max(10080),
  sent: z.boolean().default(false),
  sentAt: z.string().optional(),
});

const recurrenceSchema = z.object({
  type: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).max(12).default(1),
  endDate: z.string().optional(),
  occurrences: z.number().int().min(1).max(52).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
}).optional().nullable();

const appointmentBaseSchema = z.object({
  clientId: z.number().int().positive(),
  pianoId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1).max(255),
  date: z.string().or(z.date()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().int().min(15).max(480).default(60),
  serviceType: serviceTypeSchema.optional().nullable(),
  status: appointmentStatusSchema.default("scheduled"),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  reminders: z.array(reminderSchema).max(5).optional(),
  recurrence: recurrenceSchema,
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  estimatedPrice: z.number().min(0).optional().nullable(),
});

/**
 * Esquema de paginación para citas
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["date", "status", "clientId", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  clientId: z.number().optional(),
  technicianId: z.string().optional(),
});

const calendarViewSchema = z.object({
  view: z.enum(["day", "week", "month"]).default("month"),
  date: z.string(),
  technicianId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  clientId: z.number().optional(),
});

// ============================================================================
// UTILIDADES
// ============================================================================

function getDateRange(view: "day" | "week" | "month", centerDate: Date): { start: Date; end: Date } {
  const start = new Date(centerDate);
  const end = new Date(centerDate);
  
  switch (view) {
    case "day":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { start, end };
}

function detectConflicts(
  appointments: Array<{ id?: number; date: Date | string; duration: number; technicianId?: string | null }>,
  newAppointment: { id?: number; date: Date | string; duration: number; technicianId?: string | null }
): Array<{ id: number; overlap: number }> {
  const conflicts: Array<{ id: number; overlap: number }> = [];
  
  const newStart = new Date(newAppointment.date).getTime();
  const newEnd = newStart + (newAppointment.duration || 60) * 60 * 1000;
  
  for (const apt of appointments) {
    if (apt.id && newAppointment.id && apt.id === newAppointment.id) continue;
    if (newAppointment.technicianId && apt.technicianId && 
        newAppointment.technicianId !== apt.technicianId) continue;
    
    const aptStart = new Date(apt.date).getTime();
    const aptEnd = aptStart + (apt.duration || 60) * 60 * 1000;
    
    const overlapStart = Math.max(newStart, aptStart);
    const overlapEnd = Math.min(newEnd, aptEnd);
    const overlap = overlapEnd - overlapStart;
    
    if (overlap > 0 && apt.id) {
      conflicts.push({
        id: apt.id,
        overlap: Math.round(overlap / 60000),
      });
    }
  }
  
  return conflicts;
}

function generateRecurringAppointments(
  baseAppointment: z.infer<typeof appointmentBaseSchema>,
  maxOccurrences: number = 52
): Array<z.infer<typeof appointmentBaseSchema>> {
  if (!baseAppointment.recurrence) return [baseAppointment];
  
  const { type, interval, endDate, occurrences, daysOfWeek } = baseAppointment.recurrence;
  const appointments: Array<z.infer<typeof appointmentBaseSchema>> = [];
  const baseDate = new Date(baseAppointment.date);
  const maxDate = endDate ? new Date(endDate) : new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
  const maxCount = occurrences || maxOccurrences;
  
  let currentDate = new Date(baseDate);
  let count = 0;
  
  while (currentDate <= maxDate && count < maxCount) {
    if (type === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
      const currentDay = currentDate.getDay();
      if (daysOfWeek.includes(currentDay)) {
        appointments.push({
          ...baseAppointment,
          date: currentDate.toISOString(),
          recurrence: null,
        });
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 1) {
        currentDate.setDate(currentDate.getDate() + (interval - 1) * 7);
      }
    } else {
      appointments.push({
        ...baseAppointment,
        date: currentDate.toISOString(),
        recurrence: null,
      });
      count++;
      
      switch (type) {
        case "daily":
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7 * interval);
          break;
        case "biweekly":
          currentDate.setDate(currentDate.getDate() + 14 * interval);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }
    }
  }
  
  return appointments;
}

// ============================================================================
// ROUTER
// ============================================================================

export const appointmentsRouter = router({
  /**
   * Lista de citas con paginación optimizada y eager loading
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "date", sortOrder: "asc" };
      
      const database = await db.getDb();
      if (!database) {
        return {
          items: [],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [eq(appointments.odId, ctx.user.openId)];
      
      if (pagination.dateFrom) {
        whereClauses.push(gte(appointments.date, new Date(pagination.dateFrom)));
      }
      
      if (pagination.dateTo) {
        whereClauses.push(lte(appointments.date, new Date(pagination.dateTo)));
      }
      
      if (pagination.status) {
        whereClauses.push(eq(appointments.status, pagination.status));
      }
      
      if (pagination.serviceType) {
        whereClauses.push(eq(appointments.serviceType, pagination.serviceType));
      }
      
      if (pagination.clientId) {
        whereClauses.push(eq(appointments.clientId, pagination.clientId));
      }

      // Construir ORDER BY
      const sortColumn = appointments[pagination.sortBy as keyof typeof appointments];
      const orderByClause = pagination.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // EAGER LOADING: Consulta con leftJoin para cargar cliente y piano en una sola query
      const offset = (pagination.page - 1) * pagination.limit;
      const items = await database
        .select({
          // Appointment fields
          id: appointments.id,
          odId: appointments.odId,
          clientId: appointments.clientId,
          pianoId: appointments.pianoId,
          title: appointments.title,
          date: appointments.date,
          duration: appointments.duration,
          serviceType: appointments.serviceType,
          status: appointments.status,
          notes: appointments.notes,
          address: appointments.address,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          // Client fields (eager loaded)
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          // Piano fields (eager loaded)
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pianos, eq(appointments.pianoId, pianos.id))
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(pagination.limit)
        .offset(offset);

      // Consulta de conteo total
      const [{ total }] = await database
        .select({ total: count() })
        .from(appointments)
        .where(and(...whereClauses));

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasMore: pagination.page < totalPages,
        },
      };
    }),
  
  /**
   * Vista de calendario optimizada con eager loading
   */
  calendarView: protectedProcedure
    .input(calendarViewSchema)
    .query(async ({ ctx, input }) => {
      const centerDate = new Date(input.date);
      const { start, end } = getDateRange(input.view, centerDate);
      
      const database = await db.getDb();
      if (!database) {
        return {
          view: input.view,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          appointments: [],
          byDay: {},
          totalCount: 0,
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [
        eq(appointments.odId, ctx.user.openId),
        gte(appointments.date, start),
        lte(appointments.date, end),
      ];
      
      if (input.status) {
        whereClauses.push(eq(appointments.status, input.status));
      }
      
      if (input.serviceType) {
        whereClauses.push(eq(appointments.serviceType, input.serviceType));
      }
      
      if (input.clientId) {
        whereClauses.push(eq(appointments.clientId, input.clientId));
      }

      // EAGER LOADING: Cargar citas con cliente y piano
      const items = await database
        .select({
          id: appointments.id,
          odId: appointments.odId,
          clientId: appointments.clientId,
          pianoId: appointments.pianoId,
          title: appointments.title,
          date: appointments.date,
          duration: appointments.duration,
          serviceType: appointments.serviceType,
          status: appointments.status,
          notes: appointments.notes,
          address: appointments.address,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          clientName: clients.name,
          clientEmail: clients.email,
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pianos, eq(appointments.pianoId, pianos.id))
        .where(and(...whereClauses))
        .orderBy(asc(appointments.date));

      // Agrupar por día
      const byDay: Record<string, typeof items> = {};
      for (const apt of items) {
        const dayKey = new Date(apt.date).toISOString().split("T")[0];
        if (!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(apt);
      }
      
      return {
        view: input.view,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        appointments: items,
        byDay,
        totalCount: items.length,
      };
    }),
  
  /**
   * Obtener cita por ID con eager loading
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return undefined;

      const [result] = await database
        .select({
          id: appointments.id,
          odId: appointments.odId,
          clientId: appointments.clientId,
          pianoId: appointments.pianoId,
          title: appointments.title,
          date: appointments.date,
          duration: appointments.duration,
          serviceType: appointments.serviceType,
          status: appointments.status,
          notes: appointments.notes,
          address: appointments.address,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientAddress: clients.address,
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
          pianoSerialNumber: pianos.serialNumber,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pianos, eq(appointments.pianoId, pianos.id))
        .where(and(eq(appointments.odId, ctx.user.openId), eq(appointments.id, input.id)));

      return result;
    }),
  
  /**
   * Crear nueva cita
   */
  create: protectedProcedure
    .input(appointmentBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Detectar conflictos
      const existingAppointments = await db.getAppointments(ctx.user.openId);
      const conflicts = detectConflicts(existingAppointments, {
        date: input.date,
        duration: input.duration,
        technicianId: input.technicianId,
      });
      
      // Si hay recurrencia, generar todas las citas
      if (input.recurrence) {
        const recurringAppointments = generateRecurringAppointments(input);
        const createdAppointments = [];
        
        for (const apt of recurringAppointments) {
          const created = await db.createAppointment({
            ...apt,
            date: new Date(apt.date),
            odId: ctx.user.openId,
          });
          createdAppointments.push(created);
        }
        
        return {
          appointments: createdAppointments,
          conflicts,
          isRecurring: true,
          count: createdAppointments.length,
        };
      }
      
      const appointment = await db.createAppointment({
        ...input,
        date: new Date(input.date),
        odId: ctx.user.openId,
      });
      
      return {
        appointment,
        conflicts,
        isRecurring: false,
      };
    }),
  
  /**
   * Actualizar cita existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(appointmentBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Detectar conflictos si se actualiza la fecha o duración
      if (data.date || data.duration) {
        const existingAppointments = await db.getAppointments(ctx.user.openId);
        const currentAppointment = await db.getAppointment(ctx.user.openId, id);
        
        if (currentAppointment) {
          const conflicts = detectConflicts(existingAppointments, {
            id,
            date: data.date || currentAppointment.date,
            duration: data.duration || currentAppointment.duration,
            technicianId: data.technicianId !== undefined ? data.technicianId : currentAppointment.technicianId,
          });
          
          await db.updateAppointment(ctx.user.openId, id, {
            ...data,
            date: data.date ? new Date(data.date) : undefined,
          });
          
          return { success: true, conflicts };
        }
      }
      
      await db.updateAppointment(ctx.user.openId, id, {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      });
      
      return { success: true, conflicts: [] };
    }),
  
  /**
   * Eliminar cita
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteAppointment(ctx.user.openId, input.id)),
  
  /**
   * Obtener próximas citas (con caché)
   */
  getUpcoming: protectedProcedure
    .input(z.object({
      daysAhead: z.number().int().min(1).max(90).default(7),
    }).optional())
    .query(async ({ ctx, input }) => {
      const daysAhead = input?.daysAhead || 7;
      // Cache disabled

      const database = await db.getDb();
      if (!database) return [];

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const items = await database
        .select({
          id: appointments.id,
          title: appointments.title,
          date: appointments.date,
          duration: appointments.duration,
          status: appointments.status,
          clientName: clients.name,
          pianoBrand: pianos.brand,
        })
        .from(appointments)
        .leftJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pianos, eq(appointments.pianoId, pianos.id))
        .where(and(
          eq(appointments.odId, ctx.user.openId),
          gte(appointments.date, now),
          lte(appointments.date, futureDate)
        ))
        .orderBy(asc(appointments.date))
        .limit(20);

      // Cache disabled
      
      return items;
    }),
});
