import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Supplier, SUPPLIER_TYPE_LABELS } from '@/types/supplier';
import { useState } from 'react';

export default function SuppliersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { suppliers, loading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState('');

  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'tint');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupplierPress = (supplier: Supplier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/supplier/[id]' as any, params: { id: supplier.id } });
  };

  const handleAddSupplier = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/supplier/[id]' as any, params: { id: 'new' } });
  };

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <Pressable
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={() => handleSupplierPress(item)}
    >
      <View style={[styles.avatar, { backgroundColor: `${accent}15` }]}>
        <IconSymbol name="building.2.fill" size={24} color={accent} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.name}>{item.name}</ThemedText>
        <ThemedText style={[styles.type, { color: secondaryText }]}>
          {SUPPLIER_TYPE_LABELS[item.type]}
        </ThemedText>
        {item.contactPerson && (
          <ThemedText style={[styles.contact, { color: secondaryText }]}>
            {item.contactPerson}
          </ThemedText>
        )}
        {item.city && (
          <ThemedText style={[styles.location, { color: secondaryText }]}>
            📍 {item.city}{item.country ? `, ${item.country}` : ''}
          </ThemedText>
        )}
      </View>
      <View style={styles.ratingContainer}>
        {item.rating && (
          <View style={styles.rating}>
            <IconSymbol name="star.fill" size={14} color="#F59E0B" />
            <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
          </View>
        )}
        <IconSymbol name="chevron.right" size={16} color={secondaryText} />
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={accent} />
        </Pressable>
        <ThemedText type="title" style={styles.title}>Proveedores</ThemedText>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar proveedor..."
      />

      {loading ? (
        <View style={styles.loadingState}>
          <LoadingSpinner messageType="suppliers" size="medium" />
        </View>
      ) : filteredSuppliers.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="building.2.fill" size={48} color={secondaryText} />
          <ThemedText style={[styles.emptyText, { color: secondaryText }]}>
            {searchQuery ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </ThemedText>
          {!searchQuery && (
            <Pressable style={[styles.addButton, { backgroundColor: accent }]} onPress={handleAddSupplier}>
              <ThemedText style={styles.addButtonText}>Añadir Proveedor</ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          renderItem={renderSupplier}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={handleAddSupplier} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 28,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  type: {
    fontSize: 13,
    marginTop: 2,
  },
  contact: {
    fontSize: 13,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingContainer: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
