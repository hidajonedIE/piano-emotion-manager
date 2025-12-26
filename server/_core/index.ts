import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { applyCorsHeaders, isOriginAllowed } from "../security/cors.config.js";
import { applyRateLimit } from "../security/rate-limit.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS middleware with strict origin checking
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Apply CORS headers
    applyCorsHeaders(res, origin);
    
    // Reject requests from unauthorized origins (except for requests without origin)
    if (origin && !isOriginAllowed(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Rate limiting middleware
  app.use((req, res, next) => {
    // Determine rate limit type based on path
    let limitType: 'auth' | 'public' | 'api' | 'expensive' | 'portal' = 'api';
    
    if (req.path.startsWith('/api/auth') || req.path.includes('/login') || req.path.includes('/logout')) {
      limitType = 'auth';
    } else if (req.path.startsWith('/api/portal')) {
      limitType = 'portal';
    } else if (req.path.includes('/pdf') || req.path.includes('/email') || req.path.includes('/export')) {
      limitType = 'expensive';
    }
    
    const rateLimitResult = applyRateLimit(
      { headers: req.headers as Record<string, string | string[] | undefined> },
      limitType
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
    
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
  }

  server.listen(port, () => {
  });
}

startServer().catch(console.error);
