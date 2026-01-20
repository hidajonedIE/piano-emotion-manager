/**
 * Clients Screen - Elegant Professional Design
 * Piano Emotion Manager
 * 
 * Diseño siguiendo el patrón del Dashboard:
 * - Header configurado con useHeader
 * - Búsqueda y filtros elegantes
 * - Grid de estadísticas por región/ruta
 * - Lista de clientes con cards profesionales
 * - Acciones rápidas
 * - FAB para añadir cliente
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useHeader } from '@/contexts/HeaderContext';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks y componentes
import { useClientsData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { ClientCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { Client, getClientFullName } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';
import { BorderRadius, Spacing } from '@/constants/theme';

// Colores del diseño Elegant Professional
const COLORS = {
  primary: '#003a8c',      // Azul Cobalto
  accent: '#e07a5f',       // Terracota
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  cardBg: '#ffffff',
  border: '#e5e7eb',
};

export default function ClientsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Hook con filtrado
  const { 
    clients, 
    totalClients,
    loading, 
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
    regions,
  } = useClientsData({
    search: debouncedSearch,
    region: selectedRegion,
    pageSize: 30,
  });

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: 'Clientes',
      subtitle: `${totalClients} ${totalClients === 1 ? 'cliente' : 'clientes'}`,
      icon: 'person.2.fill',
      showBackButton: false,
    });
  }, [totalClients, setHeaderConfig]);

  // Estadísticas por región
  const stats = useMemo(() => {
    const regionCounts = regions.map(region => ({
      region,
      count: clients.filter(c => c.region === region).length,
    })).sort((a, b) => b.count - a.count);

    return regionCounts.slice(0, 4); // Top 4 regiones
  }, [clients, regions]);

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return clients;
  }, [clients]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Navegación
  const handleAddClient = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/clients/new');
  }, [router]);

  const handleClientPress = useCallback((client: Client) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/clients/${client.id}`);
  }, [router]);

  // Colores para las cards de estadísticas
  const statColors = ['#7c3aed', '#0891b2', '#10b981', '#f59e0b'];

  // Render de loading inicial
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor principal con padding */}
        <View style={styles.mainContent}>
          {/* Estadísticas por región */}
          {stats.length > 0 && (
            <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
              {stats.map((stat, index) => (
                <View 
                  key={stat.region} 
                  style={[styles.statCard, { backgroundColor: statColors[index] }]}
                >
                  <Ionicons name="location" size={24} color={COLORS.white} />
                  <Text style={styles.statNumber}>{stat.count}</Text>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {stat.region || 'Sin región'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Búsqueda */}
          <View style={styles.searchSection}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar clientes..."
            />
          </View>

          {/* Filtros de región */}
          {regions.length > 0 && (
            <View style={styles.filtersSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
              >
                <Pressable
                  style={[
                    styles.filterButton,
                    selectedRegion === null && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedRegion(null);
                  }}
                >
                  <Ionicons
                    name="apps"
                    size={18}
                    color={selectedRegion === null ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedRegion === null && styles.filterButtonTextActive,
                    ]}
                  >
                    Todas las regiones
                  </Text>
                </Pressable>
                {regions.map((region) => (
                  <Pressable
                    key={region}
                    style={[
                      styles.filterButton,
                      selectedRegion === region && styles.filterButtonActive,
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedRegion(region);
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={selectedRegion === region ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedRegion === region && styles.filterButtonTextActive,
                      ]}
                    >
                      {region}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Lista de clientes */}
          <View style={styles.clientsSection}>
            {filteredClients.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No hay clientes"
                message="Añade tu primer cliente para comenzar"
                actionLabel="Añadir Cliente"
                onAction={handleAddClient}
              />
            ) : (
              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ClientCard
                    client={item}
                    onPress={() => handleClientPress(item)}
                  />
                )}
                contentContainerStyle={styles.clientsList}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.loadingMore}>
                      <LoadingSpinner size="small" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>

          {/* Acciones rápidas */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/clients/import');
                }}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Importar Clientes</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/clients/export');
                }}
              >
                <Ionicons name="cloud-download-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Exportar Lista</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB para añadir cliente */}
      <FAB 
        onPress={handleAddClient} 
        accessibilityLabel="Añadir cliente"
        accessibilityHint="Añade un nuevo cliente"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    padding: Spacing.lg,
  },
  
  // Estadísticas
  statsSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  statsSectionDesktop: {
    maxWidth: 1000,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },

  // Búsqueda
  searchSection: {
    marginBottom: Spacing.md,
  },

  // Filtros
  filtersSection: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },

  // Lista de clientes
  clientsSection: {
    marginBottom: Spacing.xl,
  },
  clientsList: {
    gap: Spacing.md,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Acciones rápidas
  actionsSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionsGridDesktop: {
    maxWidth: 600,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: COLORS.accent,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
