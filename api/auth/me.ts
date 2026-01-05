import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME } from "../../shared/const.js";
import { sdk } from "../../server/_core/sdk.js";
import { verifyClerkSession, getOrCreateUserFromClerk } from "../../server/_core/clerk.js";
import { getDb } from "../../server/db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Try Clerk authentication first (new system)
    const clerkUser = await verifyClerkSession(req);
    if (clerkUser) {
      const db = await getDb();
      if (db) {
        const dbUser = await getOrCreateUserFromClerk(clerkUser, db, users, eq);
        return res.json({
          user: {
            id: (dbUser as any).id,
            openId: (dbUser as any).openId || clerkUser.id,
            name: dbUser.name,
            email: dbUser.email,
            loginMethod: "clerk",
            lastSignedIn: ((dbUser as any).lastSignedIn ?? new Date()).toISOString(),
            subscriptionPlan: (dbUser as any).subscriptionPlan ?? 'free',
            subscriptionStatus: (dbUser as any).subscriptionStatus ?? 'none',
          }
        });
      }
    }

    // Fall back to legacy SDK authentication
    // Try to get token from cookie first, then from Authorization header
    const cookieToken = req.cookies?.[COOKIE_NAME];
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ") 
      ? authHeader.slice("Bearer ".length).trim() 
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated", user: null });
    }

    // Authenticate using the token
    const user = await sdk.authenticateRequest({
      headers: { 
        cookie: `${COOKIE_NAME}=${token}`,
        authorization: bearerToken ? `Bearer ${bearerToken}` : undefined,
      },
    } as any);

    return res.json({ 
      user: {
        id: (user as any)?.id ?? null,
        openId: user?.openId ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
        loginMethod: user?.loginMethod ?? null,
        lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
        subscriptionPlan: (user as any)?.subscriptionPlan ?? 'free',
        subscriptionStatus: (user as any)?.subscriptionStatus ?? 'none',
      }
    });
  } catch (error) {
    console.error("[Auth] /api/auth/me failed:", error);
    return res.status(401).json({ error: "Not authenticated", user: null });
  }
}
