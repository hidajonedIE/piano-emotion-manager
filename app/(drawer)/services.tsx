import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useHeader } from '@/contexts/HeaderContext';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ServiceCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
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
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
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

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
    setHeaderConfig({
      title: t('navigation.services'),
      subtitle: `${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}`,
      icon: 'wrench.and.screwdriver.fill',
      showBackButton: false,
    });
    }, [services.length, t, setHeaderConfig])
  );

  // Estadísticas por tipo
  const stats = useMemo(() => {
    const tuning = services.filter(s => s.type === 'tuning').length;
    const cleaning = services.filter(s => s.type === 'maintenance').length;
    const repair = services.filter(s => s.type === 'repair').length;
    const regulation = services.filter(s => s.type === 'regulation').length;
    
    return { tuning, cleaning, repair, regulation };
  }, [services]);

  // Filtrar servicios
  const filteredServices = useMemo(() => {
    const now = new Date();
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

    // Agregar flag isPast para determinar el color del borde
    return result.map(s => ({
      ...s,
      isPast: new Date(s.date) < now // true = completado (verde), false = pendiente (rojo)
    }));
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
          isPast={(item as any).isPast}
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
      {/* Grid de estadísticas por tipo */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="musical-notes" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.tuning}</Text>
          <Text style={styles.statLabel}>Afinaciones</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
          <Ionicons name="sparkles" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.cleaning}</Text>
          <Text style={styles.statLabel}>Limpiezas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="construct" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.repair}</Text>
          <Text style={styles.statLabel}>Reparaciones</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
          <Ionicons name="settings" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.regulation}</Text>
          <Text style={styles.statLabel}>Regulaciones</Text>
        </View>
      </View>

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
          style={{ flexGrow: 0 }}
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
          icon="wrench.fill" showBackButton={true}
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

      {/* Acciones rápidas */}
      {filteredServices.length > 0 && (
        <View style={styles.actionsSection}>
          <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="calendar" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Calendario</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="share" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Exportar</Text>
            </Pressable>
          </View>
        </View>
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
    gap: Spacing.xs,
  },
  statsSectionDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },

  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filtersWrapper: {
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    height: 34,
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
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
