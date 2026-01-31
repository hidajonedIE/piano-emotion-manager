/**
 * Esquema de base de datos para Gestión de Equipos Multi-Tenant
 * Piano Emotion Manager
 * 
 * Este módulo extiende el esquema existente para soportar organizaciones
 * con múltiples técnicos, roles y permisos.
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./schema.js";

// ==========================================
// ENUMS
// ==========================================

/**
 * Planes de suscripción disponibles para organizaciones
 */
export const subscriptionPlanEnum = mysqlEnum("subscriptionPlan", [
  "free",           // 1 usuario, funcionalidad básica
  "starter",        // Hasta 3 usuarios
  "team",           // Hasta 10 usuarios
  "business",       // Hasta 25 usuarios
  "enterprise",     // Usuarios ilimitados
]);

/**
 * Roles disponibles dentro de una organización
 */
export const organizationRoleEnum = mysqlEnum("organizationRole", [
  "owner",          // Propietario de la organización (no se puede eliminar)
  "admin",          // Control total excepto transferir propiedad
  "manager",        // Gestión de técnicos, asignación de trabajos, reportes
  "senior_tech",    // Técnico senior: puede ver trabajos de otros, asignar
  "technician",     // Técnico estándar: solo sus propios trabajos
  "apprentice",     // Aprendiz: acceso limitado, supervisión requerida
  "receptionist",   // Recepcionista: gestión de citas, clientes, sin servicios
  "accountant",     // Contable: solo acceso a facturación y reportes financieros
  "viewer",         // Solo lectura
]);

/**
 * Estado de la membresía en la organización
 */
export const membershipStatusEnum = mysqlEnum("membershipStatus", [
  "active",             // Miembro activo
  "pending_invitation", // Invitación enviada, pendiente de aceptación
  "suspended",          // Suspendido temporalmente
  "inactive",           // Inactivo (baja voluntaria o despido)
]);

/**
 * Estado de asignación de un trabajo
 */
export const workAssignmentStatusEnum = mysqlEnum("workAssignmentStatus", [
  "unassigned",     // Sin asignar
  "assigned",       // Asignado a un técnico
  "accepted",       // Aceptado por el técnico
  "in_progress",    // En progreso
  "completed",      // Completado
  "cancelled",      // Cancelado
  "reassigned",     // Reasignado a otro técnico
]);

/**
 * Prioridad de un trabajo
 */
