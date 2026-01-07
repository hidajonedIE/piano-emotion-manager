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

// For SSO, provide a web implementation
export const useSSO = Platform.OS === 'web'
  ? () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { signIn } = clerkModule.useSignIn();
      return {
        startSSOFlow: async ({ strategy, redirectUrl }: any) => {
          if (!signIn) return {};
          return signIn.authenticateWithRedirect({
            strategy,
            redirectUrl: redirectUrl || '/',
            redirectUrlComplete: redirectUrl || '/',
          });
        },
      };
    }
  : clerkModule.useSSO;
