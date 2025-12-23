import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ClientMap } from '@/components/client-map';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useClients } from '@/hooks/use-clients';
import { Client } from '@/types';

export default function ClientsMapScreen() {
  const router = useRouter();
  const { clients } = useClients();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const handleClientSelect = (client: Client) => {
    router.push(`/client/${client.id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mapa de Clientes',
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
        }}
      />
      
      <View style={styles.mapContainer}>
        <ClientMap 
          clients={clients} 
          onClientSelect={handleClientSelect}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
});
