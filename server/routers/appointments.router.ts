/**
 * Appointments Router
 * Gestión de citas con vistas múltiples, detección de conflictos y recordatorios
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Estados de cita
 */
const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show", // Cliente no se presentó
  "rescheduled",
]);

/**
 * Tipos de servicio para citas
 */
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

/**
 * Esquema de recordatorio
 */
const reminderSchema = z.object({
  type: z.enum(["email", "sms", "whatsapp", "push"]),
  minutesBefore: z.number().int().min(0).max(10080), // Hasta 1 semana antes
  sent: z.boolean().default(false),
  sentAt: z.string().optional(),
});

/**
 * Esquema de recurrencia
 */
const recurrenceSchema = z.object({
  type: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).max(12).default(1), // Cada X días/semanas/meses
  endDate: z.string().optional(), // Fecha de fin de recurrencia
  occurrences: z.number().int().min(1).max(52).optional(), // Número de ocurrencias
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // Para recurrencia semanal
}).optional().nullable();

/**
 * Esquema base de cita
 */
const appointmentBaseSchema = z.object({
  clientId: z.number().int().positive(),
  pianoId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1, "El título es obligatorio").max(255),
  date: z.string().or(z.date()),
  startTime: z.string().optional(), // Hora de inicio (HH:MM)
  endTime: z.string().optional(), // Hora de fin (HH:MM)
  duration: z.number().int().min(15).max(480).default(60), // Duración en minutos
  serviceType: serviceTypeSchema.optional().nullable(),
  status: appointmentStatusSchema.default("scheduled"),
  notes: z.string().max(2000).optional().nullable(),
  internalNotes: z.string().max(2000).optional().nullable(), // Notas internas
  address: z.string().max(500).optional().nullable(),
  // Coordenadas para navegación
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  // Recordatorios
  reminders: z.array(reminderSchema).max(5).optional(),
  // Recurrencia
  recurrence: recurrenceSchema,
  // Técnico asignado (para equipos)
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  // Color para el calendario
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  // Prioridad
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  // Estimación de precio
  estimatedPrice: z.number().min(0).optional().nullable(),
});

/**
 * Esquema de filtros para vista de calendario
 */
