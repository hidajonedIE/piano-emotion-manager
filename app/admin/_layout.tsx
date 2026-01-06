/**
 * Admin Layout
 * Layout para las pantallas de administración
 */
import { Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AdminLayout() {
  const backgroundColor = useThemeColor({}, 'background');

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
    </Stack>
  );
}
