import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
import * as shopSchema from "../drizzle/shop-schema.js";
import * as crmSchema from "../drizzle/crm-schema.js";
import * as distributorSchema from "../drizzle/distributor-schema.js";

type InsertUser = InferInsertModel<typeof users>;
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Attempting to connect...");
      console.log("[Database] DATABASE_URL present:", !!process.env.DATABASE_URL);
      console.log("[Database] DATABASE_URL length:", process.env.DATABASE_URL?.length);
      
      // Create connection pool with SSL configuration for TiDB Cloud
      // Optimized for 2500 concurrent users
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
        // Connection pool configuration for high concurrency
        connectionLimit: 1000,          // Max connections (TiDB serverless supports up to 1000)
        waitForConnections: true,       // Queue requests when pool is full
        queueLimit: 0,                  // Unlimited queue (requests will wait)
        enableKeepAlive: true,          // Keep connections alive
        keepAliveInitialDelay: 10000,   // 10 seconds
        maxIdle: 50,                    // Max idle connections
        idleTimeout: 60000,             // 60 seconds idle timeout
        connectTimeout: 10000,          // 10 seconds connect timeout
      });
      _db = drizzle(pool, { schema: { ...schema, ...shopSchema, ...crmSchema, ...distributorSchema } });
      console.log("[Database] ✓ Connection pool created successfully");
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error instanceof Error ? error.message : error);
      if (error instanceof Error && error.stack) {
        console.error("[Database] Stack:", error.stack);
      }
      _db = null;
    }
  } else if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not configured");
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Siempre establecer plan professional para nuevos usuarios
    values.subscriptionPlan = 'professional';
    values.subscriptionStatus = 'active';
    
    // También actualizar usuarios existentes a professional si no tienen plan
    updateSet.subscriptionPlan = 'professional';
    updateSet.subscriptionStatus = 'active';

    await getDb().insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await getDb().select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Añadir queries de características adicionales según crezca el esquema.

import { and, desc } from "drizzle-orm";
import {
  clients,
  pianos,
  services,
  inventory,
  appointments,
  invoices,
  serviceRates,
  businessInfo,
  reminders,
  quotes,
  quoteTemplates,
} from "../drizzle/schema.js";

type Client = InferSelectModel<typeof clients>;
type Piano = InferSelectModel<typeof pianos>;
type Service = InferSelectModel<typeof services>;
type InventoryItem = InferSelectModel<typeof inventory>;
type Appointment = InferSelectModel<typeof appointments>;
type Invoice = InferSelectModel<typeof invoices>;
type ServiceRate = InferSelectModel<typeof serviceRates>;
type BusinessInfo = InferSelectModel<typeof businessInfo>;
type Reminder = InferSelectModel<typeof reminders>;
type Quote = InferSelectModel<typeof quotes>;
type QuoteTemplate = InferSelectModel<typeof quoteTemplates>;

type InsertClient = InferInsertModel<typeof clients>;
type InsertPiano = InferInsertModel<typeof pianos>;
type InsertService = InferInsertModel<typeof services>;
type InsertInventoryItem = InferInsertModel<typeof inventory>;
type InsertAppointment = InferInsertModel<typeof appointments>;
type InsertInvoice = InferInsertModel<typeof invoices>;
type InsertServiceRate = InferInsertModel<typeof serviceRates>;
type InsertBusinessInfo = InferInsertModel<typeof businessInfo>;
type InsertReminder = InferInsertModel<typeof reminders>;
type InsertQuote = InferInsertModel<typeof quotes>;
type InsertQuoteTemplate = InferInsertModel<typeof quoteTemplates>;

// ============ CLIENTS ============

export async function getClients(odId: string): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(clients).where(eq(clients.odId, odId)).orderBy(desc(clients.updatedAt));
}

export async function getClient(odId: string, id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
  return result[0];
}

export async function createClient(data: InsertClient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(clients).values(data);
  return result[0].insertId;
}

export async function updateClient(odId: string, id: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(clients).set(data).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}

export async function deleteClient(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}

// ============ PIANOS ============

export async function getPianos(odId: string): Promise<Piano[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(pianos).where(eq(pianos.odId, odId)).orderBy(desc(pianos.updatedAt));
}

export async function getPiano(odId: string, id: number): Promise<Piano | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
  return result[0];
}

export async function getPianosByClient(odId: string, clientId: number): Promise<Piano[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.clientId, clientId)));
}

export async function createPiano(data: InsertPiano): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(pianos).values(data);
  return result[0].insertId;
}

export async function updatePiano(odId: string, id: number, data: Partial<InsertPiano>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(pianos).set(data).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}

export async function deletePiano(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}

// ============ SERVICES ============

export async function getServices(odId: string): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(services).where(eq(services.odId, odId)).orderBy(desc(services.date));
}

export async function getService(odId: string, id: number): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(services).where(and(eq(services.odId, odId), eq(services.id, id)));
  return result[0];
}

export async function getServicesByPiano(odId: string, pianoId: number): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(services).where(and(eq(services.odId, odId), eq(services.pianoId, pianoId))).orderBy(desc(services.date));
}

export async function createService(data: InsertService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(services).values(data);
  return result[0].insertId;
}

export async function updateService(odId: string, id: number, data: Partial<InsertService>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(services).set(data).where(and(eq(services.odId, odId), eq(services.id, id)));
}

