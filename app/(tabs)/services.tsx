import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ServiceCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useClientsData, usePianosData, useServicesData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Service, ServiceType, getClientFullName } from '@/types';

type FilterType = 'all' | ServiceType;

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { services, loading, refresh } = useServicesData();
  const { getPiano } = usePianosData();
  const { getClient } = useClientsData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  // Filtrar servicios
  const filteredServices = useMemo(() => {
    let result = [...services].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Filtrar por tipo
    if (filter !== 'all') {
      result = result.filter((s) => s.type === filter);
    }

    // Filtrar por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((s) => {
        const piano = getPiano(s.pianoId);
        const client = getClient(s.clientId);
        return (
          piano?.brand.toLowerCase().includes(searchLower) ||
          piano?.model.toLowerCase().includes(searchLower) ||
          (client ? getClientFullName(client).toLowerCase().includes(searchLower) : false) ||
          s.notes?.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [services, filter, search, getPiano, getClient]);

  const handleServicePress = (service: Service) => {
    router.push({
      pathname: '/service/[id]' as any,
      params: { id: service.id },
    });
  };

  const handleAddService = () => {
    router.push({
      pathname: '/service/[id]' as any,
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
    ({ item }: { item: Service }) => {
      const piano = getPiano(item.pianoId);
      const client = getClient(item.clientId);
      return (
        <ServiceCard
          service={item}
          pianoInfo={piano ? `${piano.brand} ${piano.model}` : undefined}
          clientName={client ? getClientFullName(client) : undefined}
          onPress={() => handleServicePress(item)}
        />
      );
    },
    [getPiano, getClient]
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'tuning', label: t('services.types.tuning') },
    { key: 'repair', label: t('services.types.repair') },
    { key: 'maintenance', label: t('services.types.cleaning') },
    { key: 'regulation', label: t('services.types.regulation') },
  ];

  // Calcular estadísticas
  const totalCost = filteredServices.reduce((sum, s) => sum + (s.cost || 0), 0);

  // Mostrar animación de carga inicial
  if (loading && services.length === 0) {
    return (
      <LinearGradient
        colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <ScreenHeader 
          title={t('navigation.services')} 
          icon="wrench.fill"
        />
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="services" />
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
        title={t('navigation.services')} 
        subtitle={`${filteredServices.length} ${filteredServices.length === 1 ? t('services.title').toLowerCase().slice(0, -1) : t('services.title').toLowerCase()}${totalCost > 0 ? ` · €${totalCost.toFixed(0)}` : ''}`}
        icon="wrench.fill"
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search') + '...'}
          accessibilityLabel={t('common.search') + ' ' + t('navigation.services').toLowerCase()}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item: f }) => (
            <Pressable
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
          )}
        />
      </View>

      {filteredServices.length === 0 ? (
        <EmptyState
          icon="wrench.fill"
          title={search || filter !== 'all' ? t('common.noResults') : t('services.noServices')}
          message={
            search || filter !== 'all'
              ? t('common.noResults')
              : t('services.addFirstService')
          }
        />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7A8B99"
              title={t('common.loading')}
              titleColor="#7A8B99"
            />
          }
        />
      )}

      <FAB 
        onPress={handleAddService} 
        accessibilityLabel={t('services.newService')}
        accessibilityHint={t('services.addFirstService')}
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
  filtersWrapper: {
    marginBottom: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
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
