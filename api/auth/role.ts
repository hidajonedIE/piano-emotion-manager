import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME } from "../../shared/const.js";
import { sdk } from "../../server/_core/sdk.js";
import { verifyClerkSession, getOrCreateUserFromClerk } from "../../server/_core/clerk.js";
import { getDb } from "../../server/db.js";
import { users } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * API endpoint to get the current user's role
 * Returns: { role: 'user' | 'admin', isAdmin: boolean }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    let userId: string | null = null;

    // Try Clerk authentication first (new system)
    try {
      const clerkUser = await verifyClerkSession(req);
      if (clerkUser) {
        const dbUser = await getOrCreateUserFromClerk(clerkUser, db, users, eq);
        userId = (dbUser as any).openId || clerkUser.id;
      }
    } catch (clerkError) {
      console.error("[Auth] Clerk authentication failed:", clerkError);
      // Continue to try legacy authentication
    }

    // If Clerk failed, try legacy SDK authentication
    if (!userId) {
      try {
        const cookieToken = req.cookies?.[COOKIE_NAME];
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ") 
          ? authHeader.slice("Bearer ".length).trim() 
          : null;

        const token = cookieToken || bearerToken;

        if (token) {
          // Authenticate using the token
          const user = await sdk.authenticateRequest({
            headers: { 
              cookie: `${COOKIE_NAME}=${token}`,
              authorization: bearerToken ? `Bearer ${bearerToken}` : undefined,
            },
          } as any);

          userId = user?.openId;
        }
      } catch (sdkError) {
        console.error("[Auth] SDK authentication also failed:", sdkError);
        // Both authentication methods failed
      }
    }

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Query the database to get the user's role
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.openId, userId))
      .limit(1);

    if (!userRecord) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const role = userRecord.role;
    const isAdmin = role === 'admin';
    const isOwner = role === 'owner';

    return res.json({ 
      role,
      isAdmin,
      isOwner
    });
  } catch (error) {
    console.error("[Auth] /api/auth/role failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
