/**
 * Services Screen - Professional Minimalist Design
 * Piano Emotion Manager
 * 
 * Diseño profesional y minimalista:
 * - Estadísticas limpias y sobrias
 * - Paleta neutra con acentos azules
 * - Sin colorines infantiles
 * - Tipografía limpia y espaciado generoso
 */
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, Text } from 'react-native';
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

// Paleta profesional minimalista
const COLORS = {
  primary: '#003a8c',
  surface: '#f8f9fa',
  border: '#e5e7eb',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b7280',
};

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

  // Estadísticas por tipo
  const stats = useMemo(() => {
    const tuning = services.filter(s => s.type === 'tuning').length;
    const maintenance = services.filter(s => s.type === 'maintenance').length;
    const repair = services.filter(s => s.type === 'repair').length;
    const regulation = services.filter(s => s.type === 'regulation').length;
    
    return { 
      total: services.length,
      tuning,
      maintenance,
      repair,
      regulation
    };
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
      isPast: new Date(s.date) < now
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
    { key: 'all', label: 'Todos' },
    { key: 'tuning', label: 'Afinación' },
    { key: 'repair', label: 'Reparación' },
    { key: 'maintenance', label: 'Limpieza' },
    { key: 'regulation', label: 'Regulación' },
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
          title="Servicios" 
          icon="wrench.fill" 
          showBackButton={true}
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
        title="Servicios" 
        subtitle={`${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}`}
        icon="wrench.fill" 
        showBackButton={true}
      />

      {/* Estadísticas minimalistas */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOTAL</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.tuning}</Text>
          <Text style={styles.statLabel}>AFINACIONES</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.repair}</Text>
          <Text style={styles.statLabel}>REPARACIONES</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.maintenance}</Text>
          <Text style={styles.statLabel}>LIMPIEZAS</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar servicios..."
          accessibilityLabel="Buscar servicios"
        />
      </View>

      {/* Filtros minimalistas */}
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
          icon="wrench.fill"
          title={search || filter !== 'all' ? 'No se encontraron resultados' : 'No hay servicios'}
          message={
            search || filter !== 'all'
              ? 'Intenta con otros términos de búsqueda'
              : 'Añade tu primer servicio para comenzar'
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
              title="Cargando..."
              titleColor="#7A8B99"
            />
          }
        />
      )}

      <FAB 
        onPress={handleAddService} 
        accessibilityLabel="Añadir nuevo servicio"
        accessibilityHint="Crear un nuevo servicio"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Estadísticas
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
