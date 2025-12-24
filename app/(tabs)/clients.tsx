import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ClientCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedView } from '@/components/themed-view';
import { useClientsData, usePianosData } from '@/hooks/data';
import { Spacing } from '@/constants/theme';
import { Client, getClientFullName } from '@/types';

export default function ClientsScreen() {
  const router = useRouter();
  const { clients, loading, refresh } = useClientsData();
  const { pianos } = usePianosData();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filtrar clientes por búsqueda
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const searchLower = search.toLowerCase();
    return clients.filter(
      (c) =>
        getClientFullName(c).toLowerCase().includes(searchLower) ||
        c.phone.includes(search) ||
        c.email?.toLowerCase().includes(searchLower)
    );
  }, [clients, search]);

  // Contar pianos por cliente
  const getPianoCount = useCallback(
    (clientId: string) => pianos.filter((p) => p.clientId === clientId).length,
    [pianos]
  );

  const handleClientPress = (client: Client) => {
    router.push({
      pathname: '/client/[id]',
      params: { id: client.id },
    });
  };

  const handleAddClient = () => {
    router.push('/client/new');
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refresh) {
      await refresh();
    }
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(
    ({ item }: { item: Client }) => (
      <ClientCard
        client={item}
        pianoCount={getPianoCount(item.id)}
        onPress={() => handleClientPress(item)}
      />
    ),
    [getPianoCount]
  );

  // Mostrar animación de carga inicial
  if (loading && clients.length === 0) {
    return (
      <LinearGradient
        colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <ScreenHeader 
          title="Clientes" 
          icon="person.2.fill"
        />
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="clients" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader 
        title="Clientes" 
        subtitle={`${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}`}
        icon="person.2.fill"
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cliente..."
        />
      </View>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon="person.2.fill"
          title={search ? 'Sin resultados' : 'Sin clientes'}
          message={
            search
              ? 'No se encontraron clientes con ese criterio de búsqueda.'
              : 'Agrega tu primer cliente tocando el botón + abajo.'
          }
        />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7A8B99"
              title="Actualizando clientes..."
              titleColor="#7A8B99"
            />
          }
        />
      )}

      <FAB onPress={handleAddClient} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
