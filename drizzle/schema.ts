import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, uniqueIndex, index, datetime } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ============================================================================
 * PARTNERS SCHEMA - Multi-tenant system
 * ============================================================================
 * Este schema define las tablas necesarias para el sistema multi-tenant
 * donde cada fabricante/distribuidor (partner) tiene su propia instancia
 * personalizada de la aplicación.
 */

/**
 * Partners table - Fabricantes/Distribuidores
 * Cada partner representa un fabricante o distribuidor que usa la plataforma
 */
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  
  // Identificación
  slug: varchar("slug", { length: 50 }).notNull().unique(), // Para subdominio: steinway.pianoemotion.com
  name: varchar("name", { length: 255 }).notNull(), // Nombre del fabricante
  email: varchar("email", { length: 320 }).notNull(), // Email de contacto
  
  // Subdominio personalizado del fabricante (opcional)
  customDomain: varchar("customDomain", { length: 255 }), // Ej: app.steinway.com o manager.steinway.com
  
  // Branding
  logo: text("logo"), // URL o base64 del logo
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6"), // Color principal (hex)
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#10b981"), // Color secundario (hex)
  brandName: varchar("brandName", { length: 255 }), // Nombre personalizado de la app
  
  // Estado y configuración
  status: mysqlEnum("status", ["active", "suspended", "inactive"]).default("active").notNull(),
  allowMultipleSuppliers: boolean("allowMultipleSuppliers").default(false).notNull(), // Permitir otros proveedores
  
  // Idioma
  defaultLanguage: varchar("defaultLanguage", { length: 5 }).default("es").notNull(), // Idioma por defecto del partner (ISO 639-1)
  
  // Contacto y soporte
  supportEmail: varchar("supportEmail", { length: 320 }),
  supportPhone: varchar("supportPhone", { length: 50 }),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

/**
 * Partner Pricing table - Precios personalizados por partner
 * Permite que cada fabricante tenga sus propios precios de suscripción
 */
export const partnerPricing = mysqlTable("partner_pricing", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull().references(() => partners.id, { onDelete: "cascade" }),
  
  // Plan
  planCode: mysqlEnum("planCode", ["free", "professional", "premium"]).notNull(),
  
  // Precios
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }), // Precio mensual
  yearlyPrice: decimal("yearlyPrice", { precision: 10, scale: 2 }), // Precio anual
  
  // Requisitos
  minMonthlyRevenue: decimal("minMonthlyRevenue", { precision: 10, scale: 2 }), // Facturación mínima mensual requerida
  
  // Descuentos
  discountPercentage: int("discountPercentage").default(0), // Descuento en %
  
  // Características personalizadas
  customFeatures: text("customFeatures"), // JSON con features adicionales
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerPricing = typeof partnerPricing.$inferSelect;
export type InsertPartnerPricing = typeof partnerPricing.$inferInsert;

/**
 * Partner Settings table - Configuración adicional por partner
 * Configuraciones específicas que no van en la tabla principal
 */
