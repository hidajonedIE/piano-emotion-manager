import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import { and, desc } from "drizzle-orm";
import {
  clients, Client, InsertClient,
  pianos, Piano, InsertPiano,
  services, Service, InsertService,
  inventory, InventoryItem, InsertInventoryItem,
  appointments, Appointment, InsertAppointment,
  invoices, Invoice, InsertInvoice,
  serviceRates, ServiceRate, InsertServiceRate,
  businessInfo, BusinessInfo, InsertBusinessInfo,
  reminders, Reminder, InsertReminder,
} from "../drizzle/schema.js";

// ============ CLIENTS ============

export async function getClients(odId: string): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.odId, odId)).orderBy(desc(clients.updatedAt));
}

export async function getClient(odId: string, id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
  return result[0];
}

export async function createClient(data: InsertClient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
}

export async function updateClient(odId: string, id: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}

export async function deleteClient(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}

// ============ PIANOS ============

export async function getPianos(odId: string): Promise<Piano[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pianos).where(eq(pianos.odId, odId)).orderBy(desc(pianos.updatedAt));
}

export async function getPiano(odId: string, id: number): Promise<Piano | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
  return result[0];
}

export async function getPianosByClient(odId: string, clientId: number): Promise<Piano[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.clientId, clientId)));
}

export async function createPiano(data: InsertPiano): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pianos).values(data);
  return result[0].insertId;
}

export async function updatePiano(odId: string, id: number, data: Partial<InsertPiano>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pianos).set(data).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}

export async function deletePiano(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}

// ============ SERVICES ============

export async function getServices(odId: string): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(eq(services.odId, odId)).orderBy(desc(services.date));
}

export async function getService(odId: string, id: number): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(and(eq(services.odId, odId), eq(services.id, id)));
  return result[0];
}

export async function getServicesByPiano(odId: string, pianoId: number): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(and(eq(services.odId, odId), eq(services.pianoId, pianoId))).orderBy(desc(services.date));
}

export async function createService(data: InsertService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(services).values(data);
  return result[0].insertId;
}

export async function updateService(odId: string, id: number, data: Partial<InsertService>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(services).set(data).where(and(eq(services.odId, odId), eq(services.id, id)));
}

export async function deleteService(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(services).where(and(eq(services.odId, odId), eq(services.id, id)));
}

// ============ INVENTORY ============

export async function getInventory(odId: string): Promise<InventoryItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventory).where(eq(inventory.odId, odId)).orderBy(inventory.name);
}

export async function getInventoryItem(odId: string, id: number): Promise<InventoryItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
  return result[0];
}

export async function createInventoryItem(data: InsertInventoryItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventory).values(data);
  return result[0].insertId;
}

export async function updateInventoryItem(odId: string, id: number, data: Partial<InsertInventoryItem>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventory).set(data).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}

export async function deleteInventoryItem(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}

// ============ APPOINTMENTS ============

export async function getAppointments(odId: string): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appointments).where(eq(appointments.odId, odId)).orderBy(appointments.date);
}

export async function getAppointment(odId: string, id: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
  return result[0];
}

export async function createAppointment(data: InsertAppointment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return result[0].insertId;
}

export async function updateAppointment(odId: string, id: number, data: Partial<InsertAppointment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appointments).set(data).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}

export async function deleteAppointment(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}

// ============ INVOICES ============

export async function getInvoices(odId: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invoices).where(eq(invoices.odId, odId)).orderBy(desc(invoices.date));
}

export async function getInvoice(odId: string, id: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
  return result[0];
}

export async function createInvoice(data: InsertInvoice): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(data);
  return result[0].insertId;
}

export async function updateInvoice(odId: string, id: number, data: Partial<InsertInvoice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invoices).set(data).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}

export async function deleteInvoice(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}

// ============ SERVICE RATES ============

export async function getServiceRates(odId: string): Promise<ServiceRate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceRates).where(eq(serviceRates.odId, odId)).orderBy(serviceRates.category, serviceRates.name);
}

export async function getServiceRate(odId: string, id: number): Promise<ServiceRate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
  return result[0];
}

export async function createServiceRate(data: InsertServiceRate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(serviceRates).values(data);
  return result[0].insertId;
}

export async function updateServiceRate(odId: string, id: number, data: Partial<InsertServiceRate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceRates).set(data).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}

export async function deleteServiceRate(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}

// ============ BUSINESS INFO ============

export async function getBusinessInfo(odId: string): Promise<BusinessInfo | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessInfo).where(eq(businessInfo.odId, odId));
  return result[0];
}

export async function saveBusinessInfo(data: InsertBusinessInfo): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getBusinessInfo(data.odId);
  if (existing) {
    await db.update(businessInfo).set(data).where(eq(businessInfo.odId, data.odId));
  } else {
    await db.insert(businessInfo).values(data);
  }
}

// ============ REMINDERS ============

export async function getReminders(odId: string): Promise<Reminder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.odId, odId)).orderBy(reminders.dueDate);
}

export async function getReminder(odId: string, id: number): Promise<Reminder | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
  return result[0];
}

export async function createReminder(data: InsertReminder): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminders).values(data);
  return result[0].insertId;
}

export async function updateReminder(odId: string, id: number, data: Partial<InsertReminder>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminders).set(data).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}

export async function deleteReminder(odId: string, id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}
