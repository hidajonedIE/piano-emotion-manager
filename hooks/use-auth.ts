import { useCallback, useMemo } from "react";
import type { User } from "@/lib/auth";

// Try to import Clerk hooks - they may not be available if Clerk is not configured
let useClerkAuth: any = null;
let useClerkUser: any = null;

try {
  const clerk = require("@clerk/clerk-expo");
  useClerkAuth = clerk.useAuth;
  useClerkUser = clerk.useUser;
} catch (e) {
  console.log("[useAuth] Clerk not available");
}

// Import legacy auth as fallback
import { useAuth as useLegacyAuth } from "@/hooks/use-auth-legacy";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  // Check if Clerk is available
  const usingClerk = useClerkAuth !== null;
  
  // Use Clerk hooks if available
  const clerkAuth = useClerkAuth?.() || { isLoaded: true, isSignedIn: false, signOut: async () => {}, getToken: async () => null };
  const clerkUserHook = useClerkUser?.() || { user: null, isLoaded: true };
  
  // Use legacy auth as fallback
  const legacyAuth = useLegacyAuth(options);

  // If using Clerk, map Clerk user to our User type
  const clerkUser = useMemo<User | null>(() => {
    if (!usingClerk || !clerkAuth.isLoaded || !clerkUserHook.isLoaded || !clerkAuth.isSignedIn || !clerkUserHook.user) {
      return null;
    }

    const user = clerkUserHook.user;
    return {
      id: user.id,
      openId: user.id,
      name: user.fullName || user.firstName || "Usuario",
      email: user.primaryEmailAddress?.emailAddress || "",
      loginMethod: user.primaryEmailAddress ? "email" : "oauth",
      lastSignedIn: user.lastSignInAt ? new Date(user.lastSignInAt) : new Date(),
    };
  }, [usingClerk, clerkAuth.isLoaded, clerkAuth.isSignedIn, clerkUserHook.isLoaded, clerkUserHook.user]);

  // Determine which auth system to use
  const user = usingClerk ? clerkUser : legacyAuth.user;
  const loading = usingClerk ? (!clerkAuth.isLoaded || !clerkUserHook.isLoaded) : legacyAuth.loading;
  const isAuthenticated = usingClerk ? (clerkAuth.isSignedIn && !!clerkUser) : legacyAuth.isAuthenticated;

  const logout = useCallback(async () => {
    if (usingClerk) {
      try {
        await clerkAuth.signOut();
      } catch (err) {
        console.error("[Auth] Clerk logout error:", err);
      }
    } else {
      await legacyAuth.logout();
    }
  }, [usingClerk, clerkAuth, legacyAuth]);

  const refresh = useCallback(async () => {
    if (usingClerk) {
      // Clerk handles this automatically
      console.log("[useAuth] Refresh called - Clerk handles this automatically");
    } else {
      await legacyAuth.refresh();
    }
  }, [usingClerk, legacyAuth]);

  // Get session token for API calls
  const getSessionToken = useCallback(async () => {
    if (usingClerk) {
      try {
        const token = await clerkAuth.getToken();
        return token;
      } catch (err) {
        console.error("[Auth] Error getting Clerk token:", err);
        return null;
      }
    }
    return null;
  }, [usingClerk, clerkAuth]);

  return {
    user,
    loading,
    error: usingClerk ? null : legacyAuth.error,
    isAuthenticated,
    refresh,
    logout,
    getSessionToken,
    usingClerk,
  };
}
