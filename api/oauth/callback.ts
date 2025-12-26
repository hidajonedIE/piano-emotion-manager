import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { getUserByOpenId, upsertUser } from "../../server/db/index.js";
import { sdk } from "../../server/_core/sdk.js";

function getQueryParam(req: VercelRequest, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return saved;
}

function getFrontendUrl(req: VercelRequest): string {
  // Priority 1: Use the host from the request (most reliable)
  const host = req.headers.host;
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  
  // Priority 2: Use VERCEL_PROJECT_PRODUCTION_URL for production domain
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  
  // Priority 3: Use VERCEL_URL (may be preview URL)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback for development
  return process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[OAuth Callback] Request received");
  console.log("[OAuth Callback] Headers:", JSON.stringify(req.headers, null, 2));
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  console.log("[OAuth Callback] code:", code ? "present" : "missing");
  console.log("[OAuth Callback] state:", state ? "present" : "missing");

  if (!code || !state) {
    return res.status(400).json({ error: "code and state are required" });
  }

  try {
    console.log("[OAuth Callback] Exchanging code for token...");
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    console.log("[OAuth Callback] Token received");
    
    console.log("[OAuth Callback] Getting user info...");
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    console.log("[OAuth Callback] User info:", { openId: userInfo.openId, name: userInfo.name });
    
    console.log("[OAuth Callback] Syncing user to database...");
    const savedUser = await syncUser(userInfo);
    console.log("[OAuth Callback] User synced:", savedUser?.id);
    
    console.log("[OAuth Callback] Creating session token...");
    const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });
    console.log("[OAuth Callback] Session token created");

    // Set cookie - for Vercel deployments, don't set domain to allow it to default to the exact host
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    
    // Build cookie with all necessary attributes
    const cookieParts = [
      `${COOKIE_NAME}=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`,
    ];
    
    if (isProduction) {
      cookieParts.push("Secure");
    }
    
    const cookieValue = cookieParts.join("; ");
    console.log("[OAuth Callback] Setting cookie (without value):", cookieValue.replace(sessionToken, "[REDACTED]"));
    
    res.setHeader("Set-Cookie", cookieValue);

    // Redirect to the frontend
    const frontendUrl = getFrontendUrl(req);
    console.log("[OAuth Callback] Redirecting to:", frontendUrl);
    
    return res.redirect(302, frontendUrl);
  } catch (error) {
    console.error("[OAuth Callback] Failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "OAuth callback failed", details: errorMessage });
  }
}