export const workPriorityEnum = mysqlEnum("workPriority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

// ==========================================
// TABLA: ORGANIZACIONES
// ==========================================

/**
 * Organizaciones (empresas/equipos de técnicos)
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Información básica
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  description: text("description"),
  logo: text("logo"), // URL o base64
  
  // Propietario
  ownerId: int("ownerId").notNull(), // FK a users.id
  
  // Suscripción
  subscriptionPlan: subscriptionPlanEnum.default("free").notNull(),
  maxMembers: int("maxMembers").default(1).notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  
  // Información fiscal/comercial
  taxId: varchar("taxId", { length: 50 }), // NIF/CIF
  legalName: varchar("legalName", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 2 }).default("ES"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  
  // Configuración bancaria
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  swiftBic: varchar("swiftBic", { length: 11 }),
  
  // Configuración de facturación
  invoicePrefix: varchar("invoicePrefix", { length: 10 }).default("FAC"),
  invoiceNextNumber: int("invoiceNextNumber").default(1),
  defaultTaxRate: decimal("defaultTaxRate", { precision: 5, scale: 2 }).default("21.00"),
  defaultCurrency: varchar("defaultCurrency", { length: 3 }).default("EUR"),
  
  // Configuración de operaciones
  defaultServiceDuration: int("defaultServiceDuration").default(60), // minutos
  workingHoursStart: varchar("workingHoursStart", { length: 5 }).default("09:00"),
  workingHoursEnd: varchar("workingHoursEnd", { length: 5 }).default("18:00"),
  workingDays: json("workingDays").$type<number[]>().default([1, 2, 3, 4, 5]), // 0=Dom, 1=Lun...
  timezone: varchar("timezone", { length: 50 }).default("Europe/Madrid"),
  
  // Configuración de notificaciones
  notifyOnNewAppointment: boolean("notifyOnNewAppointment").default(true),
  notifyOnAssignment: boolean("notifyOnAssignment").default(true),
  notifyOnCompletion: boolean("notifyOnCompletion").default(true),
  
  // Metadatos
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("slug_idx").on(table.slug),
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ==========================================
// TABLA: MIEMBROS DE ORGANIZACIÓN
// ==========================================

/**
 * Miembros de una organización (relación usuario-organización)
 */
export const organizationMembers = mysqlTable("organization_members", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relaciones
  organizationId: int("organizationId").notNull(), // FK a organizations.id
  userId: int("userId").notNull(), // FK a users.id
  
  // Rol y estado
  role: organizationRoleEnum.default("technician").notNull(),
  status: membershipStatusEnum.default("pending_invitation").notNull(),
  
  // Información del miembro dentro de la organización
  displayName: varchar("displayName", { length: 100 }), // Nombre a mostrar
  jobTitle: varchar("jobTitle", { length: 100 }), // Cargo
  employeeId: varchar("employeeId", { length: 50 }), // ID de empleado interno
  phone: varchar("phone", { length: 50 }),
  color: varchar("color", { length: 7 }), // Color para calendario (#RRGGBB)
  
  // Configuración de trabajo
  canBeAssigned: boolean("canBeAssigned").default(true), // Puede recibir asignaciones
  maxDailyAppointments: int("maxDailyAppointments").default(8),
  workingHoursStart: varchar("workingHoursStart", { length: 5 }), // Override org settings
  workingHoursEnd: varchar("workingHoursEnd", { length: 5 }),
  workingDays: json("workingDays").$type<number[]>(), // Override org settings
  
  // Zonas/territorios asignados
  assignedZones: json("assignedZones").$type<string[]>(), // Códigos postales, ciudades, etc.
  
  // Especialidades
  specialties: json("specialties").$type<string[]>(), // Tipos de servicio especializados
  
  // Fechas
  invitedAt: timestamp("invitedAt"),
  invitedBy: int("invitedBy"), // FK a users.id
  joinedAt: timestamp("joinedAt"),
  lastActiveAt: timestamp("lastActiveAt"),
  suspendedAt: timestamp("suspendedAt"),
  suspendedReason: text("suspendedReason"),
  
  // Metadatos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgUserIdx: uniqueIndex("org_user_idx").on(table.organizationId, table.userId),
  orgIdx: index("org_idx").on(table.organizationId),
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

// ==========================================
// TABLA: INVITACIONES
// ==========================================

/**
 * Invitaciones pendientes a la organización
 */
export const organizationInvitations = mysqlTable("organization_invitations", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: organizationRoleEnum.default("technician").notNull(),
  
  // Token de invitación
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Quién invitó
  invitedBy: int("invitedBy").notNull(), // FK a users.id
  
  // Mensaje personalizado
  message: text("message"),
  
  // Estado
  acceptedAt: timestamp("acceptedAt"),
  acceptedByUserId: int("acceptedByUserId"), // FK a users.id
  declinedAt: timestamp("declinedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("token_idx").on(table.token),
  emailOrgIdx: index("email_org_idx").on(table.email, table.organizationId),
}));

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
export type InsertOrganizationInvitation = typeof organizationInvitations.$inferInsert;

// ==========================================
// TABLA: ASIGNACIONES DE TRABAJO
// ==========================================

/**
 * Asignaciones de trabajos a técnicos
 */
export const workAssignments = mysqlTable("work_assignments", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  
  // Referencia al trabajo (cita o servicio)
  appointmentId: int("appointmentId"), // FK a appointments.id
  serviceId: int("serviceId"), // FK a services.id
  
  // Técnico asignado
  technicianId: int("technicianId").notNull(), // FK a users.id
  
  // Estado y prioridad
  status: workAssignmentStatusEnum.default("assigned").notNull(),
  priority: workPriorityEnum.default("normal").notNull(),
  
  // Fechas programadas
  scheduledDate: timestamp("scheduledDate").notNull(),
  scheduledStartTime: varchar("scheduledStartTime", { length: 5 }), // HH:MM
  scheduledEndTime: varchar("scheduledEndTime", { length: 5 }),
  estimatedDuration: int("estimatedDuration"), // minutos
  
  // Fechas reales
  actualStartTime: timestamp("actualStartTime"),
  actualEndTime: timestamp("actualEndTime"),
  
  // Asignación
  assignedBy: int("assignedBy").notNull(), // FK a users.id
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  
  // Aceptación/Rechazo
  acceptedAt: timestamp("acceptedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  
  // Reasignación
  previousTechnicianId: int("previousTechnicianId"), // Si fue reasignado
  reassignedAt: timestamp("reassignedAt"),
  reassignmentReason: text("reassignmentReason"),
  
  // Notas
  assignmentNotes: text("assignmentNotes"), // Notas del manager
  technicianNotes: text("technicianNotes"), // Notas del técnico
  
  // Ubicación (para optimización de rutas)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("wa_org_idx").on(table.organizationId),
  techIdx: index("wa_tech_idx").on(table.technicianId),
  dateIdx: index("wa_date_idx").on(table.scheduledDate),
  statusIdx: index("wa_status_idx").on(table.status),
}));