export const partnerSettings = mysqlTable("partner_settings", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull().unique().references(() => partners.id, { onDelete: "cascade" }),
  
  // Integración con ecommerce (para futuro Store)
  ecommerceEnabled: boolean("ecommerceEnabled").default(false).notNull(),
  ecommerceApiUrl: text("ecommerceApiUrl"),
  ecommerceApiKey: text("ecommerceApiKey"), // Encriptado
  
  // Configuración de pedidos automáticos
  autoOrderEnabled: boolean("autoOrderEnabled").default(false).notNull(),
  autoOrderThreshold: int("autoOrderThreshold").default(5), // Stock mínimo para pedido automático
  
  // Configuración de notificaciones
  notificationEmail: varchar("notificationEmail", { length: 320 }),
  notificationWebhook: text("notificationWebhook"),
  
  // Límites y cuotas
  maxUsers: int("maxUsers"), // Máximo de usuarios permitidos (null = ilimitado)
  maxOrganizations: int("maxOrganizations"), // Máximo de organizaciones
  
  // Idiomas
  supportedLanguages: json("supportedLanguages").$type<string[]>(), // Array de códigos de idioma permitidos (null = todos)
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerSettings = typeof partnerSettings.$inferSelect;
export type InsertPartnerSettings = typeof partnerSettings.$inferInsert;

/**
 * Partner Users table - Usuarios administrativos del partner
 * Usuarios que gestionan la configuración del partner (no son técnicos)
 * 
 * NOTE: This table references users table which is defined below.
 * The forward reference is handled by Drizzle's lazy evaluation.
 */
export const partnerUsers = mysqlTable("partner_users", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull().references(() => partners.id, { onDelete: "cascade" }),
  userId: int("userId").notNull(), // FK to users.id - defined below
  
  // Rol dentro del partner
  role: mysqlEnum("role", ["owner", "admin", "manager"]).default("manager").notNull(),
  
  // Permisos
  canManageBranding: boolean("canManageBranding").default(false).notNull(),
  canManagePricing: boolean("canManagePricing").default(false).notNull(),
  canManageUsers: boolean("canManageUsers").default(false).notNull(),
  canViewAnalytics: boolean("canViewAnalytics").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerUser = typeof partnerUsers.$inferSelect;
export type InsertPartnerUser = typeof partnerUsers.$inferInsert;

/**
 * ============================================================================
 * CORE APPLICATION SCHEMA
 * ============================================================================
 */

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Idioma preferido del usuario (null = usar idioma del partner)
  preferredLanguage: varchar("preferredLanguage", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "starter", "professional", "enterprise", "premium_ia"]).default("professional").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "none"]).default("none").notNull(),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  // SMTP configuration for corporate email
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort").default(587),
  smtpUser: varchar("smtpUser", { length: 320 }),
  smtpPassword: text("smtpPassword"), // Should be encrypted in production
  smtpSecure: boolean("smtpSecure").default(false),
  smtpFromName: varchar("smtpFromName", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - Stores customer information
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  clientType: mysqlEnum("clientType", [
    "particular",
    "student",
    "professional",
    "music_school",
    "conservatory",
    "concert_hall"
  ]).default("particular").notNull(),
  notes: text("notes"),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  routeGroup: varchar("routeGroup", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Pianos table - Stores piano information
 */
export const pianos = mysqlTable("pianos", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  clientId: int("clientId").notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  year: int("year"),
  category: mysqlEnum("category", ["vertical", "grand"]).default("vertical").notNull(),
  pianoType: varchar("pianoType", { length: 50 }).notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor", "needs_repair"]).default("good").notNull(),
  location: text("location"),
  notes: text("notes"),
  photos: json("photos").$type<string[]>(),
  
  // Configuración de alertas
  tuningIntervalDays: int("tuningIntervalDays").default(180), // Días entre afinaciones (default: 6 meses)
  regulationIntervalDays: int("regulationIntervalDays").default(730), // Días entre regulaciones (default: 2 años)
  alertsEnabled: boolean("alertsEnabled").default(true).notNull(), // Activar/desactivar alertas para este piano
  customThresholdsEnabled: boolean("customThresholdsEnabled").default(false).notNull(), // Usar umbrales personalizados o globales
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Piano = typeof pianos.$inferSelect;
export type InsertPiano = typeof pianos.$inferInsert;

/**
 * Services table - Stores service records
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  pianoId: int("pianoId").notNull(),
  clientId: int("clientId").notNull(),
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
  date: timestamp("date").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  duration: int("duration"), // in minutes
  tasks: json("tasks").$type<{ name: string; completed: boolean; notes?: string }[]>(),
  notes: text("notes"),
  technicianNotes: text("technicianNotes"),
  materialsUsed: json("materialsUsed").$type<{ materialId: number; quantity: number }[]>(),
  photosBefore: json("photosBefore").$type<string[]>(),
  photosAfter: json("photosAfter").$type<string[]>(),
  clientSignature: text("clientSignature"),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Inventory table - Stores materials and parts
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "strings",
    "hammers",
    "dampers",
    "keys",
    "action_parts",
    "pedals",
    "tuning_pins",
    "felts",
    "tools",
    "chemicals",
    "other"
  ]).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  unit: varchar("unit", { length: 20 }).default("unidad").notNull(),
  minStock: decimal("minStock", { precision: 10, scale: 2 }).default("0").notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = typeof inventory.$inferInsert;

/**
 * Appointments table - Stores scheduled appointments
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  clientId: int("clientId").notNull(),
  pianoId: int("pianoId"),
  title: varchar("title", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  duration: int("duration").default(60).notNull(), // in minutes
  serviceType: varchar("serviceType", { length: 50 }),
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Invoices table - Stores invoice records
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  clientId: int("clientId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientAddress: text("clientAddress"),
  date: timestamp("date").notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["draft", "sent", "paid", "cancelled"]).default("draft").notNull(),
  items: json("items").$type<{ description: string; quantity: number; unitPrice: number; taxRate: number; total: number }[]>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  businessInfo: json("businessInfo").$type<{
    name: string;
    taxId: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    bankAccount: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Service Rates table - Stores service catalog with prices
 */
export const serviceRates = mysqlTable("serviceRates", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "tuning",
    "maintenance",
    "regulation",
    "repair",
    "restoration",
    "inspection",
    "other"
  ]).notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  taxRate: int("taxRate").default(21).notNull(),
  estimatedDuration: int("estimatedDuration"), // in minutes
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRate = typeof serviceRates.$inferSelect;
export type InsertServiceRate = typeof serviceRates.$inferInsert;

/**
 * Business Info table - Stores technician's business information
 */
export const businessInfo = mysqlTable("businessInfo", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull().unique(), // Owner user ID (one per user)
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  name: varchar("name", { length: 255 }).notNull(),
  taxId: varchar("taxId", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  bankAccount: varchar("bankAccount", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessInfo = typeof businessInfo.$inferSelect;
export type InsertBusinessInfo = typeof businessInfo.$inferInsert;

/**
 * Reminders table - Stores follow-up reminders
 */
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  clientId: int("clientId").notNull(),
  pianoId: int("pianoId"),
  reminderType: mysqlEnum("reminderType", ["call", "visit", "email", "whatsapp", "follow_up"]).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;


/**
 * Quotes table - Stores budget/quote records for clients
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull(),
  clientId: int("clientId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientAddress: text("clientAddress"),
  pianoId: int("pianoId"),
  pianoDescription: varchar("pianoDescription", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired", "converted"]).default("draft").notNull(),
  items: json("items").$type<{ 
    id: string;
    type: 'service' | 'part' | 'labor' | 'travel' | 'other';
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    subtotal: number;
    total: number;
  }[]>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  totalDiscount: decimal("totalDiscount", { precision: 10, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  notes: text("notes"),
  termsAndConditions: text("termsAndConditions"),
  sentAt: timestamp("sentAt"),
  acceptedAt: timestamp("acceptedAt"),
  rejectedAt: timestamp("rejectedAt"),
  convertedToInvoiceId: int("convertedToInvoiceId"),
  businessInfo: json("businessInfo").$type<{
    name: string;
    taxId: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    bankAccount: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Quote Templates table - Stores reusable quote templates
 */
export const quoteTemplates = mysqlTable("quoteTemplates", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
  // Multi-tenant field
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id),
  // Organization field (nullable for individual technicians)
  organizationId: int("organizationId"), // FK to organizations.id
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["tuning", "repair", "restoration", "maintenance", "moving", "evaluation", "custom"]).default("custom").notNull(),
  items: json("items").$type<{
    type: 'service' | 'part' | 'labor' | 'travel' | 'other';
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }[]>(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteTemplate = typeof quoteTemplates.$inferSelect;
export type InsertQuoteTemplate = typeof quoteTemplates.$inferInsert;


// ============================================================================
// TEAM-SCHEMA
// ============================================================================

/**
 * Esquema de base de datos para Gestión de Equipos Multi-Tenant
 * Piano Emotion Manager
 * 
 * Este módulo extiende el esquema existente para soportar organizaciones
 * con múltiples técnicos, roles y permisos.
 */

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
  organizationRole: organizationRoleEnum.default("technician").notNull(),
  membershipStatus: membershipStatusEnum.default("pending_invitation").notNull(),
  
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
  statusIdx: index("status_idx").on(table.membershipStatus),
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

// ============================================================================
// DISTRIBUTOR-SCHEMA
// ============================================================================

/**
 * Esquema de Distribuidor
 * Piano Emotion Manager
 * 
 * Define las tablas para la configuración del distribuidor y gestión de técnicos.
 */


// ============================================================================
// Distributor Configuration
// ============================================================================

export const distributors = mysqlTable('distributors', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// WooCommerce Configuration
// ============================================================================

export const distributorWooCommerceConfig = mysqlTable('distributor_woocommerce_config', {
  id: int('id').primaryKey().autoincrement(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }).unique(),
  url: varchar('url', { length: 500 }).notNull(),
  consumerKey: varchar('consumer_key', { length: 255 }).notNull(),
  consumerSecret: varchar('consumer_secret', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(false),
  connectionStatus: mysqlEnum('connection_status', ['connected', 'disconnected', 'error', 'testing']).default('disconnected'),
  lastTestDate: datetime('last_test_date'),
  errorMessage: text('error_message'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  distributorIdIdx: index('wc_config_distributor_id_idx').on(table.distributorId),
}));

// ============================================================================
// Premium Configuration
// ============================================================================

export const distributorPremiumConfig = mysqlTable('distributor_premium_config', {
  id: int('id').primaryKey().autoincrement(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }).unique(),
  minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 10, scale: 2 }).default('100.00'),
  trialPeriodDays: int('trial_period_days').default(30),
  gracePeriodDays: int('grace_period_days').default(7),
  whatsappEnabled: boolean('whatsapp_enabled').default(true),
  portalEnabled: boolean('portal_enabled').default(true),
  autoRemindersEnabled: boolean('auto_reminders_enabled').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  distributorIdIdx: index('premium_config_distributor_id_idx').on(table.distributorId),
}));

// ============================================================================
// Distributor Module Configuration
// Configura qué módulos están disponibles para los clientes del distribuidor
// ============================================================================

export const distributorModuleConfig = mysqlTable('distributor_module_config', {
  id: int('id').primaryKey().autoincrement(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }).unique(),
  
  // Módulos Core (siempre activos, no configurables)
  // clients, pianos, services, calendar - siempre disponibles
  
  // Módulos de Negocio - el distribuidor decide si ofrecer
  suppliersEnabled: boolean('suppliers_enabled').default(true),        // Permite ver/añadir otros proveedores
  inventoryEnabled: boolean('inventory_enabled').default(true),        // Control de stock
  invoicingEnabled: boolean('invoicing_enabled').default(true),        // Facturación básica
  advancedInvoicingEnabled: boolean('advanced_invoicing_enabled').default(false), // Facturación electrónica
  accountingEnabled: boolean('accounting_enabled').default(false),     // Contabilidad
  
  // Módulos Premium - normalmente solo para clientes premium del distribuidor
  teamEnabled: boolean('team_enabled').default(false),                 // Gestión de equipos
  crmEnabled: boolean('crm_enabled').default(false),                   // CRM avanzado
  reportsEnabled: boolean('reports_enabled').default(false),           // Reportes y analytics
  
  // Configuración de Tienda
  shopEnabled: boolean('shop_enabled').default(true),                  // Tienda del distribuidor
  showPrices: boolean('show_prices').default(true),                    // Mostrar precios en tienda
  allowDirectOrders: boolean('allow_direct_orders').default(true),     // Permitir pedidos directos
  showStock: boolean('show_stock').default(true),                      // Mostrar disponibilidad
  stockAlertsEnabled: boolean('stock_alerts_enabled').default(true),   // Alertas de stock bajo
  
  // Configuración de marca
  customBranding: boolean('custom_branding').default(false),           // Usar branding del distribuidor
  hideCompetitorLinks: boolean('hide_competitor_links').default(false), // Ocultar enlaces a otros proveedores
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  distributorIdIdx: index('module_config_distributor_id_idx').on(table.distributorId),
}));

