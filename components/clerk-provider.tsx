import { ClerkProvider as ClerkProviderBase, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/clerk-token-cache";
import Constants from "expo-constants";
import { Platform } from "react-native";

type ClerkProviderProps = {
  children: React.ReactNode;
};

// Clerk publishable key - this is public and safe to include in client code
// Get your key from: https://dashboard.clerk.com/
const CLERK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsucGlhbm9lbW90aW9uLmNvbSQ";

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
  
  // Use hardcoded fallback key
  return CLERK_PUBLISHABLE_KEY;
}

const publishableKey = getPublishableKey();

export function ClerkProvider({ children }: ClerkProviderProps) {
  // If no publishable key, render children without Clerk wrapper
  // This allows the app to work with demo login while Clerk is being set up
  if (!publishableKey) {
    console.warn("[ClerkProvider] No publishable key found. Using fallback authentication.");
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase 
      publishableKey={publishableKey}
      tokenCache={Platform.OS !== "web" ? tokenCache : undefined}
    >
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProviderBase>
  );
}
