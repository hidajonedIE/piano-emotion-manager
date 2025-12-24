/**
 * Layout para la sección de Configuración
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor: textColor,
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Configuración',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="modules" 
        options={{ 
          title: 'Módulos',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="subscription" 
        options={{ 
          title: 'Suscripción',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}
