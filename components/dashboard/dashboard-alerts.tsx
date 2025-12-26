/**
 * Dashboard Alerts Component
 * Muestra alertas urgentes y pendientes
 */
import { Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';

interface DashboardAlertsProps {
  urgentCount: number;
  pendingCount: number;
}

export function DashboardAlerts({ urgentCount, pendingCount }: DashboardAlertsProps) {
  const router = useRouter();
  const error = useThemeColor({}, 'error');
  const warning = useThemeColor({}, 'warning');

  return (
    <>
      {/* Alertas urgentes */}
      {urgentCount > 0 && (
        <Pressable
          style={[styles.alertBanner, { backgroundColor: '#FEE2E2', borderColor: error }]}
          onPress={() => router.push('/(tabs)/pianos')}
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color={error} />
          <View style={styles.alertContent}>
            <ThemedText style={[styles.alertTitle, { color: error }]}>
              {urgentCount} {urgentCount === 1 ? 'piano requiere' : 'pianos requieren'} atención urgente
            </ThemedText>
            <ThemedText style={[styles.alertSubtitle, { color: error }]}>
              Toca para ver detalles
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={error} />
        </Pressable>
      )}

      {/* Pendientes */}
      {pendingCount > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Pendientes</ThemedText>
            <View style={[styles.badge, { backgroundColor: `${warning}20` }]}>
              <ThemedText style={[styles.badgeText, { color: warning }]}>{pendingCount}</ThemedText>
            </View>
          </View>
          <View style={[styles.pendingCard, { backgroundColor: '#FEF3C7', borderColor: warning }]}>
            <IconSymbol name="clock.fill" size={20} color={warning} />
            <ThemedText style={styles.pendingText}>
              {pendingCount} {pendingCount === 1 ? 'piano necesita' : 'pianos necesitan'} servicio próximamente
            </ThemedText>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '600',
    fontSize: 15,
  },
  alertSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
  },
});
