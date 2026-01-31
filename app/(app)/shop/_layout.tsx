/**
 * Layout de Tienda
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function ShopLayout() {
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
          title: t('shop.title'),
        }}
      />
      <Stack.Screen
        name="cart"
        options={{
          title: t('shop.cart'),
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: t('shop.orders'),
        }}
      />
      <Stack.Screen
        name="approvals"
        options={{
          title: t('shop.approvals'),
        }}
      />
    </Stack>
  );
}
