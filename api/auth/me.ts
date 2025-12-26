import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME } from "../../shared/const.js";
import { sdk } from "../../server/_core/sdk.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
      }
    });
  } catch (error) {
    console.error("[Auth] /api/auth/me failed:", error);
    return res.status(401).json({ error: "Not authenticated", user: null });
  }
}
