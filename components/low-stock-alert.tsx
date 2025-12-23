import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

// Mapeo de categorías de inventario a categorías de la tienda Piano Emotion
const CATEGORY_TO_STORE_MAPPING: Record<string, { storeCategory: string; searchTerm: string }> = {
  strings: { storeCategory: 'cuerdas', searchTerm: 'cuerdas piano' },
  hammers: { storeCategory: 'macillos', searchTerm: 'macillos piano' },
  felts: { storeCategory: 'fieltros', searchTerm: 'fieltros piano' },
  tools: { storeCategory: 'herramientas', searchTerm: 'herramientas piano' },
  pins: { storeCategory: 'clavijas', searchTerm: 'clavijas piano' },
  adhesives: { storeCategory: 'adhesivos', searchTerm: 'cola madera piano' },
  maintenance: { storeCategory: 'mantenimiento', searchTerm: 'mantenimiento piano' },
  parts: { storeCategory: 'repuestos', searchTerm: 'repuestos piano' },
  tuning_levers: { storeCategory: 'llaves-afinacion', searchTerm: 'llave afinacion piano' },
};

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  unit: string;
  category?: string;
}

interface LowStockAlertProps {
  items: LowStockItem[];
  onItemPress?: (item: LowStockItem) => void;
}

export function LowStockAlert({ items, onItemPress }: LowStockAlertProps) {
  if (items.length === 0) return null;

  const openPianoEmotionStore = (item: LowStockItem) => {
    // Por ahora abre la web principal, cuando la tienda esté lista se puede cambiar
    // a una URL específica de categoría o búsqueda
    const mapping = item.category ? CATEGORY_TO_STORE_MAPPING[item.category] : null;
    const url = 'https://www.pianoemotion.es';
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#D97706" />
          <Text style={styles.headerTitle}>Stock Bajo - Reponer</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{items.length}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {items.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Pressable 
              style={styles.itemInfo}
              onPress={() => onItemPress?.(item)}
            >
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemStock}>
                {item.quantity} / {item.minStock} {item.unit}
              </Text>
            </Pressable>
            <Pressable 
              style={styles.orderButton}
              onPress={() => openPianoEmotionStore(item)}
            >
              <IconSymbol name="cart.fill" size={14} color="#FFFFFF" />
              <Text style={styles.orderButtonText}>Pedir</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {items.length > 5 && (
        <Text style={styles.moreItems}>
          +{items.length - 5} materiales más con stock bajo
        </Text>
      )}

      <Pressable 
        style={styles.storeLink}
        onPress={() => Linking.openURL('https://www.pianoemotion.es')}
      >
        <View style={styles.storeLinkContent}>
          <Text style={styles.storeLinkIcon}>🎹</Text>
          <View style={styles.storeLinkText}>
            <Text style={styles.storeLinkTitle}>Piano Emotion Store</Text>
            <Text style={styles.storeLinkSubtitle}>Renner • Klinke • Röslau • Hainsworth</Text>
          </View>
        </View>
        <IconSymbol name="arrow.right" size={16} color="#5B9A8B" />
      </Pressable>
    </View>
  );
}

interface OrderButtonProps {
  item: {
    name: string;
    category?: string;
  };
  size?: 'small' | 'medium';
}

export function OrderFromStoreButton({ item, size = 'medium' }: OrderButtonProps) {
  const openPianoEmotionStore = () => {
    Linking.openURL('https://www.pianoemotion.es');
  };

  const isSmall = size === 'small';

  return (
    <Pressable 
      style={[styles.orderFromStoreButton, isSmall && styles.orderFromStoreButtonSmall]}
      onPress={openPianoEmotionStore}
    >
      <IconSymbol name="cart.fill" size={isSmall ? 14 : 16} color="#FFFFFF" />
      <Text style={[styles.orderFromStoreText, isSmall && styles.orderFromStoreTextSmall]}>
        Pedir a Piano Emotion
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  badge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemsList: {
    padding: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemStock: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B9A8B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  orderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreItems: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    paddingBottom: 12,
  },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
  },
  storeLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeLinkIcon: {
    fontSize: 24,
  },
  storeLinkText: {
    gap: 2,
  },
  storeLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  storeLinkSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  orderFromStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B9A8B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  orderFromStoreButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  orderFromStoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderFromStoreTextSmall: {
    fontSize: 12,
  },
});

export default LowStockAlert;
