/**
 * Página Principal de Inventario
 * Piano Emotion Manager
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { InventoryDashboard } from '@/components/inventory';

export default function InventoryIndexScreen() {
  const router = useRouter();

  return (
    <InventoryDashboard
      onNavigateToProducts={() => router.push('/inventory/products')}
      onNavigateToAlerts={() => router.push('/inventory/alerts')}
      onNavigateToWarehouses={() => router.push('/inventory/warehouses')}
      onNavigateToOrders={() => router.push('/inventory/orders')}
      onNavigateToReorder={() => router.push('/inventory/reorder')}
    />
  );
}
