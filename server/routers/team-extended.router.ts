/**
 * Router Extendido de API para Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Endpoints adicionales para ausencias, métricas y zonas de servicio.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { permissionsService } from "../services/team/permissions.service";

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
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para editar zonas" });
      }
      
      const { zoneId, organizationId, ...data } = input;
      return updateServiceZone(zoneId, data);
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
        "update"
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
      organizationId: z.number(),
      zoneId: z.number(),
      memberId: z.number(),
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
      
      return assignTechnicianToZone(input.zoneId, input.memberId, input.isPrimary);
    }),

  /**
   * Quitar técnico de zona
   */
  removeTechnician: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      zoneId: z.number(),
      memberId: z.number(),
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
// FUNCIONES AUXILIARES (STUBS)
// ==========================================

// Estas funciones deben implementarse con las queries reales a la BD

async function getMemberByUserId(userId: number, organizationId: number) {
  // TODO: Implementar query real
  return null;
}

async function getAbsencesByMember(memberId: number, startDate?: string, endDate?: string) {
  // TODO: Implementar query real
  return [];
}

async function getOrganizationAbsences(
  organizationId: number,
  startDate: Date,
  endDate: Date,
  status?: string
) {
  // TODO: Implementar query real
  return [];
}

async function createAbsenceRequest(data: any) {
  // TODO: Implementar mutation real
  return { id: 1, ...data };
}

async function approveAbsence(absenceId: number, approvedBy: number) {
  // TODO: Implementar mutation real
  return { id: absenceId, status: "approved" };
}

async function rejectAbsence(absenceId: number, rejectedBy: number, reason: string) {
  // TODO: Implementar mutation real
  return { id: absenceId, status: "rejected", rejectionReason: reason };
}

async function cancelAbsence(absenceId: number, cancelledBy: number) {
  // TODO: Implementar mutation real
  return { id: absenceId, status: "cancelled" };
}

async function getTechnicianMetrics(organizationId: number, technicianId: number, period: string) {
  // TODO: Implementar query real
  return {
    servicesCompleted: 0,
    totalRevenue: 0,
    averageRating: 0,
    punctualityRate: 0,
    hoursWorked: 0,
  };
}

async function getOrganizationMetrics(organizationId: number, period: string) {
  // TODO: Implementar query real
  return {
    totalServices: 0,
    totalRevenue: 0,
    averageRating: 0,
    activeMembers: 0,
    pendingAssignments: 0,
  };
}

async function getTechnicianRanking(organizationId: number, period: string, metric: string) {
  // TODO: Implementar query real
  return [];
}

async function getDashboardStats(organizationId: number) {
  // TODO: Implementar query real
  return {
    todayAppointments: 0,
    pendingAssignments: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
  };
}

async function getServiceZones(organizationId: number) {
  // TODO: Implementar query real
  return [];
}

async function createServiceZone(data: any) {
  // TODO: Implementar mutation real
  return { id: 1, ...data };
}

async function updateServiceZone(zoneId: number, data: any) {
  // TODO: Implementar mutation real
  return { id: zoneId, ...data };
}

async function deleteServiceZone(zoneId: number) {
  // TODO: Implementar mutation real
  return { success: true };
}

async function assignTechnicianToZone(zoneId: number, memberId: number, isPrimary?: boolean) {
  // TODO: Implementar mutation real
  return { zoneId, memberId, isPrimary };
}

async function removeTechnicianFromZone(zoneId: number, memberId: number) {
  // TODO: Implementar mutation real
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
