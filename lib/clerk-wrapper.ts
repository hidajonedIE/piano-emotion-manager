import { Platform } from "react-native";

// Load the correct Clerk module based on platform
const clerkModule = Platform.OS === 'web'
  ? require("@clerk/clerk-react")
  : require("@clerk/clerk-expo");

console.log('[clerk-wrapper] Platform:', Platform.OS);
console.log('[clerk-wrapper] Using Clerk module:', Platform.OS === 'web' ? '@clerk/clerk-react' : '@clerk/clerk-expo');

// Export hooks directly from the correct module
export const useUser = clerkModule.useUser;
export const useSession = clerkModule.useSession;
export const useAuth = clerkModule.useAuth;
export const useSignIn = clerkModule.useSignIn;
export const useSignUp = clerkModule.useSignUp;

// For SSO, provide platform-specific implementation
export const useSSO = Platform.OS === 'web'
  ? () => {
      // For web with @clerk/clerk-react, use useSignIn
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { signIn } = clerkModule.useSignIn();
      return {
        startSSOFlow: async ({ strategy, redirectUrl }: any) => {
          if (!signIn) {
            console.error('[useSSO] signIn not available');
            return {};
          }
          
          try {
            console.log('[useSSO] Starting OAuth with strategy:', strategy);
            console.log('[useSSO] Redirect URL:', redirectUrl || window.location.origin);
            
            // Use authenticateWithRedirect which handles the full OAuth flow
            await signIn.authenticateWithRedirect({
              strategy,
              redirectUrl: redirectUrl || window.location.origin,
              redirectUrlComplete: redirectUrl || window.location.origin,
            });
            
            // This won't execute because authenticateWithRedirect redirects the page
            return {};
          } catch (error) {
            console.error('[useSSO] OAuth error:', error);
            throw error;
          }
        },
      };
    }
  : clerkModule.useSSO;
