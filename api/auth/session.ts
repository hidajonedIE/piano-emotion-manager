import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { sdk } from "../../server/.core/sdk.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ error: "Bearer token required" });
    }
    const token = authHeader.slice("Bearer ".length).trim();

    // Verify the token is valid
    const user = await sdk.authenticateRequest({
      headers: { authorization: `Bearer ${token}` },
    } as any);

    // Set cookie - for Vercel deployments, don't set domain to allow it to default to the exact host
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    
    const cookieValue = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}${isProduction ? "; Secure" : ""}`;
    
    res.setHeader("Set-Cookie", cookieValue);

    return res.json({ 
      success: true, 
      user: {
        id: (user as any)?.id ?? null,
        openId: user?.openId ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
      }
    });
  } catch (error) {
    console.error("[Auth] /api/auth/session failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}
