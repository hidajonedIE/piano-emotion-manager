import { createClerkClient, verifyToken } from "@clerk/backend";
import type { VercelRequest } from "@vercel/node";

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export { clerkClient };

// Type for authenticated user from Clerk
export type ClerkUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
};

/**
 * Verify the Clerk session token from the request
 */
export async function verifyClerkSession(req: VercelRequest): Promise<ClerkUser | null> {
  try {
    // Get the session token from the Authorization header or cookie
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : null;

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

    const payload = await verifyToken(sessionToken, {
      secretKey,
    });

    if (!payload || !payload.sub) {
      console.log("[Clerk] Invalid token payload");
      return null;
    }

    // Get the user details from Clerk
    const user = await clerkClient.users.getUser(payload.sub);

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
  db: any,
  users: any,
  eq: any
): Promise<{ id: string; email: string; name: string }> {
  // Check if user exists in database
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.openId, clerkUser.id))
    .limit(1);

  if (existingUsers.length > 0) {
    // Update last sign in
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, existingUsers[0].id));
    
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

  const result = await db.insert(users).values(newUser);
  const insertedId = result[0]?.insertId;

  if (insertedId) {
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, insertedId))
      .limit(1);
    return createdUser;
  }

  // If insert didn't return ID, fetch by openId
  const [createdUser] = await db
    .select()
    .from(users)
    .where(eq(users.openId, clerkUser.id))
    .limit(1);

  return createdUser;
}
