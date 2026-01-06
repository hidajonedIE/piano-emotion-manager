/**
 * Admin Layout
 * Layout para las pantallas de administración con verificación de permisos
 */
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useUserRole } from '@/hooks/use-user-role';

export default function AdminLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const { role, isLoading } = useUserRole();
  const isAdmin = role === 'admin';

  useEffect(() => {
    // Redirigir si no es admin una vez cargado
    if (!isLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isLoading, isAdmin]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <ThemedText style={styles.loadingText}>Verificando permisos...</ThemedText>
      </View>
    );
  }

  // No mostrar nada si no es admin (se redirigirá)
  if (!isAdmin) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="partners"
        options={{
          title: 'Partners',
        }}
      />
      <Stack.Screen
        name="help/index"
        options={{
          title: 'Gestión de Ayuda',
        }}
      />
      <Stack.Screen
        name="help/[sectionId]"
        options={{
          title: 'Gestión de Items',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});
