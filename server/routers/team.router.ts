/**
 * Router de API para Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Define todos los endpoints REST para organizaciones, miembros y asignaciones.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { organizationService } from "../services/team/organization.service";
import { workAssignmentService } from "../services/team/work-assignment.service";
import { permissionsService } from "../services/team/permissions.service";

// ==========================================
// SCHEMAS DE VALIDACIÓN
// ==========================================

const organizationRoleSchema = z.enum([
  "owner",
  "admin",
  "manager",
  "senior_tech",
  "technician",
  "apprentice",
  "receptionist",
  "accountant",
  "viewer",
]);

const memberStatusSchema = z.enum([
  "active",
  "pending_invitation",
  "suspended",
  "inactive",
]);

const workAssignmentStatusSchema = z.enum([
  "unassigned",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "reassigned",
]);

const workPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

const absenceTypeSchema = z.enum([
  "vacation",
  "sick_leave",
  "personal",
  "training",
  "public_holiday",
  "other",
]);

// ==========================================
// ROUTER DE ORGANIZACIONES
// ==========================================

export const organizationsRouter = router({
  /**
   * Obtener organizaciones del usuario actual
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return organizationService.getByUserId(ctx.user.id);
  }),

  /**
   * Obtener una organización por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const org = await organizationService.getById(input.id);
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organización no encontrada" });
      }
      
      // Verificar que el usuario pertenece a la organización
      const hasAccess = await permissionsService.hasPermission(
        ctx.user.id,
        input.id,
        "organization",
        "read"
      );
      
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a esta organización" });
      }
      
      return org;
    }),

  /**
   * Obtener organización con miembros
   */
  getWithMembers: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await permissionsService.hasPermission(
        ctx.user.id,
        input.id,
        "members",
        "read"
      );
      
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver los miembros" });
      }
      
      return organizationService.getWithMembers(input.id);
    }),

  /**
   * Crear nueva organización
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      taxId: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return organizationService.create({
        ...input,
        ownerId: ctx.user.id,
      });
    }),

  /**
   * Actualizar organización
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      logo: z.string().optional(),
      taxId: z.string().optional(),
      legalName: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      bankAccount: z.string().optional(),
      bankName: z.string().optional(),
      swiftBic: z.string().optional(),
      invoicePrefix: z.string().max(10).optional(),
      defaultTaxRate: z.number().min(0).max(100).optional(),
      defaultCurrency: z.string().length(3).optional(),
      defaultServiceDuration: z.number().min(15).max(480).optional(),
      workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      workingDays: z.array(z.number().min(0).max(6)).optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        id,
        "organization",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para editar esta organización" });
      }
      
      return organizationService.update(id, data);
    }),
});

// ==========================================
// ROUTER DE MIEMBROS
// ==========================================

export const membersRouter = router({
  /**
   * Listar miembros activos de una organización
   */
  list: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver los miembros" });
      }
      
      return organizationService.getActiveMembers(input.organizationId);
    }),

  /**
   * Obtener técnicos asignables
   */
  assignable: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver los técnicos" });
      }
      
      return organizationService.getAssignableTechnicians(input.organizationId);
    }),

  /**
   * Invitar nuevo miembro
   */
  invite: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      email: z.string().email(),
      role: organizationRoleSchema.exclude(["owner"]),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "invitations",
        "create"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para invitar miembros" });
      }
      
      // Verificar que puede asignar este rol
      const userRole = await permissionsService.getUserRole(ctx.user.id, input.organizationId);
      if (!userRole || !permissionsService.canAssignRole(userRole, input.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes asignar este rol" });
      }
      
      return organizationService.inviteMember({
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.user.id,
        message: input.message,
      });
    }),

  /**
   * Aceptar invitación
   */
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return organizationService.acceptInvitation(input.token, ctx.user.id);
    }),

  /**
   * Cambiar rol de un miembro
   */
  changeRole: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      memberId: z.number(),
      newRole: organizationRoleSchema.exclude(["owner"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "update"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para cambiar roles" });
      }
      
      // Verificar jerarquía
      const canManage = await permissionsService.canManageMember(
        ctx.user.id,
        input.memberId,
        input.organizationId
      );
      
      if (!canManage) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes gestionar a este miembro" });
      }
      
      return organizationService.changeMemberRole(
        input.organizationId,
        input.memberId,
        input.newRole,
        ctx.user.id
      );
    }),

  /**
   * Suspender miembro
   */
  suspend: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      memberId: z.number(),
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
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para suspender miembros" });
      }
      
      return organizationService.suspendMember(
        input.organizationId,
        input.memberId,
        input.reason,
        ctx.user.id
      );
    }),

  /**
   * Eliminar miembro
   */
  remove: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      memberId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "members",
        "delete"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para eliminar miembros" });
      }
      
      return organizationService.removeMember(
        input.organizationId,
        input.memberId,
        ctx.user.id
      );
    }),

  /**
   * Obtener permisos del usuario actual
   */
  myPermissions: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const role = await permissionsService.getUserRole(ctx.user.id, input.organizationId);
      const permissions = await permissionsService.getUserPermissions(ctx.user.id, input.organizationId);
      
      return {
        role,
        permissions,
        isAdmin: role === "owner" || role === "admin",
        isManager: role === "owner" || role === "admin" || role === "manager",
        isTechnician: ["owner", "admin", "manager", "senior_tech", "technician", "apprentice"].includes(role || ""),
      };
    }),
});

