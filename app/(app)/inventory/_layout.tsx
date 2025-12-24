/**
 * Layout de Inventario
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';

export default function InventoryLayout() {
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
          title: t('inventory.dashboard'),
        }}
      />
      <Stack.Screen
        name="products"
        options={{
          title: t('inventory.products'),
        }}
      />
      <Stack.Screen
        name="warehouses"
        options={{
          title: t('inventory.warehouses'),
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: t('inventory.purchaseOrders'),
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          title: t('inventory.alerts'),
        }}
      />
      <Stack.Screen
        name="reorder"
        options={{
          title: t('inventory.reorder'),
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          title: t('inventory.productDetails'),
        }}
      />
      <Stack.Screen
        name="warehouse/[id]"
        options={{
          title: t('inventory.warehouseDetails'),
        }}
      />
    </Stack>
  );
}