// ============================================================================
// Technician Account Status
// ============================================================================

export const technicianAccountStatus = mysqlTable('technician_account_status', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }),
  accountTier: mysqlEnum('account_tier', ['trial', 'basic', 'premium']).default('trial'),
  trialEndsAt: datetime('trial_ends_at'),
  purchasesLast30Days: decimal('purchases_last_30_days', { precision: 10, scale: 2 }).default('0.00'),
  lastPurchaseCheck: datetime('last_purchase_check'),
  lastPurchaseDate: datetime('last_purchase_date'),
  tierChangedAt: datetime('tier_changed_at'),
  previousTier: mysqlEnum('previous_tier', ['trial', 'basic', 'premium']),
  gracePeriodEndsAt: datetime('grace_period_ends_at'),
  manualOverride: boolean('manual_override').default(false),
  manualOverrideReason: text('manual_override_reason'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('tech_status_user_id_idx').on(table.userId),
  distributorIdIdx: index('tech_status_distributor_id_idx').on(table.distributorId),
  tierIdx: index('tech_status_tier_idx').on(table.accountTier),
}));

// ============================================================================
// Purchase Verification Logs
// ============================================================================

export const purchaseVerificationLogs = mysqlTable('purchase_verification_logs', {
  id: int('id').primaryKey().autoincrement(),
  logId: varchar('log_id', { length: 36 }).notNull().unique(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  distributorId: int('distributor_id').notNull().references(() => distributors.id, { onDelete: 'cascade' }),
  verificationDate: datetime('verification_date').notNull(),
  purchasesFound: decimal('purchases_found', { precision: 10, scale: 2 }).notNull(),
  minimumRequired: decimal('minimum_required', { precision: 10, scale: 2 }).notNull(),
  meetsMinimum: boolean('meets_minimum').notNull(),
  previousTier: mysqlEnum('previous_tier', ['trial', 'basic', 'premium']),
  newTier: mysqlEnum('new_tier', ['trial', 'basic', 'premium']),
  tierChanged: boolean('tier_changed').default(false),
  ordersCount: int('orders_count').default(0),
  status: mysqlEnum('status', ['success', 'error', 'skipped']).default('success'),
  errorMessage: text('error_message'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('verification_log_user_id_idx').on(table.userId),
  distributorIdIdx: index('verification_log_distributor_id_idx').on(table.distributorId),
  verificationDateIdx: index('verification_log_date_idx').on(table.verificationDate),
}));

// ============================================================================
// Types
// ============================================================================

export type Distributor = typeof distributors.$inferSelect;
export type InsertDistributor = typeof distributors.$inferInsert;

export type DistributorWooCommerceConfig = typeof distributorWooCommerceConfig.$inferSelect;
export type InsertDistributorWooCommerceConfig = typeof distributorWooCommerceConfig.$inferInsert;

export type DistributorPremiumConfig = typeof distributorPremiumConfig.$inferSelect;
export type InsertDistributorPremiumConfig = typeof distributorPremiumConfig.$inferInsert;

export type DistributorModuleConfig = typeof distributorModuleConfig.$inferSelect;
export type InsertDistributorModuleConfig = typeof distributorModuleConfig.$inferInsert;

export type TechnicianAccountStatus = typeof technicianAccountStatus.$inferSelect;
export type InsertTechnicianAccountStatus = typeof technicianAccountStatus.$inferInsert;

export type PurchaseVerificationLog = typeof purchaseVerificationLogs.$inferSelect;
export type InsertPurchaseVerificationLog = typeof purchaseVerificationLogs.$inferInsert;

// ============================================================================
// LICENSE-SCHEMA
// ============================================================================

/**
 * Esquema de Licencias
 * Piano Emotion Manager
 * 
 * Sistema de licencias para gestionar el acceso de técnicos
 * tanto individuales como clientes de distribuidores.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Tipos de licencia
 */
export const licenseTypeValues = ['trial', 'free', 'starter', 'professional', 'enterprise'] as const;
export type LicenseType = typeof licenseTypeValues[number];

/**
 * Estados de licencia
 */
export const licenseStatusValues = ['available', 'active', 'expired', 'revoked', 'suspended'] as const;
export type LicenseStatus = typeof licenseStatusValues[number];

// ============================================================================
// Platform Admins
// ============================================================================

/**
 * Administradores de la plataforma Piano Emotion
 * Solo estos usuarios pueden acceder al panel de administración
 */
export const platformAdmins = mysqlTable('platform_admins', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  role: mysqlEnum('role', ['super_admin', 'admin', 'support']).default('admin'),
  permissions: json('permissions').$type<string[]>(), // Permisos específicos
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('platform_admins_user_id_idx').on(table.userId),
}));

