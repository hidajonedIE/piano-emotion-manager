/**
 * Loading States Components
 * Piano Emotion Manager
 * 
 * Standardized loading indicators for consistent UX
 */

import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'large',
  color,
  message,
}: LoadingSpinnerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const spinnerColor = color || tintColor;

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <ThemedText style={[styles.loadingMessage, { color: textSecondary }]}>
          {message}
        </ThemedText>
      )}
    </View>
  );
});

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const skeletonColor = useThemeColor({}, 'border');

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
          opacity,
        },
        style,
      ]}
    />
  );
});

export interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
}

export const SkeletonCard = memo(function SkeletonCard({
  lines = 3,
  showAvatar = false,
}: SkeletonCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');

  return (
    <View style={[styles.skeletonCard, { backgroundColor: cardBackground }]}>
      <View style={styles.skeletonCardHeader}>
        {showAvatar && <Skeleton width={40} height={40} borderRadius={20} />}
        <View style={styles.skeletonCardHeaderText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: Spacing.xs }} />
        </View>
      </View>
      <View style={styles.skeletonCardBody}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            width={index === lines - 1 ? '70%' : '100%'}
            height={14}
            style={{ marginTop: index > 0 ? Spacing.sm : 0 }}
          />
        ))}
      </View>
    </View>
  );
});

export interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
}

export const SkeletonList = memo(function SkeletonList({
  count = 5,
  itemHeight = 60,
}: SkeletonListProps) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.skeletonListItem, { height: itemHeight }]}>
          <Skeleton width={40} height={40} borderRadius={8} />
          <View style={styles.skeletonListItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{ marginTop: Spacing.xs }} />
          </View>
        </View>
      ))}
    </View>
  );
});

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable = memo(function SkeletonTable({
  rows = 5,
  columns = 4,
}: SkeletonTableProps) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.skeletonTable, { borderColor }]}>
      {/* Header */}
      <View style={[styles.skeletonTableRow, styles.skeletonTableHeader, { borderColor }]}>
        {Array.from({ length: columns }).map((_, index) => (
          <View key={index} style={styles.skeletonTableCell}>
            <Skeleton width="80%" height={14} />
          </View>
        ))}
      </View>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={[styles.skeletonTableRow, { borderColor }]}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <View key={colIndex} style={styles.skeletonTableCell}>
              <Skeleton width={`${60 + Math.random() * 30}%`} height={12} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

export interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading = memo(function FullPageLoading({
  message = 'Cargando...',
}: FullPageLoadingProps) {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.fullPageContainer, { backgroundColor }]}>
      <LoadingSpinner size="large" message={message} />
    </View>
  );
});

export interface OverlayLoadingProps {
  visible: boolean;
  message?: string;
}

export const OverlayLoading = memo(function OverlayLoading({
  visible,
  message = 'Procesando...',
}: OverlayLoadingProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <LoadingSpinner size="large" message={message} />
      </View>
    </View>
  );
});

export interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
}

export const ButtonLoading = memo(function ButtonLoading({
  loading,
  children,
}: ButtonLoadingProps) {
  if (loading) {
    return <ActivityIndicator size="small" color="#fff" />;
  }
  return <>{children}</>;
});

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  loadingMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  skeleton: {
    overflow: 'hidden',
  },
  skeletonCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skeletonCardHeaderText: {
    flex: 1,
  },
  skeletonCardBody: {
    marginTop: Spacing.md,
  },
  skeletonList: {
    gap: Spacing.sm,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  skeletonListItemContent: {
    flex: 1,
  },
  skeletonTable: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  skeletonTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  skeletonTableHeader: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  skeletonTableCell: {
    flex: 1,
    padding: Spacing.sm,
  },
  fullPageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#fff',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
});
