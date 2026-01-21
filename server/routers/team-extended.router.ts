/**

interface ServiceZoneUpdate {
  name?: string;
  description?: string;
  postalCodes?: string[];
  color?: string;
  isActive?: boolean;
}
 * Router Extendido de API para Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Endpoints adicionales para ausencias, métricas y zonas de servicio.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, desc, sql, between } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc.js";
import { permissionsService } from "../services/team/permissions.service.js";
import { getDb } from "../db.js";
import {
  organizationMembers,
  memberAbsences,
  serviceZones,
  technicianZones,
  technicianMetrics,
  workAssignments,
} from "../../drizzle/schema.js";
import { services, appointments } from "../../drizzle/schema.js";

// ==========================================
// SCHEMAS DE VALIDACIÓN
// ==========================================

const absenceTypeSchema = z.enum([
  "vacation",
  "sick_leave",
  "personal",
  "training",
  "public_holiday",
  "other",
]);

const absenceStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

// ==========================================
// ROUTER DE AUSENCIAS
// ==========================================

export const absencesRouter = router({
  /**
   * Listar ausencias de un miembro
   */
  byMember: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      memberId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "read"
      );
      
      // Usuarios pueden ver sus propias ausencias
      const member = await getMemberByUserId(ctx.user.id, input.organizationId);
      if (!hasPermission && member?.id !== input.memberId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver estas ausencias" });
      }
      
      return getAbsencesByMember(input.memberId, input.startDate, input.endDate);
    }),

  /**
   * Listar todas las ausencias de la organización
   */
  list: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      status: absenceStatusSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver las ausencias" });
      }
      
      return getOrganizationAbsences(
        input.organizationId,
        new Date(input.startDate),
        new Date(input.endDate),
        input.status
      );
    }),

  /**
   * Solicitar ausencia
   */
  request: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      absenceType: absenceTypeSchema,
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const member = await getMemberByUserId(ctx.user.id, input.organizationId);
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No eres miembro de esta organización" });
      }
      
      return createAbsenceRequest({
        memberId: member.id,
        organizationId: input.organizationId,
        absenceType: input.absenceType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
      });
    }),

  /**
   * Aprobar ausencia
   */
  approve: protectedProcedure
    .input(z.object({
      absenceId: z.number(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para aprobar ausencias" });
      }
      
      return approveAbsence(input.absenceId, ctx.user.id);
    }),

  /**
   * Rechazar ausencia
   */
  reject: protectedProcedure
    .input(z.object({
      absenceId: z.number(),
      organizationId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para rechazar ausencias" });
      }
      
      return rejectAbsence(input.absenceId, ctx.user.id, input.reason);
    }),

  /**
   * Cancelar ausencia propia
   */
  cancel: protectedProcedure
    .input(z.object({ absenceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return cancelAbsence(input.absenceId, ctx.user.id);
    }),
});

// ==========================================
// ROUTER DE MÉTRICAS
// ==========================================

export const metricsRouter = router({
  /**
   * Obtener métricas de un técnico
   */
  technician: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      technicianId: z.number(),
      period: z.enum(["day", "week", "month", "quarter", "year"]),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "reports",
        "read"
      );
      
      // Técnicos pueden ver sus propias métricas
      if (!hasPermission && input.technicianId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver estas métricas" });
      }
      
      return getTechnicianMetrics(input.organizationId, input.technicianId, input.period);
    }),

  /**
   * Obtener métricas de toda la organización
   */
  organization: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      period: z.enum(["day", "week", "month", "quarter", "year"]),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "reports",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver las métricas" });
      }
      
      return getOrganizationMetrics(input.organizationId, input.period);
    }),

  /**
   * Obtener ranking de técnicos
   */
  ranking: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      period: z.enum(["week", "month", "quarter", "year"]),
      metric: z.enum(["services", "revenue", "rating", "punctuality"]),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "reports",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver el ranking" });
      }
      
      return getTechnicianRanking(input.organizationId, input.period, input.metric);
    }),

  /**
   * Dashboard de estadísticas
   */
  dashboard: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "reports",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver el dashboard" });
      }
      
      return getDashboardStats(input.organizationId);
    }),
});

