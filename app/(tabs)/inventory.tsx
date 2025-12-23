import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInventory } from '@/hooks/use-inventory';
import { BorderRadius, Spacing } from '@/constants/theme';
import { MATERIAL_CATEGORY_LABELS, MaterialCategory } from '@/types/inventory';
import { InventoryItem } from '@/hooks/use-inventory';

type FilterType = 'all' | 'low_stock' | MaterialCategory;

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, loading, getLowStockItems } = useInventory();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const success = useThemeColor({}, 'success');

  const lowStockItems = getLowStockItems();

  // Filtrar items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filtrar por stock bajo
    if (filter === 'low_stock') {
      result = lowStockItems;
    } else if (filter !== 'all') {
      result = result.filter((i) => i.category === filter);
    }

    // Filtrar por búsqueda
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(searchLower) ||
          i.description?.toLowerCase().includes(searchLower) ||
          i.supplierName?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar: primero los de stock bajo, luego alfabéticamente
    return result.sort((a, b) => {
      const aLow = a.quantity <= a.minStock;
      const bLow = b.quantity <= b.minStock;
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, filter, search, lowStockItems]);

  const handleItemPress = (item: InventoryItem) => {
    router.push({
      pathname: '/inventory/[id]' as any,
      params: { id: item.id },
    });
  };

  const handleAddItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/inventory/[id]' as any,
      params: { id: 'new' },
    });
  };

  const getStockColor = (item: InventoryItem) => {
    if (item.quantity === 0) return error;
    if (item.quantity <= item.minStock) return warning;
    return success;
  };

  const renderItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const stockColor = getStockColor(item);
      const isLowStock = item.quantity <= item.minStock;

      return (
        <Pressable
          style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => handleItemPress(item)}
        >
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {item.name}
              </ThemedText>
              {isLowStock && (
                <View style={[styles.alertBadge, { backgroundColor: `${stockColor}20` }]}>
                  <IconSymbol
                    name="exclamationmark.triangle.fill"
                    size={12}
                    color={stockColor}
                  />
                </View>
              )}
            </View>

            <ThemedText style={[styles.itemCategory, { color: textSecondary }]}>
              {item.categoryName || (item.category ? MATERIAL_CATEGORY_LABELS[item.category as keyof typeof MATERIAL_CATEGORY_LABELS] : 'Sin categoría')}
            </ThemedText>

            <View style={styles.stockRow}>
              <View style={styles.stockInfo}>
                <ThemedText style={[styles.stockLabel, { color: textSecondary }]}>
                  Stock:
                </ThemedText>
                <ThemedText style={[styles.stockValue, { color: stockColor }]}>
                  {item.quantity} {item.unit}
                </ThemedText>
              </View>
              <ThemedText style={[styles.minStock, { color: textSecondary }]}>
                Mín: {item.minStock}
              </ThemedText>
            </View>

            {item.price !== undefined && (
              <ThemedText style={[styles.itemPrice, { color: textSecondary }]}>
                €{item.price.toFixed(2)} / {item.unit}
              </ThemedText>
            )}
          </View>

          <IconSymbol name="chevron.right" size={20} color={textSecondary} />
        </Pressable>
      );
    },
    [cardBg, borderColor, textSecondary, error, warning, success]
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'low_stock', label: `Stock bajo (${lowStockItems.length})` },
    { key: 'strings', label: 'Cuerdas' },
    { key: 'hammers', label: 'Martillos' },
    { key: 'felts', label: 'Fieltros' },
    { key: 'tools', label: 'Herramientas' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <ThemedText type="title">Inventario</ThemedText>
        <ThemedText style={styles.subtitle}>
          {items.length} {items.length === 1 ? 'material' : 'materiales'}
          {lowStockItems.length > 0 && (
            <ThemedText style={{ color: warning }}> · {lowStockItems.length} con stock bajo</ThemedText>
          )}
        </ThemedText>
      </View>

      {/* Alerta de stock bajo */}
      {lowStockItems.length > 0 && filter !== 'low_stock' && (
        <Pressable
          style={[styles.alertBanner, { backgroundColor: '#FEF3C7', borderColor: warning }]}
          onPress={() => setFilter('low_stock')}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color={warning} />
          <ThemedText style={styles.alertText}>
            {lowStockItems.length} {lowStockItems.length === 1 ? 'material necesita' : 'materiales necesitan'} reposición
          </ThemedText>
          <IconSymbol name="chevron.right" size={16} color={warning} />
        </Pressable>
      )}

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar material..."
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item: f }) => (
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: cardBg, borderColor },
                filter === f.key && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: filter === f.key ? '#FFFFFF' : textSecondary },
                ]}
              >
                {f.label}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <LoadingSpinner messageType="inventory" size="medium" />
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="shippingbox.fill"
          title={search || filter !== 'all' ? 'Sin resultados' : 'Inventario vacío'}
          message={
            search || filter !== 'all'
              ? 'No se encontraron materiales con ese criterio.'
              : 'Agrega tu primer material tocando el botón + abajo.'
          }
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={handleAddItem} />
    </ThemedView>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 2,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filtersWrapper: {
    marginBottom: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  alertBadge: {
    padding: 4,
    borderRadius: BorderRadius.sm,
  },
  itemCategory: {
    fontSize: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 13,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  minStock: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 12,
    marginTop: 2,
  },
});
