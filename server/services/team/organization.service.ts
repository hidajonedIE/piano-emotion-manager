/**
 * Servicio de Gestión de Organizaciones
 * Piano Emotion Manager
 * 
 * Maneja la creación, actualización y gestión de organizaciones multi-tenant.
 */

import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db.js';
import {
  organizations,
  organizationMembers,
  organizationInvitations,
  organizationActivityLog,
  Organization,
  InsertOrganization,
  OrganizationMember,
  InsertOrganizationMember,
  OrganizationInvitation,
} from '../../../drizzle/team-schema';
import { users } from '../../../drizzle/schema';
import { generateToken, hashToken } from '../../utils/crypto';
import { sendEmail } from '../../utils/email';

// ==========================================
// TIPOS
// ==========================================

export interface CreateOrganizationInput {
  name: string;
  ownerId: number;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  logo?: string;
  taxId?: string;
  legalName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankAccount?: string;
  bankName?: string;
  swiftBic?: string;
  invoicePrefix?: string;
  defaultTaxRate?: number;
  defaultCurrency?: string;
  defaultServiceDuration?: number;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: number[];
  timezone?: string;
}

export interface InviteMemberInput {
  organizationId: number;
  email: string;
  role: 'admin' | 'manager' | 'senior_tech' | 'technician' | 'apprentice' | 'receptionist' | 'accountant' | 'viewer';
  invitedBy: number;
  message?: string;
}

export interface OrganizationWithMembers extends Organization {
  members: (OrganizationMember & { user: { name: string; email: string } })[];
  memberCount: number;
}

// ==========================================
// SERVICIO
// ==========================================

export class OrganizationService {
  