// ============================================================================
// License Templates
// ============================================================================

/**
 * Plantillas de licencia predefinidas
 * Facilitan la creación de licencias con configuraciones comunes
 */
export const licenseTemplates = mysqlTable('license_templates', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  
  // Duración
  durationDays: int('duration_days'), // null = sin expiración
  
  // Configuración de módulos incluidos
  moduleConfig: json('module_config').$type<{
    // Módulos de Negocio
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    // Módulos Premium
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    // Configuración de Tienda
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Límites
  maxUsers: int('max_users').default(1), // Para licencias de equipo
  maxClients: int('max_clients'), // Límite de clientes
  maxPianos: int('max_pianos'), // Límite de pianos
  
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// Licenses
// ============================================================================

/**
 * Licencias generadas
 * Cada licencia tiene un código único que el técnico usa para activar
 */
export const licenses = mysqlTable('licenses', {
  id: int('id').primaryKey().autoincrement(),
  
  // Código único de activación (ej: PE-XXXX-XXXX-XXXX)
  code: varchar('code', { length: 50 }).notNull().unique(),
  
  // Tipo y estado
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  status: mysqlEnum('status', licenseStatusValues).default('available'),
  
  // Asociación (opcional)
  distributorId: int('distributor_id').references(() => distributors.id, { onDelete: 'set null' }),
  templateId: int('template_id').references(() => licenseTemplates.id, { onDelete: 'set null' }),
  
  // Usuario que activó la licencia (null si no está activada)
  activatedByUserId: int('activated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  activatedAt: datetime('activated_at'),
  
  // Configuración de módulos (puede sobrescribir la del distribuidor)
  moduleConfig: json('module_config').$type<{
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Límites específicos de esta licencia
  maxUsers: int('max_users').default(1),
  maxClients: int('max_clients'),
  maxPianos: int('max_pianos'),
  
  // Fechas
  validFrom: datetime('valid_from').$defaultFn(() => new Date()),
  validUntil: datetime('valid_until'), // null = sin expiración
  
  // Metadatos
  notes: text('notes'), // Notas internas del admin
  metadata: json('metadata').$type<Record<string, any>>(), // Datos adicionales
  
  // Quién creó la licencia
  createdByAdminId: int('created_by_admin_id').references(() => platformAdmins.id),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  codeIdx: index('licenses_code_idx').on(table.code),
  statusIdx: index('licenses_status_idx').on(table.status),
  distributorIdx: index('licenses_distributor_idx').on(table.distributorId),
  activatedByIdx: index('licenses_activated_by_idx').on(table.activatedByUserId),
}));

// ============================================================================
// License Batches
// ============================================================================

/**
 * Lotes de licencias
 * Para generar múltiples licencias de una vez para un distribuidor
 */
export const licenseBatches = mysqlTable('license_batches', {
  id: int('id').primaryKey().autoincrement(),
  
  // Identificador del lote
  batchCode: varchar('batch_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Asociación
  distributorId: int('distributor_id').references(() => distributors.id, { onDelete: 'set null' }),
  templateId: int('template_id').references(() => licenseTemplates.id),
  
  // Cantidad
  totalLicenses: int('total_licenses').notNull(),
  activatedLicenses: int('activated_licenses').default(0),
  
  // Configuración común para todas las licencias del lote
  licenseType: mysqlEnum('license_type', licenseTypeValues).notNull(),
  moduleConfig: json('module_config').$type<{
    suppliersEnabled: boolean;
    inventoryEnabled: boolean;
    invoicingEnabled: boolean;
    advancedInvoicingEnabled: boolean;
    accountingEnabled: boolean;
    teamEnabled: boolean;
    crmEnabled: boolean;
    reportsEnabled: boolean;
    shopEnabled: boolean;
    showPrices: boolean;
    allowDirectOrders: boolean;
    showStock: boolean;
    stockAlertsEnabled: boolean;
  }>(),
  
  // Duración de las licencias
  durationDays: int('duration_days'),
  
  // Quién creó el lote
  createdByAdminId: int('created_by_admin_id').references(() => platformAdmins.id),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  batchCodeIdx: index('license_batches_code_idx').on(table.batchCode),
  distributorIdx: index('license_batches_distributor_idx').on(table.distributorId),
}));

// ============================================================================
// License History
// ============================================================================

/**
 * Historial de cambios en licencias
 * Para auditoría y seguimiento
 */
export const licenseHistory = mysqlTable('license_history', {
  id: int('id').primaryKey().autoincrement(),
  licenseId: int('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  
  action: mysqlEnum('action', [
    'created',
    'activated', 
    'deactivated',
    'expired',
    'revoked',
    'suspended',
    'reactivated',
    'transferred',
    'config_changed',
  ]).notNull(),
  
  previousStatus: mysqlEnum('previous_status', licenseStatusValues),
  newStatus: mysqlEnum('new_status', licenseStatusValues),
  
  // Quién realizó la acción
  performedByAdminId: int('performed_by_admin_id').references(() => platformAdmins.id),
  performedByUserId: int('performed_by_user_id').references(() => users.id),
  
  // Detalles adicionales
  details: json('details').$type<Record<string, any>>(),
  notes: text('notes'),
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  licenseIdx: index('license_history_license_idx').on(table.licenseId),
  actionIdx: index('license_history_action_idx').on(table.action),
}));

// ============================================================================
// Types
// ============================================================================

export type PlatformAdmin = typeof platformAdmins.$inferSelect;
export type InsertPlatformAdmin = typeof platformAdmins.$inferInsert;

export type LicenseTemplate = typeof licenseTemplates.$inferSelect;
export type InsertLicenseTemplate = typeof licenseTemplates.$inferInsert;

export type License = typeof licenses.$inferSelect;
export type InsertLicense = typeof licenses.$inferInsert;

export type LicenseBatch = typeof licenseBatches.$inferSelect;
export type InsertLicenseBatch = typeof licenseBatches.$inferInsert;

export type LicenseHistoryEntry = typeof licenseHistory.$inferSelect;
export type InsertLicenseHistoryEntry = typeof licenseHistory.$inferInsert;

// ============================================================================
// MARKETING-SCHEMA
// ============================================================================

/**
 * Tipos de plantillas de mensajes disponibles
 */
export const messageTemplateTypes = [
  'appointment_reminder',      // Recordatorio de cita
  'service_completed',         // Servicio completado
  'maintenance_reminder',      // Recordatorio de mantenimiento
  'invoice_sent',              // Factura enviada
  'welcome',                   // Bienvenida a nuevo cliente
  'birthday',                  // Felicitación de cumpleaños
  'promotion',                 // Promoción/Oferta
  'follow_up',                 // Seguimiento post-servicio
  'reactivation',              // Reactivación de cliente inactivo
  'custom',                    // Mensaje personalizado
] as const;

export type MessageTemplateType = typeof messageTemplateTypes[number];

/**
 * Canales de comunicación disponibles
 */
export const messageChannels = ['whatsapp', 'email', 'sms', 'all'] as const;
export type MessageChannel = typeof messageChannels[number];

/**
 * Plantillas de mensajes configurables por el usuario
 */
export const messageTemplates = mysqlTable('message_templates', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Tipo de plantilla
  type: varchar('type', { length: 50 }).notNull(),
  
  // Canal: whatsapp, email, o both (ambos)
  channel: varchar('channel', { length: 20 }).default('whatsapp'),
  
  // Nombre descriptivo de la plantilla
  name: varchar('name', { length: 100 }).notNull(),
  
  // Asunto del email (solo para canal email)
  emailSubject: varchar('email_subject', { length: 200 }),
  
  // Contenido del mensaje con variables {{variable}}
  content: text('content').notNull(),
  
  // Contenido HTML para email (opcional, si no se usa content como texto plano)
  htmlContent: text('html_content'),
  
  // Variables disponibles para esta plantilla (JSON array)
  availableVariables: json('available_variables').$type<string[]>(),
  
  // Si es la plantilla por defecto para este tipo y canal
  isDefault: boolean('is_default').default(false),
  
  // Si está activa
  isActive: boolean('is_active').default(true),
  
  // Metadatos
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdBy: int('created_by'),
});

/**
 * Estados de una campaña de marketing
 */
export const campaignStatuses = [
  'draft',        // Borrador
  'scheduled',    // Programada
  'in_progress',  // En progreso (enviando)
  'paused',       // Pausada
  'completed',    // Completada
  'cancelled',    // Cancelada
] as const;

export type CampaignStatus = typeof campaignStatuses[number];

/**
 * Campañas de marketing
 */
export const marketingCampaigns = mysqlTable('marketing_campaigns', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Información básica
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Plantilla a usar
  templateId: int('template_id').notNull(),
  
  // Estado de la campaña
  status: varchar('status', { length: 20 }).default('draft'),
  
  // Filtros para seleccionar destinatarios (JSON)
  recipientFilters: json('recipient_filters').$type<{
    lastServiceBefore?: string;      // Último servicio antes de esta fecha
    lastServiceAfter?: string;       // Último servicio después de esta fecha
    pianoTypes?: string[];           // Tipos de piano
    serviceTypes?: string[];         // Tipos de servicio realizados
    tags?: string[];                 // Etiquetas de cliente
    hasUpcomingAppointment?: boolean; // Tiene cita próxima
    isActive?: boolean;              // Cliente activo
  }>(),
  
  // Estadísticas
  totalRecipients: int('total_recipients').default(0),
  sentCount: int('sent_count').default(0),
  
  // Fechas
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdBy: int('created_by'),
});

/**
 * Destinatarios de una campaña (cola de envío)
 */
export const campaignRecipients = mysqlTable('campaign_recipients', {
  id: int('id').primaryKey().autoincrement(),
  campaignId: int('campaign_id').notNull(),
  clientId: int('client_id').notNull(),
  
  // Mensaje personalizado generado para este cliente
  generatedMessage: text('generated_message'),
  
  // Estado del envío
  status: varchar('status', { length: 20 }).default('pending'), // pending, sent, skipped, failed
  
  // Información del envío
  sentAt: timestamp('sent_at'),
  sentBy: int('sent_by'),
  
  // Notas (por qué se saltó, error, etc.)
  notes: text('notes'),
  
  // Orden en la cola
  queueOrder: int('queue_order'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Historial de mensajes enviados (para auditoría y seguimiento)
 */
export const messageHistory = mysqlTable('message_history', {
  id: int('id').primaryKey().autoincrement(),
  organizationId: int('organization_id').notNull(),
  
  // Relaciones opcionales
  campaignId: int('campaign_id'),
  templateId: int('template_id'),
  clientId: int('client_id').notNull(),
  
  // Tipo de mensaje
  messageType: varchar('message_type', { length: 50 }).notNull(),
  
  // Contenido enviado
  content: text('content').notNull(),
  
  // Canal de envío
  channel: varchar('channel', { length: 20 }).default('whatsapp'), // whatsapp, email, sms
  
  // Número de teléfono al que se envió
  recipientPhone: varchar('recipient_phone', { length: 20 }),
  
  // Estado
  status: varchar('status', { length: 20 }).default('sent'), // sent, delivered, read, failed
  
  // Metadatos
  sentAt: timestamp('sent_at').defaultNow(),
  sentBy: int('sent_by'),
});

// Relaciones
export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [messageTemplates.organizationId],
    references: [organizations.id],
  }),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [marketingCampaigns.organizationId],
    references: [organizations.id],
  }),
  template: one(messageTemplates, {
    fields: [marketingCampaigns.templateId],
    references: [messageTemplates.id],
  }),
  recipients: many(campaignRecipients),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [campaignRecipients.campaignId],
    references: [marketingCampaigns.id],
  }),
}));

