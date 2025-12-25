/**
 * Servicio de Asignación de Trabajos
 * Piano Emotion Manager
 * 
 * Maneja la asignación, reasignación y seguimiento de trabajos a técnicos.
 */

import { eq, and, gte, lte, desc, asc, sql, or } from 'drizzle-orm';
import { db } from '../../db';
import {
  workAssignments,
  organizationMembers,
  memberAbsences,
  technicianZones,
  serviceZones,
  WorkAssignment,
  InsertWorkAssignment,
  OrganizationMember,
} from '../../../drizzle/team-schema';
import { appointments, services, clients } from '../../../drizzle/schema';
import { organizationService } from './organization.service';

// ==========================================
// TIPOS
// ==========================================

export interface CreateAssignmentInput {
  organizationId: number;
  appointmentId?: number;
  serviceId?: number;
  technicianId: number;
  scheduledDate: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedBy: number;
  assignmentNotes?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReassignInput {
  assignmentId: number;
  newTechnicianId: number;
  reassignedBy: number;
  reason: string;
}

export interface TechnicianAvailability {
  memberId: number;
  userId: number;
  displayName: string;
  color: string;
  isAvailable: boolean;
  currentLoad: number; // Número de trabajos asignados para el día
  maxLoad: number;
  nextAvailableSlot?: string;
  absenceReason?: string;
}

export interface WorkAssignmentWithDetails extends WorkAssignment {
  technician: {
    displayName: string;
    color: string;
    phone: string;
  };
  client?: {
    name: string;
    address: string;
    phone: string;
  };
  appointment?: {
    title: string;
    serviceType: string;
  };
}

export interface DailySchedule {
  date: Date;
  technicians: {
    memberId: number;
    displayName: string;
    color: string;
    assignments: WorkAssignmentWithDetails[];
    totalMinutes: number;
  }[];
}

// ==========================================
// SERVICIO
// ==========================================

export class WorkAssignmentService {
  
  /**
   * Crear una nueva asignación de trabajo
   */
  async create(input: CreateAssignmentInput): Promise<WorkAssignment> {
    // Verificar disponibilidad del técnico
    const availability = await this.checkTechnicianAvailability(
      input.organizationId,
      input.technicianId,
      input.scheduledDate
    );
    
    if (!availability.isAvailable) {
      throw new Error(`El técnico no está disponible: ${availability.absenceReason || 'Carga máxima alcanzada'}`);
    }
    
    // Crear asignación
    const [assignment] = await db.insert(workAssignments).values({
      organizationId: input.organizationId,
      appointmentId: input.appointmentId,
      serviceId: input.serviceId,
      technicianId: input.technicianId,
      status: 'assigned',
      priority: input.priority || 'normal',
      scheduledDate: input.scheduledDate,
      scheduledStartTime: input.scheduledStartTime,
      scheduledEndTime: input.scheduledEndTime,
      estimatedDuration: input.estimatedDuration,
      assignedBy: input.assignedBy,
      assignmentNotes: input.assignmentNotes,
      latitude: input.latitude,
      longitude: input.longitude,
    }).returning();
    
    // Enviar notificación al técnico
    try {
      const { notificationService } = await import('../notifications/notification.service');
      await notificationService.notifyNewAssignment(technicianId, {
        clientName: input.clientName || 'Cliente',
        serviceType: input.serviceType || 'Servicio',
        scheduledDate: input.scheduledDate,
        priority: input.priority || 'normal',
        assignmentId: assignment.id,
        organizationId: this.organizationId,
      });
    } catch (notifyError) {
      console.error('Error enviando notificación de asignación:', notifyError);
    }
    
    return assignment;
  }
  
  /**
   * Obtener asignación por ID
   */
  async getById(id: number): Promise<WorkAssignment | null> {
    const [assignment] = await db
      .select()
      .from(workAssignments)
      .where(eq(workAssignments.id, id))
      .limit(1);
    
    return assignment || null;
  }
  
  /**
   * Obtener asignaciones de un técnico para un rango de fechas
   */
  async getByTechnician(
    technicianId: number,
    startDate: Date,
    endDate: Date
  ): Promise<WorkAssignment[]> {
    return db
      .select()
      .from(workAssignments)
      .where(
        and(
          eq(workAssignments.technicianId, technicianId),
          gte(workAssignments.scheduledDate, startDate),
          lte(workAssignments.scheduledDate, endDate)
        )
      )
      .orderBy(asc(workAssignments.scheduledDate), asc(workAssignments.scheduledStartTime));
  }
  
