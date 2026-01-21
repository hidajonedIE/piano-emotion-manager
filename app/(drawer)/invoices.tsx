/**
 * Página Principal de Facturación
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHeader } from '@/contexts/HeaderContext';
import { AccountingDashboard } from '@/components/accounting';

export default function InvoicesScreen() {
  const { setHeaderConfig } = useHeader();

  // Configurar header al entrar en la sección
  useFocusEffect(
    React.useCallback(() => {
      setHeaderConfig({
        title: 'Facturación',
        subtitle: 'Gestión de facturas y contabilidad',
        icon: 'doc.text.fill',
        showBackButton: false,
      });
    }, [setHeaderConfig])
  );

  return (
    <View style={styles.container}>
      <AccountingDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
