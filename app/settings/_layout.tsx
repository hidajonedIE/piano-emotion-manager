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
        headerTitleStyle: { fontWeight: '600', fontFamily: 'Arkhip' },
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
      <Stack.Screen 
        name="business" 
        options={{ 
          title: 'Mi Empresa',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="einvoicing" 
        options={{ 
          title: 'Facturación Electrónica',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="ai" 
        options={{ 
          title: 'Inteligencia Artificial',
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="invitations" 
        options={{ 
          title: 'Gestión de Invitaciones',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}
