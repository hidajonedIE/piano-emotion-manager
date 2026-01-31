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
      const { signIn, setActive } = clerkModule.useSignIn();
      return {
        startSSOFlow: async ({ strategy, redirectUrl }: any) => {
          console.log('[useSSO] startSSOFlow called with strategy:', strategy);
          console.log('[useSSO] signIn object:', signIn);
          
          if (!signIn) {
            console.error('[useSSO] signIn not available');
            return {};
          }
          
          try {
            console.log('[useSSO] Starting OAuth with strategy:', strategy);
            
            // Create a sign-in attempt with the OAuth strategy
            const signInAttempt = await signIn.create({
              strategy,
            });
            
            console.log('[useSSO] Sign-in attempt created:', signInAttempt);
            
            // Get the external verification redirect URL
            const redirectUrlFromClerk = 
              signInAttempt.firstFactorVerification?.externalVerificationRedirectURL;
            
            if (!redirectUrlFromClerk) {
              console.error('[useSSO] No redirect URL from Clerk');
              return {};
            }
            
            console.log('[useSSO] Opening OAuth URL:', redirectUrlFromClerk);
            
            // Redirect the current page to Google OAuth
            window.location.href = redirectUrlFromClerk;
            
            // Return empty object as we're redirecting
            return {};
          } catch (error) {
            console.error('[useSSO] OAuth error:', error);
            throw error;
          }
        },
      };
    }
  : clerkModule.useSSO;
