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
    clerkId: unknown;
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
  clerkId?: string;
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
  cookieHeader.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join("="));
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
    // Try different possible cookie names (including with suffixes like __session_A82HkYdo)
    let sessionToken: string | undefined;
    
    // First try exact matches
    sessionToken = cookies["__session"] || 
                   cookies["__clerk_session"] ||
                   cookies["clerk-session"];
    
    // If not found, try to find any cookie starting with __session
    if (!sessionToken) {
      const sessionCookieName = Object.keys(cookies).find(name => name.startsWith("__session"));
      if (sessionCookieName) {
        sessionToken = cookies[sessionCookieName];
      }
    }
    
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
    console.log("[DEBUG] [Clerk] ========== VERIFICACIÓN DE SESIÓN INICIADA ==========");
    console.log("[DEBUG] [Clerk] URL:", req.url);
    console.log("[DEBUG] [Clerk] Método:", req.method);
    
    // DEBUG: Log all cookies to identify the correct cookie name
    console.log("[DEBUG] [Clerk] Cookies recibidos:", JSON.stringify(req.cookies || {}));
    console.log("[DEBUG] [Clerk] Header Cookie:", req.headers?.cookie ? req.headers.cookie.substring(0, 100) + '...' : 'NO PRESENTE');
    console.log("[DEBUG] [Clerk] Authorization header:", req.headers?.authorization ? 'PRESENTE' : 'NO PRESENTE');
    
    // Get the session token from Authorization header or cookies
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      console.log("[DEBUG] [Clerk] ❌ NO SE ENCONTRÓ TOKEN DE SESIÓN");
      console.log("[DEBUG] [Clerk] Cookies disponibles:", Object.keys(req.cookies || {}));
      return null;
    }
    
    console.log("[DEBUG] [Clerk] ✓ Token de sesión encontrado (primeros 50 caracteres):", sessionToken.substring(0, 50));

    // Verify the token
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("[DEBUG] [Clerk] ❌ CLERK_SECRET_KEY NO CONFIGURADA");
      return null;
    }
    console.log("[DEBUG] [Clerk] ✓ CLERK_SECRET_KEY está configurada");

    // Use Clerk's authenticateRequest for proper verification
    // Note: CLERK_PUBLISHABLE_KEY is available on the server, NEXT_PUBLIC_* vars are for client only
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("[DEBUG] [Clerk] ❌ CLERK_PUBLISHABLE_KEY NO CONFIGURADA");
      return null;
    }
    console.log("[DEBUG] [Clerk] ✓ CLERK_PUBLISHABLE_KEY está configurada");

    // Create a minimal Request object for authenticateRequest
    const url = `https://pianoemotion.com${req.url || ""}`;
    const headers = new Headers();
    
    // Add Authorization header if present
    if (req.headers.authorization) {
      headers.set("Authorization", req.headers.authorization);
    }
    
    // Add Cookie header if present
    if (req.headers.cookie) {
      headers.set("Cookie", req.headers.cookie);
    }
    
    const request = new Request(url, {
      headers,
      method: req.method || "GET",
    });

    // Use Clerk's authenticateRequest method
    console.log("[DEBUG] [Clerk] Intentando verificar con authenticateRequest...");
    let authResult;
    try {
      authResult = await clerkClient.authenticateRequest(request, {
        publishableKey,
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: [
          "https://pianoemotion.com",
          "https://clerk.pianoemotion.com",
          "https://accounts.pianoemotion.com",
          "https://piano-emotion-manager.vercel.app",
          "http://localhost:3000"
        ],
      });
      console.log("[DEBUG] [Clerk] ✓ authenticateRequest completado sin errores");
    } catch (authError) {
      console.error("[DEBUG] [Clerk] ❌ Error en authenticateRequest:", authError);
      throw authError;
    }

    console.log("[DEBUG] [Clerk] isSignedIn:", authResult.isSignedIn);
    console.log("[DEBUG] [Clerk] userId:", authResult.toAuth().userId);
    
    if (!authResult.isSignedIn || !authResult.toAuth().userId) {
      console.log("[DEBUG] [Clerk] ❌ Usuario no autenticado o sin ID");
      return null;
    }
    
    console.log("[DEBUG] [Clerk] ✓ Usuario autenticado");

    const userId = authResult.toAuth().userId;
    if (!userId) {
      console.log("[DEBUG] [Clerk] ❌ No hay ID de usuario en el resultado");
      return null;
    }
    
    console.log("[DEBUG] [Clerk] ✓ ID de usuario obtenido:", userId);

    // Get user details from Clerk
    console.log("[DEBUG] [Clerk] Obteniendo detalles del usuario desde Clerk...");
    const user = await clerkClient.users.getUser(userId);
    
    console.log("[DEBUG] [Clerk] ✓ Usuario obtenido:", {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim()
    });

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario",
      imageUrl: user.imageUrl,
    };
  } catch (error) {
    console.error("[DEBUG] [Clerk] ❌ ERROR VERIFICANDO SESIÓN:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("[DEBUG] [Clerk] Stack trace:", error.stack);
    }
    return null;
  }
  finally {
    console.log("[DEBUG] [Clerk] ========== VERIFICACIÓN DE SESIÓN FINALIZADA ==========");
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
  // 1. Find user by openId (primary) - database uses openId, not clerkId
  let existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.openId, clerkUser.id))
    .limit(1) as DatabaseUser[];

  if (existingUser.length > 0) {
    // Update last sign in and return
    await db
      .update(usersTable)
      .set({ lastSignedIn: new Date() })
      .where(eq(usersTable.id, existingUser[0].id));
    return existingUser[0];
  }

  // 2. Find user by email (fallback for migration)
  existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, clerkUser.email))
    .limit(1) as DatabaseUser[];

  if (existingUser.length > 0) {
    // User exists, but openId might be missing. Update it.
    await db
      .update(usersTable)
      .set({ openId: clerkUser.id, lastSignedIn: new Date() })
      .where(eq(usersTable.id, existingUser[0].id));
    return { ...existingUser[0], openId: clerkUser.id };
  }

  // 3. Create new user
  const newUser = {
    openId: clerkUser.id, // Database uses openId, not clerkId
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
