import { createClerkClient } from "@clerk/backend";
import { jwtVerify } from "jose";
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
 * Get Clerk public key for JWT verification
 */
async function getClerkPublicKey(): Promise<string> {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("CLERK_PUBLISHABLE_KEY not configured");
  }
  
  // Extract the public key from the publishable key
  // Clerk's publishable key format: pk_test_... or pk_live_...
  // We need to fetch the actual public key from Clerk's JWKS endpoint
  // For now, we'll use the clerkClient to get the public key
  
  return publishableKey;
}

/**
 * Verify the Clerk session token from the request
 * Supports both Bearer token (native) and cookie-based auth (web)
 */
export async function verifyClerkSession(req: VercelRequest): Promise<ClerkUser | null> {
  try {
    console.log("[DEBUG] [Clerk] ========== VERIFICACION DE SESION INICIADA ==========");
    console.log("[DEBUG] [Clerk] URL:", req.url);
    console.log("[DEBUG] [Clerk] Metodo:", req.method);
    
    // DEBUG: Log all cookies to identify the correct cookie name
    console.log("[DEBUG] [Clerk] Cookies recibidos:", JSON.stringify(req.cookies || {}));
    console.log("[DEBUG] [Clerk] Header Cookie:", req.headers?.cookie ? req.headers.cookie.substring(0, 100) + '...' : 'NO PRESENTE');
    console.log("[DEBUG] [Clerk] Authorization header:", req.headers?.authorization ? 'PRESENTE' : 'NO PRESENTE');
    
    // Get the session token from Authorization header or cookies
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      console.log("[DEBUG] [Clerk] NO SE ENCONTRO TOKEN DE SESION");
      console.log("[DEBUG] [Clerk] Cookies disponibles:", Object.keys(req.cookies || {}));
      return null;
    }
    
    console.log("[DEBUG] [Clerk] Token de sesion encontrado (primeros 50 caracteres):", sessionToken.substring(0, 50));

    // Verify the token
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error("[DEBUG] [Clerk] CLERK_SECRET_KEY NO CONFIGURADA");
      return null;
    }
    console.log("[DEBUG] [Clerk] CLERK_SECRET_KEY esta configurada");

    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("[DEBUG] [Clerk] CLERK_PUBLISHABLE_KEY NO CONFIGURADA");
      return null;
    }
    console.log("[DEBUG] [Clerk] CLERK_PUBLISHABLE_KEY esta configurada");

    console.log("[DEBUG] [Clerk] Intentando verificar token usando clerkClient.authenticateRequest...");
    
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

    let userId: string | null = null;

    try {
      // Try using authenticateRequest with minimal options to avoid JOSE issues
      const authResult = await clerkClient.authenticateRequest(request, {
        publishableKey,
        secretKey: secretKey,
      });
      
      console.log("[DEBUG] [Clerk] authenticateRequest completado");
      console.log("[DEBUG] [Clerk] isSignedIn:", authResult.isSignedIn);
      
      if (authResult.isSignedIn) {
        userId = authResult.toAuth().userId;
        console.log("[DEBUG] [Clerk] Usuario autenticado, ID:", userId);
      } else {
        console.log("[DEBUG] [Clerk] Usuario no autenticado");
      }
    } catch (authError) {
      console.error("[DEBUG] [Clerk] Error en authenticateRequest:", authError instanceof Error ? authError.message : authError);
      
      // If authenticateRequest fails, try to use the Clerk SDK to verify the token
      console.log("[DEBUG] [Clerk] Intentando verificar token usando Clerk SDK...");
      try {
        // Try to get the user from Clerk using the token
        // This is a fallback approach
        const decoded = JSON.parse(Buffer.from(sessionToken.split('.')[1], 'base64').toString());
        console.log("[DEBUG] [Clerk] Token decodificado (sin verificar):", { sub: decoded.sub, email: decoded.email });
        
        if (decoded.sub) {
          userId = decoded.sub;
          console.log("[DEBUG] [Clerk] ID extraido del token:", userId);
        }
      } catch (decodeError) {
        console.error("[DEBUG] [Clerk] Error decodificando token:", decodeError instanceof Error ? decodeError.message : decodeError);
        throw authError; // Throw the original error
      }
    }

    if (!userId) {
      console.log("[DEBUG] [Clerk] No se pudo obtener el ID de usuario");
      return null;
    }

    // Get user details from Clerk
    console.log("[DEBUG] [Clerk] Obteniendo detalles del usuario desde Clerk...");
    const user = await clerkClient.users.getUser(userId);
    
    console.log("[DEBUG] [Clerk] Usuario obtenido:", {
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
    console.error("[DEBUG] [Clerk] ERROR VERIFICANDO SESION:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("[DEBUG] [Clerk] Stack trace:", error.stack);
    }
    return null;
  }
  finally {
    console.log("[DEBUG] [Clerk] ========== VERIFICACION DE SESION FINALIZADA ==========");
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
  console.log("[DEBUG] [getOrCreateUserFromClerk] Iniciando busqueda de usuario", { clerkUserId: clerkUser.id, email: clerkUser.email });
  
  // 1. Find user by openId (primary) - database uses openId, not clerkId
  console.log("[DEBUG] [getOrCreateUserFromClerk] Buscando usuario por openId:", clerkUser.id);
  let existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.openId, clerkUser.id))
    .limit(1) as DatabaseUser[];

  console.log("[DEBUG] [getOrCreateUserFromClerk] Resultado de busqueda por openId:", { found: existingUser.length > 0, user: existingUser[0] });

  if (existingUser.length > 0) {
    // Update last sign in and return
    console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario encontrado, actualizando lastSignedIn");
    await db
      .update(usersTable)
      .set({ lastSignedIn: new Date() })
      .where(eq(usersTable.id, existingUser[0].id));
    console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario actualizado y devuelto");
    return existingUser[0];
  }

  // 2. Find user by email (fallback for migration)
  console.log("[DEBUG] [getOrCreateUserFromClerk] Buscando usuario por email:", clerkUser.email);
  existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, clerkUser.email))
    .limit(1) as DatabaseUser[];

  console.log("[DEBUG] [getOrCreateUserFromClerk] Resultado de busqueda por email:", { found: existingUser.length > 0, user: existingUser[0] });

  if (existingUser.length > 0) {
    // User exists, but openId might be missing. Update it.
    console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario encontrado por email, actualizando openId");
    await db
      .update(usersTable)
      .set({ openId: clerkUser.id, lastSignedIn: new Date() })
      .where(eq(usersTable.id, existingUser[0].id));
    console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario actualizado con openId");
    return { ...existingUser[0], openId: clerkUser.id };
  }

  // 3. Create new user
  console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario no encontrado, creando nuevo usuario");
  const newUser = {
    openId: clerkUser.id, // Database uses openId, not clerkId
    email: clerkUser.email,
    name: clerkUser.name,
    loginMethod: "clerk",
    lastSignedIn: new Date(),
  };

  console.log("[DEBUG] [getOrCreateUserFromClerk] Insertando nuevo usuario:", newUser);
  const result = await db.insert(usersTable).values(newUser) as unknown as Array<{ insertId?: number }>;
  const insertedId = result[0]?.insertId;

  console.log("[DEBUG] [getOrCreateUserFromClerk] Resultado de insercion:", { insertedId, result });

  if (insertedId) {
    console.log("[DEBUG] [getOrCreateUserFromClerk] Recuperando usuario insertado por ID:", insertedId);
    const createdUsers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, insertedId))
      .limit(1) as DatabaseUser[];
    console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario recuperado:", createdUsers[0]);
    return createdUsers[0];
  }

  // If insert didn't return ID, fetch by openId
  console.log("[DEBUG] [getOrCreateUserFromClerk] No insertedId, buscando por openId:", clerkUser.id);
  const createdUsers = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.openId, clerkUser.id))
    .limit(1) as DatabaseUser[];

  console.log("[DEBUG] [getOrCreateUserFromClerk] Usuario creado:", createdUsers[0]);
  return createdUsers[0];
}
