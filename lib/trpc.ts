import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Store for the Clerk token getter function
 * This will be set by the TRPCProvider component
 */
let getClerkToken: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  getClerkToken = getter;
}

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
            let token: string | null = null;
            
            // Use the token getter function set by TRPCProvider
            if (getClerkToken) {
              try {
                token = await getClerkToken();
              } catch (error) {
                console.warn('[tRPC fetch] Error getting token from Clerk:', error);
              }
            }
            
            console.log('[tRPC fetch] Token obtained:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
            
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
