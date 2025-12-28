import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { Platform } from "react-native";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/auth";

/**
 * tRPC React client for type-safe API calls.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * TRPCProvider that has access to Clerk's useAuth hook
 * This allows us to get the session token dynamically for each request
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  // Create query client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Create tRPC client with access to Clerk's getToken
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: `${getApiBaseUrl()}/api/trpc`,
            transformer: superjson,
            async headers() {
              // Web platform: get token from Clerk
              if (Platform.OS === "web") {
                try {
                  const token = await getToken();
                  if (token) {
                    return { Authorization: `Bearer ${token}` };
                  }
                } catch (error) {
                  console.error("[tRPC] Failed to get Clerk token:", error);
                }
              } else {
                // Native platform: get token from secure storage
                const token = await Auth.getSessionToken();
                if (token) {
                  return { Authorization: `Bearer ${token}` };
                }
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