export type WorkAssignment = typeof workAssignments.$inferSelect;
export type InsertWorkAssignment = typeof workAssignments.$inferInsert;

// ==========================================
// TABLA: ZONAS DE SERVICIO
// ==========================================

/**
 * Zonas geográficas de servicio
 */
export const serviceZones = mysqlTable("service_zones", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Para visualización en mapa
  
  // Definición de la zona
  postalCodes: json("postalCodes").$type<string[]>(), // Lista de códigos postales
  cities: json("cities").$type<string[]>(), // Lista de ciudades
  geoJson: json("geoJson"), // Polígono GeoJSON para zonas complejas
  
  // Configuración
  isActive: boolean("isActive").default(true).notNull(),
  surchargePercent: decimal("surchargePercent", { precision: 5, scale: 2 }).default("0"), // Recargo por zona
  estimatedTravelTime: int("estimatedTravelTime"), // Tiempo de viaje estimado en minutos
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("sz_org_idx").on(table.organizationId),
}));

export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = typeof serviceZones.$inferInsert;

// ==========================================
// TABLA: ASIGNACIÓN TÉCNICO-ZONA
// ==========================================

/**
 * Relación entre técnicos y zonas de servicio
 */
export const technicianZones = mysqlTable("technician_zones", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  memberId: int("memberId").notNull(), // FK a organization_members.id
  zoneId: int("zoneId").notNull(), // FK a service_zones.id
  
  isPrimary: boolean("isPrimary").default(false), // Zona principal del técnico
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  memberZoneIdx: uniqueIndex("member_zone_idx").on(table.memberId, table.zoneId),
}));

export type TechnicianZone = typeof technicianZones.$inferSelect;
export type InsertTechnicianZone = typeof technicianZones.$inferInsert;

// ==========================================
// TABLA: AUSENCIAS Y VACACIONES
// ==========================================

/**
 * Registro de ausencias, vacaciones y permisos
 */
export const memberAbsences = mysqlTable("member_absences", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  memberId: int("memberId").notNull(), // FK a organization_members.id
  
  // Tipo de ausencia
  absenceType: mysqlEnum("absenceType", [
    "vacation",       // Vacaciones
    "sick_leave",     // Baja por enfermedad
    "personal",       // Asuntos personales
    "training",       // Formación
    "public_holiday", // Festivo
    "other",
  ]).notNull(),
  
  // Fechas
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isFullDay: boolean("isFullDay").default(true),
  startTime: varchar("startTime", { length: 5 }), // Si no es día completo
  endTime: varchar("endTime", { length: 5 }),
  
  // Aprobación
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"), // FK a users.id
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  memberIdx: index("ma_member_idx").on(table.memberId),
  dateIdx: index("ma_date_idx").on(table.startDate, table.endDate),
}));

