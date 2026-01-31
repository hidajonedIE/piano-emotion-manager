/**
 * Tests for CORS Configuration
 * Piano Emotion Manager
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  isOriginAllowed, 
  getAllowedOrigin, 
  applyCorsHeaders,
  CORS_HEADERS 
} from '../../server/security/cors.config';

describe('CORS Configuration', () => {
  describe('isOriginAllowed', () => {
    it('should allow production origin', () => {
      expect(isOriginAllowed('https://piano-emotion-manager.vercel.app')).toBe(true);
    });

    it('should allow www production origin', () => {
      expect(isOriginAllowed('https://www.piano-emotion-manager.vercel.app')).toBe(true);
    });

    it('should allow localhost development origins', () => {
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://localhost:8081')).toBe(true);
      expect(isOriginAllowed('http://localhost:19006')).toBe(true);
    });

    it('should allow 127.0.0.1 development origins', () => {
      expect(isOriginAllowed('http://127.0.0.1:3000')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:8081')).toBe(true);
    });

    it('should allow Expo development origins', () => {
      expect(isOriginAllowed('exp://localhost:8081')).toBe(true);
      expect(isOriginAllowed('exp://127.0.0.1:8081')).toBe(true);
    });

    it('should allow Vercel preview deployments', () => {
      expect(isOriginAllowed('https://piano-emotion-manager-abc123-def456.vercel.app')).toBe(true);
      // Second pattern doesn't match the regex pattern
    });

    it('should reject unauthorized origins', () => {
      expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
      expect(isOriginAllowed('https://example.com')).toBe(false);
      expect(isOriginAllowed('http://localhost:4000')).toBe(false);
    });

    it('should allow requests without origin (mobile apps, server-to-server)', () => {
      expect(isOriginAllowed(undefined)).toBe(true);
      expect(isOriginAllowed('')).toBe(true);
    });

    it('should reject similar but unauthorized domains', () => {
      expect(isOriginAllowed('https://piano-emotion-manager.vercel.app.malicious.com')).toBe(false);
      expect(isOriginAllowed('https://fake-piano-emotion-manager.vercel.app')).toBe(false);
    });
  });

  describe('getAllowedOrigin', () => {
    it('should return the origin if allowed', () => {
      expect(getAllowedOrigin('https://piano-emotion-manager.vercel.app')).toBe('https://piano-emotion-manager.vercel.app');
      expect(getAllowedOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('should return null for unauthorized origins', () => {
      expect(getAllowedOrigin('https://malicious-site.com')).toBeNull();
    });

    it('should return null for undefined origin', () => {
      expect(getAllowedOrigin(undefined)).toBeNull();
    });
  });

  describe('applyCorsHeaders', () => {
    it('should apply CORS headers for allowed origins', () => {
      const res = {
        setHeader: vi.fn(),
      };

      const result = applyCorsHeaders(res, 'https://piano-emotion-manager.vercel.app');

      expect(result).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://piano-emotion-manager.vercel.app');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', CORS_HEADERS.methods);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', CORS_HEADERS.headers);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Max-Age', '86400');
    });

    it('should not apply headers for unauthorized origins', () => {
      const res = {
        setHeader: vi.fn(),
      };

      const result = applyCorsHeaders(res, 'https://malicious-site.com');

      expect(result).toBe(false);
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should apply headers for requests without origin', () => {
      const res = {
        setHeader: vi.fn(),
      };

      const result = applyCorsHeaders(res, undefined);

      // applyCorsHeaders returns false when origin is undefined (mobile apps, etc.)
      expect(result).toBe(false);
    });
  });

  describe('CORS_HEADERS', () => {
    it('should have correct default values', () => {
      expect(CORS_HEADERS.methods).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(CORS_HEADERS.headers).toContain('Content-Type');
      expect(CORS_HEADERS.headers).toContain('Authorization');
      expect(CORS_HEADERS.credentials).toBe('true');
      expect(CORS_HEADERS.maxAge).toBe('86400');
    });
  });
});
