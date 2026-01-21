/**
 * Pianos Screen - Elegant Professional Design
 * Piano Emotion Manager
 * 
 * Diseño siguiendo el patrón del Dashboard:
 * - Header configurado con useHeader
 * - Búsqueda y filtros elegantes
 * - Grid de estadísticas
 * - Lista de pianos con cards profesionales
 * - Acciones rápidas
 * - FAB para añadir piano
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
import { useClientsData, usePianosData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { PianoCard, EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { Piano, PianoCategory, getClientFullName } from '@/types';
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

type FilterType = 'all' | PianoCategory;

export default function PianosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Hook con filtrado
  const { 
    pianos, 
    totalPianos,
    loading, 
    refresh,
    loadMore,
    hasMore,
    isLoadingMore,
  } = usePianosData({
    search: debouncedSearch,
    category: filter !== 'all' ? filter : undefined,
    pageSize: 30,
  });

  const { getClient } = useClientsData();

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: 'Pianos',
      subtitle: `${totalPianos} ${totalPianos === 1 ? 'piano' : 'pianos'}`,
      icon: 'music.note',
      showBackButton: false,
    });
  }, [totalPianos, setHeaderConfig]);

  // Estadísticas por categoría
  const stats = useMemo(() => {
    const upright = pianos.filter(p => p.category === 'vertical').length;
    const grand = pianos.filter(p => p.category === 'cola').length;
    const digital = pianos.filter(p => p.category === 'digital').length;
    
    return { upright, grand, digital };
  }, [pianos]);

  // Filtrar pianos
  const filteredPianos = useMemo(() => {
    return pianos;
  }, [pianos]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Navegación
  const handleAddPiano = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/pianos/new');
  }, [router]);

  const handlePianoPress = useCallback((piano: Piano) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/pianos/${piano.id}`);
  }, [router]);

  // Filtros de categoría
  const categoryFilters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'Todos', icon: 'apps' },
    { key: 'vertical', label: 'Vertical', icon: 'square' },
    { key: 'cola', label: 'Cola', icon: 'triangle' },
    { key: 'digital', label: 'Digital', icon: 'hardware-chip' },
  ];

  // Render de loading inicial
  if (loading && pianos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="pianos" />
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
          {/* Estadísticas por categoría */}
          <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
            <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
              <Ionicons name="square" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.upright}</Text>
              <Text style={styles.statLabel}>Verticales</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
              <Ionicons name="triangle" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.grand}</Text>
              <Text style={styles.statLabel}>De Cola</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Ionicons name="hardware-chip" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.digital}</Text>
              <Text style={styles.statLabel}>Digitales</Text>
            </View>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchSection}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar pianos..."
            />
          </View>

          {/* Filtros de categoría */}
          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {categoryFilters.map((item) => (
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

          {/* Lista de pianos */}
          <View style={styles.pianosSection}>
            {filteredPianos.length === 0 ? (
              <EmptyState
                icon="musical-notes-outline"
                title="No hay pianos"
                message="Añade tu primer piano para comenzar"
                actionLabel="Añadir Piano"
                onAction={handleAddPiano}
              />
            ) : (
              <FlatList
                data={filteredPianos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PianoCard
                    piano={item}
                    onPress={() => handlePianoPress(item)}
                    clientName={
                      item.clientId
                        ? getClientFullName(getClient(item.clientId))
                        : undefined
                    }
                  />
                )}
                contentContainerStyle={styles.pianosList}
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
                  router.push('/pianos/import');
                }}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Importar Pianos</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/pianos/export');
                }}
              >
                <Ionicons name="cloud-download-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Exportar Lista</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB para añadir piano */}
      <FAB 
        onPress={handleAddPiano} 
        accessibilityLabel="Añadir piano"
        accessibilityHint="Añade un nuevo piano al inventario"
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
  },
  statsSectionDesktop: {
    maxWidth: 800,
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
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
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

  // Lista de pianos
  pianosSection: {
    marginBottom: Spacing.xl,
  },
  pianosList: {
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
