import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";

type AuthGuardProps = {
  children: React.ReactNode;
};

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ["/oauth/callback", "/login", "/portal", "/api/auth/demo-login"];

// URL de demo login - usa el endpoint local que crea sesión sin OAuth externo
function getDemoLoginUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const currentUrl = encodeURIComponent(window.location.pathname);
    return `/api/auth/demo-login?redirect=${currentUrl}`;
  }
  return "/api/auth/demo-login";
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // No hacer nada mientras carga
    if (loading) return;

    // Verificar si es una ruta pública
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    if (isPublicRoute) return;

    // Si no está autenticado, redirigir a demo login
    if (!isAuthenticated && !redirecting) {
      console.log("[AuthGuard] No authenticated user, redirecting to demo login...");
      setRedirecting(true);

      if (Platform.OS === "web") {
        // En web, redirigir al endpoint de demo login
        const loginUrl = getDemoLoginUrl();
        console.log("[AuthGuard] Redirecting to:", loginUrl);
        window.location.href = loginUrl;
      } else {
        // En native, navegar a una pantalla de login
        router.replace("/login");
      }
    }
  }, [loading, isAuthenticated, pathname, redirecting, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Cargando...</Text>
      </View>
    );
  }

  // Mostrar loading mientras redirige
  if (redirecting || (!isAuthenticated && !PUBLIC_ROUTES.some((route) => pathname?.startsWith(route)))) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Iniciando sesión de demostración...</Text>
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
