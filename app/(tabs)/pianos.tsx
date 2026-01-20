import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PianoCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { useClientsData, usePianosData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Piano, PianoCategory, getClientFullName } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';

type FilterType = 'all' | PianoCategory;

export default function PianosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search para evitar demasiadas peticiones
  const debouncedSearch = useDebounce(search, 300);

  // Hook con filtrado en backend
  const { 
    pianos, 
    totalPianos,
    loading, 
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
    brands,
  } = usePianosData({
    search: debouncedSearch,
    category: filter !== 'all' ? filter : undefined,
    pageSize: 30,
  });

  const { getClient } = useClientsData();

  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const handlePianoPress = useCallback((piano: Piano) => {
    router.push({
      pathname: '/piano/[id]',
      params: { id: piano.id },
    });
  }, [router]);

  const handleAddPiano = useCallback(() => {
    router.push({
      pathname: '/piano/[id]',
      params: { id: 'new' },
    });
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
    [getClient, handlePianoPress]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={accent} />
      </View>
    );
  }, [isLoadingMore, accent]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'vertical', label: t('pianos.categories.upright') },
    { key: 'grand', label: t('pianos.categories.grand') },
    { key: 'digital', label: t('pianos.categories.digital') },
  ];

  // Mostrar animación de carga inicial
  if (loading && pianos.length === 0) {
    return (
      <LinearGradient
        colors={['#003a8c', '#001d4a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <ScreenHeader 
          title={t('navigation.pianos')} 
          icon="pianokeys"
          showBackButton={true}
        />
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="pianos" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#003a8c', '#001d4a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader 
        title={t('navigation.pianos')} 
        subtitle={`${totalPianos} ${totalPianos === 1 ? 'piano' : 'pianos'}`}
        icon="pianokeys"
        showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search') + '...'}
          accessibilityLabel={t('common.search') + ' ' + t('navigation.pianos').toLowerCase()}
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
            accessibilityRole="button"
            accessibilityLabel={`${t('common.filter')}: ${f.label}`}
            accessibilityState={{ selected: filter === f.key }}
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

      {pianos.length === 0 ? (
        <EmptyState
          icon="pianokeys"
          showBackButton={true}
          title={search || filter !== 'all' ? t('common.noResults') : t('pianos.noPianos')}
          message={
            search || filter !== 'all'
              ? t('common.noResults')
              : t('pianos.addFirstPiano')
          }
        />
      ) : (
        <FlatList
          data={pianos}
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
        onPress={handleAddPiano} 
        accessibilityLabel={t('pianos.newPiano')}
        accessibilityHint={t('pianos.addFirstPiano')}
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
    borderRadius: 8,
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
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
