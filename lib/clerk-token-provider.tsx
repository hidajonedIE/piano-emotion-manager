import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setGlobalTokenGetter } from './trpc';

/**
 * Context to provide Clerk session token to tRPC client
 */
type ClerkTokenContextType = {
  getToken: () => Promise<string | null>;
};

const ClerkTokenContext = createContext<ClerkTokenContextType | null>(null);

/**
 * Provider that exposes Clerk's getToken function to child components
 */
export function ClerkTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  // Register the token getter globally for tRPC
  useEffect(() => {
    setGlobalTokenGetter(getToken);
  }, [getToken]);

  return (
    <ClerkTokenContext.Provider value={{ getToken }}>
      {children}
    </ClerkTokenContext.Provider>
  );
}

/**
 * Hook to access Clerk token getter from anywhere in the app
 */
export function useClerkToken() {
  const context = useContext(ClerkTokenContext);
  if (!context) {
    // Return a no-op function if provider is not available
    return { getToken: async () => null };
  }
  return context;
}
