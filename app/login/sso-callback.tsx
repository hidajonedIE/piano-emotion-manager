import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

/**
 * Página de callback para SSO/OAuth en Clerk
 * Esta ruta maneja el retorno desde el proveedor OAuth (Google)
 * El componente <SignIn /> de Clerk redirige aquí automáticamente
 */
export default function SSOCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Usuario autenticado correctamente, redirigir al dashboard
      console.log('[SSOCallback] User signed in, redirecting to dashboard');
      router.replace('/(tabs)');
    } else {
      // No autenticado, volver al login
      console.log('[SSOCallback] User not signed in, redirecting to login');
      router.replace('/login');
    }
  }, [isSignedIn, isLoaded, router]);

  if (Platform.OS === 'web') {
    // Para web, usar el componente de @clerk/clerk-react
    try {
      const { AuthenticateWithRedirectCallback } = require('@clerk/clerk-react');
      
      return (
        <View style={styles.container}>
          <AuthenticateWithRedirectCallback 
            afterSignInUrl="/(tabs)"
            afterSignUpUrl="/(tabs)"
          />
        </View>
      );
    } catch (error) {
      console.error('[SSOCallback] Error loading @clerk/clerk-react:', error);
      // Fallback: mostrar loading y esperar a que useEffect maneje la redirección
    }
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
