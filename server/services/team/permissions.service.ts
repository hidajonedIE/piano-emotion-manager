/**

interface PermissionContext {
  user?: { id: string; role?: string };
  organizationId?: string;
}
 * Sistema de Roles y Permisos
 * Piano Emotion Manager
 * 
 * Define y gestiona los permisos de cada rol dentro de una organización.
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from '../../db.js';
import { organizationMembers, OrganizationMember } from '../../../drizzle/team-schema';

// ==========================================
// TIPOS DE PERMISOS
// ==========================================

/**
 * Recursos del sistema sobre los que se pueden definir permisos
 */
export type Resource =
  | 'organization'      // Configuración de la organización
  | 'members'           // Gestión de miembros
  | 'invitations'       // Invitaciones
  | 'clients'           // Clientes
  | 'pianos'            // Pianos
  | 'appointments'      // Citas
  | 'services'          // Servicios realizados
  | 'invoices'          // Facturas
  | 'inventory'         // Inventario
  | 'rates'             // Tarifas
  | 'reports'           // Reportes
  | 'assignments'       // Asignaciones de trabajo
  | 'zones'             // Zonas de servicio
  | 'absences'          // Ausencias y vacaciones
  | 'activity_log';     // Registro de actividad

/**
 * Acciones que se pueden realizar sobre un recurso
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'assign' | 'approve';

/**
 * Alcance del permiso
 */
export type Scope = 'own' | 'team' | 'all';

/**
 * Definición de un permiso
 */
export interface Permission {
  resource: Resource;
  action: Action;
  scope: Scope;
}

/**
 * Tipo de rol en la organización
 */
export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'senior_tech'
  | 'technician'
  | 'apprentice'
  | 'receptionist'
  | 'accountant'
  | 'viewer';

// ==========================================
// MATRIZ DE PERMISOS POR ROL
// ==========================================

/**
 * Definición completa de permisos por rol.
 * 
 * Estructura: { [rol]: { [recurso]: { [acción]: alcance } } }
 * 
 * Alcances:
 * - 'own': Solo sus propios datos
 * - 'team': Datos de su equipo/zona
 * - 'all': Todos los datos de la organización
 * - undefined/false: Sin permiso
 */