// ============================================================================
// NOTIFICATIONS-SCHEMA
// ============================================================================

/**
 * Esquema de Notificaciones
 * Piano Emotion Manager
 * 
 * Define las tablas para el sistema de notificaciones push e in-app.
 */


// ============================================================================
// Push Tokens
// ============================================================================

export const pushTokens = mysqlTable('push_tokens', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull(),
  platform: mysqlEnum('platform', ['ios', 'android', 'web']).notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  deviceName: varchar('device_name', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  lastUsedAt: datetime('last_used_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('push_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('push_tokens_token_idx').on(table.token),
}));

// ============================================================================
// Stored Notifications (In-App)
// ============================================================================

export const storedNotifications = mysqlTable('stored_notifications', {
  id: int('id').primaryKey().autoincrement(),
  notificationId: varchar('notification_id', { length: 36 }).notNull().unique(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: int('organization_id'),
  type: mysqlEnum('type', [
    'assignment_new',
    'assignment_accepted',
    'assignment_rejected',
    'assignment_started',
    'assignment_completed',
    'assignment_cancelled',
    'assignment_reassigned',
    'invitation_received',
    'invitation_accepted',
    'member_joined',
    'member_left',
    'reminder',
    'system',
    'message',
    'payment',
    'invoice',
    'quote',
    'warranty',
    'stock_alert',
  ]).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'),
  isRead: boolean('is_read').default(false),
  readAt: datetime('read_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('stored_notifications_user_id_idx').on(table.userId),
  orgIdIdx: index('stored_notifications_org_id_idx').on(table.organizationId),
  typeIdx: index('stored_notifications_type_idx').on(table.type),
  isReadIdx: index('stored_notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('stored_notifications_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// Notification Preferences
// ============================================================================

export const notificationPreferences = mysqlTable('notification_preferences', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Canales habilitados
  pushEnabled: boolean('push_enabled').default(true),
  emailEnabled: boolean('email_enabled').default(true),
  smsEnabled: boolean('sms_enabled').default(false),
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  
  // Tipos de notificación habilitados
  assignmentsEnabled: boolean('assignments_enabled').default(true),
  remindersEnabled: boolean('reminders_enabled').default(true),
  messagesEnabled: boolean('messages_enabled').default(true),
  paymentsEnabled: boolean('payments_enabled').default(true),
  systemEnabled: boolean('system_enabled').default(true),
  
  // Horarios de silencio
  quietHoursEnabled: boolean('quiet_hours_enabled').default(false),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // HH:MM
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // HH:MM
  
  // Frecuencia de resúmenes
  dailyDigestEnabled: boolean('daily_digest_enabled').default(false),
  dailyDigestTime: varchar('daily_digest_time', { length: 5 }), // HH:MM
  
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('notification_preferences_user_id_idx').on(table.userId),
}));

// ============================================================================
// Scheduled Notifications
// ============================================================================

export const scheduledNotifications = mysqlTable('scheduled_notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expoNotificationId: varchar('expo_notification_id', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'),
  scheduledFor: datetime('scheduled_for').notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'cancelled', 'failed']).default('pending'),
  sentAt: datetime('sent_at'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('scheduled_notifications_user_id_idx').on(table.userId),
  scheduledForIdx: index('scheduled_notifications_scheduled_for_idx').on(table.scheduledFor),
  statusIdx: index('scheduled_notifications_status_idx').on(table.status),
}));

