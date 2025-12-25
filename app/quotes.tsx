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
import { useQuotes } from '@/hooks/use-quotes';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido',
};

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  items: any[];
  total: number;
  pianoDescription?: string;
}

export default function QuotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { quotes, loading } = useQuotes();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((quote: Quote) => {
        const matchesSearch = 
          quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quote.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a: Quote, b: Quote) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quotes, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = quotes.reduce((sum: number, q: Quote) => sum + q.total, 0);
    const pending = quotes.filter((q: Quote) => q.status === 'sent').reduce((sum: number, q: Quote) => sum + q.total, 0);
    const accepted = quotes.filter((q: Quote) => q.status === 'accepted').reduce((sum: number, q: Quote) => sum + q.total, 0);
    const converted = quotes.filter((q: Quote) => q.status === 'converted').reduce((sum: number, q: Quote) => sum + q.total, 0);
    return { total, pending, accepted, converted };
  }, [quotes]);

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted': return success;
      case 'converted': return success;
      case 'sent': return accent;
      case 'rejected': return error;
      case 'expired': return error;
      default: return warning;
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const renderQuote = ({ item }: { item: Quote }) => {
    const statusColor = getStatusColor(item.status);
    const expired = item.status === 'sent' && isExpired(item.validUntil);
    
    return (
      <Pressable
        style={[styles.quoteCard, { backgroundColor: cardBg, borderColor }]}
        onPress={() => router.push({ pathname: '/quote/[id]' as any, params: { id: item.id } })}
      >
        <View style={styles.quoteHeader}>
          <View>
            <ThemedText style={styles.quoteNumber}>{item.quoteNumber}</ThemedText>
            <ThemedText style={[styles.quoteDate, { color: textSecondary }]}>
              {new Date(item.date).toLocaleDateString('es-ES')}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${expired ? error : statusColor}15` }]}>
            <ThemedText style={[styles.statusText, { color: expired ? error : statusColor }]}>
              {expired ? 'Expirado' : QUOTE_STATUS_LABELS[item.status]}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.clientName}>{item.clientName}</ThemedText>
        
        {item.pianoDescription && (
          <ThemedText style={[styles.pianoDescription, { color: textSecondary }]}>
            🎹 {item.pianoDescription}
          </ThemedText>
        )}

        <View style={styles.quoteFooter}>
          <View style={styles.footerLeft}>
            <ThemedText style={[styles.itemsCount, { color: textSecondary }]}>
              {item.items?.length || 0} concepto{(item.items?.length || 0) !== 1 ? 's' : ''}
            </ThemedText>
            <ThemedText style={[styles.validUntil, { color: expired ? error : textSecondary }]}>
              Válido hasta: {new Date(item.validUntil).toLocaleDateString('es-ES')}
            </ThemedText>
          </View>
          <ThemedText style={[styles.total, { color: accent }]}>
            €{item.total.toFixed(2)}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const statuses: (QuoteStatus | 'all')[] = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Presupuestos' }} />

      {/* Resumen */}
      <View style={[styles.statsContainer, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Total</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>€{stats.total.toFixed(2)}</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Pendientes</ThemedText>
          <ThemedText style={[styles.statValue, { color: warning }]}>€{stats.pending.toFixed(2)}</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Aceptados</ThemedText>
          <ThemedText style={[styles.statValue, { color: success }]}>€{stats.accepted.toFixed(2)}</ThemedText>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={[styles.searchContainer, { borderColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Buscar presupuesto..."
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
      <FlatList
        horizontal
        data={statuses}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
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
              {item === 'all' ? 'Todos' : QUOTE_STATUS_LABELS[item]}
            </ThemedText>
          </Pressable>
        )}
      />

      {/* Lista de presupuestos */}
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuote}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {searchQuery ? 'No se encontraron presupuestos' : 'No hay presupuestos creados'}
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textSecondary }]}>
              Crea tu primer presupuesto pulsando el botón +
            </ThemedText>
          </View>
        }
      />

      <FAB
        icon="plus"
        onPress={() => router.push({ pathname: '/quote/[id]' as any, params: { id: 'new' } })}
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
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  quoteCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteNumber: {
    fontSize: 17,
    fontWeight: '600',
  },
  quoteDate: {
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
  pianoDescription: {
    fontSize: 13,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  footerLeft: {
    gap: 2,
  },
  itemsCount: {
    fontSize: 13,
  },
  validUntil: {
    fontSize: 12,
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
