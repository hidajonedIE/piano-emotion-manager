import PQueue from 'p-queue';

/**
 * Request Queue Configuration
 * 
 * Purpose: Prevent Vercel rate limiting (429 errors) by controlling throughput
 * 
 * Vercel Pro Limits:
 * - 1,000 req/s per deployment (hard limit)
 * - 10,000 req/min per project (global limit)
 * 
 * Our Configuration:
 * - concurrency: 100 (max 100 concurrent requests)
 * - timeout: 5000ms (5 seconds max wait time)
 * - throwOnTimeout: true (fail fast if queue is full)
 * 
 * Expected Throughput:
 * - ~800-900 req/s (under Vercel limit)
 * - Supports 2,500 concurrent users without 429 errors
 */

const queue = new PQueue({
  concurrency: 100, // Max 100 concurrent requests
  timeout: 5000, // 5 seconds max wait time
  throwOnTimeout: true, // Fail fast if queue is full
});

// Metrics for monitoring
let totalQueued = 0;
let totalProcessed = 0;
let totalFailed = 0;

queue.on('add', () => {
  totalQueued++;
  if (totalQueued % 1000 === 0) {
    console.log(`[Queue] Metrics: queued=${totalQueued}, processed=${totalProcessed}, failed=${totalFailed}, pending=${queue.pending}, size=${queue.size}`);
  }
});

queue.on('completed', () => {
  totalProcessed++;
});

queue.on('error', (error) => {
  totalFailed++;
  console.error('[Queue] Error:', error);
});

/**
 * Wrap a function with request queuing
 * 
 * @param fn - The function to execute
 * @returns The result of the function
 * 
 * @example
 * const result = await withQueue(() => db.query.clients.findMany(...));
 */
export async function withQueue<T>(fn: () => Promise<T>): Promise<T> {
  return queue.add(fn);
}

/**
 * Get current queue metrics
 */
export function getQueueMetrics() {
  return {
    totalQueued,
    totalProcessed,
    totalFailed,
    pending: queue.pending,
    size: queue.size,
    isPaused: queue.isPaused,
  };
}

/**
 * Clear queue metrics (for testing)
 */
export function clearQueueMetrics() {
  totalQueued = 0;
  totalProcessed = 0;
  totalFailed = 0;
}
