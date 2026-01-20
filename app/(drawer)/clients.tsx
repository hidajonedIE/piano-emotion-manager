import { useTranslation } from '@/hooks/use-translation';
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
import { BorderRadius, Spacing } from '@/constants/theme';
import { Client, getClientFullName } from '@/types';

export default function ClientsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const { clients, loading, refresh } = useClientsData();
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

  // Estadísticas simples
  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'active').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;
    const vip = clients.filter(c => c.isVIP).length;
    const withPianos = clients.filter(c => 
      pianos.some(p => p.clientId === c.id)
    ).length;
    
    return { active, inactive, vip, withPianos };
  }, [clients, pianos]);

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
      <LinearGradient
        colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
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
      {/* Grid de estadísticas */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="star" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.vip}</Text>
          <Text style={styles.statLabel}>VIP</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
          <Ionicons name="musical-notes" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.withPianos}</Text>
          <Text style={styles.statLabel}>Con Pianos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#64748b' }]}>
          <Ionicons name="pause-circle" size={20} color="#ffffff" />
          <Text style={styles.statNumber}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>Inactivos</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search') + '...'}
          accessibilityLabel={t('common.search') + ' ' + t('navigation.clients').toLowerCase()}
        />
      </View>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon="person.2.fill"
          showBackButton={true}
          title={search ? t('common.noResults') : t('clients.noClients')}
          message={
            search
              ? t('common.noResults')
              : t('clients.addFirstClient')
          }
        />
      ) : (
        <FlatList
          data={filteredClients}
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
      {filteredClients.length > 0 && (
        <View style={styles.actionsSection}>
          <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="cloud-upload" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Importar</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Ionicons name="share" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Exportar</Text>
            </Pressable>
          </View>
        </View>
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
