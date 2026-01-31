/**
 * Página Principal de Reportes y Analytics
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AnalyticsDashboard } from '@/components/reports';

export default function ReportsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AnalyticsDashboard
        onNavigateToReports={() => router.push('/reports/all')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
