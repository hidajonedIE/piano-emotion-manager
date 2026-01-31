import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { DEMO_MODE } from "@/DEMO_MODE";

type AuthGuardProps = {
  children: React.ReactNode;
};

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/sign-up", "/portal", "/api/"];

// Completar el flujo de autenticación en web
if (Platform.OS === "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  // Usar Clerk para autenticación
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // En modo demo, permitir acceso sin autenticación
    if (DEMO_MODE) return;

    // No hacer nada mientras carga
    if (!isLoaded) return;

    // Verificar si es una ruta pública
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    if (isPublicRoute) return;

    // Si no está autenticado, redirigir a login
    if (!isSignedIn && !redirecting) {
      setRedirecting(true);
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, pathname, redirecting, router]);

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
