import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - Stores customer information
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Owner user ID
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
