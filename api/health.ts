/**
 * Health Check Endpoint
 * Piano Emotion Manager
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ ok: true, timestamp: Date.now() });
}
