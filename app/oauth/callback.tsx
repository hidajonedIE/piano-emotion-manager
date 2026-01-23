import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/api";
import * as Auth from "@/lib/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    sessionToken?: string;
    user?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for sessionToken in params first (web OAuth callback from server redirect)
        if (params.sessionToken) {
          await Auth.setSessionToken(params.sessionToken);

          // Decode and store user info if available
          if (params.user) {
            try {
              // Use atob for base64 decoding (works in both web and React Native)
              const userJson =
                typeof atob !== "undefined"
                  ? atob(params.user)
                  : Buffer.from(params.user, "base64").toString("utf-8");
              const userData = JSON.parse(userJson);
              const userInfo: Auth.User = {
                id: userData.id,
                openId: userData.openId,
                name: userData.name,
                email: userData.email,
                loginMethod: userData.loginMethod,
                lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
              };
              await Auth.setUserInfo(userInfo);
            } catch (err) {
              console.error("[OAuth] Failed to parse user data:", err);
            }
          }

          setStatus("success");
          setTimeout(() => {
            router.replace("/(drawer)");
          }, 1000);
          return;
        }

        // Get URL from params or Linking
        let url: string | null = null;

        // Try to get from local search params first (works with expo-router)
        if (params.code || params.state || params.error) {
          // Extract from params
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
        } else {
          // Fallback: try to get from Linking
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            url = initialUrl;
          }
        }

        // Check for error
        const error =
          params.error || (url ? new URL(url, "http://dummy").searchParams.get("error") : null);
        if (error) {
          console.error("[OAuth] Error parameter found:", error);
          setStatus("error");
          setErrorMessage(error || "OAuth error occurred");
          return;
        }

        // Check for code and state
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        // Try to get from params first
        if (params.code && params.state) {
          code = params.code;
          state = params.state;
        } else if (url) {
          // Parse from URL
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
          } catch {
            // Try parsing as relative URL with query params
            const match = url.match(/[?&](code|state|sessionToken)=([^&]+)/g);
            if (match) {
              match.forEach((param) => {
                const [key, value] = param.substring(1).split("=");
                if (key === "code") code = decodeURIComponent(value);
                if (key === "state") state = decodeURIComponent(value);
                if (key === "sessionToken") sessionToken = decodeURIComponent(value);
              });
            }
          }
        }

        // If we have sessionToken directly from URL, use it
        if (sessionToken) {
          await Auth.setSessionToken(sessionToken);
          // User info is already in the OAuth callback response
          // No need to fetch from API
          setStatus("success");
          setTimeout(() => {
            router.replace("/(drawer)");
          }, 1000);
          return;
        }

        // Otherwise, exchange code for session token
        if (!code || !state) {
          console.error("[OAuth] Missing code or state parameter");
          setStatus("error");
          setErrorMessage("Missing code or state parameter");
          return;
        }

        // Exchange code for session token
        const result = await Api.exchangeOAuthCode(code, state);

        if (result.sessionToken) {
          // Store session token
          await Auth.setSessionToken(result.sessionToken);

          // Store user info if available
          if (result.user) {
            const userInfo: Auth.User = {
              id: result.user.id,
              openId: result.user.openId,
              name: result.user.name,
              email: result.user.email,
              loginMethod: result.user.loginMethod,
              lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
            };
            await Auth.setUserInfo(userInfo);
          }

          setStatus("success");

          // Redirect to home after a short delay
          setTimeout(() => {
            router.replace("/(drawer)");
          }, 1000);
        } else {
          console.error("[OAuth] No session token in result:", result);
          setStatus("error");
          setErrorMessage("No session token received");
        }
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete authentication",
        );
      }
    };

    handleCallback();
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          // Handle all safe area edges for device notches, corners, and bottom bars
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
        },
      ]}
    >
      {status === "processing" && (
        <>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.text}>Completing authentication...</ThemedText>
        </>
      )}
      {status === "success" && (
        <>
          <ThemedText style={styles.text}>Authentication successful!</ThemedText>
          <ThemedText style={styles.text}>Redirecting...</ThemedText>
        </>
      )}
      {status === "error" && (
        <>
          <ThemedText type="subtitle" style={styles.errorText}>
            Authentication failed
          </ThemedText>
          <ThemedText style={styles.text}>{errorMessage}</ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#ff4444",
    marginBottom: 8,
  },
});
