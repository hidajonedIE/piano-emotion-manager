import type { User } from "../../drizzle/schema.js";
import type { IncomingMessage, ServerResponse } from "http";
import { sdk } from "./sdk.js";
import { verifyClerkSession, getOrCreateUserFromClerk } from "./clerk.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "../../shared/const.js";
import { SignJWT } from "jose";

// ============================================================================
// Tipos de Request/Response
// ============================================================================

/**
 * Tipo genérico para request HTTP que funciona con Express, Vercel y otros frameworks
 */
export interface HttpRequest extends IncomingMessage {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: unknown;
}

/**
 * Tipo genérico para response HTTP
 */
export interface HttpResponse extends ServerResponse {
  setHeader(name: string, value: string | number | readonly string[]): this;
}

// ============================================================================
// Contexto de tRPC
// ============================================================================

/**
 * Contexto disponible en todos los procedimientos de tRPC
 */
export type TrpcContext = {
  req: HttpRequest;
  res: HttpResponse;
  user: User | null;
  partnerId: number | null; // Partner ID for multi-tenant filtering
  language: string; // User's preferred language for AI and content generation
};

/**
 * Opciones para crear el contexto
 */
export type CreateContextOptions = {
  req: HttpRequest;
  res: HttpResponse;
  info?: {
    isBatchCall?: boolean;
    calls?: unknown[];
  };
};

/**
 * Crea un JWT compatible con el SDK legacy para que pueda verificar la sesión
 */
async function createSessionJWT(user: User): Promise<string> {
  const secretKey = new TextEncoder().encode(
    process.env.SESSION_SECRET || "default-secret-key-change-in-production"
  );
  
  const now = Math.floor(Date.now() / 1000);
  const expirationSeconds = now + (365 * 24 * 60 * 60); // 1 year
  
  return new SignJWT({
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

  // Try Clerk authentication first (new system)
  try {
    console.log('[Context] Attempting Clerk authentication...');
    const clerkUser = await verifyClerkSession(opts.req);
    
    if (clerkUser) {
      console.log('[Context] Clerk user verified:', { id: clerkUser.id, email: clerkUser.email });
      
      // Get or create user in database
      const db = await getDb();
      if (db) {
        const dbUser = await getOrCreateUserFromClerk(clerkUser, db, users, eq);
        user = dbUser as User;
        const partnerId = user.partnerId || null;
        
        // Create a session JWT compatible with SDK legacy
        try {
          const sessionJWT = await createSessionJWT(user);
          // Set the cookie so SDK legacy can also authenticate
          opts.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionJWT}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
          console.log('[Context] Session JWT cookie set for SDK legacy compatibility');
        } catch (error) {
          console.error('[Context] Failed to create session JWT:', error);
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
          console.log('[Context] Language detection failed (fields may not exist yet), using default:', error);
        }
        
        console.log('[Context] User authenticated successfully via Clerk:', { id: user.id, email: user.email, partnerId, language });
        return { req: opts.req, res: opts.res, user, partnerId, language };
      } else {
        console.error('[Context] Database connection failed');
      }
    } else {
      console.log('[Context] Clerk session verification returned null (user not signed in)');
    }
  } catch (error) {
    console.error('[Context] Clerk authentication error:', error);
    // Clerk authentication failed, continue to legacy auth
  }

  // Fall back to legacy SDK authentication (demo login, etc.)
  try {
    console.log('[Context] Attempting SDK legacy authentication...');
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      console.log('[Context] User authenticated via SDK legacy:', { id: user.id, email: user.email });
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log('[Context] SDK legacy authentication failed:', error);
    user = null;
  }

  // Get partnerId from user if available
  const partnerId = user?.partnerId || null;
  
  // Detect language for legacy auth
  let language = 'es'; // Default fallback
  if (user) {
    try {
      const userLanguage = (user as any).preferredLanguage;
      if (userLanguage) {
        language = userLanguage;
      } else if (partnerId) {
        const db = await getDb();
        if (db) {
          const { partners } = await import('../../drizzle/schema.js');
          const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
          if (partner?.defaultLanguage) {
            language = partner.defaultLanguage;
          }
        }
      }
    } catch (error) {
      console.log('[Context] Language detection failed for legacy auth, using default:', error);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    partnerId,
    language,
  };
}
