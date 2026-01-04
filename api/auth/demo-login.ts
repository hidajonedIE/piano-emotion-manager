/**
 * Demo Login Endpoint
 * Creates a demo session without requiring external OAuth
 * This allows testing Stripe and other features immediately
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT } from "jose";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import * as db from "../../server/db";
import { applyCorsHeaders } from "../../server/security/cors.config";
import { applyRateLimit } from "../../server/security/rate-limit";

// Input validation schema
const QuerySchema = z.object({
  redirect: z.string().optional().default("/"),
});

const DEMO_USER = {
  openId: "demo-user-piano-emotion-2024",
  name: "Usuario Demo",
  email: "demo@piano-emotion.test",
};

function getSessionSecret() {
  const secret = process.env.JWT_SECRET || "piano-emotion-manager-dev-secret-key-2024";
  return new TextEncoder().encode(secret);
}

async function createSessionToken(openId: string, name: string): Promise<string> {
  const appId = process.env.VITE_APP_ID || "piano-emotion-manager";
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  const secretKey = getSessionSecret();

  return new SignJWT({
    openId,
    appId,
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS
  applyCorsHeaders(res, req.headers.origin as string | undefined);
  
  // Apply rate limiting for auth endpoints
  const rateLimitResult = applyRateLimit(
    { headers: req.headers as Record<string, string | string[] | undefined> },
    'auth'
  );
  
  for (const [key, value] of Object.entries(rateLimitResult.headers)) {
    res.setHeader(key, value);
  }
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimitResult.retryAfter 
    });
  }

  // Only allow in development/test or when explicitly enabled
  const isDev = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_LOGIN === "true";
  
  if (!isDev) {
    return res.status(403).json({ error: "Demo login not available in production" });
  }

  try {
    // Validate query parameters
    const queryResult = QuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ 
        error: "Invalid query parameters",
        details: queryResult.error.format()
      });
    }
    
    const { redirect } = queryResult.data;
    
    // Validate redirect URL to prevent open redirect
    const isValidRedirect = redirect.startsWith('/') && !redirect.startsWith('//');
    const safeRedirect = isValidRedirect ? redirect : '/';

    // Ensure demo user exists in database
    await db.upsertUser({
      openId: DEMO_USER.openId,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      loginMethod: "demo",
      lastSignedIn: new Date(),
    });

    // Create session token
    const sessionToken = await createSessionToken(DEMO_USER.openId, DEMO_USER.name);

    // Set cookie
    const cookieValue = `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`;
    res.setHeader("Set-Cookie", cookieValue);

    // Redirect to home page
    res.redirect(302, safeRedirect);
  } catch (error) {
    console.error("[Demo Login] Error:", error);
    res.status(500).json({ 
      error: "Failed to create demo session",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
