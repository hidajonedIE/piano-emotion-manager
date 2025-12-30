import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ClientCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { useClientsData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { Spacing } from '@/constants/theme';
import { Client, getClientFullName } from '@/types';
import { Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';

export default function ClientsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search para evitar demasiadas peticiones
  const debouncedSearch = useDebounce(search, 300);

  // Hook con filtrado en backend
  const { 
    clients, 
    totalClients,
    loading, 
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
    regions,
    routeGroups,
  } = useClientsData({
    search: debouncedSearch,
    region: selectedRegion,
    routeGroup: selectedRoute,
    pageSize: 30,
  });

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const activeFiltersCount = (selectedRegion ? 1 : 0) + (selectedRoute ? 1 : 0);

  const handleClientPress = useCallback((client: Client) => {
    router.push({
      pathname: '/client/[id]',
      params: { id: client.id },
    });
  }, [router]);

  const handleAddClient = useCallback(() => {
    router.push('/client/new');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refresh) {
      await refresh();
    }
    setRefreshing(false);
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: Client }) => (
      <ClientCard
        client={item}
        pianoCount={0} // Se puede optimizar después con un endpoint específico
        onPress={() => handleClientPress(item)}
      />
    ),
    [handleClientPress]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={accent} />
      </View>
    );
  }, [isLoadingMore, accent]);

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
          title={t('navigation.clients')} 
          icon="person.2.fill" showBackButton={true}
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
        title={t('navigation.clients')} 
        subtitle={`${totalClients} ${totalClients === 1 ? t('clients.title').toLowerCase().slice(0, -1) : t('clients.title').toLowerCase()}`}
        icon="person.2.fill" showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('common.search') + '...'}
              accessibilityLabel={t('common.search') + ' ' + t('navigation.clients').toLowerCase()}
            />
          </View>
          <Pressable
            style={[styles.filterButton, { backgroundColor: cardBg, borderColor }, activeFiltersCount > 0 && { backgroundColor: accent }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <ThemedText style={{ color: activeFiltersCount > 0 ? '#FFFFFF' : textSecondary }}>
              {activeFiltersCount > 0 ? activeFiltersCount : ''} ⚙️
            </ThemedText>
          </Pressable>
        </View>
        
        {showFilters && (regions.length > 0 || routeGroups.length > 0) && (
          <View style={[styles.filtersContainer, { backgroundColor: cardBg, borderColor }]}>
            {regions.length > 0 && (
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterLabel, { color: textSecondary }]}>Región:</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterChips}>
                    <Pressable
                      style={[styles.filterChip, { borderColor }, !selectedRegion && { backgroundColor: accent }]}
                      onPress={() => setSelectedRegion(null)}
                    >
                      <ThemedText style={{ color: !selectedRegion ? '#FFFFFF' : textSecondary, fontSize: 12 }}>Todas</ThemedText>
                    </Pressable>
                    {regions.map(region => (
                      <Pressable
                        key={region}
                        style={[styles.filterChip, { borderColor }, selectedRegion === region && { backgroundColor: accent }]}
                        onPress={() => setSelectedRegion(selectedRegion === region ? null : region)}
                      >
                        <ThemedText style={{ color: selectedRegion === region ? '#FFFFFF' : textSecondary, fontSize: 12 }}>{region}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            
            {routeGroups.length > 0 && (
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterLabel, { color: textSecondary }]}>Ruta:</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterChips}>
                    <Pressable
                      style={[styles.filterChip, { borderColor }, !selectedRoute && { backgroundColor: accent }]}
                      onPress={() => setSelectedRoute(null)}
                    >
                      <ThemedText style={{ color: !selectedRoute ? '#FFFFFF' : textSecondary, fontSize: 12 }}>Todas</ThemedText>
                    </Pressable>
                    {routeGroups.map(route => (
                      <Pressable
                        key={route}
                        style={[styles.filterChip, { borderColor }, selectedRoute === route && { backgroundColor: accent }]}
                        onPress={() => setSelectedRoute(selectedRoute === route ? null : route)}
                      >
                        <ThemedText style={{ color: selectedRoute === route ? '#FFFFFF' : textSecondary, fontSize: 12 }}>{route}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {clients.length === 0 ? (
        <EmptyState
          icon="person.2.fill" showBackButton={true}
          title={search ? t('common.noResults') : t('clients.noClients')}
          message={
            search
              ? t('clients.noClients')
              : t('clients.addFirstClient')
          }
        />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
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
        onPress={handleAddClient} 
        accessibilityLabel={t('clients.newClient')}
        accessibilityHint={t('clients.addFirstClient')}
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
    paddingBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  filterSection: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
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
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
