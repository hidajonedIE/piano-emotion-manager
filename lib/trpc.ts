import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@clerk/clerk-react";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  // Get Clerk token from client-side
  let clerkToken: string | null = null;
  
  // Try to get token synchronously (it may be cached)
  if (typeof window !== 'undefined') {
    try {
      const { getToken } = require('@clerk/clerk-react');
      // This is async, but we'll handle it in the fetch function
    } catch (e) {
      console.error('[createTRPCClient] Error loading Clerk:', e);
    }
  }

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        // Pass Clerk token in Authorization header
        async fetch(url, options) {
          try {
            // Get the token from Clerk
            const { getToken } = require('@clerk/clerk-react');
            const token = await getToken();
            console.log('[tRPC fetch] Token obtained from Clerk:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
            
            return fetch(url, {
              ...options,
              credentials: "include",
              headers: {
                ...options?.headers,
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            });
          } catch (e) {
            console.error('[tRPC fetch] Error getting Clerk token:', e);
            // Fall back to sending without token
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          }
        },
      }),
    ],
  });
}
