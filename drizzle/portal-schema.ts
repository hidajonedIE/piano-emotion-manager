import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Portal Magic Links - Tokens para autenticación sin contraseña
 */
export const portalMagicLinks = mysqlTable("portalMagicLinks", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalMagicLink = typeof portalMagicLinks.$inferSelect;
export type InsertPortalMagicLink = typeof portalMagicLinks.$inferInsert;

/**
 * Portal Sessions - Sesiones activas del portal
 */
export const portalSessions = mysqlTable("portalSessions", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  token: varchar("token", { length: 256 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalSession = typeof portalSessions.$inferSelect;
export type InsertPortalSession = typeof portalSessions.$inferInsert;

/**
 * Portal Appointment Requests - Solicitudes de cita desde el portal
 */
export const portalAppointmentRequests = mysqlTable("portalAppointmentRequests", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner (technician) user ID
  clientId: int("clientId").notNull(),
  pianoId: int("pianoId").notNull(),
  serviceType: mysqlEnum("serviceType", [
    "tuning",
    "repair",
    "regulation",
    "maintenance_basic",
    "maintenance_complete",
    "maintenance_premium",
    "inspection",
    "restoration",
    "other"
  ]).notNull(),
  preferredDates: json("preferredDates").$type<string[]>().notNull(),
  preferredTimeSlot: mysqlEnum("preferredTimeSlot", [
    "morning",
    "afternoon",
    "evening",
    "any"
  ]).default("any"),
  notes: text("notes"),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "rejected",
    "cancelled"
  ]).default("pending").notNull(),
  confirmedDate: timestamp("confirmedDate"),
  appointmentId: int("appointmentId"), // Referencia a la cita creada
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalAppointmentRequest = typeof portalAppointmentRequests.$inferSelect;
export type InsertPortalAppointmentRequest = typeof portalAppointmentRequests.$inferInsert;

/**
 * Service Ratings - Valoraciones de servicios por clientes
 */
export const serviceRatings = mysqlTable("serviceRatings", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner (technician) user ID
  serviceId: int("serviceId").notNull(),
  clientId: int("clientId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRating = typeof serviceRatings.$inferSelect;
export type InsertServiceRating = typeof serviceRatings.$inferInsert;

/**
 * Portal Conversations - Conversaciones cliente-técnico
 */
export const portalConversations = mysqlTable("portalConversations", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner (technician) user ID
  clientId: int("clientId").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  clientUnreadCount: int("clientUnreadCount").default(0),
  technicianUnreadCount: int("technicianUnreadCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalConversation = typeof portalConversations.$inferSelect;
export type InsertPortalConversation = typeof portalConversations.$inferInsert;

/**
 * Portal Messages - Mensajes en conversaciones
 */
export const portalMessages = mysqlTable("portalMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderType: mysqlEnum("senderType", ["client", "technician"]).notNull(),
  senderId: int("senderId").notNull(), // clientId o odId según senderType
  messageType: mysqlEnum("messageType", ["text", "image", "file", "appointment_request"]).default("text"),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalMessage = typeof portalMessages.$inferSelect;
export type InsertPortalMessage = typeof portalMessages.$inferInsert;

/**
 * Portal Notifications - Notificaciones para clientes
 */
export const portalNotifications = mysqlTable("portalNotifications", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  type: mysqlEnum("type", [
    "appointment_confirmed",
    "appointment_reminder",
    "service_completed",
    "invoice_ready",
    "message_received",
    "maintenance_due",
    "general"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: json("data").$type<Record<string, any>>(),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortalNotification = typeof portalNotifications.$inferSelect;
export type InsertPortalNotification = typeof portalNotifications.$inferInsert;
