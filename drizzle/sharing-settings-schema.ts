/**
 * Organization Sharing Settings Schema
 * Piano Emotion Manager
 * 
 * Define la configuración de compartición de datos dentro de una organización.
 * Cada organización puede configurar qué recursos se comparten entre sus técnicos.
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { organizations } from "./schema.js";

// ==========================================
// ENUMS
// ==========================================

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

// ==========================================
// TABLA: CONFIGURACIÓN DE SHARING
// ==========================================

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
