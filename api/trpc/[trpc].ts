/**
 * tRPC API Handler for Vercel Serverless Functions
 * Piano Emotion Manager
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../server/routers.js';
import { createContext } from '../../server/_core/context.js';
import { applyCorsHeaders, isOriginAllowed } from '../../server/security/cors.config';
import { applyRateLimit, getClientIdentifier } from '../../server/security/rate-limit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  
  // Apply CORS headers
  const corsApplied = applyCorsHeaders(res, origin);
  
  // Reject requests from unauthorized origins (except for requests without origin)
  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(
    { headers: req.headers as Record<string, string | string[] | undefined> },
    'api'
  );
  
  // Set rate limit headers
  for (const [key, value] of Object.entries(rateLimitResult.headers)) {
    res.setHeader(key, value);
  }
  
  // Check if rate limited
  if (!rateLimitResult.allowed) {
    res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimitResult.retryAfter 
    });
    return;
  }

  // Convert Vercel request to fetch Request
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = `${protocol}://${host}${req.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  // Read body for POST requests
  let body: string | undefined;
  if (req.method === 'POST' && req.body) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  const fetchRequest = new Request(url, {
    method: req.method || 'GET',
    headers,
    body: body,
  });

  // Create a normalized request object that works with the SDK
  const normalizedReq = {
    headers: {
      cookie: req.headers.cookie,
      authorization: req.headers.authorization || req.headers.Authorization,
      Authorization: req.headers.authorization || req.headers.Authorization,
    },
  };

  // Handle tRPC request using fetch adapter
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: fetchRequest,
    router: appRouter,
    createContext: async () => createContext({ req: normalizedReq, res }),
  });

  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Send response
  res.status(response.status);
  const responseBody = await response.text();
  res.send(responseBody);
}
