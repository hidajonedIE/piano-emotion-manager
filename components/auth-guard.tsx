import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Try to import Clerk hooks - they may not be available if Clerk is not configured
let useClerkAuth: any = null;
let useClerkUser: any = null;

try {
  const clerk = require("@clerk/clerk-expo");
  useClerkAuth = clerk.useAuth;
  useClerkUser = clerk.useUser;
} catch (e) {
  console.log("[AuthGuard] Clerk not available, using fallback auth");
}

// Fallback hook for when Clerk is not available
import { useAuth as useLegacyAuth } from "@/hooks/use-auth-legacy";

type AuthGuardProps = {
  children: React.ReactNode;
};

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/sign-up", "/portal", "/api/", "/oauth/callback"];

// Completar el flujo de autenticación en web
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  // Use Clerk if available, otherwise use legacy auth
  const clerkAuth = useClerkAuth?.() || { isLoaded: true, isSignedIn: false };
  const legacyAuth = useLegacyAuth();
  
  // Determine if Clerk is being used
  const usingClerk = useClerkAuth !== null;
  
  // Get authentication state
  const isLoaded = usingClerk ? clerkAuth.isLoaded : !legacyAuth.loading;
  const isSignedIn = usingClerk ? clerkAuth.isSignedIn : legacyAuth.isAuthenticated;

  useEffect(() => {
    // No hacer nada mientras carga
    if (!isLoaded) return;

    // Verificar si es una ruta pública
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    if (isPublicRoute) return;

    // Si no está autenticado, redirigir a login
    if (!isSignedIn && !redirecting) {
      console.log("[AuthGuard] No authenticated user, redirecting to login...");
      setRedirecting(true);
      
      if (usingClerk) {
        // Redirect to Clerk login page
        router.replace("/login");
      } else {
        // Redirect to demo login for legacy auth
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const currentUrl = encodeURIComponent(window.location.pathname);
          window.location.href = `/api/auth/demo-login?redirect=${currentUrl}`;
        } else {
          router.replace("/login");
        }
      }
    }
  }, [isLoaded, isSignedIn, pathname, redirecting, router, usingClerk]);

  // Mostrar loading mientras carga
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Cargando...</Text>
      </View>
    );
  }

  // Verificar si es una ruta pública
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Si es ruta pública, mostrar contenido sin verificar auth
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Mostrar loading mientras redirige
  if (redirecting || !isSignedIn) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Redirigiendo a inicio de sesión...</Text>
      </View>
    );
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
