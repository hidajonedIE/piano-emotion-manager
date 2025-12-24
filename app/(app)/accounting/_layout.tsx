/**
 * Layout de Contabilidad
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function AccountingLayout() {
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
          title: t('accounting.title'),
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          title: t('accounting.transactions'),
        }}
      />
      <Stack.Screen
        name="accounts"
        options={{
          title: t('accounting.accounts'),
        }}
      />
      <Stack.Screen
        name="budgets"
        options={{
          title: t('accounting.budgets'),
        }}
      />
    </Stack>
  );
}