// ============================================================================
// Types
// ============================================================================

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

export type StoredNotification = typeof storedNotifications.$inferSelect;
export type InsertStoredNotification = typeof storedNotifications.$inferInsert;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = typeof scheduledNotifications.$inferInsert;

// ==========================================
// SHARING SETTINGS SCHEMA
// ==========================================

/**
 * Organization Sharing Settings Schema
 * Piano Emotion Manager
 * 
 * Define la configuración de compartición de datos dentro de una organización.
 * Cada organización puede configurar qué recursos se comparten entre sus técnicos.
 */

/**
 * Recursos que se pueden configurar para compartir
 */
export const sharableResourceEnum = mysqlEnum("sharable_resource", [
  "clients",        // Clientes
  "pianos",         // Pianos
  "services",       // Servicios realizados
  "appointments",   // Citas
  "inventory",      // Inventario
  "invoices",       // Facturas
  "quotes",         // Presupuestos
  "reminders",      // Recordatorios
]);

/**
 * Modelos de compartición disponibles
 */
export const sharingModelEnum = mysqlEnum("sharing_model", [
  "private",        // Privado: Solo el técnico ve sus datos
  "shared_read",    // Compartido (Solo Lectura): Todos ven, solo el técnico edita
  "shared_write",   // Compartido (Lectura/Escritura): Todos ven y editan
]);

