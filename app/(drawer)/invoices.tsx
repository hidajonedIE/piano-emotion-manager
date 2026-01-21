/**
 * Invoices Screen - Original Modern Design
 * Piano Emotion Manager
 * 
 * Diseño original y moderno:
 * - Layout único con dashboard horizontal
 * - Paleta oficial: rojo teja #e07a5f, verde sobrio
 * - Tipografía elegante y espaciado generoso
 * - Cards con diseño asimétrico
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useHeader } from '@/contexts/HeaderContext';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, Text, useWindowDimensions } from 'react-native';

import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { useInvoicesData } from '@/hooks/data';
import { BorderRadius, Spacing, Colors } from '@/constants/theme';
import { Invoice, INVOICE_STATUS_LABELS } from '@/types/invoice';
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';

// Paleta oficial de Piano Emotion
const THEME = {
  primary: '#1A1A2E',        // Azul oscuro profundo
  accent: '#e07a5f',         // Terracota (rojo teja)
  success: '#6B9080',        // Verde sobrio (no vibrante)
  warning: '#F59E0B',        // Ámbar
  error: '#EF4444',          // Rojo
  background: '#FAFAFA',     // Fondo claro
  surface: '#FFFFFF',        // Blanco
  surfaceAlt: '#F8F9FA',     // Gris muy claro
  border: '#E5E7EB',         // Gris claro
  textPrimary: '#1A1A2E',    // Texto principal
  textSecondary: '#6B7280',  // Texto secundario
  textTertiary: '#9CA3AF',   // Texto terciario
};

type FilterType = 'all' | Invoice['status'];
type PeriodType = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear';

export default function InvoicesScreen() {
  const router = useRouter();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Aplicar filtro desde alertas
  useEffect(() => {
    if (params.filter === 'pending' || params.filter === 'overdue') {
      setFilter('sent');
    }
  }, [params.filter]);

  const debouncedSearch = useDebounce(search, 300);
  const { invoices, loading } = useInvoicesData();

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
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const pending = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
    const paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const draft = invoices.filter(inv => inv.status === 'draft').length;
    const cancelled = invoices.filter(inv => inv.status === 'cancelled').length;
    
    return { 
      total, 
      pending, 
      paid,
      count: invoices.length,
      draft,
      cancelled,
    };
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
        
        let matchesOverdue = true;
        if (params.filter === 'overdue' && inv.dueDate) {
          const dueDate = new Date(inv.dueDate);
          matchesOverdue = dueDate < now;
        }
        
        return matchesSearch && matchesStatus && matchesDate && matchesOverdue;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, debouncedSearch, filter, period, params.filter]);

  const statusFilters = useMemo(() => [
    { key: 'all' as FilterType, label: 'Todas' },
    { key: 'draft' as FilterType, label: 'Borrador' },
    { key: 'sent' as FilterType, label: 'Enviada' },
    { key: 'paid' as FilterType, label: 'Pagada' },
    { key: 'cancelled' as FilterType, label: 'Anulada' },
  ], []);

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
      {/* Dashboard horizontal original */}
      <View style={[styles.dashboard, isDesktop && styles.dashboardDesktop]}>
        {/* Card principal con total */}
        <View style={[styles.mainCard, { backgroundColor: THEME.primary }]}>
          <Text style={styles.mainCardLabel}>Total Facturado</Text>
          <Text style={styles.mainCardValue}>€{stats.total.toFixed(2)}</Text>
          <View style={styles.mainCardFooter}>
            <Text style={styles.mainCardFooterText}>{stats.count} facturas</Text>
          </View>
        </View>

        {/* Cards secundarios */}
        <View style={styles.secondaryCards}>
          <View style={[styles.secondaryCard, { borderLeftColor: THEME.warning, borderLeftWidth: 4 }]}>
            <Text style={styles.secondaryCardLabel}>Pendiente</Text>
            <Text style={[styles.secondaryCardValue, { color: THEME.warning }]}>
              €{stats.pending.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.secondaryCard, { borderLeftColor: THEME.success, borderLeftWidth: 4 }]}>
            <Text style={styles.secondaryCardLabel}>Cobrado</Text>
            <Text style={[styles.secondaryCardValue, { color: THEME.success }]}>
              €{stats.paid.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Mini stats */}
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{stats.draft}</Text>
            <Text style={styles.miniStatLabel}>Borradores</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{stats.cancelled}</Text>
            <Text style={styles.miniStatLabel}>Anuladas</Text>
          </View>
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

      {/* Filtros en línea */}
      <View style={styles.filtersRow}>
        <Text style={styles.filtersLabel}>Estado:</Text>
        <View style={styles.filtersChips}>
          {statusFilters.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && { backgroundColor: THEME.primary },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive,
              ]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filtersRow}>
        <Text style={styles.filtersLabel}>Período:</Text>
        <View style={styles.filtersChips}>
          {periodFilters.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                period === f.key && { backgroundColor: THEME.accent },
              ]}
              onPress={() => setPeriod(f.key)}
            >
              <Text style={[
                styles.filterChipText,
                period === f.key && styles.filterChipTextActive,
              ]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
              tintColor={THEME.textSecondary}
            />
          }
        />
      )}

      <FAB 
        onPress={handleAddInvoice} 
        accessibilityLabel="Nueva factura"
      />
    </View>
  );
}

