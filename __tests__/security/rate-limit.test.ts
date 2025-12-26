/**
 * Tests for Rate Limiting
 * Piano Emotion Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  checkRateLimit, 
  getRateLimitHeaders, 
  getClientIdentifier,
  applyRateLimit,
  RATE_LIMITS 
} from '../../server/security/rate-limit';

describe('Rate Limiting', () => {
  describe('RATE_LIMITS', () => {
    it('should have correct configurations for auth endpoints', () => {
      expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    });

    it('should have correct configurations for public endpoints', () => {
      expect(RATE_LIMITS.public.windowMs).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMITS.public.maxRequests).toBe(30);
    });

    it('should have correct configurations for API endpoints', () => {
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMITS.api.maxRequests).toBe(100);
    });

    it('should have correct configurations for expensive operations', () => {
      expect(RATE_LIMITS.expensive.windowMs).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMITS.expensive.maxRequests).toBe(10);
    });

    it('should have correct configurations for portal endpoints', () => {
      expect(RATE_LIMITS.portal.windowMs).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMITS.portal.maxRequests).toBe(20);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = `test-user-${Date.now()}`;
      
      const result = checkRateLimit(identifier, 'api');
      
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(RATE_LIMITS.api.maxRequests - 1);
    });

    it('should block requests exceeding limit', () => {
      const identifier = `test-user-block-${Date.now()}`;
      
      // Make requests up to the limit
      for (let i = 0; i < RATE_LIMITS.auth.maxRequests; i++) {
        checkRateLimit(identifier, 'auth');
      }
      
      // Next request should be limited
      const result = checkRateLimit(identifier, 'auth');
      
      expect(result.limited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should track different identifiers separately', () => {
      const identifier1 = `user1-${Date.now()}`;
      const identifier2 = `user2-${Date.now()}`;
      
      // Make requests for user1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier1, 'api');
      }
      
      // User2 should still have full quota
      const result = checkRateLimit(identifier2, 'api');
      
      expect(result.limited).toBe(false);
      expect(result.remaining).toBe(RATE_LIMITS.api.maxRequests - 1);
    });

    it('should track different limit types separately', () => {
      const identifier = `multi-type-${Date.now()}`;
      
      // Use up auth limit
      for (let i = 0; i < RATE_LIMITS.auth.maxRequests + 1; i++) {
        checkRateLimit(identifier, 'auth');
      }
      
      // API limit should still be available
      const result = checkRateLimit(identifier, 'api');
      
      expect(result.limited).toBe(false);
    });

    it('should return correct resetIn value', () => {
      const identifier = `reset-test-${Date.now()}`;
      
      const result = checkRateLimit(identifier, 'api');
      
      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(RATE_LIMITS.api.windowMs);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers', () => {
      const identifier = `headers-test-${Date.now()}`;
      
      const headers = getRateLimitHeaders(identifier, 'api');
      
      expect(headers['X-RateLimit-Limit']).toBe(RATE_LIMITS.api.maxRequests.toString());
      expect(headers['X-RateLimit-Remaining']).toBeDefined();
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should show decreasing remaining count', () => {
      const identifier = `decreasing-${Date.now()}`;
      
      const headers1 = getRateLimitHeaders(identifier, 'api');
      const headers2 = getRateLimitHeaders(identifier, 'api');
      
      const remaining1 = parseInt(headers1['X-RateLimit-Remaining']);
      const remaining2 = parseInt(headers2['X-RateLimit-Remaining']);
      
      expect(remaining2).toBe(remaining1 - 1);
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from X-Real-IP header', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('192.168.1.2');
    });

    it('should fall back to req.ip', () => {
      const req = {
        headers: {},
        ip: '192.168.1.3',
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('192.168.1.3');
    });

    it('should fall back to socket.remoteAddress', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '192.168.1.4' },
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('192.168.1.4');
    });

    it('should return "unknown" when no IP is available', () => {
      const req = {
        headers: {},
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('unknown');
    });

    it('should handle array values in headers', () => {
      const req = {
        headers: {
          'x-forwarded-for': ['192.168.1.5', '10.0.0.1'],
        },
      };
      
      const identifier = getClientIdentifier(req);
      
      expect(identifier).toBe('192.168.1.5');
    });
  });

  describe('applyRateLimit', () => {
    it('should return allowed=true for requests within limit', () => {
      const req = {
        headers: {
          'x-forwarded-for': `apply-test-${Date.now()}`,
        },
      };
      
      const result = applyRateLimit(req, 'api');
      
      expect(result.allowed).toBe(true);
      expect(result.headers).toBeDefined();
      expect(result.retryAfter).toBeUndefined();
    });

    it('should return allowed=false with retryAfter for rate limited requests', () => {
      const ip = `limited-${Date.now()}`;
      const req = {
        headers: {
          'x-forwarded-for': ip,
        },
      };
      
      // Exhaust the limit
      for (let i = 0; i < RATE_LIMITS.auth.maxRequests + 1; i++) {
        applyRateLimit(req, 'auth');
      }
      
      const result = applyRateLimit(req, 'auth');
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.headers['Retry-After']).toBeDefined();
    });

    it('should include rate limit headers in response', () => {
      const req = {
        headers: {
          'x-forwarded-for': `headers-apply-${Date.now()}`,
        },
      };
      
      const result = applyRateLimit(req, 'api');
      
      expect(result.headers['X-RateLimit-Limit']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });
  });
});
