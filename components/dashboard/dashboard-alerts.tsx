/**
 * Dashboard Alerts Component
 * Muestra alertas consolidadas de pianos que requieren atención
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

  // No mostrar nada si no hay alertas
  if (urgentCount === 0 && pendingCount === 0) {
    return null;
  }

  // Determinar el color principal basado en si hay urgentes
  const hasUrgent = urgentCount > 0;
  const primaryColor = hasUrgent ? error : warning;
  const bgColor = hasUrgent ? '#FEE2E2' : '#FEF3C7';

  return (
    <Pressable
      style={[styles.alertBanner, { backgroundColor: bgColor, borderColor: primaryColor }]}
      onPress={() => router.push('/(tabs)/pianos')}
    >
      <IconSymbol 
        name={hasUrgent ? "exclamationmark.triangle.fill" : "clock.fill"} 
        size={22} 
        color={primaryColor} 
      />
      <View style={styles.alertContent}>
        {/* Mostrar alertas urgentes */}
        {urgentCount > 0 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: error }]} />
            <ThemedText style={[styles.alertText, { color: error }]}>
              {urgentCount} {urgentCount === 1 ? 'piano requiere' : 'pianos requieren'} atención urgente
            </ThemedText>
          </View>
        )}
        {/* Mostrar pendientes */}
        {pendingCount > 0 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: warning }]} />
            <ThemedText style={[styles.alertText, { color: warning }]}>
              {pendingCount} {pendingCount === 1 ? 'piano necesita' : 'pianos necesitan'} servicio pronto
            </ThemedText>
          </View>
        )}
      </View>
      <IconSymbol name="chevron.right" size={18} color={primaryColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
