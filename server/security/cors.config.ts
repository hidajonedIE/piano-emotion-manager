/**
 * CORS Configuration
 * Piano Emotion Manager
 * 
 * Define allowed origins for CORS requests.
 * This prevents unauthorized websites from making authenticated requests.
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  // Production
  'https://piano-emotion-manager.vercel.app',
  'https://www.piano-emotion-manager.vercel.app',
  
  // Development
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  
  // Expo development
  'exp://localhost:8081',
  'exp://127.0.0.1:8081',
  
  // Preview deployments (Vercel)
  // Pattern: https://piano-emotion-manager-*-*.vercel.app
];

// Pattern for Vercel preview deployments
const VERCEL_PREVIEW_PATTERN = /^https:\/\/piano-emotion-manager-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/;

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Allow requests without origin (e.g., mobile apps, server-to-server)
    return true;
  }
  
  // Check exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check Vercel preview pattern
  if (VERCEL_PREVIEW_PATTERN.test(origin)) {
    return true;
  }
  
  return false;
}

/**
 * Get the allowed origin for CORS header
 * Returns the origin if allowed, or null if not
 */
export function getAllowedOrigin(origin: string | undefined): string | null {
  if (isOriginAllowed(origin)) {
    return origin || null;
  }
  return null;
}

/**
 * CORS headers configuration
 */
export const CORS_HEADERS = {
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie',
  credentials: 'true',
  maxAge: '86400', // 24 hours
};

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  res: { setHeader: (key: string, value: string) => void },
  origin: string | undefined
): boolean {
  const allowedOrigin = getAllowedOrigin(origin);
  
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', CORS_HEADERS.methods);
    res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS.headers);
    res.setHeader('Access-Control-Allow-Credentials', CORS_HEADERS.credentials);
    res.setHeader('Access-Control-Max-Age', CORS_HEADERS.maxAge);
    return true;
  }
  
  return false;
}
