/**
 * Página Principal de Contabilidad
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AccountingDashboard } from '@/components/accounting';

export default function AccountingScreen() {
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