const ROLE_PERMISSIONS: Record<OrganizationRole, Partial<Record<Resource, Partial<Record<Action, Scope>>>>> = {
  
  // ==========================================
  // OWNER - Control total, no se puede eliminar
  // ==========================================
  owner: {
    organization: { read: 'all', update: 'all', delete: 'all' },
    members: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    invitations: { create: 'all', read: 'all', delete: 'all' },
    clients: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    pianos: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    appointments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    services: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    invoices: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    inventory: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    rates: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    reports: { read: 'all' },
    assignments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    zones: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    absences: { create: 'all', read: 'all', update: 'all', delete: 'all', approve: 'all' },
    activity_log: { read: 'all' },
  },
  
  // ==========================================
  // ADMIN - Control total excepto transferir propiedad
  // ==========================================
  admin: {
    organization: { read: 'all', update: 'all' },
    members: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    invitations: { create: 'all', read: 'all', delete: 'all' },
    clients: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    pianos: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    appointments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    services: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    invoices: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    inventory: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    rates: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    reports: { read: 'all' },
    assignments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    zones: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    absences: { create: 'all', read: 'all', update: 'all', delete: 'all', approve: 'all' },
    activity_log: { read: 'all' },
  },
  
  // ==========================================
  // MANAGER - Gestión de técnicos y trabajos
  // ==========================================
  manager: {
    organization: { read: 'all' },
    members: { read: 'all', update: 'team' },
    invitations: { read: 'all' },
    clients: { create: 'all', read: 'all', update: 'all' },
    pianos: { create: 'all', read: 'all', update: 'all' },
    appointments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    services: { create: 'all', read: 'all', update: 'all' },
    invoices: { read: 'all' },
    inventory: { read: 'all', update: 'all' },
    rates: { read: 'all' },
    reports: { read: 'all' },
    assignments: { create: 'all', read: 'all', update: 'all', assign: 'all' },
    zones: { read: 'all', update: 'all' },
    absences: { read: 'all', approve: 'all' },
    activity_log: { read: 'all' },
  },
  
  // ==========================================
  // SENIOR_TECH - Técnico senior con más permisos
  // ==========================================
  senior_tech: {
    organization: { read: 'all' },
    members: { read: 'team' },
    clients: { create: 'all', read: 'all', update: 'all' },
    pianos: { create: 'all', read: 'all', update: 'all' },
    appointments: { create: 'all', read: 'all', update: 'own', assign: 'team' },
    services: { create: 'all', read: 'all', update: 'own' },
    invoices: { read: 'own' },
    inventory: { read: 'all', update: 'all' },
    rates: { read: 'all' },
    reports: { read: 'team' },
    assignments: { read: 'team', update: 'own', assign: 'team' },
    zones: { read: 'all' },
    absences: { create: 'own', read: 'team' },
  },
  
  // ==========================================
  // TECHNICIAN - Técnico estándar
  // ==========================================
  technician: {
    organization: { read: 'all' },
    clients: { read: 'all', update: 'own' },
    pianos: { read: 'all', update: 'own' },
    appointments: { read: 'own', update: 'own' },
    services: { create: 'own', read: 'own', update: 'own' },
    invoices: { read: 'own' },
    inventory: { read: 'all' },
    rates: { read: 'all' },
    assignments: { read: 'own', update: 'own' },
    absences: { create: 'own', read: 'own' },
  },
  
  // ==========================================
  // APPRENTICE - Aprendiz con permisos limitados
  // ==========================================
  apprentice: {
    organization: { read: 'all' },
    clients: { read: 'own' },
    pianos: { read: 'own' },
    appointments: { read: 'own' },
    services: { read: 'own', update: 'own' },
    inventory: { read: 'all' },
    rates: { read: 'all' },
    assignments: { read: 'own' },
    absences: { create: 'own', read: 'own' },
  },
  
  // ==========================================
  // RECEPTIONIST - Gestión de citas y clientes
  // ==========================================
  receptionist: {
    organization: { read: 'all' },
    members: { read: 'all' },
    clients: { create: 'all', read: 'all', update: 'all' },
    pianos: { create: 'all', read: 'all', update: 'all' },
    appointments: { create: 'all', read: 'all', update: 'all', delete: 'all', assign: 'all' },
    services: { read: 'all' },
    rates: { read: 'all' },
    assignments: { create: 'all', read: 'all', assign: 'all' },
    zones: { read: 'all' },
    absences: { read: 'all' },
  },
  
  // ==========================================
  // ACCOUNTANT - Solo facturación y reportes
  // ==========================================
  accountant: {
    organization: { read: 'all' },
    clients: { read: 'all' },
    services: { read: 'all' },
    invoices: { create: 'all', read: 'all', update: 'all', delete: 'all' },
    inventory: { read: 'all' },
    rates: { read: 'all', update: 'all' },
    reports: { read: 'all' },
  },
  
  // ==========================================
  // VIEWER - Solo lectura
  // ==========================================
  viewer: {
    organization: { read: 'all' },
    members: { read: 'all' },
    clients: { read: 'all' },
    pianos: { read: 'all' },
    appointments: { read: 'all' },
    services: { read: 'all' },
    invoices: { read: 'all' },
    inventory: { read: 'all' },
    rates: { read: 'all' },
    reports: { read: 'all' },
    assignments: { read: 'all' },
    zones: { read: 'all' },
    absences: { read: 'all' },
    activity_log: { read: 'all' },
  },
};

// ==========================================
// SERVICIO DE PERMISOS
// ==========================================

export class PermissionsService {
  