/**
 * Configuración de compartición de datos por organización
 * 
 * Esta tabla define cómo se comparten los datos entre los técnicos
 * de una organización para cada tipo de recurso.
 */
export const organizationSharingSettings = mysqlTable("organization_sharing_settings", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relación con organización
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Recurso configurado
  resource: sharableResourceEnum.notNull(),
  
  // Modelo de compartición
  sharingModel: sharingModelEnum.notNull().default("private"),
  
  // Metadatos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índice único: una organización solo puede tener una configuración por recurso
  orgResourceIdx: uniqueIndex("org_resource_idx").on(table.organizationId, table.resource),
}));

export type OrganizationSharingSetting = typeof organizationSharingSettings.$inferSelect;
export type InsertOrganizationSharingSetting = typeof organizationSharingSettings.$inferInsert;

/**
 * Configuración por defecto para nuevas organizaciones
 * 
 * Por defecto, todos los recursos son privados excepto el inventario
 * que se comparte en modo lectura/escritura (es común compartir el inventario).
 */
export const DEFAULT_SHARING_SETTINGS: Array<{ resource: string; sharingModel: string }> = [
  { resource: "clients", sharingModel: "private" },
  { resource: "pianos", sharingModel: "private" },
  { resource: "services", sharingModel: "private" },
  { resource: "appointments", sharingModel: "private" },
  { resource: "inventory", sharingModel: "shared_write" }, // Inventario compartido por defecto
  { resource: "invoices", sharingModel: "private" },
  { resource: "quotes", sharingModel: "private" },
  { resource: "reminders", sharingModel: "private" },
];

