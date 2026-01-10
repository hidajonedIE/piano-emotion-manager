import type { HttpRequest, HttpResponse } from "@vercel/node";
import type { User } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { verifyClerkSession, getOrCreateUserFromClerk } from "./clerk.js";
import { getDb } from "../../server/db.js";
import { users } from "../../drizzle/schema.js";
import * as jose from "jose";

const COOKIE_NAME = "session";

/**
 * Contexto disponible en todos los procedimientos de tRPC
 */
export type TrpcContext = {
  req: HttpRequest;
  res: HttpResponse;
  user: User | null;
  partnerId: number | null; // Partner ID for multi-tenant filtering
  language: string; // User's preferred language for AI and content generation
  debugLog?: {
    point1?: string;
    point2?: string;
    point3?: string;
    point4?: string;
    point5?: string;
    point6?: string;
    point7?: string;
    point8?: string;
    point9?: string;
    point10?: string;
    point11?: string;
    point12?: string;
    point13?: string;
  };
};

/**
 * Opciones para crear el contexto
 */
export type CreateContextOptions = {
  req: HttpRequest;
  res: HttpResponse;
};

/**
 * Crea un JWT de sesión compatible con el SDK legacy
 */
async function createSessionJWT(user: User): Promise<string> {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  const expirationSeconds = 60 * 60 * 24 * 365; // 1 year

  // Para HS256, usamos importSecret en lugar de importSPKI
  const secretKey = await jose.importSecret(secret, "HS256");

  return await new jose.SignJWT({
    sub: String(user.id),
    email: user.email,
    openId: user.openId || user.clerkId || String(user.id),
    appId: process.env.NEXT_PUBLIC_APP_ID || "piano-emotion-manager",
    name: user.name || user.email || "User",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Crea el contexto de tRPC para cada request
 * Intenta autenticar primero con Clerk, luego con el SDK legacy
 */
export async function createContext(opts: CreateContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  let debugLog: Record<string, string> = {};

  // Try Clerk authentication first (new system)
  try {
    console.log("[DEBUG] [Context] Attempting Clerk authentication...");
    const clerkResult = await verifyClerkSession(opts.req);
    
    if (clerkResult) {
      const { user: clerkUser, debugLog: clerkDebugLog } = clerkResult;
      debugLog = { ...debugLog, ...clerkDebugLog };
      console.log("[DEBUG] [Context] Clerk user verified:", { id: clerkUser.id, email: clerkUser.email });
      
      // Get or create user in database
      console.log("[DEBUG] [Context] Getting database connection...");
      const db = await getDb();
      if (db) {
        console.log("[DEBUG] [Context] Database connected, calling getOrCreateUserFromClerk...");
        console.log("[DEBUG] [Context] clerkUser:", clerkUser);
        const dbResult = await getOrCreateUserFromClerk(clerkUser, db, users, eq, debugLog);
        const { user: dbUser, debugLog: dbDebugLog } = dbResult;
        debugLog = { ...debugLog, ...dbDebugLog };
        console.log("[DEBUG] [Context] getOrCreateUserFromClerk returned:", dbUser);
        console.log("[DEBUG] [Context] debugLog:", JSON.stringify(debugLog));
        user = dbUser as User;
        const partnerId = user.partnerId || null;
        console.log("[DEBUG] [Context] User set with partnerId:", partnerId);
        
        // Create a session JWT compatible with SDK legacy
        try {
          const sessionJWT = await createSessionJWT(user);
          // Set the cookie so SDK legacy can also authenticate
          opts.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionJWT}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
          console.log("[DEBUG] [Context] Session JWT cookie set for SDK legacy compatibility");
        } catch (error) {
          console.error("[DEBUG] [Context] Failed to create session JWT:", error);
        }
        
        // Detect language: user preference > partner default > browser > default
        let language = 'es'; // Default fallback
        try {
          // Try to get user's preferred language
          const userLanguage = (user as any).preferredLanguage;
          if (userLanguage) {
            language = userLanguage;
          } else if (partnerId) {
            // Try to get partner's default language
            const { partners } = await import('../../drizzle/schema.js');
            const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
            if (partner?.defaultLanguage) {
              language = partner.defaultLanguage;
            }
          }
        } catch (error) {
          // Fields might not exist yet if migration hasn't run
          console.log("[DEBUG] [Context] Language detection failed (fields may not exist yet), using default:", error);
        }
        
        console.log("[DEBUG] [Context] User authenticated successfully via Clerk:", { id: user.id, email: user.email, partnerId, language });
        return { req: opts.req, res: opts.res, user, partnerId, language, debugLog };
      } else {
        console.error("[DEBUG] [Context] Database connection failed");
      }
    } else {
      console.log("[DEBUG] [Context] Clerk session verification returned null (user not signed in)");
    }
  } catch (error) {
    console.error("[DEBUG] [Context] Error during Clerk authentication:", error);
  }

  // If no user authenticated, return unauthenticated context
  console.log("[DEBUG] [Context] No user authenticated, returning unauthenticated context");
  return { req: opts.req, res: opts.res, user: null, partnerId: null, language: 'es', debugLog };
}
