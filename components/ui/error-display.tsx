/**
 * Error Display Component
 * Piano Emotion Manager
 * 
 * Standardized error display for consistent error handling across the app
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorDisplayProps {
  message: string;
  severity?: ErrorSeverity;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  details?: string;
}

const severityConfig = {
  error: {
    icon: 'exclamationmark.triangle.fill',
    colorKey: 'error' as const,
    defaultTitle: 'Error',
  },
  warning: {
    icon: 'exclamationmark.circle.fill',
    colorKey: 'warning' as const,
    defaultTitle: 'Advertencia',
  },
  info: {
    icon: 'info.circle.fill',
    colorKey: 'tint' as const,
    defaultTitle: 'Información',
  },
};

export const ErrorDisplay = memo(function ErrorDisplay({
  message,
  severity = 'error',
  title,
  onRetry,
  onDismiss,
  details,
}: ErrorDisplayProps) {
  const config = severityConfig[severity];
  const color = useThemeColor({}, config.colorKey);
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'cardBackground');

  return (
    <View style={[styles.container, { backgroundColor: `${color}15`, borderColor: color }]}>
      <View style={styles.header}>
        <IconSymbol name={config.icon as any} size={24} color={color} />
        <ThemedText style={[styles.title, { color }]}>
          {title || config.defaultTitle}
        </ThemedText>
        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <IconSymbol name="xmark" size={18} color={textSecondary} />
          </Pressable>
        )}
      </View>
      
      <ThemedText style={[styles.message, { color: textColor }]}>
        {message}
      </ThemedText>
      
      {details && (
        <ThemedText style={[styles.details, { color: textSecondary }]}>
          {details}
        </ThemedText>
      )}
      
      {onRetry && (
        <Pressable
          style={[styles.retryButton, { backgroundColor: color }]}
          onPress={onRetry}
        >
          <IconSymbol name="arrow.clockwise" size={16} color="#fff" />
          <ThemedText style={styles.retryText}>Reintentar</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

export interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
}

export const InlineError = memo(function InlineError({
  message,
  onDismiss,
}: InlineErrorProps) {
  const errorColor = useThemeColor({}, 'error');

  return (
    <View style={styles.inlineContainer}>
      <IconSymbol name="exclamationmark.circle" size={16} color={errorColor} />
      <ThemedText style={[styles.inlineMessage, { color: errorColor }]}>
        {message}
      </ThemedText>
      {onDismiss && (
        <Pressable onPress={onDismiss}>
          <IconSymbol name="xmark" size={14} color={errorColor} />
        </Pressable>
      )}
    </View>
  );
});

export interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo(function EmptyState({
  icon = 'tray',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.emptyContainer}>
      <IconSymbol name={icon as any} size={48} color={textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText style={[styles.emptyMessage, { color: textSecondary }]}>
          {message}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: tintColor }]}
          onPress={onAction}
        >
          <ThemedText style={styles.actionButtonText}>{actionLabel}</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

export interface LoadingErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
}

export const LoadingError = memo(function LoadingError({
  error,
  onRetry,
}: LoadingErrorProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <ErrorDisplay
      message={errorMessage}
      severity="error"
      title="Error al cargar"
      onRetry={onRetry}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    fontSize: 12,
    marginTop: Spacing.sm,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  inlineMessage: {
    fontSize: 12,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
