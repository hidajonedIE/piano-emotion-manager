/**
 * Clients Screen - Professional Minimalist Design
 * Piano Emotion Manager
 * 
 * Diseño profesional y minimalista:
 * - Sin colorines infantiles
 * - Paleta neutra con acentos azules
 * - Estadísticas sobrias y elegantes
 * - Tipografía limpia y espaciado generoso
 */

import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useHeader } from '@/contexts/HeaderContext';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ClientCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { useClientsData, usePianosData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Client, getClientFullName } from '@/types';

// Paleta profesional minimalista
const COLORS = {
  primary: '#003a8c',       // Azul corporativo
  background: '#ffffff',    // Blanco puro
  surface: '#f8f9fa',       // Gris muy claro
  border: '#e5e7eb',        // Gris claro para bordes
  textPrimary: '#1a1a1a',   // Negro casi puro
  textSecondary: '#6b7280', // Gris medio
  textTertiary: '#9ca3af',  // Gris claro
  accent: '#e07a5f',        // Terracota (solo para acciones)
};

export default function ClientsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const { clients, loading, refresh, stats, loadMore, hasMore, isLoadingMore } = useClientsData({ pageSize: 300 }); // Cargar todos los clientes de una vez
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedRouteGroup, setSelectedRouteGroup] = useState<string>('');
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Calcular listas únicas para los filtros
  const uniqueProvinces = useMemo(() => {
    const provinces = clients
      .map(c => c.region)
      .filter((r): r is string => !!r);
    return ['Todas', ...Array.from(new Set(provinces)).sort()];
  }, [clients]);

  const uniqueCities = useMemo(() => {
    const cities = clients
      .map(c => c.city)
      .filter((c): c is string => !!c);
    return ['Todas', ...Array.from(new Set(cities)).sort()];
  }, [clients]);

  const uniqueRouteGroups = useMemo(() => {
    const groups = clients
      .map(c => c.routeGroup)
      .filter((g): g is string => !!g);
    return ['Todos', ...Array.from(new Set(groups)).sort()];
  }, [clients]);

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: t('navigation.clients'),
      subtitle: `${stats?.total || 0} ${(stats?.total || 0) === 1 ? 'cliente' : 'clientes'}`,
      icon: 'person.2.fill',
      showBackButton: false,
      rightAction: (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable 
            style={styles.headerButton}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Importar clientes"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.headerButtonText}>Importar</Text>
          </Pressable>
          <Pressable 
            style={styles.headerButton}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Exportar clientes"
          >
            <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.headerButtonText}>Exportar</Text>
          </Pressable>
        </View>
      ),
    });
  }, [stats?.total, t, setHeaderConfig]);

  // Estadísticas desde el backend (getStats endpoint)

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Filtro de búsqueda
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        const fullName = getClientFullName(c).toLowerCase();
        const email = c.email?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        const address = c.address?.toLowerCase() || '';
        
        const matchesSearch = (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          address.includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Filtro de provincia
      if (selectedProvince && selectedProvince !== 'Todas') {
        if (c.region !== selectedProvince) return false;
      }
      
      // Filtro de ciudad
      if (selectedCity && selectedCity !== 'Todas') {
        if (c.city !== selectedCity) return false;
      }
      
      // Filtro de grupo de ruta
      if (selectedRouteGroup && selectedRouteGroup !== 'Todos') {
        if (c.routeGroup !== selectedRouteGroup) return false;
      }
      
      return true;
    });
  }, [clients, search, selectedProvince, selectedCity, selectedRouteGroup]);
  
  // Calcular paginación
  // Usar stats.total para el cálculo total (sin filtros) ya que filteredClients puede estar limitado por el backend
  const totalPages = Math.ceil((stats?.total || 0) / ITEMS_PER_PAGE);
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage]);
  
  // Resetear a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProvince, selectedCity, selectedRouteGroup]);
  
  // Cargar más clientes automáticamente si la página actual necesita más datos
  useEffect(() => {
    const clientsNeeded = currentPage * ITEMS_PER_PAGE;
    console.log('[Paginación] Página:', currentPage, 'Clientes cargados:', clients.length, 'Filtrados:', filteredClients.length, 'Necesarios:', clientsNeeded, 'HasMore:', hasMore, 'IsLoadingMore:', isLoadingMore);
    if (filteredClients.length < clientsNeeded && hasMore && !isLoadingMore) {
      console.log('[Paginación] Cargando más clientes...');
      loadMore();
    }
  }, [currentPage, clients.length, filteredClients.length, hasMore, isLoadingMore, loadMore]);

  const handleClientPress = (client: Client) => {
    router.push({
      pathname: '/client/[id]' as any,
      params: { id: client.id },
    });
  };

  const handleAddClient = () => {
    router.push({
      pathname: '/client/[id]' as any,
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
    ({ item }: { item: Client }) => {
      return (
        <ClientCard
          client={item}
          pianoCount={(item as any).pianoCount || 0}
          onPress={() => handleClientPress(item)}
        />
      );
    },
    []
  );

  // Mostrar animación de carga inicial
  if (loading && clients.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="clients" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Estadísticas minimalistas */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.vip}</Text>
          <Text style={styles.statLabel}>VIP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.withPianos}</Text>
          <Text style={styles.statLabel}>Con Pianos</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={[styles.searchSection, isDesktop && styles.searchSectionDesktop]}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('clients.search')}
        />
      </View>

      {/* Filtros */}
      <View style={[styles.filtersSection, isDesktop && styles.filtersSectionDesktop]}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>COMUNIDAD</Text>
          <select 
            value={selectedProvince || ''}
            onChange={(e: any) => setSelectedProvince(e.target.value)}
            style={styles.filterSelect as any}
          >
            <option value="">Todas</option>
            {uniqueProvinces.filter(p => p !== 'Todas').map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </View>
        
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>CIUDAD</Text>
          <select 
            value={selectedCity || ''}
            onChange={(e: any) => setSelectedCity(e.target.value)}
            style={styles.filterSelect as any}
          >
            <option value="">Todas</option>
            {uniqueCities.filter(c => c !== 'Todas').map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </View>
        
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>GRUPO DE RUTA</Text>
          <select 
            value={selectedRouteGroup || ''}
            onChange={(e: any) => setSelectedRouteGroup(e.target.value)}
            style={styles.filterSelect as any}
          >
            <option value="">Todos</option>
            {uniqueRouteGroups.filter(g => g !== 'Todos').map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </View>
      </View>

      {/* Lista de clientes */}
      <FlatList
        data={paginatedClients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.listContentDesktop,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="person-add"
            title={search ? t('clients.noResults') : t('clients.empty')}
            message={
              search
                ? t('clients.noResultsMessage')
                : t('clients.emptyMessage')
            }
            actionLabel={search ? undefined : t('clients.addFirst')}
            onAction={search ? undefined : handleAddClient}
          />
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationContainer}>
              <Pressable
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.paginationButtonDisabled,
                ]}
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={currentPage === 1 ? COLORS.textTertiary : COLORS.primary} 
                />
                <Text style={[
                  styles.paginationButtonText,
                  currentPage === 1 && styles.paginationButtonTextDisabled,
                ]}>Anterior</Text>
              </Pressable>
              
              <Text style={styles.paginationInfo}>
                Página {currentPage} de {totalPages}
              </Text>
              
              <Pressable
                style={[
                  styles.paginationButton,
                  currentPage === totalPages && styles.paginationButtonDisabled,
                ]}
                onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={[
                  styles.paginationButtonText,
                  currentPage === totalPages && styles.paginationButtonTextDisabled,
                ]}>Siguiente</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={currentPage === totalPages ? COLORS.textTertiary : COLORS.primary} 
                />
              </Pressable>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* FAB */}
      <FAB icon="plus" onPress={handleAddClient} label={t('clients.add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Estadísticas minimalistas
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statsSectionDesktop: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Búsqueda
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchSectionDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  
  // Filtros
  filtersSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filtersSectionDesktop: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  filterSelect: {
    flex: 1,
    minHeight: 40,
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    outlineStyle: 'none', // Eliminar outline en web
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 36,
  },
  filterButtonText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  
  // Lista
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  listContentDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: COLORS.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  paginationButtonDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  paginationButtonTextDisabled: {
    color: COLORS.textTertiary,
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  
  // Botones del header
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
