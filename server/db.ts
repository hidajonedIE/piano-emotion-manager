import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema.js";
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
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
      });
      _db = drizzle(pool, { casing: 'preserve' });
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

export async function upsertUser(user: Omit<InsertUser, 'id'>): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Build the insert values object, explicitly excluding 'id'
    const insertValues: any = {
      openId: user.openId,
      partnerId: user.partnerId || 1, // Always include partnerId, default to 1
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
    };

    // Add optional fields only if they are defined and not null
    if (user.name !== undefined && user.name !== null) {
      insertValues.name = user.name;
    }
    if (user.email !== undefined && user.email !== null) {
      insertValues.email = user.email;
    }
    if (user.loginMethod !== undefined && user.loginMethod !== null) {
      insertValues.loginMethod = user.loginMethod;
    }
    if (user.role !== undefined) {
      insertValues.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      insertValues.role = 'admin';
    }
    if (user.lastSignedIn !== undefined) {
      insertValues.lastSignedIn = user.lastSignedIn;
    } else {
      insertValues.lastSignedIn = new Date();
    }

    // Build the update set
    const updateSet: any = {
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
    };
    if (user.name !== undefined && user.name !== null) {
      updateSet.name = user.name;
    }
    if (user.email !== undefined && user.email !== null) {
      updateSet.email = user.email;
    }
    if (user.loginMethod !== undefined && user.loginMethod !== null) {
      updateSet.loginMethod = user.loginMethod;
    }
    if (user.role !== undefined) {
      updateSet.role = user.role;
    }
    if (user.lastSignedIn !== undefined) {
      updateSet.lastSignedIn = user.lastSignedIn;
    } else {
      updateSet.lastSignedIn = new Date();
    }

    console.log("[Database] Inserting user with values:", JSON.stringify(insertValues, null, 2));
    console.log("[Database] Update set:", JSON.stringify(updateSet, null, 2));

    await db.insert(users).values(insertValues).onDuplicateKeyUpdate({
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

// Añadir queries de características adicionales según crezca el esquema.

import { and, desc } from "drizzle-orm"
import { eq } from "drizzle-orm";
