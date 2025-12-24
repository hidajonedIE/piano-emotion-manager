import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PianoCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useClientsData, usePianosData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Piano, PianoCategory, getClientFullName } from '@/types';

type FilterType = 'all' | PianoCategory;

export default function PianosScreen() {
  const router = useRouter();
  const { pianos, loading, refresh } = usePianosData();
  const { getClient } = useClientsData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  // Filtrar pianos
  const filteredPianos = useMemo(() => {
    let result = pianos;

    // Filtrar por categoría
    if (filter !== 'all') {
      result = result.filter((p) => p.category === filter);
    }

    // Filtrar por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((p) => {
        const client = getClient(p.clientId);
        return (
          p.brand.toLowerCase().includes(searchLower) ||
          p.model.toLowerCase().includes(searchLower) ||
          p.serialNumber?.toLowerCase().includes(searchLower) ||
          (client ? getClientFullName(client).toLowerCase().includes(searchLower) : false)
        );
      });
    }

    return result;
  }, [pianos, filter, search, getClient]);

  const handlePianoPress = (piano: Piano) => {
    router.push({
      pathname: '/piano/[id]',
      params: { id: piano.id },
    });
  };

  const handleAddPiano = () => {
    router.push({
      pathname: '/piano/[id]',
      params: { id: 'new' },
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refresh) {
      await refresh();
    }
    setRefreshing(false);
  }, [refresh]);

  const renderItem = useCallback(
    ({ item }: { item: Piano }) => {
      const client = getClient(item.clientId);
      return (
        <PianoCard
          piano={item}
          clientName={client ? getClientFullName(client) : undefined}
          onPress={() => handlePianoPress(item)}
        />
      );
    },
    [getClient]
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'vertical', label: 'Verticales' },
    { key: 'grand', label: 'De Cola' },
  ];

  // Mostrar animación de carga inicial
  if (loading && pianos.length === 0) {
    return (
      <LinearGradient
        colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <ScreenHeader 
          title="Pianos" 
          icon="pianokeys"
        />
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="pianos" />
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
        title="Pianos" 
        subtitle={`${pianos.length} ${pianos.length === 1 ? 'piano' : 'pianos'}`}
        icon="pianokeys"
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar piano o cliente..."
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              { backgroundColor: cardBg, borderColor },
              filter === f.key && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === f.key ? '#FFFFFF' : textSecondary },
              ]}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {filteredPianos.length === 0 ? (
        <EmptyState
          icon="pianokeys"
          title={search || filter !== 'all' ? 'Sin resultados' : 'Sin pianos'}
          message={
            search || filter !== 'all'
              ? 'No se encontraron pianos con ese criterio.'
              : 'Agrega tu primer piano tocando el botón + abajo.'
          }
        />
      ) : (
        <FlatList
          data={filteredPianos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7A8B99"
              title="Actualizando pianos..."
              titleColor="#7A8B99"
            />
          }
        />
      )}

      <FAB 
        onPress={handleAddPiano} 
        accessibilityLabel="Añadir nuevo piano"
        accessibilityHint="Pulsa para registrar un nuevo piano"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
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