// ==========================================
// ROUTER DE ZONAS DE SERVICIO
// ==========================================

export const zonesRouter = router({
  /**
   * Listar zonas de servicio
   */
  list: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "organization",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver las zonas" });
      }
      
      return getServiceZones(input.organizationId);
    }),

  /**
   * Crear zona de servicio
   */
  create: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      postalCodes: z.array(z.string()),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "organization",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para crear zonas" });
      }
      
      return createServiceZone(input);
    }),

  /**
   * Actualizar zona de servicio
   */
  update: protectedProcedure
    .input(z.object({
      zoneId: z.number(),
      organizationId: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      postalCodes: z.array(z.string()).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "organization",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para actualizar zonas" });
      }
      
      return updateServiceZone(input.zoneId, input);
    }),

  /**
   * Eliminar zona de servicio
   */
  delete: protectedProcedure
    .input(z.object({
      zoneId: z.number(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "organization",
        "delete"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para eliminar zonas" });
      }
      
      return deleteServiceZone(input.zoneId);
    }),

  /**
   * Asignar técnico a zona
   */
  assignTechnician: protectedProcedure
    .input(z.object({
      zoneId: z.number(),
      memberId: z.number(),
      organizationId: z.number(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para asignar zonas" });
      }
      
      return assignTechnicianToZone(input.zoneId, input.memberId, input.organizationId, input.isPrimary);
    }),

  /**
   * Desasignar técnico de zona
   */
  unassignTechnician: protectedProcedure
    .input(z.object({
      zoneId: z.number(),
      memberId: z.number(),
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para desasignar zonas" });
      }
      
      return removeTechnicianFromZone(input.zoneId, input.memberId);
    }),
});

// ==========================================
// FUNCIONES AUXILIARES IMPLEMENTADAS
// ==========================================

/**
 * Obtener miembro por userId y organizationId
 */
async function getMemberByUserId(userId: number, organizationId: number) {
  const [member] = await (await getDb())!
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active")
      )
    )
    .limit(1);
  
  return member || null;
}

/**
 * Obtener ausencias de un miembro
 */
async function getAbsencesByMember(memberId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select()
    .from(memberAbsences)
    .where(eq(memberAbsences.memberId, memberId))
    .orderBy(desc(memberAbsences.startDate));

  if (startDate && endDate) {
    query = db
      .select()
      .from(memberAbsences)
      .where(
        and(
          eq(memberAbsences.memberId, memberId),
          gte(memberAbsences.startDate, new Date(startDate)),
          lte(memberAbsences.endDate, new Date(endDate))
        )
      )
      .orderBy(desc(memberAbsences.startDate));
  }

  return query;
}

/**
 * Obtener ausencias de toda la organización
 */
async function getOrganizationAbsences(
  organizationId: number,
  startDate: Date,
  endDate: Date,
  status?: string
) {
  const conditions = [
    eq(memberAbsences.organizationId, organizationId),
    gte(memberAbsences.startDate, startDate),
    lte(memberAbsences.endDate, endDate),
  ];

  if (status) {
    conditions.push(eq(memberAbsences.status, status as any));
  }

  const absences = await (await getDb())!
    .select({
      absence: memberAbsences,
      member: organizationMembers,
    })
    .from(memberAbsences)
    .leftJoin(organizationMembers, eq(memberAbsences.memberId, organizationMembers.id))
    .where(and(...conditions))
    .orderBy(desc(memberAbsences.startDate));

  return absences.map(({ absence, member }) => ({
    ...absence,
    memberName: member?.displayName || 'Desconocido',
  }));
}

/**
 * Crear solicitud de ausencia
 */
async function createAbsenceRequest(data: {
  memberId: number;
  organizationId: number;
  absenceType: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}) {
  const [result] = await (await getDb())!.insert(memberAbsences).values({
    memberId: data.memberId,
    organizationId: data.organizationId,
    absenceType: data.absenceType as any,
    startDate: data.startDate,
    endDate: data.endDate,
    notes: data.reason,
    status: "pending",
  });

  return { id: result.insertId, ...data, status: "pending" };
}

/**
 * Aprobar ausencia
 */
