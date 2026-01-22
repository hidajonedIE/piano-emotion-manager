/**
 * Página Principal de Tienda
 * Piano Emotion Manager
 */

import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useHeader } from '@/contexts/HeaderContext';
import { ShopViewModern } from '@/components/shop';

export default function StoreScreen() {
  const { setHeaderConfig } = useHeader();

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
    setHeaderConfig({
      title: 'Store',
      subtitle: 'Tienda de pianos y accesorios',
      icon: 'cart.fill',
      showBackButton: false,
    });
    }, [setHeaderConfig])
  );

  return (
    <View style={styles.container}>
      <ShopViewModern />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
