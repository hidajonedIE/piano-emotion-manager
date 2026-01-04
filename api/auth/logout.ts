import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME } from "../../shared/const";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Clear the cookie by setting it with an expired date
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  const cookieValue = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? "; Secure" : ""}`;
  
  res.setHeader("Set-Cookie", cookieValue);

  if (req.method === "GET") {
    // Redirect to home after logout
    const frontendUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:8081";
    return res.redirect(302, frontendUrl);
  }

  return res.json({ success: true });
}
