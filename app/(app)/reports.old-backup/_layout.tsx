/**
 * Layout de Reportes
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function ReportsLayout() {
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
          title: t('reports.analytics'),
        }}
      />
      <Stack.Screen
        name="all"
        options={{
          title: t('reports.allReports'),
        }}
      />
    </Stack>
  );
}
