/**
 * Invoices Screen - Professional Minimalist Design
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
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useHeader } from '@/contexts/HeaderContext';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, Text, useWindowDimensions, ActivityIndicator } from 'react-native';

import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { useInvoicesData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Invoice, INVOICE_STATUS_LABELS } from '@/types/invoice';
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';

// Paleta profesional minimalista (igual que Pianos)
const COLORS = {
  primary: '#003a8c',       // Azul corporativo
  background: '#ffffff',    // Blanco puro
  surface: '#f8f9fa',       // Gris muy claro
  border: '#e5e7eb',        // Gris claro para bordes
  textPrimary: '#1a1a1a',   // Negro casi puro
  textSecondary: '#6b7280', // Gris medio
  textTertiary: '#9ca3af',  // Gris claro
  accent: '#e07a5f',        // Terracota (solo para acciones)
  success: '#10b981',       // Verde para pagado
  warning: '#f59e0b',       // Naranja para pendiente
};

type FilterType = 'all' | Invoice['status'];
type PeriodType = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';

export default function InvoicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Aplicar filtro automáticamente cuando se viene desde una alerta
  useEffect(() => {
    if (params.filter === 'pending') {
      setFilter('sent');
    } else if (params.filter === 'overdue') {
      setFilter('sent');
    }
  }, [params.filter]);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Hook con datos de facturas
  const { invoices, loading } = useInvoicesData();

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
      setHeaderConfig({
        title: 'Facturación',
        subtitle: `${invoices.length} ${invoices.length === 1 ? 'factura' : 'facturas'}`,
        icon: 'document-text',
        showBackButton: false,
      });
    }, [invoices.length, setHeaderConfig])
  );

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const pending = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
    const collected = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    return { totalBilled, pending, collected };
  }, [invoices]);

  // Filtrar facturas
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    return invoices
      .filter(inv => {
        const matchesSearch = 
          inv.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          inv.clientName.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesStatus = filter === 'all' || inv.status === filter;
        
        // Filtro por fecha
        let matchesDate = true;
        if (period !== 'all') {
          const invDate = new Date(inv.date);
          const invMonth = invDate.getMonth();
          const invYear = invDate.getFullYear();
          
          if (period === 'thisMonth') {
            matchesDate = invMonth === thisMonth && invYear === thisYear;
          } else if (period === 'lastMonth') {
            matchesDate = invMonth === lastMonth && invYear === lastMonthYear;
          } else if (period === 'thisYear') {
            matchesDate = invYear === thisYear;
          }
        }
        
        // Filtro adicional para facturas vencidas
        let matchesOverdue = true;
        if (params.filter === 'overdue' && inv.dueDate) {
          const dueDate = new Date(inv.dueDate);
          matchesOverdue = dueDate < now;
        }
        
        return matchesSearch && matchesStatus && matchesDate && matchesOverdue;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, debouncedSearch, filter, period, params.filter]);

  // Filtros de estado
  const statusFilters = useMemo(() => [
    { key: 'all' as FilterType, label: 'Todas' },
    { key: 'draft' as FilterType, label: 'Borrador' },
    { key: 'sent' as FilterType, label: 'Enviada' },
    { key: 'paid' as FilterType, label: 'Pagada' },
    { key: 'cancelled' as FilterType, label: 'Anulada' },
  ], []);

  // Filtros de período
  const periodFilters = useMemo(() => [
    { key: 'all' as PeriodType, label: 'Todo' },
    { key: 'thisMonth' as PeriodType, label: 'Este mes' },
    { key: 'lastMonth' as PeriodType, label: 'Mes anterior' },
    { key: 'thisYear' as PeriodType, label: 'Este año' },
  ], []);

  const handleInvoicePress = useCallback((invoice: Invoice) => {
    router.push({
      pathname: '/invoice/[id]' as any,
      params: { id: invoice.id },
    });
  }, [router]);

  const handleAddInvoice = useCallback(() => {
    router.push({
      pathname: '/invoice/[id]' as any,
      params: { id: 'new' },
    });
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Aquí iría la lógica de refresh si el hook lo soporta
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = useCallback(({ item }: { item: Invoice }) => (
    <InvoiceCard 
      invoice={item}
      onPress={() => handleInvoicePress(item)}
    />
  ), [handleInvoicePress]);

  if (loading && invoices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="invoices" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Estadísticas minimalistas */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>€{stats.totalBilled.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total facturado</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.warning }]}>€{stats.pending.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Pendiente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>€{stats.collected.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Cobrado</Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar factura..."
          accessibilityLabel="Buscar facturas"
        />
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersContainer}>
        {statusFilters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f.key)}
            accessibilityRole="button"
            accessibilityLabel={`Filtro: ${f.label}`}
            accessibilityState={{ selected: filter === f.key }}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Filtros de período */}
      <View style={styles.periodContainer}>
        <Text style={styles.periodLabel}>Período:</Text>
        {periodFilters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.periodChip,
              period === f.key && styles.periodChipActive,
            ]}
            onPress={() => setPeriod(f.key)}
            accessibilityRole="button"
            accessibilityLabel={`Período: ${f.label}`}
            accessibilityState={{ selected: period === f.key }}
          >
            <Text
              style={[
                styles.periodText,
                period === f.key && styles.periodTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista de facturas */}
      {filteredInvoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {search || filter !== 'all' ? 'No hay resultados' : 'No hay facturas'}
          </Text>
          <Text style={styles.emptyMessage}>
            {search || filter !== 'all'
              ? 'Intenta con otros filtros'
              : 'Crea tu primera factura'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.textSecondary}
              title="Cargando..."
              titleColor={COLORS.textSecondary}
            />
          }
        />
      )}

      <FAB 
        onPress={handleAddInvoice} 
        accessibilityLabel="Nueva factura"
        accessibilityHint="Crear una nueva factura"
      />
    </View>
  );
}

// Componente InvoiceCard minimalista
function InvoiceCard({ invoice, onPress }: { invoice: Invoice; onPress: () => void }) {
  const statusColors = {
    draft: COLORS.textTertiary,
    sent: COLORS.warning,
    paid: COLORS.success,
    cancelled: COLORS.textSecondary,
  };

  const statusLabels = {
    draft: 'Borrador',
    sent: 'Enviada',
    paid: 'Pagada',
    cancelled: 'Anulada',
  };

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Factura ${invoice.invoiceNumber}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.cardDate}>{formatDate(invoice.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[invoice.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[invoice.status] }]}>
            {statusLabels[invoice.status]}
          </Text>
        </View>
      </View>
      
      <Text style={styles.cardClient}>{invoice.clientName}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.cardConcepts}>{invoice.items?.length || 0} conceptos</Text>
        <Text style={styles.cardTotal}>€{invoice.total.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

// Función auxiliar para formatear fecha
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
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
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Búsqueda
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Filtros de estado
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Filtros de período
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },

  // Lista
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Card de factura
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardClient: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardConcepts: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