async function approveAbsence(absenceId: number, approvedBy: number) {
  await (await getDb())!
    .update(memberAbsences)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(memberAbsences.id, absenceId));

  return { id: absenceId, status: "approved" };
}

/**
 * Rechazar ausencia
 */
async function rejectAbsence(absenceId: number, rejectedBy: number, reason: string) {
  await (await getDb())!
    .update(memberAbsences)
    .set({
      status: "rejected",
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(memberAbsences.id, absenceId));

  return { id: absenceId, status: "rejected", rejectionReason: reason };
}

/**
 * Cancelar ausencia
 */
async function cancelAbsence(absenceId: number, cancelledBy: number) {
  // Verificar que la ausencia pertenece al usuario
  const [absence] = await (await getDb())!
    .select()
    .from(memberAbsences)
    .where(eq(memberAbsences.id, absenceId))
    .limit(1);

  if (!absence) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ausencia no encontrada" });
  }

  // Obtener el miembro para verificar
  const [member] = await (await getDb())!
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.id, absence.memberId))
    .limit(1);

  if (!member || member.userId !== cancelledBy) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No puedes cancelar esta ausencia" });
  }

  // Solo se pueden cancelar ausencias pendientes
  if (absence.status !== "pending") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se pueden cancelar ausencias pendientes" });
  }

  await (await getDb())!.delete(memberAbsences).where(eq(memberAbsences.id, absenceId));

  return { id: absenceId, status: "cancelled" };
}

/**
 * Calcular fechas según período
 */
function getDateRangeForPeriod(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (period) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * Obtener métricas de un técnico
 */
async function getTechnicianMetrics(organizationId: number, technicianId: number, period: string) {
  const { startDate, endDate } = getDateRangeForPeriod(period);

  // Obtener métricas agregadas del período
  const metrics = await (await getDb())!
    .select({
      servicesCompleted: sql<number>`SUM(${technicianMetrics.servicesCompleted})`,
      totalRevenue: sql<number>`SUM(${technicianMetrics.totalRevenue})`,
      averageRating: sql<number>`AVG(${technicianMetrics.averageRating})`,
      totalWorkMinutes: sql<number>`SUM(${technicianMetrics.totalWorkMinutes})`,
      onTimeArrivals: sql<number>`SUM(${technicianMetrics.onTimeArrivals})`,
      lateArrivals: sql<number>`SUM(${technicianMetrics.lateArrivals})`,
    })
    .from(technicianMetrics)
    .where(
      and(
        eq(technicianMetrics.organizationId, organizationId),
        eq(technicianMetrics.memberId, technicianId),
        between(technicianMetrics.date, startDate, endDate)
      )
    );

  const result = metrics[0] || {};
  const totalArrivals = (result.onTimeArrivals || 0) + (result.lateArrivals || 0);

  return {
    servicesCompleted: result.servicesCompleted || 0,
    totalRevenue: result.totalRevenue || 0,
    averageRating: result.averageRating || 0,
    punctualityRate: totalArrivals > 0 ? ((result.onTimeArrivals || 0) / totalArrivals) * 100 : 100,
    hoursWorked: Math.round((result.totalWorkMinutes || 0) / 60),
  };
}

/**
 * Obtener métricas de la organización
 */
async function getOrganizationMetrics(organizationId: number, period: string) {
  const { startDate, endDate } = getDateRangeForPeriod(period);

  // Métricas agregadas de todos los técnicos
  const metrics = await (await getDb())!
    .select({
      totalServices: sql<number>`SUM(${technicianMetrics.servicesCompleted})`,
      totalRevenue: sql<number>`SUM(${technicianMetrics.totalRevenue})`,
      averageRating: sql<number>`AVG(${technicianMetrics.averageRating})`,
    })
    .from(technicianMetrics)
    .where(
      and(
        eq(technicianMetrics.organizationId, organizationId),
        between(technicianMetrics.date, startDate, endDate)
      )
    );

  // Contar miembros activos
  const [activeMembers] = await (await getDb())!
    .select({ count: sql<number>`COUNT(*)` })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active")
      )
    );

  // Contar asignaciones pendientes
  const [pendingAssignments] = await (await getDb())!
    .select({ count: sql<number>`COUNT(*)` })
    .from(workAssignments)
    .where(
      and(
        eq(workAssignments.organizationId, organizationId),
        eq(workAssignments.status, "assigned")
      )
    );

  const result = metrics[0] || {};

  return {
    totalServices: result.totalServices || 0,
    totalRevenue: result.totalRevenue || 0,
    averageRating: result.averageRating || 0,
    activeMembers: activeMembers?.count || 0,
    pendingAssignments: pendingAssignments?.count || 0,
  };
}

