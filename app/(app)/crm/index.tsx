/**
 * Página Principal de CRM
 * Piano Emotion Manager
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ClientList } from '@/components/crm';

export default function CRMScreen() {
  const router = useRouter();

  const handleSelectClient = (client: any) => {
    router.push(`/crm/client/${client.id}`);
  };

  return (
    <View style={styles.container}>
      <ClientList onSelectClient={handleSelectClient} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
