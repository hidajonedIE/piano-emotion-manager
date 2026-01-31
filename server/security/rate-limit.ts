/**
 * Rate Limiting Service
 * Piano Emotion Manager
 * 
 * Simple in-memory rate limiting for API endpoints.
 * For production with multiple instances, consider using Redis-based solutions like @upstash/ratelimit.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
}

// In-memory store for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },
  
  // Public endpoints - moderate limits
  // Aumentado para soportar 2500 usuarios concurrentes
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Protected API endpoints - generous limits for authenticated users
  // Aumentado para soportar 2500 usuarios concurrentes
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
  },
  
  // Expensive operations (PDF generation, email sending)
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  
  // Portal endpoints - moderate limits
  portal: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
};

/**
 * Check if a request is rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limitType - Type of rate limit to apply
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'api'
): { limited: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry if doesn't exist or window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetTime - now);
  
  return {
    limited: entry.count > config.maxRequests,
    remaining,
    resetIn,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'api'
): Record<string, string> {
  const config = RATE_LIMITS[limitType];
  const result = checkRateLimit(identifier, limitType);
  
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  };
}

/**
 * Extract client identifier from request
 * Uses IP address as primary identifier
 */
export function getClientIdentifier(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  // Try X-Forwarded-For header first (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ip.trim();
  }
  
  // Try X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Fall back to direct IP
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Rate limit middleware result
 */
export interface RateLimitResult {
  allowed: boolean;
  headers: Record<string, string>;
  retryAfter?: number;
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  req: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    socket?: { remoteAddress?: string };
  },
  limitType: keyof typeof RATE_LIMITS = 'api'
): RateLimitResult {
  const identifier = getClientIdentifier(req);
  const result = checkRateLimit(identifier, limitType);
  const headers = getRateLimitHeaders(identifier, limitType);
  
  if (result.limited) {
    return {
      allowed: false,
      headers: {
        ...headers,
        'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
      },
      retryAfter: Math.ceil(result.resetIn / 1000),
    };
  }
  
  return {
    allowed: true,
    headers,
  };
}
