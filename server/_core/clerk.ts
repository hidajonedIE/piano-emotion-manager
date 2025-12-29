import { createClerkClient } from "@clerk/backend";
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
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
}

/**
 * Get session token from request (supports both Bearer token and cookies)
 */
function getSessionToken(req: VercelRequest): string | null {
  // 1. Try Authorization header (used by native apps)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // 2. Try cookies (used by web apps)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    
    // Clerk uses __session cookie for session token in web
    // Try different possible cookie names
    const sessionToken = 
      cookies['__session'] || 
      cookies['__clerk_session'] ||
      cookies['clerk-session'];
    
    if (sessionToken) {
      return sessionToken;
    }
  }

  return null;
}

/**
 * Verify the Clerk session token from the request
 * Supports both Bearer token (native) and cookie-based auth (web)
 */
export async function verifyClerkSession(req: VercelRequest): Promise<ClerkUser | null> {
  try {
    // DEBUG: Log all cookies to identify the correct cookie name
    console.log("[Clerk DEBUG] All cookies:", JSON.stringify(req.cookies || {}));
    console.log("[Clerk DEBUG] Authorization header:", req.headers?.authorization);
    
    // Get the session token from Authorization header or cookies
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      console.log("[Clerk] No session token found in request");
      return null;
    }

    // Verify the token
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("[Clerk] CLERK_SECRET_KEY not configured");
      return null;
    }

    // Use Clerk's authenticateRequest for proper verification
    // Note: CLERK_PUBLISHABLE_KEY is available on the server, NEXT_PUBLIC_* vars are for client only
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("[Clerk] CLERK_PUBLISHABLE_KEY not configured");
      return null;
    }

    // Create a minimal Request object for authenticateRequest
    const url = `https://pianoemotion.com${req.url || ''}`;
    const headers = new Headers();
    
    // Add Authorization header if present
    if (req.headers.authorization) {
      headers.set('Authorization', req.headers.authorization);
    }
    
    // Add Cookie header if present
    if (req.headers.cookie) {
      headers.set('Cookie', req.headers.cookie);
    }
    
    const request = new Request(url, {
      headers,
      method: req.method || 'GET',
    });

    // Use Clerk's authenticateRequest method
    const authResult = await clerkClient.authenticateRequest(request, {
      publishableKey,
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: ['https://pianoemotion.com', 'http://localhost:3000'],
    });

    if (!authResult.isSignedIn || !authResult.toAuth().userId) {
      console.log("[Clerk] User not signed in or no user ID");
      return null;
    }

    const userId = authResult.toAuth().userId;
    if (!userId) {
      console.log("[Clerk] No user ID in auth result");
      return null;
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);

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
