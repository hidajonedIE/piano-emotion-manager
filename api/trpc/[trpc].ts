/**
 * tRPC API Handler for Vercel Serverless Functions
 * Piano Emotion Manager
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../../server/routers.js';
import { createContext } from '../../server/_core/context.js';

// Create the tRPC middleware
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle tRPC request
  return trpcMiddleware(req as any, res as any, () => {
    res.status(404).json({ error: 'Not found' });
  });
}
