import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  Client,
  Piano,
  Service,
  PIANO_CATEGORY_LABELS,
  getPianoTypeLabel,
  PIANO_CONDITION_LABELS,
  PIANO_CONDITION_COLORS,
  SERVICE_TYPE_LABELS,
  MAINTENANCE_LEVEL_LABELS,
  MAINTENANCE_LEVEL_COLORS,
  formatDate,
  CLIENT_TYPE_LABELS,
  getClientFullName,
} from '@/types';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface ClientCardProps {
  client: Client;
  pianoCount: number;
  onPress: () => void;
}

export const ClientCard = memo(function ClientCard({ client, pianoCount, onPress }: ClientCardProps) {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Obtener nombre completo e iniciales
  const fullName = getClientFullName(client);
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg, borderColor },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Cliente ${fullName}, ${CLIENT_TYPE_LABELS[client.type]}, ${pianoCount} pianos`}
      accessibilityHint="Pulsa para ver detalles del cliente"
    >
      <View style={[styles.avatar, { backgroundColor: accent }]} accessible={false}>
        <ThemedText style={styles.avatarText}>{initials}</ThemedText>
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {fullName}
        </ThemedText>
        <View style={styles.cardRow}>
          <ThemedText style={[styles.cardSubtext, { color: textSecondary }]}>
            {CLIENT_TYPE_LABELS[client.type]}
          </ThemedText>
        </View>
        <View style={styles.cardRow}>
          <IconSymbol name="phone.fill" size={14} color={textSecondary} />
          <ThemedText style={[styles.cardSubtext, { color: textSecondary }]}>
            {client.phone}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.badge}>
          <IconSymbol name="pianokeys" size={14} color={accent} />
          <ThemedText style={[styles.badgeText, { color: accent }]}>{pianoCount}</ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </View>
    </Pressable>
  );
});

interface PianoCardProps {
  piano: Piano;
  clientName?: string;
  onPress: () => void;
}

export const PianoCard = memo(function PianoCard({ piano, clientName, onPress }: PianoCardProps) {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const conditionColor = PIANO_CONDITION_COLORS[piano.condition];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const pianoDescription = `${piano.brand} ${piano.model || ''}, ${PIANO_CATEGORY_LABELS[piano.category]}, estado ${PIANO_CONDITION_LABELS[piano.condition]}`;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg, borderColor },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={clientName ? `Piano ${pianoDescription}, cliente ${clientName}` : `Piano ${pianoDescription}`}
      accessibilityHint="Pulsa para ver detalles del piano"
    >
      <View style={[styles.pianoIcon, { backgroundColor: `${conditionColor}15` }]} accessible={false}>
        <IconSymbol name="pianokeys" size={24} color={conditionColor} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {piano.brand} {piano.model}
        </ThemedText>
        <View style={styles.cardRow}>
          <ThemedText style={[styles.cardSubtext, { color: textSecondary }]}>
            {PIANO_CATEGORY_LABELS[piano.category]} • {getPianoTypeLabel(piano.type)}
            {piano.year ? ` • ${piano.year}` : ''}
          </ThemedText>
        </View>
        {clientName && (
          <View style={styles.cardRow}>
            <IconSymbol name="person.fill" size={12} color={textSecondary} />
            <ThemedText style={[styles.cardSubtext, { color: textSecondary }]} numberOfLines={1}>
              {clientName}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}20` }]}>
          <View style={[styles.conditionDot, { backgroundColor: conditionColor }]} />
          <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
            {PIANO_CONDITION_LABELS[piano.condition]}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </View>
    </Pressable>
  );
});

interface ServiceCardProps {
  service: Service;
  pianoInfo?: string;
  clientName?: string;
  onPress: () => void;
  isPast?: boolean;
}

export const ServiceCard = memo(function ServiceCard({ service, pianoInfo, clientName, onPress, isPast }: ServiceCardProps) {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const maintenanceColor = service.maintenanceLevel
    ? MAINTENANCE_LEVEL_COLORS[service.maintenanceLevel]
    : accent;

  const serviceDescription = `${SERVICE_TYPE_LABELS[service.type]}, ${formatDate(service.date)}${service.cost !== undefined ? `, ${service.cost} euros` : ''}`;

  // Badge de estado elegante
  const statusBadge = isPast !== undefined ? {
    label: isPast ? 'Completado' : 'Pendiente',
    bgColor: isPast ? '#F0FDF4' : '#FEF2F2',
    textColor: isPast ? '#065F46' : '#991B1B',
  } : null;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg, borderColor: borderColor, borderWidth: 1 },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={clientName ? `Servicio ${serviceDescription}, cliente ${clientName}` : `Servicio ${serviceDescription}`}
      accessibilityHint="Pulsa para ver detalles del servicio"
    >
      <View style={[styles.serviceIcon, { backgroundColor: `${maintenanceColor}15` }]} accessible={false}>
        <IconSymbol name="wrench.fill" size={20} color={maintenanceColor} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.serviceHeader}>
          <ThemedText type="defaultSemiBold">
            {SERVICE_TYPE_LABELS[service.type]}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {service.maintenanceLevel && (
              <View style={[styles.levelBadge, { backgroundColor: `${maintenanceColor}20` }]}>
                <ThemedText style={[styles.levelText, { color: maintenanceColor }]}>
                  {MAINTENANCE_LEVEL_LABELS[service.maintenanceLevel]}
                </ThemedText>
              </View>
            )}
            {statusBadge && (
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
                <ThemedText style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                  {statusBadge.label}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardRow}>
          <IconSymbol name="calendar" size={12} color={textSecondary} />
          <ThemedText style={[styles.cardSubtext, { color: textSecondary }]}>
            {formatDate(service.date)}
          </ThemedText>
        </View>
        {pianoInfo && (
          <View style={styles.cardRow}>
            <IconSymbol name="pianokeys" size={12} color={textSecondary} />
            <ThemedText style={[styles.cardSubtext, { color: textSecondary }]} numberOfLines={1}>
              {pianoInfo}
            </ThemedText>
          </View>
        )}
        {clientName && (
          <View style={styles.cardRow}>
            <IconSymbol name="person.fill" size={12} color={textSecondary} />
            <ThemedText style={[styles.cardSubtext, { color: textSecondary }]} numberOfLines={1}>
              {clientName}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        {service.cost !== undefined && (
          <ThemedText type="defaultSemiBold" style={{ color: accent }}>
            €{service.cost}
          </ThemedText>
        )}
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </View>
    </Pressable>
  );
});

// Componente para estados vacíos
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const EmptyState = memo(function EmptyState({ icon, title, message }: EmptyStateProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <View style={styles.emptyState}>
      <IconSymbol name={icon as any} size={64} color={textSecondary} />
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: textSecondary }]}>
        {message}
      </ThemedText>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pianoIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});
