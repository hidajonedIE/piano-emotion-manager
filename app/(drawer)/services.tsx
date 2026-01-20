/**
 * Services Screen - Elegant Professional Design
 * Piano Emotion Manager
 * 
 * Diseño siguiendo el patrón del Dashboard:
 * - Header configurado con useHeader
 * - Búsqueda y filtros elegantes
 * - Grid de estadísticas por tipo de servicio
 * - Lista de servicios con cards profesionales
 * - Acciones rápidas
 * - FAB para añadir servicio
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
import { useClientsData, usePianosData, useServicesData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { ServiceCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { Service, ServiceType, getClientFullName } from '@/types';
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

type FilterType = 'all' | ServiceType;

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Datos
  const { services, loading, refresh } = useServicesData();
  const { getPiano } = usePianosData();
  const { getClient } = useClientsData();

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: 'Servicios',
      subtitle: `${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}`,
      icon: 'wrench.and.screwdriver.fill',
      showBackButton: false,
    });
  }, [services.length, setHeaderConfig]);

  // Estadísticas por tipo
  const stats = useMemo(() => {
    const tuning = services.filter(s => s.type === 'afinacion').length;
    const cleaning = services.filter(s => s.type === 'limpieza').length;
    const repair = services.filter(s => s.type === 'reparacion').length;
    const regulation = services.filter(s => s.type === 'regulacion').length;
    
    return { tuning, cleaning, repair, regulation };
  }, [services]);

  // Filtrar servicios
  const filteredServices = useMemo(() => {
    let result = [...services].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (filter !== 'all') {
      result = result.filter(s => s.type === filter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => {
        const client = s.clientId ? getClient(s.clientId) : null;
        const clientName = client ? getClientFullName(client).toLowerCase() : '';
        const piano = s.pianoId ? getPiano(s.pianoId) : null;
        const pianoInfo = piano ? `${piano.brand} ${piano.model}`.toLowerCase() : '';
        
        return clientName.includes(searchLower) || pianoInfo.includes(searchLower);
      });
    }

    return result;
  }, [services, filter, search, getClient, getPiano]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Navegación
  const handleAddService = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/services/new');
  }, [router]);

  const handleServicePress = useCallback((service: Service) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/services/${service.id}`);
  }, [router]);

  // Filtros de tipo
  const typeFilters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'Todos', icon: 'apps' },
    { key: 'afinacion', label: 'Afinación', icon: 'musical-notes' },
    { key: 'limpieza', label: 'Limpieza', icon: 'water' },
    { key: 'reparacion', label: 'Reparación', icon: 'construct' },
    { key: 'regulacion', label: 'Regulación', icon: 'settings' },
  ];

  // Render de loading inicial
  if (loading && services.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="services" />
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
          {/* Estadísticas por tipo */}
          <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
            <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
              <Ionicons name="musical-notes" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.tuning}</Text>
              <Text style={styles.statLabel}>Afinaciones</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
              <Ionicons name="water" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.cleaning}</Text>
              <Text style={styles.statLabel}>Limpiezas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Ionicons name="construct" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.repair}</Text>
              <Text style={styles.statLabel}>Reparaciones</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="settings" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.regulation}</Text>
              <Text style={styles.statLabel}>Regulaciones</Text>
            </View>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchSection}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar servicios..."
            />
          </View>

          {/* Filtros de tipo */}
          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {typeFilters.map((item) => (
                <Pressable
                  key={item.key}
                  style={[
                    styles.filterButton,
                    filter === item.key && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setFilter(item.key);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={filter === item.key ? COLORS.white : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === item.key && styles.filterButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Lista de servicios */}
          <View style={styles.servicesSection}>
            {filteredServices.length === 0 ? (
              <EmptyState
                icon="construct-outline"
                title="No hay servicios"
                message="Añade tu primer servicio para comenzar"
                actionLabel="Añadir Servicio"
                onAction={handleAddService}
              />
            ) : (
              <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onPress={() => handleServicePress(item)}
                    clientName={
                      item.clientId
                        ? getClientFullName(getClient(item.clientId))
                        : undefined
                    }
                    pianoInfo={
                      item.pianoId
                        ? (() => {
                            const piano = getPiano(item.pianoId);
                            return piano ? `${piano.brand} ${piano.model}` : undefined;
                          })()
                        : undefined
                    }
                  />
                )}
                contentContainerStyle={styles.servicesList}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={COLORS.primary}
                  />
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
                  router.push('/services/calendar');
                }}
              >
                <Ionicons name="calendar-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Ver Calendario</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/services/export');
                }}
              >
                <Ionicons name="cloud-download-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Exportar Lista</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB para añadir servicio */}
      <FAB 
        onPress={handleAddService} 
        accessibilityLabel="Añadir servicio"
        accessibilityHint="Añade un nuevo servicio"
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

  // Lista de servicios
  servicesSection: {
    marginBottom: Spacing.xl,
  },
  servicesList: {
    gap: Spacing.md,
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
