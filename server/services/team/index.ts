/**
 * Servicios de Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Exporta todos los servicios relacionados con la gestión multi-tenant
 * de organizaciones y equipos de técnicos.
 */

// Servicios
export { organizationService, OrganizationService } from './organization.service';
export { workAssignmentService, WorkAssignmentService } from './work-assignment.service';
export { permissionsService, PermissionsService, requirePermission, createPermissionsChecker } from './permissions.service';

// Tipos de organización
export type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  InviteMemberInput,
  OrganizationWithMembers,
} from './organization.service';

// Tipos de asignación
export type {
  CreateAssignmentInput,
  ReassignInput,
  TechnicianAvailability,
  WorkAssignmentWithDetails,
  DailySchedule,
} from './work-assignment.service';

// Tipos de permisos
export type {
  Resource,
  Action,
  Scope,
  Permission,
  OrganizationRole,
  PermissionsContext,
} from './permissions.service';
