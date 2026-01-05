import type { User } from "../../drizzle/schema.js";
import type { IncomingMessage, ServerResponse } from "http";
import { sdk } from "./sdk.js";
import { verifyClerkSession, getOrCreateUserFromClerk } from "./clerk.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

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
        console.log('[Context] User authenticated successfully via Clerk:', { id: user.id, email: user.email });
        return { req: opts.req, res: opts.res, user };
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
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
