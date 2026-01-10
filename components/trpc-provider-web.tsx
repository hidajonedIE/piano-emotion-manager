'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";

/**
 * tRPC React client for type-safe API calls.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * TRPCProvider for web that has access to Clerk's useAuth hook
 * This allows us to get the session token dynamically for each request
 */
export function TRPCProviderWeb({ 
  children,
  queryClient
}: { 
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const { getToken } = useAuth();

  // Create tRPC client with access to Clerk's getToken
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: `${getApiBaseUrl()}/api/trpc`,
            transformer: superjson,
            async headers() {
              try {
                const token = await getToken();
                console.log('[TRPCProviderWeb] Token obtained:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
                if (token) {
                  return { Authorization: `Bearer ${token}` };
                }
              } catch (error) {
                console.error("[TRPCProviderWeb] Failed to get Clerk token:", error);
              }
              return {};
            },
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        ],
      }),
    [getToken]
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