export async function deleteService(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(services).where(and(eq(services.odId, odId), eq(services.id, id)));
}

// ============ INVENTORY ============

export async function getInventory(odId: string): Promise<InventoryItem[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(inventory).where(eq(inventory.odId, odId)).orderBy(inventory.name);
}

export async function getInventoryItem(odId: string, id: number): Promise<InventoryItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
  return result[0];
}

export async function createInventoryItem(data: InsertInventoryItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(inventory).values(data);
  return result[0].insertId;
}

export async function updateInventoryItem(odId: string, id: number, data: Partial<InsertInventoryItem>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(inventory).set(data).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}

export async function deleteInventoryItem(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}

// ============ APPOINTMENTS ============

export async function getAppointments(odId: string): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(appointments).where(eq(appointments.odId, odId)).orderBy(appointments.date);
}

export async function getAppointment(odId: string, id: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
  return result[0];
}

export async function createAppointment(data: InsertAppointment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(appointments).values(data);
  return result[0].insertId;
}

export async function updateAppointment(odId: string, id: number, data: Partial<InsertAppointment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(appointments).set(data).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}

export async function deleteAppointment(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}

// ============ INVOICES ============

export async function getInvoices(odId: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(invoices).where(eq(invoices.odId, odId)).orderBy(desc(invoices.date));
}

export async function getInvoice(odId: string, id: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
  return result[0];
}

export async function createInvoice(data: InsertInvoice): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(invoices).values(data);
  return result[0].insertId;
}

export async function updateInvoice(odId: string, id: number, data: Partial<InsertInvoice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(invoices).set(data).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}

export async function deleteInvoice(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}

// ============ SERVICE RATES ============

export async function getServiceRates(odId: string): Promise<ServiceRate[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(serviceRates).where(eq(serviceRates.odId, odId)).orderBy(serviceRates.category, serviceRates.name);
}

export async function getServiceRate(odId: string, id: number): Promise<ServiceRate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
  return result[0];
}

export async function createServiceRate(data: InsertServiceRate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(serviceRates).values(data);
  return result[0].insertId;
}

export async function updateServiceRate(odId: string, id: number, data: Partial<InsertServiceRate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(serviceRates).set(data).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}

export async function deleteServiceRate(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}

// ============ BUSINESS INFO ============

export async function getBusinessInfo(odId: string): Promise<BusinessInfo | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(businessInfo).where(eq(businessInfo.odId, odId));
  return result[0];
}

export async function saveBusinessInfo(data: InsertBusinessInfo): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getBusinessInfo(data.odId);
  if (existing) {
    await getDb().update(businessInfo).set(data).where(eq(businessInfo.odId, data.odId));
  } else {
    await getDb().insert(businessInfo).values(data);
  }
}

// ============ REMINDERS ============

export async function getReminders(odId: string): Promise<Reminder[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(reminders).where(eq(reminders.odId, odId)).orderBy(reminders.dueDate);
}

export async function getReminder(odId: string, id: number): Promise<Reminder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
  return result[0];
}

export async function createReminder(data: InsertReminder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(reminders).values(data);
  return result[0].insertId;
}

export async function updateReminder(odId: string, id: number, data: Partial<InsertReminder>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(reminders).set(data).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}

export async function deleteReminder(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}


// ============ QUOTES (PRESUPUESTOS) ============

export async function getQuotes(odId: string): Promise<Quote[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(quotes).where(eq(quotes.odId, odId)).orderBy(desc(quotes.date));
}

export async function getQuote(odId: string, id: number): Promise<Quote | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(quotes).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
  return result[0];
}

export async function getQuotesByClient(odId: string, clientId: number): Promise<Quote[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(quotes).where(and(eq(quotes.odId, odId), eq(quotes.clientId, clientId))).orderBy(desc(quotes.date));
}

export async function createQuote(data: InsertQuote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(quotes).values(data);
  return result[0].insertId;
}

export async function updateQuote(odId: string, id: number, data: Partial<InsertQuote>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(quotes).set(data).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
}

export async function deleteQuote(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(quotes).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
}

export async function getNextQuoteNumber(odId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await getDb().select().from(quotes).where(eq(quotes.odId, odId)).orderBy(desc(quotes.id)).limit(1);
  return result.length > 0 ? result[0].id + 1 : 1;
}

// ============ QUOTE TEMPLATES ============

export async function getQuoteTemplates(odId: string): Promise<QuoteTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  return getDb().select().from(quoteTemplates).where(eq(quoteTemplates.odId, odId)).orderBy(quoteTemplates.name);
}

export async function getQuoteTemplate(odId: string, id: number): Promise<QuoteTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await getDb().select().from(quoteTemplates).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
  return result[0];
}

export async function createQuoteTemplate(data: InsertQuoteTemplate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getDb().insert(quoteTemplates).values(data);
  return result[0].insertId;
}

export async function updateQuoteTemplate(odId: string, id: number, data: Partial<InsertQuoteTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().update(quoteTemplates).set(data).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
}

export async function deleteQuoteTemplate(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await getDb().delete(quoteTemplates).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
}

// ============ CLERK AUTHENTICATION ============

export async function getUserByClerkId(clerkId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user by clerkId: database not available");
    return undefined;
  }

  const result = await getDb().select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
