import { mysqlTable, int, varchar, text, timestamp, boolean, decimal, mysqlEnum, json } from "drizzle-orm/mysql-core";

/**
 * Partners Schema - Multi-tenant system
 * 
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
 */
export const partnerUsers = mysqlTable("partner_users", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull().references(() => partners.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
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

// Import users table for foreign key reference
import { users } from "./schema";