/**
 * ============================================================================
 * ALERT SYSTEM SCHEMA
 * ============================================================================
 * Sistema de alertas y notificaciones para mantenimiento de pianos
 */

/**
 * Alert Settings - Configuración de umbrales de alertas
 * Permite configuración global, por organización o por usuario
 */
export const alertSettings = mysqlTable("alert_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // NULL = configuración global del partner
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id, { onDelete: "cascade" }),
  organizationId: int("organizationId"), // Configuración por organización
  
  // Umbrales de afinación (en días)
  tuningPendingDays: int("tuningPendingDays").default(180).notNull(), // 6 meses
  tuningUrgentDays: int("tuningUrgentDays").default(270).notNull(), // 9 meses
  
  // Umbrales de regulación (en días)
  regulationPendingDays: int("regulationPendingDays").default(730).notNull(), // 2 años
  regulationUrgentDays: int("regulationUrgentDays").default(1095).notNull(), // 3 años
  
  // Configuración de notificaciones
  emailNotificationsEnabled: boolean("emailNotificationsEnabled").default(true).notNull(),
  pushNotificationsEnabled: boolean("pushNotificationsEnabled").default(false).notNull(),
  weeklyDigestEnabled: boolean("weeklyDigestEnabled").default(true).notNull(),
  weeklyDigestDay: int("weeklyDigestDay").default(1).notNull(), // 1=Lunes, 7=Domingo
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertSetting = typeof alertSettings.$inferSelect;
export type InsertAlertSetting = typeof alertSettings.$inferInsert;

/**
 * Alert History - Historial de alertas generadas
 * Tracking de todas las alertas y su estado
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  pianoId: int("pianoId").notNull().references(() => pianos.id, { onDelete: "cascade" }),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userId: int("userId").notNull(), // Usuario que recibió la alerta
  partnerId: int("partnerId").notNull().default(1).references(() => partners.id, { onDelete: "cascade" }),
  organizationId: int("organizationId"),
  
  // Tipo de alerta
  alertType: mysqlEnum("alertType", ["tuning", "regulation", "repair"]).notNull(),
  priority: mysqlEnum("priority", ["urgent", "pending", "ok"]).notNull(),
  
  // Detalles
  message: text("message").notNull(),
  daysSinceLastService: int("daysSinceLastService").notNull(),
  
  // Estado
  status: mysqlEnum("status", ["active", "acknowledged", "resolved", "dismissed"]).default("active").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedByServiceId: int("resolvedByServiceId"), // ID del servicio que resolvió la alerta
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pianoStatusIdx: index("idx_piano_status").on(table.pianoId, table.status),
  userStatusIdx: index("idx_user_status").on(table.userId, table.status),
  createdIdx: index("idx_created").on(table.createdAt),
  priorityIdx: index("idx_priority").on(table.priority),
}));

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * Alert Notifications - Tracking de notificaciones enviadas
 * Registro de emails y push notifications enviadas por alertas
 */
export const alertNotifications = mysqlTable("alert_notifications", {
  id: int("id").autoincrement().primaryKey(),
  alertHistoryId: int("alertHistoryId").notNull().references(() => alertHistory.id, { onDelete: "cascade" }),
  userId: int("userId").notNull(),
  
  // Tipo de notificación
  notificationType: mysqlEnum("notificationType", ["email", "push", "weekly_digest"]).notNull(),
  
  // Estado
  status: mysqlEnum("status", ["pending", "sent", "failed", "opened"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  
  // Detalles del envío
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  subject: varchar("subject", { length: 255 }),
  errorMessage: text("errorMessage"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  alertTypeIdx: index("idx_alert_type").on(table.alertHistoryId, table.notificationType),
  userStatusIdx: index("idx_user_status").on(table.userId, table.status),
  sentIdx: index("idx_sent").on(table.sentAt),
}));

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = typeof alertNotifications.$inferInsert;
