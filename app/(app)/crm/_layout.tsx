/**
 * Layout de CRM
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function CRMLayout() {
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
          title: t('crm.title'),
        }}
      />
      <Stack.Screen
        name="client/[id]"
        options={{
          title: t('crm.clientDetails'),
        }}
      />
    </Stack>
  );
}
