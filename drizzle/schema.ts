import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

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

