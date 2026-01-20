/**
 * Página de Herramientas Avanzadas
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DashboardAdvancedTools } from '@/components/dashboard/dashboard-advanced-tools';

export default function AdvancedToolsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <DashboardAdvancedTools />
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
