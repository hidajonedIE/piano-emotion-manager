/**
 * Demo Login Endpoint
 * Creates a demo session without requiring external OAuth
 * This allows testing Stripe and other features immediately
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import * as db from "../../server/db.js";

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
  // Only allow in development/test or when explicitly enabled
  const isDev = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_LOGIN === "true";
  
  if (!isDev) {
    return res.status(403).json({ error: "Demo login not available in production" });
  }

  try {
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
    const redirectUrl = req.query.redirect as string || "/";
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("[Demo Login] Error:", error);
    res.status(500).json({ 
      error: "Failed to create demo session",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