// Card de factura con diseño asimétrico
function InvoiceCard({ invoice, onPress }: { invoice: Invoice; onPress: () => void }) {
  const statusConfig = {
    draft: { color: THEME.textTertiary, bg: THEME.surfaceAlt, label: 'Borrador' },
    sent: { color: THEME.warning, bg: THEME.warning + '15', label: 'Enviada' },
    paid: { color: THEME.success, bg: THEME.success + '15', label: 'Pagada' },
    cancelled: { color: THEME.textSecondary, bg: THEME.border, label: 'Anulada' },
  };

  const config = statusConfig[invoice.status];

  return (
    <Pressable
      style={styles.invoiceCard}
      onPress={onPress}
    >
      {/* Barra lateral de color según estado */}
      <View style={[styles.invoiceColorBar, { backgroundColor: config.color }]} />
      
      <View style={styles.invoiceContent}>
        {/* Header con número y fecha */}
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[styles.invoiceStatusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.invoiceStatusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Cliente */}
        <Text style={styles.invoiceClient}>{invoice.clientName}</Text>

        {/* Footer con fecha, conceptos y total */}
        <View style={styles.invoiceFooter}>
          <View style={styles.invoiceFooterLeft}>
            <Text style={styles.invoiceDate}>{formatDate(invoice.date)}</Text>
            <Text style={styles.invoiceConcepts}>
              {invoice.items?.length || 0} concepto{(invoice.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.invoiceTotal}>€{invoice.total.toFixed(2)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dashboard horizontal original
  dashboard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dashboardDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  mainCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainCardValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainCardFooter: {
    marginTop: Spacing.xs,
  },
  mainCardFooterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: THEME.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  secondaryCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryCardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  miniStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  miniStat: {
    flex: 1,
    backgroundColor: THEME.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.primary,
  },
  miniStatLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
  },

  // Búsqueda
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Filtros en línea
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filtersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
    minWidth: 60,
  },
  filtersChips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: THEME.surfaceAlt,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Lista
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
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
    color: THEME.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
  },

  // Card de factura con diseño asimétrico
  invoiceCard: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  invoiceColorBar: {
    width: 4,
  },
  invoiceContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.primary,
  },
  invoiceStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceClient: {
    fontSize: 15,
    color: THEME.textPrimary,
    fontWeight: '500',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  invoiceFooterLeft: {
    gap: 4,
  },
  invoiceDate: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  invoiceConcepts: {
    fontSize: 11,
    color: THEME.textTertiary,
  },
  invoiceTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.accent,
  },
});
