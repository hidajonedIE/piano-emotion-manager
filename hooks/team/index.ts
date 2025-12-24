/**
 * Hooks de Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Exporta todos los hooks relacionados con la gestión de equipos.
 */

// Hooks de organizaciones
export {
  useOrganization,
  useCurrentOrganization,
  useOrganizationSettings,
} from '../use-organization';

export type {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../use-organization';

// Hooks de miembros
export {
  useTeamMembers,
  useMyPermissions,
  useInvitation,
  useMemberProfile,
} from '../use-team-members';

export type {
  TeamMember,
  OrganizationRole,
  MemberStatus,
  InviteMemberInput,
  ChangeMemberRoleInput,
  UserPermissions,
} from '../use-team-members';

// Hooks de asignaciones
export {
  useWorkAssignments,
  useMyAssignments,
  useTechnicianSuggestion,
  useAssignmentStats,
} from '../use-work-assignments';

export type {
  WorkAssignment,
  AssignmentStatus,
  AssignmentPriority,
  TechnicianAvailability,
  DailySchedule,
  CreateAssignmentInput,
  ReassignInput,
} from '../use-work-assignments';