  /**
   * Obtener asignaciones de una organización para un día
   */
  async getByOrganizationAndDate(
    organizationId: number,
    date: Date
  ): Promise<WorkAssignmentWithDetails[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const assignments = await db
      .select({
        assignment: workAssignments,
        technician: {
          displayName: organizationMembers.displayName,
          color: organizationMembers.color,
          phone: organizationMembers.phone,
        },
      })
      .from(workAssignments)
      .innerJoin(
        organizationMembers,
        and(
          eq(workAssignments.technicianId, organizationMembers.userId),
          eq(workAssignments.organizationId, organizationMembers.organizationId)
        )
      )
      .where(
        and(
          eq(workAssignments.organizationId, organizationId),
          gte(workAssignments.scheduledDate, startOfDay),
          lte(workAssignments.scheduledDate, endOfDay)
        )
      )
      .orderBy(asc(workAssignments.scheduledStartTime));
    
    return assignments.map(a => ({
      ...a.assignment,
      technician: a.technician,
    }));
  }
  
  /**
   * Obtener calendario diario de toda la organización
   */
  async getDailySchedule(organizationId: number, date: Date): Promise<DailySchedule> {
    // Obtener todos los técnicos asignables
    const technicians = await organizationService.getAssignableTechnicians(organizationId);
    
    // Obtener todas las asignaciones del día
    const assignments = await this.getByOrganizationAndDate(organizationId, date);
    
    // Agrupar por técnico
    const technicianSchedules = technicians.map(tech => {
      const techAssignments = assignments.filter(a => a.technicianId === tech.userId);
      const totalMinutes = techAssignments.reduce((sum, a) => sum + (a.estimatedDuration || 60), 0);
      
      return {
        memberId: tech.id,
        displayName: tech.displayName || 'Sin nombre',
        color: tech.color || '#3b82f6',
        assignments: techAssignments,
        totalMinutes,
      };
    });
    
    return {
      date,
      technicians: technicianSchedules,
    };
  }
  
  /**
   * Reasignar trabajo a otro técnico
   */
  async reassign(input: ReassignInput): Promise<WorkAssignment> {
    const assignment = await this.getById(input.assignmentId);
    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }
    
    // Verificar disponibilidad del nuevo técnico
    const availability = await this.checkTechnicianAvailability(
      assignment.organizationId,
      input.newTechnicianId,
      assignment.scheduledDate
    );
    
    if (!availability.isAvailable) {
      throw new Error(`El técnico no está disponible: ${availability.absenceReason || 'Carga máxima alcanzada'}`);
    }
    
    // Actualizar asignación
    const [updated] = await db
      .update(workAssignments)
      .set({
        previousTechnicianId: assignment.technicianId,
        technicianId: input.newTechnicianId,
        status: 'reassigned',
        reassignedAt: new Date(),
        reassignmentReason: input.reason,
      })
      .where(eq(workAssignments.id, input.assignmentId))
      .returning();
    
    // TODO: Notificar a ambos técnicos
    
    return updated;
  }
  