  /**
   * Verificar si un usuario tiene permiso para realizar una acción
   */
  async hasPermission(
    userId: number,
    organizationId: number,
    resource: Resource,
    action: Action,
    targetOwnerId?: number // ID del propietario del recurso objetivo
  ): Promise<boolean> {
    // Obtener el rol del usuario en la organización
    const member = await this.getMember(userId, organizationId);
    if (!member || member.status !== 'active') {
      return false;
    }
    
    const role = member.role as OrganizationRole;
    const permissions = ROLE_PERMISSIONS[role];
    
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;
    
    const scope = resourcePermissions[action];
    if (!scope) return false;
    
    // Verificar alcance
    switch (scope) {
      case 'all':
        return true;
      case 'team':
        // Verificar si el usuario pertenece al mismo equipo/zona que el recurso objetivo
        if (!targetOwnerId) return true;
        
        try {
          // Obtener zonas del usuario actual
          const userZones = await this.getUserZones(userId, organizationId);
          
          // Obtener zonas del propietario del recurso
          const targetZones = await this.getUserZones(targetOwnerId, organizationId);
          
          // Verificar si hay intersección de zonas
          const hasCommonZone = userZones.some(uz => 
            targetZones.some(tz => tz.id === uz.id)
          );
          
          if (hasCommonZone) return true;
          
          // Verificar si están en el mismo equipo
          const userTeams = await this.getUserTeams(userId, organizationId);
          const targetTeams = await this.getUserTeams(targetOwnerId, organizationId);
          
          const hasCommonTeam = userTeams.some(ut =>
            targetTeams.some(tt => tt.id === ut.id)
          );
          
          return hasCommonTeam;
        } catch (error) {
          console.error('Error verificando permisos de equipo/zona:', error);
          return false;
        }
      case 'own':
        return targetOwnerId === undefined || targetOwnerId === userId;
      default:
        return false;
    }
  }
  
  /**
   * Obtener todos los permisos de un usuario en una organización
   */
  async getUserPermissions(
    userId: number,
    organizationId: number
  ): Promise<Permission[]> {
    const member = await this.getMember(userId, organizationId);
    if (!member || member.status !== 'active') {
      return [];
    }
    
    const role = member.role as OrganizationRole;
    const rolePermissions = ROLE_PERMISSIONS[role];
    
    if (!rolePermissions) return [];
    
    const permissions: Permission[] = [];
    
    for (const [resource, actions] of Object.entries(rolePermissions)) {
      for (const [action, scope] of Object.entries(actions)) {
        if (scope) {
          permissions.push({
            resource: resource as Resource,
            action: action as Action,
            scope: scope as Scope,
          });
        }
      }
    }
    
    return permissions;
  }
  
  /**
   * Obtener el rol de un usuario en una organización
   */
  async getUserRole(userId: number, organizationId: number): Promise<OrganizationRole | null> {
    const member = await this.getMember(userId, organizationId);
    return member?.role as OrganizationRole || null;
  }
  
  /**
   * Verificar si un usuario puede gestionar a otro usuario
   */
  async canManageMember(
    managerId: number,
    targetMemberId: number,
    organizationId: number
  ): Promise<boolean> {
    const managerMember = await this.getMember(managerId, organizationId);
    const targetMember = await this.getMemberById(targetMemberId);
    
    if (!managerMember || !targetMember) return false;
    if (targetMember.organizationId !== organizationId) return false;
    
    const managerRole = managerMember.role as OrganizationRole;
    const targetRole = targetMember.role as OrganizationRole;
    
    // Jerarquía de roles
    const hierarchy: OrganizationRole[] = [
      'owner',
      'admin',
      'manager',
      'senior_tech',
      'technician',
      'apprentice',
      'receptionist',
      'accountant',
      'viewer',
    ];
    
    const managerLevel = hierarchy.indexOf(managerRole);
    const targetLevel = hierarchy.indexOf(targetRole);
    
    // Solo puede gestionar a roles de nivel inferior
    return managerLevel < targetLevel;
  }
  
  /**
   * Obtener recursos accesibles para un rol
   */
  getAccessibleResources(role: OrganizationRole): Resource[] {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return [];
    
    return Object.keys(permissions) as Resource[];
  }
  
