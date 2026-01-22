/**
 * Servicio de Gestión de Clientes (CRM)
 * Piano Emotion Manager
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, or, gte, lte, like, inArray, sql, desc, asc } from 'drizzle-orm';
import {
  clientProfiles,
  clientTags,
  clientTagAssignments,
  communications,
  crmTasks,
  clientSegments,
  type ClientStatus,
  type ClientSource,
  type CommunicationType,
} from '../../../drizzle/crm-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface ClientFilters {
  search?: string;
  status?: ClientStatus[];
  tags?: number[];
  source?: ClientSource[];
  minScore?: number;
  maxScore?: number;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  hasMarketingConsent?: boolean;
  lastServiceDaysAgo?: number;
}

export interface ClientProfileInput {
  clientId: number;
  status?: ClientStatus;
  source?: ClientSource;
  sourceDetails?: string;
  preferredContactMethod?: CommunicationType;
  preferredContactTime?: string;
  internalNotes?: string;
  specialRequirements?: string;
  marketingConsent?: boolean;
}

export interface ClientWithProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile: {
    status: ClientStatus;
    source?: ClientSource;
    score: number;
    lifetimeValue: number;
    totalServices: number;
    lastServiceDate?: Date;
    tags: Array<{ id: number; name: string; color: string }>;
  };
}

export interface CommunicationInput {
  clientId: number;
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  summary?: string;
  phoneNumber?: string;
  callDuration?: number;
  requiresFollowUp?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

export interface TaskInput {
  clientId?: number;
  assignedTo?: number;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  reminderDate?: Date;
  relatedType?: string;
  relatedId?: number;
}

// ============================================================================
// Client Service
// ============================================================================

export class ClientService {
  private organizationId: number;
  private userId: number;

  constructor(organizationId: number, userId: number) {
    this.organizationId = organizationId;
    this.userId = userId;
  }

  /**
   * Obtiene lista de clientes con perfiles CRM
   */
  async getClients(
    filters: ClientFilters = {},
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ clients: ClientWithProfile[]; total: number }> {
    // En producción, hacer join con tabla de clientes
    // Placeholder: devolver lista vacía
    return { clients: [], total: 0 };
  }

  /**
   * Obtiene o crea perfil CRM para un cliente
   */
  async getOrCreateProfile(clientId: number): Promise<typeof clientProfiles.$inferSelect> {
    const db = await getDb();
    let profile = await db.query.clientProfiles.findFirst({
      where: and(
        eq(clientProfiles.clientId, clientId),
        eq(clientProfiles.organizationId, this.organizationId)
      ),
    });

    if (!profile) {
      const db2 = await getDb();
      const [newProfile] = await db2.insert(clientProfiles).values({
        clientId,
        organizationId: this.organizationId,
        status: 'active',
        firstContactDate: new Date().toISOString().split('T')[0],
      });
      profile = newProfile;
    }

    return profile;
  }

  /**
   * Actualiza perfil CRM de un cliente
   */
  async updateProfile(input: ClientProfileInput): Promise<typeof clientProfiles.$inferSelect> {
    const profile = await this.getOrCreateProfile(input.clientId);

    const [updated] = await db
      .update(clientProfiles)
      .set({
        status: input.status,
        source: input.source,
        sourceDetails: input.sourceDetails,
        preferredContactMethod: input.preferredContactMethod,
        preferredContactTime: input.preferredContactTime,
        internalNotes: input.internalNotes,
        specialRequirements: input.specialRequirements,
        marketingConsent: input.marketingConsent,
        marketingConsentDate: input.marketingConsent ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(clientProfiles.id, profile.id))
      ;

    return updated;
  }

  /**
   * Calcula y actualiza el score de un cliente
   */
  async calculateClientScore(clientId: number): Promise<number> {
    const profile = await this.getOrCreateProfile(clientId);
    
    let score = 0;

    // Puntos por valor de vida
    const lifetimeValue = parseFloat(profile.lifetimeValue || '0');
    if (lifetimeValue > 5000) score += 30;
    else if (lifetimeValue > 2000) score += 20;
    else if (lifetimeValue > 500) score += 10;

    // Puntos por número de servicios
    const totalServices = profile.totalServices || 0;
    if (totalServices > 20) score += 25;
    else if (totalServices > 10) score += 15;
    else if (totalServices > 5) score += 10;
    else if (totalServices > 0) score += 5;

    // Puntos por actividad reciente
    if (profile.lastServiceDate) {
      const daysSinceLastService = Math.floor(
        (Date.now() - new Date(profile.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastService < 90) score += 20;
      else if (daysSinceLastService < 180) score += 10;
      else if (daysSinceLastService < 365) score += 5;
    }

    // Puntos por referidos
    const referralCount = profile.referralCount || 0;
    score += Math.min(referralCount * 5, 25);

    // Puntos por consentimiento de marketing
    if (profile.marketingConsent) score += 5;

    // Actualizar score
    await db
      .update(clientProfiles)
      .set({ score, updatedAt: new Date() })
      .where(eq(clientProfiles.id, profile.id));

    return score;
  }

  /**
   * Actualiza estadísticas del cliente después de un servicio
   */
  async updateClientStats(
    clientId: number,
    serviceAmount: number
  ): Promise<void> {
    const profile = await this.getOrCreateProfile(clientId);

    const newTotalServices = (profile.totalServices || 0) + 1;
    const newLifetimeValue = parseFloat(profile.lifetimeValue || '0') + serviceAmount;
    const newAverageTicket = newLifetimeValue / newTotalServices;

    await db
      .update(clientProfiles)
      .set({
        totalServices: newTotalServices,
        lifetimeValue: newLifetimeValue.toFixed(2),
        averageTicket: newAverageTicket.toFixed(2),
        lastServiceDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(clientProfiles.id, profile.id));

    // Recalcular score
    await this.calculateClientScore(clientId);
  }

  // ============================================================================
  // Tags
  // ============================================================================

  /**
   * Obtiene todas las etiquetas de la organización
   */
  async getTags(): Promise<Array<typeof clientTags.$inferSelect>> {
    const db = await getDb();
    return db.query.clientTags.findMany({
      where: eq(clientTags.organizationId, this.organizationId),
      orderBy: [asc(clientTags.name)],
    });
  }

  /**
   * Crea una nueva etiqueta
   */
  async createTag(name: string, color: string = '#3b82f6', description?: string) {
    const db = await getDb();
    const [tag] = await db.insert(clientTags).values({
      organizationId: this.organizationId,
      name,
      color,
      description,
    });
    return tag;
  }

  /**
   * Asigna etiquetas a un cliente
   */
  async assignTags(clientId: number, tagIds: number[]): Promise<void> {
    // Eliminar etiquetas actuales
    await db
      .delete(clientTagAssignments)
      .where(eq(clientTagAssignments.clientId, clientId));

    // Asignar nuevas etiquetas
    if (tagIds.length > 0) {
      const db2 = await getDb();
      await db2.insert(clientTagAssignments).values(
        tagIds.map((tagId) => ({
          clientId,
          tagId,
          assignedBy: this.userId,
        }))
      );
    }
  }

  /**
   * Obtiene etiquetas de un cliente
   */
  async getClientTags(clientId: number): Promise<Array<typeof clientTags.$inferSelect>> {
    const db = await getDb();
    const assignments = await db.query.clientTagAssignments.findMany({
      where: eq(clientTagAssignments.clientId, clientId),
      with: {
        tag: true,
      },
    });

    return assignments.map((a) => a.tag).filter(Boolean) as Array<typeof clientTags.$inferSelect>;
  }

  // ============================================================================
  // Communications
  // ============================================================================

  /**
   * Registra una comunicación con un cliente
   */
  async logCommunication(input: CommunicationInput): Promise<typeof communications.$inferSelect> {
    const db = await getDb();
    const [comm] = await db.insert(communications).values({
      organizationId: this.organizationId,
      clientId: input.clientId,
      userId: this.userId,
      type: input.type,
      direction: input.direction,
      subject: input.subject,
      content: input.content,
      summary: input.summary,
      phoneNumber: input.phoneNumber,
      callDuration: input.callDuration,
      requiresFollowUp: input.requiresFollowUp,
      followUpDate: input.followUpDate?.toISOString().split('T')[0],
      followUpNotes: input.followUpNotes,
    });

    // Actualizar última fecha de contacto
    await db
      .update(clientProfiles)
      .set({
        lastContactDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientProfiles.clientId, input.clientId),
          eq(clientProfiles.organizationId, this.organizationId)
        )
      );

    return comm;
  }

  /**
   * Obtiene historial de comunicaciones de un cliente
   */
  async getCommunicationHistory(
    clientId: number,
    limit: number = 50
  ): Promise<Array<typeof communications.$inferSelect>> {
    const db = await getDb();
    return db.query.communications.findMany({
      where: and(
        eq(communications.clientId, clientId),
        eq(communications.organizationId, this.organizationId)
      ),
      orderBy: [desc(communications.createdAt)],
      limit,
    });
  }

  /**
   * Obtiene comunicaciones pendientes de seguimiento
   */
  async getPendingFollowUps(): Promise<Array<typeof communications.$inferSelect>> {
    const today = new Date().toISOString().split('T')[0];

    const db = await getDb();
    return db.query.communications.findMany({
      where: and(
        eq(communications.organizationId, this.organizationId),
        eq(communications.requiresFollowUp, true),
        lte(communications.followUpDate, today)
      ),
      orderBy: [asc(communications.followUpDate)],
    });
  }

  // ============================================================================
  // Tasks
  // ============================================================================

  /**
   * Crea una tarea CRM
   */
  async createTask(input: TaskInput): Promise<typeof crmTasks.$inferSelect> {
    const db = await getDb();
    const [task] = await db.insert(crmTasks).values({
      organizationId: this.organizationId,
      clientId: input.clientId,
      assignedTo: input.assignedTo || this.userId,
      createdBy: this.userId,
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
      dueDate: input.dueDate,
      reminderDate: input.reminderDate,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    });

    return task;
  }

  /**
   * Obtiene tareas pendientes
   */
  async getPendingTasks(
    assignedTo?: number
  ): Promise<Array<typeof crmTasks.$inferSelect>> {
    const conditions = [
      eq(crmTasks.organizationId, this.organizationId),
      eq(crmTasks.status, 'pending'),
    ];

    if (assignedTo) {
      conditions.push(eq(crmTasks.assignedTo, assignedTo));
    }

    const db = await getDb();
    return db.query.crmTasks.findMany({
      where: and(...conditions),
      orderBy: [asc(crmTasks.dueDate), desc(crmTasks.priority)],
    });
  }

  /**
   * Completa una tarea
   */
  async completeTask(taskId: number): Promise<void> {
    await db
      .update(crmTasks)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(crmTasks.id, taskId),
          eq(crmTasks.organizationId, this.organizationId)
        )
      );
  }

  // ============================================================================
  // Segments
  // ============================================================================

  /**
   * Obtiene clientes de un segmento
   */
  async getSegmentClients(segmentId: number): Promise<number[]> {
    const db = await getDb();
    const segment = await db.query.clientSegments.findFirst({
      where: and(
        eq(clientSegments.id, segmentId),
        eq(clientSegments.organizationId, this.organizationId)
      ),
    });

    if (!segment) return [];

    // Aplicar filtros del segmento
    // En producción, construir query dinámica basada en segment.filters
    return [];
  }

  /**
   * Crea un segmento de clientes
   */
  async createSegment(
    name: string,
    filters: ClientFilters,
    description?: string
  ): Promise<typeof clientSegments.$inferSelect> {
    const db = await getDb();
    const [segment] = await db.insert(clientSegments).values({
      organizationId: this.organizationId,
      createdBy: this.userId,
      name,
      description,
      filters: filters as any,
    });

    return segment;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Obtiene estadísticas generales de CRM
   */
  async getStats(): Promise<{
    totalClients: number;
    activeClients: number;
    vipClients: number;
    leadsCount: number;
    avgScore: number;
    totalLifetimeValue: number;
  }> {
    // En producción, hacer queries agregadas
    return {
      totalClients: 0,
      activeClients: 0,
      vipClients: 0,
      leadsCount: 0,
      avgScore: 0,
      totalLifetimeValue: 0,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createClientService(organizationId: number, userId: number): ClientService {
  return new ClientService(organizationId, userId);
}
