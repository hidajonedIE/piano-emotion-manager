import { useRouter, Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FAB } from '@/components/fab';
import { useServiceCatalog } from '@/hooks/use-service-catalog';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { ServiceRate, ServiceRateCategory, SERVICE_RATE_CATEGORY_LABELS } from '@/types/service-catalog';

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rates, loading, toggleRateActive, resetToDefaults } = useServiceCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceRateCategory | 'all'>('all');

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const textColor = useThemeColor({}, 'text');

  const categories: (ServiceRateCategory | 'all')[] = [
    'all', 'tuning', 'maintenance', 'regulation', 'repair', 'inspection', 'transport', 'other'
  ];

  const filteredRates = useMemo(() => {
    return rates.filter(rate => {
      const matchesSearch = rate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || rate.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [rates, searchQuery, selectedCategory]);

  const handleToggleActive = async (rate: ServiceRate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleRateActive(rate.id);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Restaurar tarifas',
      '¿Estás seguro de que quieres restaurar las tarifas por defecto? Se perderán las tarifas personalizadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const renderRate = ({ item }: { item: ServiceRate }) => (
    <Pressable
      style={[
        styles.rateCard,
        { backgroundColor: cardBg, borderColor },
        !item.isActive && styles.rateCardInactive,
      ]}
      onPress={() => router.push({ pathname: '/rate/[id]' as any, params: { id: item.id } })}
    >
      <View style={styles.rateHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: `${accent}15` }]}>
          <ThemedText style={[styles.categoryText, { color: accent }]}>
            {SERVICE_RATE_CATEGORY_LABELS[item.category]}
          </ThemedText>
        </View>
        <Pressable
          style={[
            styles.activeToggle,
            { backgroundColor: item.isActive ? `${success}15` : `${textSecondary}15` },
          ]}
          onPress={() => handleToggleActive(item)}
        >
          <IconSymbol
            name={item.isActive ? 'checkmark.circle.fill' : 'circle'}
            size={16}
            color={item.isActive ? success : textSecondary}
          />
        </Pressable>
      </View>

      <ThemedText style={[styles.rateName, !item.isActive && { color: textSecondary }]}>
        {item.name}
      </ThemedText>

      {item.description && (
        <ThemedText style={[styles.rateDescription, { color: textSecondary }]} numberOfLines={2}>
          {item.description}
        </ThemedText>
      )}

      <View style={styles.rateFooter}>
        <View style={styles.priceContainer}>
          <ThemedText style={[styles.price, { color: accent }]}>
            €{item.basePrice.toFixed(2)}
          </ThemedText>
          <ThemedText style={[styles.taxInfo, { color: textSecondary }]}>
            +{item.taxRate}% IVA
          </ThemedText>
        </View>

        {item.estimatedDuration ? (
          <View style={styles.durationContainer}>
            <IconSymbol name="clock.fill" size={14} color={textSecondary} />
            <ThemedText style={[styles.duration, { color: textSecondary }]}>
              {formatDuration(item.estimatedDuration)}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tarifas de Servicios',
          headerRight: () => (
            <Pressable onPress={handleResetDefaults}>
              <IconSymbol name="arrow.counterclockwise" size={22} color={accent} />
            </Pressable>
          ),
        }}
      />

      {/* Barra de búsqueda */}
      <View style={[styles.searchContainer, { borderColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Buscar servicio..."
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

      {/* Filtros de categoría */}
      <View style={{ alignItems: 'center' }}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
          style={{ flexGrow: 0 }}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryFilter,
                { borderColor },
                selectedCategory === item && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <ThemedText
                style={[
                  styles.categoryFilterText,
                  { color: selectedCategory === item ? '#FFFFFF' : textSecondary },
                ]}
              >
                {item === 'all' ? 'Todos' : SERVICE_RATE_CATEGORY_LABELS[item]}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      {/* Lista de tarifas */}
      <FlatList
        data={filteredRates}
        keyExtractor={(item) => item.id}
        renderItem={renderRate}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        style={{ marginTop: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              {searchQuery ? 'No se encontraron servicios' : 'No hay tarifas configuradas'}
            </ThemedText>
          </View>
        }
      />

      {/* Resumen */}
      <View style={[styles.summaryBar, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={[styles.summaryText, { color: textSecondary }]}>
          {filteredRates.filter(r => r.isActive).length} servicios activos de {filteredRates.length}
        </ThemedText>
      </View>

      <FAB
        icon="plus"
        onPress={() => router.push({ pathname: '/rate/[id]' as any, params: { id: 'new' } })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryFilter: {
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rateCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  rateCardInactive: {
    opacity: 0.6,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activeToggle: {
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  rateName: {
    fontSize: 17,
    fontWeight: '600',
  },
  rateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  rateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  taxInfo: {
    fontSize: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  summaryBar: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
  },
});
