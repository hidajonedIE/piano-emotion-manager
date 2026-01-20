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
  const { clients, loading, refresh, stats } = useClientsData();
  const { pianos } = usePianosData();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: t('navigation.clients'),
      subtitle: `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}`,
      icon: 'person.2.fill',
      showBackButton: false,
    });
  }, [clients.length, t, setHeaderConfig]);

  // Estadísticas desde el backend (getStats endpoint)

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const searchLower = search.toLowerCase();
    return clients.filter((c) => {
      const fullName = getClientFullName(c).toLowerCase();
      const email = c.email?.toLowerCase() || '';
      const phone = c.phone?.toLowerCase() || '';
      const address = c.address?.toLowerCase() || '';
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        address.includes(searchLower)
      );
    });
  }, [clients, search]);

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
      const clientPianos = pianos.filter(p => p.clientId === item.id);
      return (
        <ClientCard
          client={item}
          pianosCount={clientPianos.length}
          onPress={() => handleClientPress(item)}
        />
      );
    },
    [pianos]
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

      {/* Lista de clientes */}
      <FlatList
        data={filteredClients}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Botones de acción */}
      <View style={[styles.actionsSection, isDesktop && styles.actionsSectionDesktop]}>
        <Pressable style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="cloud-upload-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionButtonText}>Importar</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => {}}>
          <Ionicons name="cloud-download-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionButtonText}>Exportar</Text>
        </Pressable>
      </View>

      {/* FAB */}
      <FAB icon="add" onPress={handleAddClient} label={t('clients.add')} />
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
  
  // Lista
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  listContentDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  
  // Acciones
  actionsSection: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: COLORS.background,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionsSectionDesktop: {
    left: Spacing.xl,
    right: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
