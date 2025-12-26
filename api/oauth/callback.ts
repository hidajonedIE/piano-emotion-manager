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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  if (!code || !state) {
    return res.status(400).json({ error: "code and state are required" });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    await syncUser(userInfo);
    
    const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Set cookie - for Vercel deployments, don't set domain to allow it to default to the exact host
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    
    const cookieValue = `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}${isProduction ? "; Secure" : ""}`;
    
    res.setHeader("Set-Cookie", cookieValue);

    // Redirect to the frontend
    const frontendUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";
    
    return res.redirect(302, frontendUrl);
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
