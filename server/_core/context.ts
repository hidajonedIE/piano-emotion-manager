import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";
import { verifyClerkSession, getOrCreateUserFromClerk } from "./clerk.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

// Generic request/response types that work with both Express and Vercel
export type TrpcContext = {
  req: any;
  res: any;
  user: User | null;
};

export type CreateContextOptions = {
  req: any;
  res: any;
  info?: any;
};

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
        console.log("[Context] Authenticated via Clerk:", user.email);
        return { req: opts.req, res: opts.res, user };
      }
    }
  } catch (error) {
    console.log("[Context] Clerk auth failed, trying legacy auth:", error);
  }

  // Fall back to legacy SDK authentication (demo login, etc.)
  try {
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      console.log("[Context] Authenticated via legacy SDK:", user.email);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
