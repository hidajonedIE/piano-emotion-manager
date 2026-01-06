/**
 * Onboarding Layout
 * Layout para el flujo de onboarding
 */
import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function OnboardingLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          title: 'Bienvenida',
        }}
      />
      <Stack.Screen
        name="step1"
        options={{
          title: 'Información Básica',
        }}
      />
      <Stack.Screen
        name="step2"
        options={{
          title: 'Personalización',
        }}
      />
      <Stack.Screen
        name="step3"
        options={{
          title: 'Configuración',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Éxito',
          gestureEnabled: false, // Prevent going back
        }}
      />
    </Stack>
  );
}
