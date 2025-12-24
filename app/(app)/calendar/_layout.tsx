/**
 * Layout de Calendario
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function CalendarLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('calendar.title'),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: t('calendar.settings'),
        }}
      />
    </Stack>
  );
}