/**
 * Obtener ranking de técnicos
 */
async function getTechnicianRanking(organizationId: number, period: string, metric: string) {
  const { startDate, endDate } = getDateRangeForPeriod(period);

  let orderByColumn;
  switch (metric) {
    case "services":
      orderByColumn = sql`SUM(${technicianMetrics.servicesCompleted})`;
      break;
    case "revenue":
      orderByColumn = sql`SUM(${technicianMetrics.totalRevenue})`;
      break;
    case "rating":
      orderByColumn = sql`AVG(${technicianMetrics.averageRating})`;
      break;
    case "punctuality":
      orderByColumn = sql`SUM(${technicianMetrics.onTimeArrivals}) / NULLIF(SUM(${technicianMetrics.onTimeArrivals}) + SUM(${technicianMetrics.lateArrivals}), 0)`;
      break;
    default:
      orderByColumn = sql`SUM(${technicianMetrics.servicesCompleted})`;
  }

  const ranking = await (await getDb())!
    .select({
      memberId: technicianMetrics.memberId,
      memberName: organizationMembers.displayName,
      servicesCompleted: sql<number>`SUM(${technicianMetrics.servicesCompleted})`,
      totalRevenue: sql<number>`SUM(${technicianMetrics.totalRevenue})`,
      averageRating: sql<number>`AVG(${technicianMetrics.averageRating})`,
      onTimeArrivals: sql<number>`SUM(${technicianMetrics.onTimeArrivals})`,
      lateArrivals: sql<number>`SUM(${technicianMetrics.lateArrivals})`,
    })
    .from(technicianMetrics)
    .leftJoin(organizationMembers, eq(technicianMetrics.memberId, organizationMembers.id))
    .where(
      and(
        eq(technicianMetrics.organizationId, organizationId),
        between(technicianMetrics.date, startDate, endDate)
      )
    )
    .groupBy(technicianMetrics.memberId, organizationMembers.displayName)
    .orderBy(desc(orderByColumn))
    .limit(10);

  return ranking.map((r, index) => ({
    rank: index + 1,
    memberId: r.memberId,
    memberName: r.memberName || 'Técnico',
    servicesCompleted: r.servicesCompleted || 0,
    totalRevenue: r.totalRevenue || 0,
    averageRating: r.averageRating || 0,
    punctualityRate: (r.onTimeArrivals || 0) + (r.lateArrivals || 0) > 0
      ? ((r.onTimeArrivals || 0) / ((r.onTimeArrivals || 0) + (r.lateArrivals || 0))) * 100
      : 100,
  }));
}

/**
 * Obtener estadísticas del dashboard
 */
async function getDashboardStats(organizationId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Citas de hoy
  const [todayAppointmentsResult] = await (await getDb())!
    .select({ count: sql<number>`COUNT(*)` })
    .from(workAssignments)
    .where(
      and(
        eq(workAssignments.organizationId, organizationId),
        between(workAssignments.scheduledDate, today, tomorrow)
      )
    );

  // Asignaciones pendientes
  const [pendingResult] = await (await getDb())!
    .select({ count: sql<number>`COUNT(*)` })
    .from(workAssignments)
    .where(
      and(
        eq(workAssignments.organizationId, organizationId),
        eq(workAssignments.status, "assigned")
      )
    );

  // Miembros activos
  const [activeMembersResult] = await (await getDb())!
    .select({ count: sql<number>`COUNT(*)` })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active")
      )
    );

  // Ingresos del mes
  const [monthlyRevenueResult] = await (await getDb())!
    .select({ total: sql<number>`SUM(${technicianMetrics.totalRevenue})` })
    .from(technicianMetrics)
    .where(
      and(
        eq(technicianMetrics.organizationId, organizationId),
        gte(technicianMetrics.date, startOfMonth)
      )
    );

  return {
    todayAppointments: todayAppointmentsResult?.count || 0,
    pendingAssignments: pendingResult?.count || 0,
    activeMembers: activeMembersResult?.count || 0,
    monthlyRevenue: monthlyRevenueResult?.total || 0,
  };
}