// ==========================================
// ROUTER DE ASIGNACIONES DE TRABAJO
// ==========================================

export const workAssignmentsRouter = router({
  /**
   * Obtener asignaciones de un técnico
   */
  byTechnician: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      technicianId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "read"
      );
      
      // Técnicos solo pueden ver sus propias asignaciones
      const role = await permissionsService.getUserRole(ctx.user.id, input.organizationId);
      if (!hasPermission || (role === "technician" && input.technicianId !== ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver estas asignaciones" });
      }
      
      return workAssignmentService.getByTechnician(
        input.technicianId,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  /**
   * Obtener calendario diario de la organización
   */
  dailySchedule: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      date: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver el calendario" });
      }
      
      return workAssignmentService.getDailySchedule(
        input.organizationId,
        new Date(input.date)
      );
    }),

  /**
   * Verificar disponibilidad de técnicos
   */
  availability: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      date: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver la disponibilidad" });
      }
      
      return workAssignmentService.getAllTechniciansAvailability(
        input.organizationId,
        new Date(input.date)
      );
    }),

  /**
   * Sugerir mejor técnico
   */
  suggestTechnician: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      date: z.string(),
      postalCode: z.string().optional(),
      serviceType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "assign"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para asignar trabajos" });
      }
      
      return workAssignmentService.suggestBestTechnician(
        input.organizationId,
        new Date(input.date),
        input.postalCode,
        input.serviceType
      );
    }),

  /**
   * Crear asignación
   */
  create: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      appointmentId: z.number().optional(),
      serviceId: z.number().optional(),
      technicianId: z.number(),
      scheduledDate: z.string(),
      scheduledStartTime: z.string().optional(),
      scheduledEndTime: z.string().optional(),
      estimatedDuration: z.number().optional(),
      priority: workPrioritySchema.optional(),
      assignmentNotes: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "assignments",
        "assign"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para asignar trabajos" });
      }
      
      return workAssignmentService.create({
        ...input,
        scheduledDate: new Date(input.scheduledDate),
        assignedBy: ctx.user.id,
      });
    }),

  /**
   * Reasignar trabajo
   */
  reassign: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      newTechnicianId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const assignment = await workAssignmentService.getById(input.assignmentId);
      if (!assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asignación no encontrada" });
      }
      
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        assignment.organizationId,
        "assignments",
        "assign"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para reasignar trabajos" });
      }
      
      return workAssignmentService.reassign({
        ...input,
        reassignedBy: ctx.user.id,
      });
    }),

  /**
   * Aceptar asignación (técnico)
   */
  accept: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return workAssignmentService.accept(input.assignmentId, ctx.user.id);
    }),

  /**
   * Rechazar asignación (técnico)
   */
  reject: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return workAssignmentService.reject(input.assignmentId, ctx.user.id, input.reason);
    }),

  /**
   * Iniciar trabajo
   */
  start: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return workAssignmentService.startWork(input.assignmentId, ctx.user.id);
    }),

  /**
   * Completar trabajo
   */
  complete: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return workAssignmentService.complete(input.assignmentId, ctx.user.id, input.notes);
    }),

  /**
   * Cancelar asignación
   */
  cancel: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const assignment = await workAssignmentService.getById(input.assignmentId);
      if (!assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asignación no encontrada" });
      }
      
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        assignment.organizationId,
        "assignments",
        "delete"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para cancelar asignaciones" });
      }
      
      return workAssignmentService.cancel(input.assignmentId, ctx.user.id);
    }),

  /**
   * Obtener estadísticas de asignaciones
   */
  stats: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const hasPermission = await permissionsService.hasPermission(
        ctx.user.id,
        input.organizationId,
        "reports",
        "read"
      );
      
      if (!hasPermission) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para ver estadísticas" });
      }
      
      return workAssignmentService.getAssignmentStats(
        input.organizationId,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),
});

// ==========================================
// ROUTER PRINCIPAL DE EQUIPO
// ==========================================

export const teamRouter = router({
  organizations: organizationsRouter,
  members: membersRouter,
  assignments: workAssignmentsRouter,
});
