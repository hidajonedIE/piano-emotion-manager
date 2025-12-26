import { createClerkClient, verifyToken } from "@clerk/backend";
import type { VercelRequest } from "@vercel/node";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";

// ============================================================================
// Tipos
// ============================================================================

/**
 * Tipo para usuario autenticado desde Clerk
 */
export type ClerkUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
};

/**
 * Tipo para la tabla de usuarios de Drizzle
 */
type UsersTable = MySqlTableWithColumns<{
  name: "users";
  schema: undefined;
  columns: {
    id: unknown;
    openId: unknown;
    email: unknown;
    name: unknown;
    loginMethod: unknown;
    lastSignedIn: unknown;
  };
  dialect: "mysql";
}>;

/**
 * Tipo para la función eq de Drizzle
 */
type EqFunction = (column: unknown, value: unknown) => SQL;

/**
 * Tipo para el usuario de la base de datos
 */
interface DatabaseUser {
  id: string | number;
  email: string;
  name: string;
  openId?: string;
}

// ============================================================================
// Cliente de Clerk
// ============================================================================

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export { clerkClient };

// ============================================================================
// Funciones de autenticación
// ============================================================================

/**
 * Verify the Clerk session token from the request
 */
export async function verifyClerkSession(req: VercelRequest): Promise<ClerkUser | null> {
  try {
    // Get the session token from the Authorization header or cookie
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;

    if (!sessionToken) {
      return null;
    }

    // Verify the token
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("[Clerk] CLERK_SECRET_KEY not configured");
      return null;
    }

    const payload = await verifyToken(sessionToken, {
      secretKey,
    });

    if (!payload || !payload.sub) {
      return null;
    }

    // Get the user details from Clerk
    const user = await clerkClient.users.getUser(payload.sub);

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario",
      imageUrl: user.imageUrl,
    };
  } catch (error) {
    console.error("[Clerk] Error verifying session:", error);
    return null;
  }
}

/**
 * Get or create a user in the database based on Clerk user
 */
export async function getOrCreateUserFromClerk(
  clerkUser: ClerkUser,
  db: MySql2Database<Record<string, never>>,
  usersTable: UsersTable,
  eq: EqFunction
): Promise<DatabaseUser> {
  // Check if user exists in database
  const existingUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.openId, clerkUser.id))
    .limit(1) as DatabaseUser[];

  if (existingUsers.length > 0) {
    // Update last sign in
    await db
      .update(usersTable)
      .set({ lastSignedIn: new Date() })
      .where(eq(usersTable.id, existingUsers[0].id));
    
    return existingUsers[0];
  }

  // Create new user
  const newUser = {
    openId: clerkUser.id,
    email: clerkUser.email,
    name: clerkUser.name,
    loginMethod: "clerk",
    lastSignedIn: new Date(),
  };

  const result = await db.insert(usersTable).values(newUser) as unknown as Array<{ insertId?: number }>;
  const insertedId = result[0]?.insertId;

  if (insertedId) {
    const createdUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, insertedId))
      .limit(1) as DatabaseUser[];
    return createdUsers[0];
  }

  // If insert didn't return ID, fetch by openId
  const createdUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.openId, clerkUser.id))
    .limit(1) as DatabaseUser[];

  return createdUsers[0];
}
