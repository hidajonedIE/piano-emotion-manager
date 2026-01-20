/**
 * Página Principal de Tienda
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShopView } from '@/components/shop';

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <ShopView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
