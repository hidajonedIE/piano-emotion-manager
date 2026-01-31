/**
 * Componentes de Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Exporta todos los componentes relacionados con la gestión
 * de equipos de técnicos y organizaciones multi-tenant.
 */

// Componentes principales
export { TeamMembersList } from './TeamMembersList';
export { TeamCalendar } from './TeamCalendar';
export { WorkAssignmentModal } from './WorkAssignmentModal';
export { TeamDashboard } from './TeamDashboard';

// Tipos de TeamMembersList
export type { TeamMember } from './TeamMembersList';

// Tipos de TeamCalendar
export type {
  WorkAssignment,
  Technician,
  DailySchedule,
} from './TeamCalendar';

// Tipos de WorkAssignmentModal
export type {
  TechnicianAvailability,
  Client,
  Appointment,
} from './WorkAssignmentModal';

// Tipos de TeamDashboard
export type {
  TechnicianMetrics,
  OrganizationStats,
} from './TeamDashboard';
