/**
 * Página de Accesos Rápidos
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DashboardAccessShortcuts } from '@/components/dashboard/dashboard-access-shortcuts';

export default function QuickAccessScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <DashboardAccessShortcuts />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
