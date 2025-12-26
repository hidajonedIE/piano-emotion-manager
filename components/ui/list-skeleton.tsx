/**
 * List Skeleton Component
 * Componente de skeleton loading reutilizable para listas
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// SKELETON BASE
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const backgroundColor = useThemeColor({}, 'border');

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// LIST ITEM SKELETONS
// ============================================================================

export function ClientListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.content}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="50%" height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function PianoListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <Skeleton width={60} height={60} borderRadius={BorderRadius.md} />
        <View style={styles.content}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
          <View style={[styles.row, { marginTop: 8 }]}>
            <Skeleton width={60} height={20} borderRadius={10} />
            <Skeleton width={80} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function ServiceListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.content}>
          <Skeleton width="45%" height={18} />
          <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="35%" height={14} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.rightColumn}>
          <Skeleton width={70} height={20} borderRadius={10} />
          <Skeleton width={50} height={16} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function AppointmentListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <View style={styles.timeColumn}>
          <Skeleton width={50} height={20} />
          <Skeleton width={40} height={14} style={{ marginTop: 4 }} />
        </View>
        <View style={[styles.content, { marginLeft: Spacing.md }]}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="45%" height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function InvoiceListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <View style={styles.content}>
          <View style={styles.row}>
            <Skeleton width={80} height={18} />
            <Skeleton width={70} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
          <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="35%" height={14} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.rightColumn}>
          <Skeleton width={80} height={22} />
          <Skeleton width={60} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
}

export function QuoteListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <View style={styles.content}>
          <View style={styles.row}>
            <Skeleton width={90} height={18} />
            <Skeleton width={80} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
          <Skeleton width="55%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.rightColumn}>
          <Skeleton width={75} height={22} />
        </View>
      </View>
    </View>
  );
}

export function InventoryListItemSkeleton() {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.row}>
        <Skeleton width={50} height={50} borderRadius={BorderRadius.sm} />
        <View style={styles.content}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
          <View style={[styles.row, { marginTop: 8 }]}>
            <Skeleton width={60} height={18} />
            <Skeleton width={40} height={18} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// LIST SKELETON CONTAINER
// ============================================================================

interface ListSkeletonProps {
  count?: number;
  type: 'client' | 'piano' | 'service' | 'appointment' | 'invoice' | 'quote' | 'inventory';
}

export function ListSkeleton({ count = 5, type }: ListSkeletonProps) {
  const SkeletonComponent = {
    client: ClientListItemSkeleton,
    piano: PianoListItemSkeleton,
    service: ServiceListItemSkeleton,
    appointment: AppointmentListItemSkeleton,
    invoice: InvoiceListItemSkeleton,
    quote: QuoteListItemSkeleton,
    inventory: InventoryListItemSkeleton,
  }[type];

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  timeColumn: {
    alignItems: 'center',
    width: 60,
  },
});

export default ListSkeleton;
