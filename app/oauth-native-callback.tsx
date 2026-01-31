import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Página de callback para OAuth en Expo Router
 * Esta ruta maneja el retorno desde el proveedor OAuth (Google)
 * y completa el flujo de autenticación
 */
export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    // El hook useOAuth() de Clerk maneja automáticamente el callback
    // Solo necesitamos redirigir al usuario después de que se complete
    const timer = setTimeout(() => {
      router.replace('/(drawer)');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

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
