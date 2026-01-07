import { Platform } from "react-native";
import Constants from "expo-constants";

type ClerkProviderProps = {
  children: React.ReactNode;
};

// Get the publishable key from environment variables with fallback
function getPublishableKey(): string {
  // Try multiple sources for the key
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // Check if key is injected in window
    const windowKey = (window as any).__CLERK_PUBLISHABLE_KEY__;
    if (windowKey) return windowKey;
  }
  
  // Check environment variables
  const envKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
                 process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (envKey) return envKey;
  
  // Check Expo config
  const configKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  if (configKey) return configKey;
  
  return "";
}

const publishableKey = getPublishableKey();

export function ClerkProvider({ children }: ClerkProviderProps) {
  // If no publishable key, render children without Clerk wrapper
  // This allows the app to work with demo login while Clerk is being set up
  if (!publishableKey) {
    console.warn("[ClerkProvider] No publishable key found. Using fallback authentication.");
    return <>{children}</>;
  }

  // Use different providers for web and native
  if (Platform.OS === "web") {
    // For web, use @clerk/clerk-react
    try {
      const { ClerkProvider: ClerkProviderWeb } = require("@clerk/clerk-react");
      return (
        <ClerkProviderWeb publishableKey={publishableKey}>
          {children}
        </ClerkProviderWeb>
      );
    } catch (e) {
      console.error("[ClerkProvider] Failed to load @clerk/clerk-react:", e);
      return <>{children}</>;
    }
  } else {
    // For native, use @clerk/clerk-expo
    const { ClerkProvider: ClerkProviderNative, ClerkLoaded } = require("@clerk/clerk-expo");
    const { tokenCache } = require("@/lib/clerk-token-cache");
    
    return (
      <ClerkProviderNative 
        publishableKey={publishableKey}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          {children}
        </ClerkLoaded>
      </ClerkProviderNative>
    );
  }
}
