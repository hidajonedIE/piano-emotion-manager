import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users } from "../drizzle/schema.js";
import * as schema from "../drizzle/schema.js";
import * as shopSchema from "../drizzle/shop-schema.js";
import * as crmSchema from "../drizzle/crm-schema.js";
import * as distributorSchema from "../drizzle/distributor-schema.js";
import { ENV } from "./_core/env.js";
let _db = null;
// Lazily create the drizzle instance so local tooling can run without a DB.
// This function now ALWAYS returns a valid database connection or throws an error.
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
                connectionLimit: 1000, // Max connections (TiDB serverless supports up to 1000)
                waitForConnections: true, // Queue requests when pool is full
                queueLimit: 0, // Unlimited queue (requests will wait)
                enableKeepAlive: true, // Keep connections alive
                keepAliveInitialDelay: 10000, // 10 seconds
                maxIdle: 50, // Max idle connections
                idleTimeout: 60000, // 60 seconds idle timeout
                connectTimeout: 10000, // 10 seconds connect timeout
            });
            _db = drizzle(pool, {
                schema: { ...schema, ...shopSchema, ...crmSchema, ...distributorSchema },
                mode: "default"
            });
            console.log("[Database] ✓ Connection pool created successfully");
        }
        catch (error) {
            console.error("[Database] ❌ Failed to connect:", error instanceof Error ? error.message : error);
            if (error instanceof Error && error.stack) {
                console.error("[Database] Stack:", error.stack);
            }
            throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    else if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL not configured. Cannot connect to database.");
    }
    // At this point, _db must be defined (or we would have thrown)
    if (!_db) {
        throw new Error("Database connection is not available");
    }
    return _db;
}
export async function upsertUser(user) {
    if (!user.openId) {
        throw new Error("User openId is required for upsert");
    }
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }
    try {
        const values = {
            openId: user.openId,
        };
        const updateSet = {};
        const textFields = ["name", "email", "loginMethod"];
        const assignNullable = (field) => {
            const value = user[field];
            if (value === undefined)
                return;
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
        }
        else if (user.openId === ENV.ownerOpenId) {
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
        (await getDb()).insert(users).values(values).onDuplicateKeyUpdate({
            set: updateSet,
        });
    }
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
export async function getUserByOpenId(openId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = (await getDb()).select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
// Añadir queries de características adicionales según crezca el esquema.
import { and, desc } from "drizzle-orm";
import { clients, pianos, services, inventory, appointments, invoices, serviceRates, businessInfo, reminders, quotes, quoteTemplates, } from "../drizzle/schema.js";
// ============ CLIENTS ============
export async function getClients(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(clients).where(eq(clients.odId, odId)).orderBy(desc(clients.updatedAt));
}
export async function getClient(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
    return result[0];
}
export async function createClient(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(clients).values(data);
    return result[0].insertId;
}
export async function updateClient(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(clients).set(data).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}
export async function deleteClient(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(clients).where(and(eq(clients.odId, odId), eq(clients.id, id)));
}
// ============ PIANOS ============
export async function getPianos(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(pianos).where(eq(pianos.odId, odId)).orderBy(desc(pianos.updatedAt));
}
export async function getPiano(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
    return result[0];
}
export async function getPianosByClient(odId, clientId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(pianos).where(and(eq(pianos.odId, odId), eq(pianos.clientId, clientId)));
}
export async function createPiano(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(pianos).values(data);
    return result[0].insertId;
}
export async function updatePiano(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(pianos).set(data).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}
export async function deletePiano(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(pianos).where(and(eq(pianos.odId, odId), eq(pianos.id, id)));
}
// ============ SERVICES ============
export async function getServices(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(services).where(eq(services.odId, odId)).orderBy(desc(services.date));
}
export async function getService(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(services).where(and(eq(services.odId, odId), eq(services.id, id)));
    return result[0];
}
export async function getServicesByPiano(odId, pianoId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(services).where(and(eq(services.odId, odId), eq(services.pianoId, pianoId))).orderBy(desc(services.date));
}
export async function createService(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(services).values(data);
    return result[0].insertId;
}
export async function updateService(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(services).set(data).where(and(eq(services.odId, odId), eq(services.id, id)));
}
export async function deleteService(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(services).where(and(eq(services.odId, odId), eq(services.id, id)));
}
// ============ INVENTORY ============
export async function getInventory(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(inventory).where(eq(inventory.odId, odId)).orderBy(inventory.name);
}
export async function getInventoryItem(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
    return result[0];
}
export async function createInventoryItem(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(inventory).values(data);
    return result[0].insertId;
}
export async function updateInventoryItem(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(inventory).set(data).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}
export async function deleteInventoryItem(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(inventory).where(and(eq(inventory.odId, odId), eq(inventory.id, id)));
}
// ============ APPOINTMENTS ============
export async function getAppointments(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(appointments).where(eq(appointments.odId, odId)).orderBy(appointments.date);
}
export async function getAppointment(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
    return result[0];
}
export async function createAppointment(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(appointments).values(data);
    return result[0].insertId;
}
export async function updateAppointment(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(appointments).set(data).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}
export async function deleteAppointment(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(appointments).where(and(eq(appointments.odId, odId), eq(appointments.id, id)));
}
// ============ INVOICES ============
export async function getInvoices(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(invoices).where(eq(invoices.odId, odId)).orderBy(desc(invoices.date));
}
export async function getInvoice(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
    return result[0];
}
export async function createInvoice(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(invoices).values(data);
    return result[0].insertId;
}
export async function updateInvoice(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(invoices).set(data).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}
export async function deleteInvoice(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(invoices).where(and(eq(invoices.odId, odId), eq(invoices.id, id)));
}
// ============ SERVICE RATES ============
export async function getServiceRates(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(serviceRates).where(eq(serviceRates.odId, odId)).orderBy(serviceRates.category, serviceRates.name);
}
export async function getServiceRate(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
    return result[0];
}
export async function createServiceRate(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(serviceRates).values(data);
    return result[0].insertId;
}
export async function updateServiceRate(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(serviceRates).set(data).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}
export async function deleteServiceRate(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(serviceRates).where(and(eq(serviceRates.odId, odId), eq(serviceRates.id, id)));
}
// ============ BUSINESS INFO ============
export async function getBusinessInfo(odId) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(businessInfo).where(eq(businessInfo.odId, odId));
    return result[0];
}
export async function saveBusinessInfo(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const existing = await getBusinessInfo(data.odId);
    if (existing) {
        (await getDb()).update(businessInfo).set(data).where(eq(businessInfo.odId, data.odId));
    }
    else {
        (await getDb()).insert(businessInfo).values(data);
    }
}
// ============ REMINDERS ============
export async function getReminders(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(reminders).where(eq(reminders.odId, odId)).orderBy(reminders.dueDate);
}
export async function getReminder(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
    return result[0];
}
export async function createReminder(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(reminders).values(data);
    return result[0].insertId;
}
export async function updateReminder(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(reminders).set(data).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}
export async function deleteReminder(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(reminders).where(and(eq(reminders.odId, odId), eq(reminders.id, id)));
}
// ============ QUOTES (PRESUPUESTOS) ============
export async function getQuotes(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(quotes).where(eq(quotes.odId, odId)).orderBy(desc(quotes.date));
}
export async function getQuote(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(quotes).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
    return result[0];
}
export async function getQuotesByClient(odId, clientId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(quotes).where(and(eq(quotes.odId, odId), eq(quotes.clientId, clientId))).orderBy(desc(quotes.date));
}
export async function createQuote(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(quotes).values(data);
    return result[0].insertId;
}
export async function updateQuote(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(quotes).set(data).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
}
export async function deleteQuote(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(quotes).where(and(eq(quotes.odId, odId), eq(quotes.id, id)));
}
export async function getNextQuoteNumber(odId) {
    const db = await getDb();
    if (!db)
        return 1;
    const result = (await getDb()).select().from(quotes).where(eq(quotes.odId, odId)).orderBy(desc(quotes.id)).limit(1);
    return result.length > 0 ? result[0].id + 1 : 1;
}
// ============ QUOTE TEMPLATES ============
export async function getQuoteTemplates(odId) {
    const db = await getDb();
    if (!db)
        return [];
    return getDb().select().from(quoteTemplates).where(eq(quoteTemplates.odId, odId)).orderBy(quoteTemplates.name);
}
export async function getQuoteTemplate(odId, id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = (await getDb()).select().from(quoteTemplates).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
    return result[0];
}
export async function createQuoteTemplate(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = (await getDb()).insert(quoteTemplates).values(data);
    return result[0].insertId;
}
export async function updateQuoteTemplate(odId, id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).update(quoteTemplates).set(data).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
}
export async function deleteQuoteTemplate(odId, id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    (await getDb()).delete(quoteTemplates).where(and(eq(quoteTemplates.odId, odId), eq(quoteTemplates.id, id)));
}
// ============ CLERK AUTHENTICATION ============
export async function getUserByClerkId(clerkId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user by clerkId: database not available");
        return undefined;
    }
    const result = (await getDb()).select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
