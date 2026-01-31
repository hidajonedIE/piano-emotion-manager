import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Componente base de skeleton
export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = BorderRadius.sm,
  style 
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton para tarjeta de cliente
export function ClientCardSkeleton() {
  return (
    <View style={styles.clientCard}>
      <View style={styles.clientCardContent}>
        <View style={styles.avatarSkeleton}>
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>
        <View style={styles.clientInfo}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
          <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

// Skeleton para tarjeta de piano
export function PianoCardSkeleton() {
  return (
    <View style={styles.pianoCard}>
      <View style={styles.pianoCardHeader}>
        <View style={styles.pianoIcon}>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
        <View style={styles.pianoInfo}>
          <Skeleton width="50%" height={18} />
          <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={styles.pianoCardFooter}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
}

// Skeleton para tarjeta de servicio
export function ServiceCardSkeleton() {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceCardLeft}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width="100%" height={16} style={{ marginTop: 8 }} />
        <Skeleton width="70%" height={14} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.serviceCardRight}>
        <Skeleton width={70} height={20} />
        <Skeleton width={50} height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Lista de skeletons
interface SkeletonListProps {
  type: 'client' | 'piano' | 'service';
  count?: number;
}

export function SkeletonList({ type, count = 5 }: SkeletonListProps) {
  const SkeletonComponent = {
    client: ClientCardSkeleton,
    piano: PianoCardSkeleton,
    service: ServiceCardSkeleton,
  }[type];

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  list: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  // Client card skeleton
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSkeleton: {
    marginRight: Spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  // Piano card skeleton
  pianoCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: Spacing.md,
  },
  pianoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pianoIcon: {
    marginRight: Spacing.md,
  },
  pianoInfo: {
    flex: 1,
  },
  pianoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Service card skeleton
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceCardLeft: {
    flex: 1,
  },
  serviceCardRight: {
    alignItems: 'flex-end',
  },
});
