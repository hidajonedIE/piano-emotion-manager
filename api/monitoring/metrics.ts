import type { VercelRequest, VercelResponse } from '@vercel/node';
import { monitoring } from '../../server/lib/monitoring.service.js';

/**
 * API endpoint to view monitoring metrics
 * 
 * Protected by secret key to prevent unauthorized access
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify secret key
  const secret = req.headers['x-monitoring-secret'] as string;
  if (secret !== process.env.MONITORING_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const summary = monitoring.getMetricsSummary();
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: summary,
    });
  } catch (error) {
    console.error('[Monitoring API] Error getting metrics:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