  /**
   * Crear una nueva organización
   */
  async create(input: CreateOrganizationInput): Promise<Organization> {
    // Generar slug único
    const slug = await this.generateUniqueSlug(input.name);
    
    // Crear la organización
    const [organization] = await db.insert(organizations).values({
      name: input.name,
      slug,
      ownerId: input.ownerId,
      taxId: input.taxId,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
      phone: input.phone,
      email: input.email,
      subscriptionPlan: 'free',
      maxMembers: 1,
    }).returning();
    
    // Añadir al propietario como miembro con rol 'owner'
    await db.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: input.ownerId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });
    
    // Registrar actividad
    await this.logActivity({
      organizationId: organization.id,
      userId: input.ownerId,
      activityType: 'member_joined',
      description: `Organización "${input.name}" creada`,
      entityType: 'organization',
      entityId: organization.id,
    });
    
    return organization;
  }
  
  /**
   * Obtener organización por ID
   */
  async getById(id: number): Promise<Organization | null> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    
    return organization || null;
  }
  
  /**
   * Obtener organización con sus miembros
   */
  async getWithMembers(id: number): Promise<OrganizationWithMembers | null> {
    const organization = await this.getById(id);
    if (!organization) return null;
    
    const members = await db
      .select({
        member: organizationMembers,
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, id));
    
    return {
      ...organization,
      members: members.map(m => ({ ...m.member, user: m.user })),
      memberCount: members.length,
    };
  }
  
  /**
   * Obtener organizaciones de un usuario
   */
  async getByUserId(userId: number): Promise<Organization[]> {
    const memberOrgs = await db
      .select({ organization: organizations })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, 'active')
        )
      );
    
    return memberOrgs.map(m => m.organization);
  }
  
  /**
   * Actualizar organización
   */
  async update(id: number, input: UpdateOrganizationInput): Promise<Organization> {
    const [updated] = await db
      .update(organizations)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    
    return updated;
  }
  
  /**
   * Invitar a un nuevo miembro
   */
  async inviteMember(input: InviteMemberInput): Promise<OrganizationInvitation> {
    // Verificar que el email no esté ya en la organización
    const existingMember = await this.getMemberByEmail(input.organizationId, input.email);
    if (existingMember) {
      throw new Error('Este email ya es miembro de la organización');
    }
    
    // Verificar límite de miembros
    const org = await this.getWithMembers(input.organizationId);
    if (org && org.memberCount >= org.maxMembers) {
      throw new Error('Se ha alcanzado el límite de miembros para este plan');
    }
    
    // Generar token de invitación
    const token = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días
    
    // Crear invitación
    const [invitation] = await db.insert(organizationInvitations).values({
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      token,
      expiresAt,
      invitedBy: input.invitedBy,
      message: input.message,
    }).returning();
    
    // Enviar email de invitación
    await this.sendInvitationEmail(invitation, org!.name);
    
    // Registrar actividad
    await this.logActivity({
      organizationId: input.organizationId,
      userId: input.invitedBy,
      activityType: 'member_invited',
      description: `Invitación enviada a ${input.email} con rol ${input.role}`,
      entityType: 'invitation',
      entityId: invitation.id,
    });
    
    return invitation;
  }
  
  /**
   * Aceptar invitación
   */
  async acceptInvitation(token: string, userId: number): Promise<OrganizationMember> {
    // Buscar invitación válida
    const [invitation] = await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.token, token))
      .limit(1);
    
    if (!invitation) {
      throw new Error('Invitación no encontrada');
    }
    
    if (invitation.acceptedAt) {
      throw new Error('Esta invitación ya fue aceptada');
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Esta invitación ha expirado');
    }
    
    // Marcar invitación como aceptada
    await db
      .update(organizationInvitations)
      .set({
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      })
      .where(eq(organizationInvitations.id, invitation.id));
    
    // Crear miembro
    const [member] = await db.insert(organizationMembers).values({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
      status: 'active',
      invitedAt: invitation.createdAt,
      invitedBy: invitation.invitedBy,
      joinedAt: new Date(),
    }).returning();
    
    // Registrar actividad
    await this.logActivity({
      organizationId: invitation.organizationId,
      userId,
      activityType: 'member_joined',
      description: `Nuevo miembro unido con rol ${invitation.role}`,
      entityType: 'member',
      entityId: member.id,
    });
    
    return member;
  }
  
  /**
   * Cambiar rol de un miembro
   */
  async changeMemberRole(
    organizationId: number,
    memberId: number,
    newRole: string,
    changedBy: number
  ): Promise<OrganizationMember> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!member) {
      throw new Error('Miembro no encontrado');
    }
    
    if (member.role === 'owner') {
      throw new Error('No se puede cambiar el rol del propietario');
    }
    
    const oldRole = member.role;
    
    const [updated] = await db
      .update(organizationMembers)
      .set({ role: newRole as any })
      .where(eq(organizationMembers.id, memberId))
      .returning();
    
    // Registrar actividad
    await this.logActivity({
      organizationId,
      userId: changedBy,
      activityType: 'member_role_changed',
      description: `Rol cambiado de ${oldRole} a ${newRole}`,
      entityType: 'member',
      entityId: memberId,
      metadata: { oldRole, newRole },
    });
    
    return updated;
  }
  
  /**
   * Suspender miembro
   */
  async suspendMember(
    organizationId: number,
    memberId: number,
    reason: string,
    suspendedBy: number
  ): Promise<OrganizationMember> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!member) {
      throw new Error('Miembro no encontrado');
    }
    
    if (member.role === 'owner') {
      throw new Error('No se puede suspender al propietario');
    }
    
    const [updated] = await db
      .update(organizationMembers)
      .set({
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedReason: reason,
      })
      .where(eq(organizationMembers.id, memberId))
      .returning();
    
    // Registrar actividad
    await this.logActivity({
      organizationId,
      userId: suspendedBy,
      activityType: 'member_suspended',
      description: `Miembro suspendido: ${reason}`,
      entityType: 'member',
      entityId: memberId,
    });
    
    return updated;
  }
  
  /**
   * Eliminar miembro
   */
  async removeMember(
    organizationId: number,
    memberId: number,
    removedBy: number
  ): Promise<void> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.id, memberId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    if (!member) {
      throw new Error('Miembro no encontrado');
    }
    
    if (member.role === 'owner') {
      throw new Error('No se puede eliminar al propietario');
    }
    
    await db
      .update(organizationMembers)
      .set({ status: 'inactive' })
      .where(eq(organizationMembers.id, memberId));
    
    // Registrar actividad
    await this.logActivity({
      organizationId,
      userId: removedBy,
      activityType: 'member_removed',
      description: 'Miembro eliminado de la organización',
      entityType: 'member',
      entityId: memberId,
    });
  }
  
  /**
   * Obtener miembros activos de una organización
   */
  async getActiveMembers(organizationId: number): Promise<OrganizationMember[]> {
    return db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.status, 'active')
        )
      );
  }
  
  /**
   * Obtener técnicos asignables
   */
  async getAssignableTechnicians(organizationId: number): Promise<OrganizationMember[]> {
    return db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.status, 'active'),
          eq(organizationMembers.canBeAssigned, true)
        )
      );
  }
  
  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================
  
  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    let counter = 0;
    let uniqueSlug = slug;
    
    while (true) {
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, uniqueSlug))
        .limit(1);
      
      if (!existing) break;
      
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }
    
    return uniqueSlug;
  }
  
  private async getMemberByEmail(organizationId: number, email: string): Promise<OrganizationMember | null> {
    const [member] = await db
      .select({ member: organizationMembers })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(users.email, email)
        )
      )
      .limit(1);
    
    return member?.member || null;
  }
  
  private async sendInvitationEmail(invitation: OrganizationInvitation, orgName: string): Promise<void> {
    const inviteUrl = `${process.env.APP_URL}/invite/${invitation.token}`;
    
    await sendEmail({
      to: invitation.email,
      subject: `Invitación a unirte a ${orgName} en Piano Emotion Manager`,
      html: `
        <h1>Has sido invitado a unirte a ${orgName}</h1>
        <p>Has recibido una invitación para unirte al equipo de ${orgName} en Piano Emotion Manager.</p>
        <p>Tu rol será: <strong>${invitation.role}</strong></p>
        ${invitation.message ? `<p>Mensaje: ${invitation.message}</p>` : ''}
        <p><a href="${inviteUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Aceptar Invitación</a></p>
        <p>Este enlace expirará en 7 días.</p>
      `,
    });
  }
  
  private async logActivity(data: {
    organizationId: number;
    userId: number;
    activityType: string;
    description: string;
    entityType?: string;
    entityId?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await db.insert(organizationActivityLog).values({
      organizationId: data.organizationId,
      userId: data.userId,
      activityType: data.activityType as any,
      description: data.description,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata,
    });
  }
}

// Exportar instancia singleton
export const organizationService = new OrganizationService();