/**
 * Obtener zonas de servicio
 */
async function getServiceZones(organizationId: number) {
  const zones = await (await getDb())!
    .select()
    .from(serviceZones)
    .where(eq(serviceZones.organizationId, organizationId))
    .orderBy(serviceZones.name);

  // Obtener técnicos asignados a cada zona
  const zonesWithTechnicians = await Promise.all(
    zones.map(async (zone) => {
      const technicians = await (await getDb())!
        .select({
          memberId: technicianZones.memberId,
          isPrimary: technicianZones.isPrimary,
          memberName: organizationMembers.displayName,
        })
        .from(technicianZones)
        .leftJoin(organizationMembers, eq(technicianZones.memberId, organizationMembers.id))
        .where(eq(technicianZones.zoneId, zone.id));

      return {
        ...zone,
        technicians,
      };
    })
  );

  return zonesWithTechnicians;
}

/**
 * Crear zona de servicio
 */
async function createServiceZone(data: {
  organizationId: number;
  name: string;
  description?: string;
  postalCodes: string[];
  color?: string;
}) {
  const [result] = await (await getDb())!.insert(serviceZones).values({
    organizationId: data.organizationId,
    name: data.name,
    description: data.description,
    postalCodes: data.postalCodes,
    color: data.color || '#3B82F6',
    isActive: true,
  });

  return { id: result.insertId, ...data };
}

/**
 * Actualizar zona de servicio
 */
async function updateServiceZone(zoneId: number, data: ServiceZoneUpdate) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.postalCodes !== undefined) updateData.postalCodes = data.postalCodes;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await (await getDb())!
    .update(serviceZones)
    .set(updateData)
    .where(eq(serviceZones.id, zoneId));

  return { id: zoneId, ...updateData };
}

/**
 * Eliminar zona de servicio
 */
async function deleteServiceZone(zoneId: number) {
  // Primero eliminar asignaciones de técnicos
  await (await getDb())!.delete(technicianZones).where(eq(technicianZones.zoneId, zoneId));
  
  // Luego eliminar la zona
  await (await getDb())!.delete(serviceZones).where(eq(serviceZones.id, zoneId));

  return { success: true };
}

/**
 * Asignar técnico a zona
 */
async function assignTechnicianToZone(zoneId: number, memberId: number, organizationId: number, isPrimary?: boolean) {
  // Verificar si ya existe la asignación
  const [existing] = await (await getDb())!
    .select()
    .from(technicianZones)
    .where(
      and(
        eq(technicianZones.zoneId, zoneId),
        eq(technicianZones.memberId, memberId)
      )
    )
    .limit(1);

  if (existing) {
    // Actualizar si ya existe
    await (await getDb())!
      .update(technicianZones)
      .set({ isPrimary: isPrimary || false })
      .where(eq(technicianZones.id, existing.id));
    
    return { zoneId, memberId, isPrimary: isPrimary || false };
  }

  // Crear nueva asignación
  await (await getDb())!.insert(technicianZones).values({
    organizationId,
    zoneId,
    memberId,
    isPrimary: isPrimary || false,
  });

  return { zoneId, memberId, isPrimary: isPrimary || false };
}

/**
 * Desasignar técnico de zona
 */
async function removeTechnicianFromZone(zoneId: number, memberId: number) {
  await (await getDb())!
    .delete(technicianZones)
    .where(
      and(
        eq(technicianZones.zoneId, zoneId),
        eq(technicianZones.memberId, memberId)
      )
    );

  return { success: true };
}

// ==========================================
// ROUTER EXTENDIDO
// ==========================================

export const teamExtendedRouter = router({
  absences: absencesRouter,
  metrics: metricsRouter,
  zones: zonesRouter,
});