  /**
   * Verificar si un rol puede asignar otro rol
   */
  canAssignRole(assignerRole: OrganizationRole, roleToAssign: OrganizationRole): boolean {
    const hierarchy: OrganizationRole[] = [
      'owner',
      'admin',
      'manager',
      'senior_tech',
      'technician',
      'apprentice',
      'receptionist',
      'accountant',
      'viewer',
    ];
    
    const assignerLevel = hierarchy.indexOf(assignerRole);
    const roleLevel = hierarchy.indexOf(roleToAssign);
    
    // No se puede asignar owner
    if (roleToAssign === 'owner') return false;
    
    // Solo owner y admin pueden asignar roles
    if (assignerLevel > 1) return false;
    
    // Solo puede asignar roles de nivel inferior
    return assignerLevel < roleLevel;
  }
  
  // ==========================================
  /**
   * Obtiene las zonas asignadas a un usuario
   */
  private async getUserZones(userId: number, organizationId: number): Promise<{ id: number; name: string }[]> {
    try {
      const { serviceZones, technicianZoneAssignments } = await import('@/drizzle/team-schema');
      
      const zones = await db
        .select({
          id: serviceZones.id,
          name: serviceZones.name,
        })
        .from(technicianZoneAssignments)
        .innerJoin(serviceZones, eq(serviceZones.id, technicianZoneAssignments.zoneId))
        .where(and(
          eq(technicianZoneAssignments.technicianId, userId),
          eq(serviceZones.organizationId, organizationId)
        ));
      
      return zones;
    } catch (error) {
      console.error('Error obteniendo zonas del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene los equipos a los que pertenece un usuario
   */
  private async getUserTeams(userId: number, organizationId: number): Promise<{ id: number; name: string }[]> {
    try {
      const { organizationMembers } = await import('@/drizzle/team-schema');
      
      // Por ahora, todos los miembros de una organización están en el mismo "equipo"
      // En el futuro se puede implementar una tabla de equipos separada
      const [member] = await db
        .select({
          id: organizationMembers.id,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        ));
      
      if (member) {
        return [{ id: organizationId, name: 'Equipo Principal' }];
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo equipos del usuario:', error);
      return [];
    }
  }

  // MÉTODOS PRIVADOS
  // ==========================================
  
  private async getMember(userId: number, organizationId: number): Promise<OrganizationMember | null> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    
    return member || null;
  }
  
  private async getMemberById(memberId: number): Promise<OrganizationMember | null> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, memberId))
      .limit(1);
    
    return member || null;
  }
}

// Exportar instancia singleton
export const permissionsService = new PermissionsService();

// ==========================================
// MIDDLEWARE DE AUTORIZACIÓN
// ==========================================

/**
 * Middleware para verificar permisos en rutas de API
 */
export function requirePermission(resource: Resource, action: Action) {
  return async (ctx: PermissionContext, next: () => Promise<void>) => {
    const userId = ctx.state.user?.id;
    const organizationId = ctx.state.organizationId;
    
    if (!userId || !organizationId) {
      ctx.status = 401;
      ctx.body = { error: 'No autenticado' };
      return;
    }
    
    const hasPermission = await permissionsService.hasPermission(
      userId,
      organizationId,
      resource,
      action
    );
    
    if (!hasPermission) {
      ctx.status = 403;
      ctx.body = { error: 'No tienes permiso para realizar esta acción' };
      return;
    }
    
    await next();
  };
}

// ==========================================
// HOOKS PARA REACT
// ==========================================

/**
 * Tipo para el contexto de permisos en el frontend
 */
export interface PermissionsContext {
  role: OrganizationRole | null;
  permissions: Permission[];
  can: (resource: Resource, action: Action) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
}

/**
 * Función helper para verificar permisos en el frontend
 */
export function createPermissionsChecker(permissions: Permission[]) {
  return (resource: Resource, action: Action): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action);
  };
}
