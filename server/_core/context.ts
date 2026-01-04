import type { User } from "../../drizzle/schema";
import type { IncomingMessage, ServerResponse } from "http";
import { sdk } from "./sdk";
import { verifyClerkSession, getOrCreateUserFromClerk } from "./clerk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
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
    const clerkUser = await verifyClerkSession(opts.req);
    if (clerkUser) {
      // Get or create user in database
      const db = await getDb();
      if (db) {
        const dbUser = await getOrCreateUserFromClerk(clerkUser, db, users, eq);
        user = dbUser as User;
        return { req: opts.req, res: opts.res, user };
      }
    }
  } catch {
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
