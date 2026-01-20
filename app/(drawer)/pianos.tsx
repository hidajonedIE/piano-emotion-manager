import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { useHeader } from '@/contexts/HeaderContext';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, ActivityIndicator, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { PianoCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
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
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
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

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: t('navigation.pianos'),
      subtitle: `${totalPianos} ${totalPianos === 1 ? 'piano' : 'pianos'}`,
      icon: 'pianokeys',
      showBackButton: false,
    });
  }, [totalPianos, t, setHeaderConfig]);
  
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Estadísticas por categoría
  const stats = useMemo(() => {
    const upright = pianos.filter(p => p.category === 'vertical').length;
    const grand = pianos.filter(p => p.category === 'cola').length;
    const digital = pianos.filter(p => p.category === 'digital').length;
    
    return { upright, grand, digital };
  }, [pianos]);

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
    { key: 'cola', label: t('pianos.categories.grand') },
    { key: 'digital', label: t('pianos.categories.digital') },
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
      {/* Grid de estadísticas por categoría */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
          <Ionicons name="square" size={24} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.upright}</Text>
          <Text style={styles.statLabel}>Verticales</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
          <Ionicons name="triangle" size={24} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.grand}</Text>
          <Text style={styles.statLabel}>De Cola</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="hardware-chip" size={24} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.digital}</Text>
          <Text style={styles.statLabel}>Digitales</Text>
        </View>
      </View>

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
          showBackButton={false}
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

      {/* Acciones rápidas */}
      {pianos.length > 0 && (
        <View style={styles.actionsSection}>
          <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="download" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Importar</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="share" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Exportar</Text>
            </Pressable>
          </View>
        </View>
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Grid de estadísticas
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statsSectionDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
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
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Acciones rápidas
  actionsSection: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionsGridDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#e07a5f',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