export type MemberAbsence = typeof memberAbsences.$inferSelect;
export type InsertMemberAbsence = typeof memberAbsences.$inferInsert;

// ==========================================
// TABLA: REGISTRO DE ACTIVIDAD
// ==========================================

/**
 * Log de actividad de la organización para auditoría
 */
export const organizationActivityLog = mysqlTable("organization_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(), // Quién realizó la acción
  
  // Tipo de actividad
  activityType: mysqlEnum("activityType", [
    "member_invited",
    "member_joined",
    "member_removed",
    "member_role_changed",
    "member_suspended",
    "work_assigned",
    "work_reassigned",
    "work_completed",
    "settings_changed",
    "subscription_changed",
    "invoice_created",
    "client_created",
    "service_completed",
  ]).notNull(),
  
  // Detalles
  description: text("description").notNull(),
  metadata: json("metadata"), // Datos adicionales en JSON
  
  // Referencia a la entidad afectada
  entityType: varchar("entityType", { length: 50 }), // 'member', 'appointment', 'invoice', etc.
  entityId: int("entityId"),
  
  // IP y dispositivo (para seguridad)
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("al_org_idx").on(table.organizationId),
  userIdx: index("al_user_idx").on(table.userId),
  typeIdx: index("al_type_idx").on(table.activityType),
  dateIdx: index("al_date_idx").on(table.createdAt),
}));

export type OrganizationActivityLog = typeof organizationActivityLog.$inferSelect;
export type InsertOrganizationActivityLog = typeof organizationActivityLog.$inferInsert;

// ==========================================
// TABLA: MÉTRICAS DE RENDIMIENTO
// ==========================================

/**
 * Métricas de rendimiento por técnico (agregadas diariamente)
 */
export const technicianMetrics = mysqlTable("technician_metrics", {
  id: int("id").autoincrement().primaryKey(),
  
  organizationId: int("organizationId").notNull(),
  memberId: int("memberId").notNull(), // FK a organization_members.id
  
  // Período
  date: timestamp("date").notNull(), // Fecha del registro
  
  // Métricas de trabajo
  appointmentsScheduled: int("appointmentsScheduled").default(0),
  appointmentsCompleted: int("appointmentsCompleted").default(0),
  appointmentsCancelled: int("appointmentsCancelled").default(0),
  servicesCompleted: int("servicesCompleted").default(0),
  
  // Métricas de tiempo
  totalWorkMinutes: int("totalWorkMinutes").default(0),
  totalTravelMinutes: int("totalTravelMinutes").default(0),
  averageServiceDuration: int("averageServiceDuration"), // minutos
  
  // Métricas financieras
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default("0"),
  totalMaterialsCost: decimal("totalMaterialsCost", { precision: 10, scale: 2 }).default("0"),
  
  // Métricas de calidad
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }), // 1.00 - 5.00
  ratingsCount: int("ratingsCount").default(0),
  complaintsCount: int("complaintsCount").default(0),
  
  // Métricas de puntualidad
  onTimeArrivals: int("onTimeArrivals").default(0),
  lateArrivals: int("lateArrivals").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  memberDateIdx: uniqueIndex("tm_member_date_idx").on(table.memberId, table.date),
  orgDateIdx: index("tm_org_date_idx").on(table.organizationId, table.date),
}));

export type TechnicianMetrics = typeof technicianMetrics.$inferSelect;
export type InsertTechnicianMetrics = typeof technicianMetrics.$inferInsert;

// ==========================================
// RELACIONES
// ==========================================

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
  workAssignments: many(workAssignments),
  serviceZones: many(serviceZones),
  activityLog: many(organizationActivityLog),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [organizationMembers.invitedBy],
    references: [users.id],
  }),
  zones: many(technicianZones),
  absences: many(memberAbsences),
  metrics: many(technicianMetrics),
}));
