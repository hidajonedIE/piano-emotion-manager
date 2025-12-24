/**
 * Layout de Páginas de Equipo
 * Piano Emotion Manager
 * 
 * Define la navegación y estructura de las páginas de gestión de equipos.
 */

import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme-color';

export default function TeamLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Equipo',
        }}
      />
      <Stack.Screen
        name="members"
        options={{
          title: 'Miembros',
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Calendario',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Configuración',
        }}
      />
      <Stack.Screen
        name="create-organization"
        options={{
          title: 'Nueva Organización',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
