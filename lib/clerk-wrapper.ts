import { Platform } from 'react-native';

// Dynamic imports based on platform
let clerkModule: any;

if (Platform.OS === 'web') {
  // For web, use @clerk/clerk-react
  try {
    clerkModule = require('@clerk/clerk-react');
  } catch (e) {
    console.warn('Failed to load @clerk/clerk-react');
    clerkModule = {
      useSignIn: () => ({ isLoaded: false, signIn: null, setActive: () => {} }),
      useSignUp: () => ({ isLoaded: false, signUp: null, setActive: () => {} }),
      useAuth: () => ({ isSignedIn: false }),
      useUser: () => ({ user: null, isLoaded: false }),
      useSession: () => ({ session: null, isLoaded: false }),
    };
  }
} else {
  // For native, use @clerk/clerk-expo
  clerkModule = require('@clerk/clerk-expo');
}

// Export all Clerk hooks
export const useSignIn = clerkModule.useSignIn;
export const useSignUp = clerkModule.useSignUp;
export const useAuth = clerkModule.useAuth;
export const useUser = clerkModule.useUser;
export const useSession = clerkModule.useSession;

// For SSO on web, wrap the signIn hook to provide startSSOFlow
export const useSSO = Platform.OS === 'web' 
  ? () => {
      const { signIn, isLoaded } = clerkModule.useSignIn?.() || { signIn: null, isLoaded: false };
      
      return {
        startSSOFlow: async (options: { strategy: string }) => {
          if (!signIn || !isLoaded) {
            console.error('[useSSO] SignIn not loaded');
            return null;
          }
          
          try {
            // For web, use authenticateWithRedirect which handles OAuth flow
            const result = await signIn.authenticateWithRedirect({
              strategy: options.strategy as 'oauth_google' | 'oauth_github' | 'oauth_microsoft',
              redirectUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/oauth/callback`,
              redirectUrlComplete: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
            });
            
            return result;
          } catch (error) {
            console.error('[useSSO] Error in authenticateWithRedirect:', error);
            return null;
          }
        }
      };
    }
  : clerkModule.useSSO;