const calendarViewSchema = z.object({
  view: z.enum(["day", "week", "month"]).default("month"),
  date: z.string(), // Fecha central de la vista
  technicianId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  serviceType: serviceTypeSchema.optional(),
  clientId: z.number().optional(),
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula el rango de fechas para una vista de calendario
 */
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
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes como inicio
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

/**
 * Detecta conflictos de horario
 */
function detectConflicts(
  appointments: Array<{ id?: number; date: Date | string; duration: number; technicianId?: string | null }>,
  newAppointment: { id?: number; date: Date | string; duration: number; technicianId?: string | null }
): Array<{ id: number; overlap: number }> {
  const conflicts: Array<{ id: number; overlap: number }> = [];
  
  const newStart = new Date(newAppointment.date).getTime();
  const newEnd = newStart + (newAppointment.duration || 60) * 60 * 1000;
  
  for (const apt of appointments) {
    // No comparar consigo mismo
    if (apt.id && newAppointment.id && apt.id === newAppointment.id) continue;
    
    // Solo comparar si es el mismo técnico (o si no hay técnico asignado)
    if (newAppointment.technicianId && apt.technicianId && 
        newAppointment.technicianId !== apt.technicianId) continue;
    
    const aptStart = new Date(apt.date).getTime();
    const aptEnd = aptStart + (apt.duration || 60) * 60 * 1000;
    
    // Calcular solapamiento
    const overlapStart = Math.max(newStart, aptStart);
    const overlapEnd = Math.min(newEnd, aptEnd);
    const overlap = overlapEnd - overlapStart;
    
    if (overlap > 0 && apt.id) {
      conflicts.push({
        id: apt.id,
        overlap: Math.round(overlap / 60000), // Minutos de solapamiento
      });
    }
  }
  
  return conflicts;
}

/**
 * Genera citas recurrentes
 */
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
    // Para recurrencia semanal con días específicos
    if (type === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
      const currentDay = currentDate.getDay();
      if (daysOfWeek.includes(currentDay)) {
        appointments.push({
          ...baseAppointment,
          date: currentDate.toISOString(),
          recurrence: null, // Las citas generadas no son recurrentes
        });
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 1) { // Nuevo lunes
        currentDate.setDate(currentDate.getDate() + (interval - 1) * 7);
      }
    } else {
      appointments.push({
        ...baseAppointment,
        date: currentDate.toISOString(),
        recurrence: null,
      });
      count++;
      
      // Avanzar según el tipo de recurrencia
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
   * Lista de citas con filtros
   */
  list: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      status: appointmentStatusSchema.optional(),
      clientId: z.number().optional(),
      technicianId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const appointments = await db.getAppointments(ctx.user.openId);
      
      let filtered = appointments;
      
      if (input?.dateFrom) {
        const fromDate = new Date(input.dateFrom);
        filtered = filtered.filter(apt => new Date(apt.date) >= fromDate);
      }
      
      if (input?.dateTo) {
        const toDate = new Date(input.dateTo);
        filtered = filtered.filter(apt => new Date(apt.date) <= toDate);
      }
      
      if (input?.status) {
        filtered = filtered.filter(apt => apt.status === input.status);
      }
      
      if (input?.clientId) {
        filtered = filtered.filter(apt => apt.clientId === input.clientId);
      }
      
      if (input?.technicianId) {
        filtered = filtered.filter(apt => apt.technicianId === input.technicianId);
      }
      
      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }),
  
  /**
   * Vista de calendario (día, semana, mes)
   */
  calendarView: protectedProcedure
    .input(calendarViewSchema)
    .query(async ({ ctx, input }) => {
      const centerDate = new Date(input.date);
      const { start, end } = getDateRange(input.view, centerDate);
      
      const appointments = await db.getAppointments(ctx.user.openId);
      
      // Filtrar por rango de fechas
      let filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= start && aptDate <= end;
      });
      
      // Aplicar filtros adicionales
      if (input.status) {
        filtered = filtered.filter(apt => apt.status === input.status);
      }
      
      if (input.serviceType) {
        filtered = filtered.filter(apt => apt.serviceType === input.serviceType);
      }
      
      if (input.clientId) {
        filtered = filtered.filter(apt => apt.clientId === input.clientId);
      }
      
      if (input.technicianId) {
        filtered = filtered.filter(apt => apt.technicianId === input.technicianId);
      }
      
      // Ordenar por fecha y hora
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Agrupar por día para vista de semana/mes
      const byDay: Record<string, typeof filtered> = {};
      for (const apt of filtered) {
        const dayKey = new Date(apt.date).toISOString().split("T")[0];
        if (!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(apt);
      }
      
      return {
        view: input.view,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        appointments: filtered,
        byDay,
        totalCount: filtered.length,
      };
    }),
  
  /**
   * Obtener cita por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getAppointment(ctx.user.openId, input.id)),
  
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
      const { id, date, recurrence, ...data } = input;
      
      // Detectar conflictos si se cambia la fecha o duración
      let conflicts: Array<{ id: number; overlap: number }> = [];
      if (date || data.duration) {
        const existingAppointments = await db.getAppointments(ctx.user.openId);
        const currentAppointment = await db.getAppointment(ctx.user.openId, id);
        
        conflicts = detectConflicts(existingAppointments, {
          id,
          date: date || currentAppointment?.date || new Date(),
          duration: data.duration || currentAppointment?.duration || 60,
          technicianId: data.technicianId ?? currentAppointment?.technicianId,
        });
      }
      
      const updated = await db.updateAppointment(ctx.user.openId, id, {
        ...data,
        ...(date ? { date: new Date(date) } : {}),
      });
      
      return {
        appointment: updated,
        conflicts,
      };
    }),
  
  /**
   * Eliminar cita
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteAppointment(ctx.user.openId, input.id)),
  
  /**
   * Cambiar estado de cita
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: appointmentStatusSchema,
    }))
    .mutation(({ ctx, input }) => db.updateAppointment(ctx.user.openId, input.id, { status: input.status })),
  
  /**
   * Verificar conflictos para una fecha/hora
   */
  checkConflicts: protectedProcedure
    .input(z.object({
      date: z.string(),
      duration: z.number().default(60),
      technicianId: z.string().optional(),
      excludeId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const appointments = await db.getAppointments(ctx.user.openId);
      
      const conflicts = detectConflicts(appointments, {
        id: input.excludeId,
        date: input.date,
        duration: input.duration,
        technicianId: input.technicianId,
      });
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    }),
  
  /**
   * Obtener próximas citas
   */
  getUpcoming: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
      daysAhead: z.number().int().min(1).max(365).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 10;
      const daysAhead = input?.daysAhead || 30;
      
      const appointments = await db.getAppointments(ctx.user.openId);
      const now = new Date();
      const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      
      return appointments
        .filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= now && aptDate <= cutoff && apt.status !== "cancelled";
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, limit);
    }),
  
  /**
   * Obtener citas de hoy
   */
  getToday: protectedProcedure.query(async ({ ctx }) => {
    const appointments = await db.getAppointments(ctx.user.openId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate < tomorrow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }),
  
  /**
   * Obtener estadísticas de citas
   */
  getStats: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "year"]).default("month"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const appointments = await db.getAppointments(ctx.user.openId);
      const now = new Date();
      
      let startDate: Date;
      switch (input?.period || "month") {
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      const periodAppointments = appointments.filter(apt => new Date(apt.date) >= startDate);
      
      return {
        total: periodAppointments.length,
        completed: periodAppointments.filter(apt => apt.status === "completed").length,
        cancelled: periodAppointments.filter(apt => apt.status === "cancelled").length,
        noShow: periodAppointments.filter(apt => apt.status === "no_show").length,
        upcoming: appointments.filter(apt => new Date(apt.date) > now && apt.status !== "cancelled").length,
        byStatus: {
          scheduled: periodAppointments.filter(apt => apt.status === "scheduled").length,
          confirmed: periodAppointments.filter(apt => apt.status === "confirmed").length,
          in_progress: periodAppointments.filter(apt => apt.status === "in_progress").length,
          completed: periodAppointments.filter(apt => apt.status === "completed").length,
          cancelled: periodAppointments.filter(apt => apt.status === "cancelled").length,
          no_show: periodAppointments.filter(apt => apt.status === "no_show").length,
          rescheduled: periodAppointments.filter(apt => apt.status === "rescheduled").length,
        },
        completionRate: periodAppointments.length > 0
          ? (periodAppointments.filter(apt => apt.status === "completed").length / periodAppointments.length) * 100
          : 0,
      };
    }),
  
  /**
   * Convertir cita a servicio
   */
  convertToService: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await db.getAppointment(ctx.user.openId, input.appointmentId);
      if (!appointment) {
        throw new Error("Cita no encontrada");
      }
      
      // Crear servicio basado en la cita
      const service = await db.createService({
        clientId: appointment.clientId,
        pianoId: appointment.pianoId || 0,
        serviceType: appointment.serviceType || "other",
        date: new Date(appointment.date),
        duration: appointment.duration,
        notes: appointment.notes,
        status: "scheduled",
        appointmentId: appointment.id,
        odId: ctx.user.openId,
      });
      
      // Actualizar estado de la cita
      await db.updateAppointment(ctx.user.openId, input.appointmentId, {
        status: "completed",
      });
      
      return service;
    }),
});