  /**
   * Aceptar asignación (por el técnico)
   */
  async accept(assignmentId: number, technicianId: number): Promise<WorkAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }
    
    if (assignment.technicianId !== technicianId) {
      throw new Error('Esta asignación no te pertenece');
    }
    
    const [updated] = await db
      .update(workAssignments)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(workAssignments.id, assignmentId))
      .returning();
    
    return updated;
  }
  
  /**
   * Rechazar asignación (por el técnico)
   */
  async reject(assignmentId: number, technicianId: number, reason: string): Promise<WorkAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }
    
    if (assignment.technicianId !== technicianId) {
      throw new Error('Esta asignación no te pertenece');
    }
    
    const [updated] = await db
      .update(workAssignments)
      .set({
        status: 'unassigned',
        rejectedAt: new Date(),
        rejectionReason: reason,
        technicianId: null as any, // Dejar sin asignar
      })
      .where(eq(workAssignments.id, assignmentId))
      .returning();
    
    // TODO: Notificar al manager
    
    return updated;
  }
  
  /**
   * Iniciar trabajo
   */
  async startWork(assignmentId: number, technicianId: number): Promise<WorkAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }
    
    if (assignment.technicianId !== technicianId) {
      throw new Error('Esta asignación no te pertenece');
    }
    
    const [updated] = await db
      .update(workAssignments)
      .set({
        status: 'in_progress',
        actualStartTime: new Date(),
      })
      .where(eq(workAssignments.id, assignmentId))
      .returning();
    
    return updated;
  }
  
  /**
   * Completar trabajo
   */
  async complete(
    assignmentId: number,
    technicianId: number,
    notes?: string
  ): Promise<WorkAssignment> {
    const assignment = await this.getById(assignmentId);
    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }
    
    if (assignment.technicianId !== technicianId) {
      throw new Error('Esta asignación no te pertenece');
    }
    
    const [updated] = await db
      .update(workAssignments)
      .set({
        status: 'completed',
        actualEndTime: new Date(),
        technicianNotes: notes,
      })
      .where(eq(workAssignments.id, assignmentId))
      .returning();
    
    return updated;
  }
  
  /**
   * Cancelar asignación
   */
  async cancel(assignmentId: number, cancelledBy: number): Promise<WorkAssignment> {
    const [updated] = await db
      .update(workAssignments)
      .set({ status: 'cancelled' })
      .where(eq(workAssignments.id, assignmentId))
      .returning();
    
    return updated;
  }
  
  /**
   * Verificar disponibilidad de un técnico para una fecha
   */
  async checkTechnicianAvailability(
    organizationId: number,
    technicianId: number,
    date: Date
  ): Promise<TechnicianAvailability> {
    // Obtener miembro
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, technicianId),
          eq(organizationMembers.status, 'active')
        )
      )
      .limit(1);
    
    if (!member) {
      return {
        memberId: 0,
        userId: technicianId,
        displayName: 'Desconocido',
        color: '#gray',
        isAvailable: false,
        currentLoad: 0,
        maxLoad: 0,
        absenceReason: 'Técnico no encontrado o inactivo',
      };
    }
    
    // Verificar ausencias
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [absence] = await db
      .select()
      .from(memberAbsences)
      .where(
        and(
          eq(memberAbsences.memberId, member.id),
          eq(memberAbsences.status, 'approved'),
          lte(memberAbsences.startDate, endOfDay),
          gte(memberAbsences.endDate, startOfDay)
        )
      )
      .limit(1);
    
    if (absence) {
      return {
        memberId: member.id,
        userId: technicianId,
        displayName: member.displayName || 'Sin nombre',
        color: member.color || '#3b82f6',
        isAvailable: false,
        currentLoad: 0,
        maxLoad: member.maxDailyAppointments || 8,
        absenceReason: `Ausencia: ${absence.absenceType}`,
      };
    }
    
    // Contar asignaciones del día
    const assignmentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(workAssignments)
      .where(
        and(
          eq(workAssignments.technicianId, technicianId),
          gte(workAssignments.scheduledDate, startOfDay),
          lte(workAssignments.scheduledDate, endOfDay),
          or(
            eq(workAssignments.status, 'assigned'),
            eq(workAssignments.status, 'accepted'),
            eq(workAssignments.status, 'in_progress')
          )
        )
      );
    
    const currentLoad = Number(assignmentsCount[0]?.count || 0);
    const maxLoad = member.maxDailyAppointments || 8;
    
    return {
      memberId: member.id,
      userId: technicianId,
      displayName: member.displayName || 'Sin nombre',
      color: member.color || '#3b82f6',
      isAvailable: currentLoad < maxLoad,
      currentLoad,
      maxLoad,
    };
  }
  
  /**
   * Obtener disponibilidad de todos los técnicos para una fecha
   */
  async getAllTechniciansAvailability(
    organizationId: number,
    date: Date
  ): Promise<TechnicianAvailability[]> {
    const technicians = await organizationService.getAssignableTechnicians(organizationId);
    
    const availabilities = await Promise.all(
      technicians.map(tech => 
        this.checkTechnicianAvailability(organizationId, tech.userId, date)
      )
    );
    
    return availabilities;
  }
  
  /**
   * Sugerir mejor técnico para una asignación
   */
  async suggestBestTechnician(
    organizationId: number,
    date: Date,
    postalCode?: string,
    serviceType?: string
  ): Promise<TechnicianAvailability | null> {
    const availabilities = await this.getAllTechniciansAvailability(organizationId, date);
    
    // Filtrar solo disponibles
    const available = availabilities.filter(a => a.isAvailable);
    
    if (available.length === 0) return null;
    
    // Ordenar por menor carga
    available.sort((a, b) => a.currentLoad - b.currentLoad);
    
    // TODO: Considerar zona y especialidad del técnico
    
    return available[0];
  }
  
  /**
   * Obtener estadísticas de asignaciones
   */
  async getAssignmentStats(
    organizationId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    averageDuration: number;
  }> {
    const stats = await db
      .select({
        status: workAssignments.status,
        count: sql<number>`count(*)`,
        avgDuration: sql<number>`avg(${workAssignments.estimatedDuration})`,
      })
      .from(workAssignments)
      .where(
        and(
          eq(workAssignments.organizationId, organizationId),
          gte(workAssignments.scheduledDate, startDate),
          lte(workAssignments.scheduledDate, endDate)
        )
      )
      .groupBy(workAssignments.status);
    
    const result = {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      averageDuration: 0,
    };
    
    let totalDuration = 0;
    let durationCount = 0;
    
    for (const row of stats) {
      const count = Number(row.count);
      result.total += count;
      
      if (row.status === 'completed') result.completed = count;
      else if (row.status === 'cancelled') result.cancelled = count;
      else result.pending += count;
      
      if (row.avgDuration) {
        totalDuration += Number(row.avgDuration) * count;
        durationCount += count;
      }
    }
    
    result.averageDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    
    return result;
  }
}

// Exportar instancia singleton
export const workAssignmentService = new WorkAssignmentService();
