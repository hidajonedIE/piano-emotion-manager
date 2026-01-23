/**
 * Página Principal de Tienda
 * Piano Emotion Manager
 */

import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useHeader } from '@/contexts/HeaderContext';
import { ShopViewElegant } from '@/components/shop';

export default function StoreScreen() {
  const { setHeaderConfig } = useHeader();

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
    setHeaderConfig({
      title: 'Piano Emotion Store',
      subtitle: 'Artículos y componentes para la reparación, restauración y afinación de pianos',
      icon: 'music.note',
      iconColor: '#FFFFFF',
      showBackButton: false,
    });
    }, [setHeaderConfig])
  );

  return (
    <View style={styles.container}>
      <ShopViewElegant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
