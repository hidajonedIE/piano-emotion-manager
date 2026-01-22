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
        headers: async () => {
          try {
            let token: string | null = null;
            
            // Check if we're in a browser environment
            if (typeof window !== 'undefined') {
              // Try to get token from Clerk
              // Use the global Clerk object which should be available after ClerkProvider loads
              if ((window as any).Clerk) {
                const clerk = (window as any).Clerk;
                
                // Try to get the session
                if (clerk.session) {
                  try {
                    token = await clerk.session.getToken();
                  } catch (e) {
                    console.warn('[tRPC headers] Could not get token from Clerk session:', e);
                  }
                }
                
                // If no token yet, try the user object
                if (!token && clerk.user) {
                  try {
                    token = await clerk.user.getToken();
                  } catch (e) {
                    console.warn('[tRPC headers] Could not get token from Clerk user:', e);
                  }
                }
              }
            }
            
            console.log('[tRPC headers] Token obtained:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
            
            return {
              ...(token && { authorization: `Bearer ${token}` }),
            };
          } catch (e) {
            console.error('[tRPC headers] Error getting Clerk token:', e);
            return {};
          }
        },
      }),
    ],
  });
}
