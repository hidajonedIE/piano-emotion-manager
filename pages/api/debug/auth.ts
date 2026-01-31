import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  timestamp: string;
  cookies: {
    received: Record<string, string>;
    keys: string[];
    count: number;
  };
  headers: {
    cookie?: string;
    authorization?: string;
  };
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const timestamp = new Date().toISOString();
  
  const cookiesReceived = req.cookies || {};
  const cookieKeys = Object.keys(cookiesReceived);
  
  const headerCookie = req.headers.cookie || undefined;
  const headerAuth = req.headers.authorization || undefined;

  const response: ResponseData = {
    timestamp,
    cookies: {
      received: cookiesReceived,
      keys: cookieKeys,
      count: cookieKeys.length,
    },
    headers: {
      cookie: headerCookie,
      authorization: headerAuth,
    },
    message: cookieKeys.length > 0 
      ? `✓ Se recibieron ${cookieKeys.length} cookies`
      : "❌ NO se recibieron cookies",
  };

  console.log("[DEBUG AUTH]", JSON.stringify(response, null, 2));

  res.status(200).json(response);
}
