import { useRouter, Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FAB } from '@/components/fab';
import { useInvoices } from '@/hooks/use-invoices';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Invoice, INVOICE_STATUS_LABELS } from '@/types/invoice';

export default function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, loading } = useInvoices();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear'>('all');

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    return invoices
      .filter(inv => {
        const matchesSearch = 
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        
        // Filtro por fecha
        let matchesDate = true;
        if (dateFilter !== 'all') {
          const invDate = new Date(inv.date);
          const invMonth = invDate.getMonth();
          const invYear = invDate.getFullYear();
          
          if (dateFilter === 'thisMonth') {
            matchesDate = invMonth === thisMonth && invYear === thisYear;
          } else if (dateFilter === 'lastMonth') {
            matchesDate = invMonth === lastMonth && invYear === lastMonthYear;
          } else if (dateFilter === 'thisYear') {
            matchesDate = invYear === thisYear;
          }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const pending = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0);
    const paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    return { total, pending, paid };
  }, [invoices]);

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return success;
      case 'sent': return accent;
      case 'cancelled': return error;
      default: return warning;
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <Pressable
        style={[styles.invoiceCard, { backgroundColor: cardBg, borderColor }]}
        onPress={() => router.push({ pathname: '/invoice/[id]' as any, params: { id: item.id } })}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <ThemedText style={styles.invoiceNumber}>{item.invoiceNumber}</ThemedText>
            <ThemedText style={[styles.invoiceDate, { color: textSecondary }]}>
              {new Date(item.date).toLocaleDateString('es-ES')}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {INVOICE_STATUS_LABELS[item.status]}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.clientName}>{item.clientName}</ThemedText>

        <View style={styles.invoiceFooter}>
          <ThemedText style={[styles.itemsCount, { color: textSecondary }]}>
            {item.items.length} concepto{item.items.length !== 1 ? 's' : ''}
          </ThemedText>
          <ThemedText style={[styles.total, { color: accent }]}>
            €{item.total.toFixed(2)}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const statuses: (Invoice['status'] | 'all')[] = ['all', 'draft', 'sent', 'paid', 'cancelled'];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Facturas' }} />

      {/* Resumen */}
      <View style={[styles.statsContainer, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Total facturado</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>€{stats.total.toFixed(2)}</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Pendiente</ThemedText>
          <ThemedText style={[styles.statValue, { color: warning }]}>€{stats.pending.toFixed(2)}</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Cobrado</ThemedText>
          <ThemedText style={[styles.statValue, { color: success }]}>€{stats.paid.toFixed(2)}</ThemedText>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchContainer, { borderColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Buscar factura..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          data={statuses}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.filterChip,
              { borderColor },
              statusFilter === item && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => setStatusFilter(item)}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: statusFilter === item ? '#FFFFFF' : textSecondary },
              ]}
            >
              {item === 'all' ? 'Todas' : INVOICE_STATUS_LABELS[item]}
            </ThemedText>
          </Pressable>
        )}
        />
      </View>

      {/* Filtros de fecha */}
      <View style={styles.dateFiltersRow}>
        <ThemedText style={[styles.dateFilterLabel, { color: textSecondary }]}>Periodo:</ThemedText>
        <FlatList
          horizontal
          data={['all', 'thisMonth', 'lastMonth', 'thisYear'] as const}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.dateFiltersContainer}
          renderItem={({ item }) => {
            const labels = {
              all: 'Todo',
              thisMonth: 'Este mes',
              lastMonth: 'Mes anterior',
              thisYear: 'Este año',
            };
            return (
              <Pressable
                style={[
                  styles.dateFilterChip,
                  { borderColor },
                  dateFilter === item && { backgroundColor: `${accent}20`, borderColor: accent },
                ]}
                onPress={() => setDateFilter(item)}
              >
                <ThemedText
                  style={[
                    styles.dateFilterText,
                    { color: dateFilter === item ? accent : textSecondary },
                  ]}
                >
                  {labels[item]}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Lista de facturas */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {searchQuery ? 'No se encontraron facturas' : 'No hay facturas creadas'}
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textSecondary }]}>
              Crea tu primera factura pulsando el botón +
            </ThemedText>
          </View>
        }
      />

      <FAB
        icon="plus"
        onPress={() => router.push({ pathname: '/invoice/[id]' as any, params: { id: 'new' } })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  filtersWrapper: {
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateFilterLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  dateFiltersContainer: {
    gap: Spacing.xs,
  },
  dateFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  invoiceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 17,
    fontWeight: '600',
  },
  invoiceDate: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 15,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  itemsCount: {
    fontSize: 13,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
