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
            // Get the token from Clerk using the correct method
            let token: string | null = null;
            
            // Check if Clerk is available and has a session
            if (typeof window !== 'undefined' && window.Clerk) {
              try {
                // Use the correct method to get the token
                if (window.Clerk.session) {
                  token = await window.Clerk.session.getToken();
                }
              } catch (clerkError) {
                console.warn('[tRPC fetch] Could not get token from Clerk session:', clerkError);
              }
              
              // Fallback: try to get token from Clerk user
              if (!token) {
                try {
                  if (window.Clerk.user) {
                    token = await window.Clerk.user.getToken();
                  }
                } catch (userError) {
                  console.warn('[tRPC fetch] Could not get token from Clerk user:', userError);
                }
              }
            }
            
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
