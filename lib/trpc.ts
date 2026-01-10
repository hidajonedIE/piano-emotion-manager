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
            let token: string | null = null;
            
            // Check if Clerk is available
            if (typeof window !== 'undefined' && window.Clerk) {
              try {
                // Use Clerk.session.getToken() to get the JWT token
                // This is the correct way to get the token for API calls
                const session = window.Clerk?.session;
                if (session) {
                  token = await session.getToken();
                  console.log('[tRPC fetch] Token obtained from Clerk.session:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
                } else {
                  console.warn('[tRPC fetch] No Clerk session available');
                }
              } catch (clerkError) {
                console.error('[tRPC fetch] Error getting token from Clerk:', clerkError);
              }
            } else {
              console.warn('[tRPC fetch] Clerk not available in window');
            }
            
            return fetch(url, {
              ...options,
              credentials: "include",
              headers: {
                ...options?.headers,
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            });
          } catch (e) {
            console.error('[tRPC fetch] Error in fetch wrapper:', e);
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
