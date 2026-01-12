/**
 * Dashboard Alerts Component V2
 * Muestra alertas consolidadas de todo el sistema
 */
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Alert } from '@/hooks/use-all-alerts';

interface DashboardAlertsV2Props {
  alerts: Alert[];
  totalUrgent: number;
  totalWarning: number;
  totalInfo: number;
}

export function DashboardAlertsV2({ alerts, totalUrgent, totalWarning, totalInfo }: DashboardAlertsV2Props) {
  const router = useRouter();
  const error = useThemeColor({}, 'error');
  const warning = useThemeColor({}, 'warning');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const border = useThemeColor({}, 'border');

  const hasAlerts = alerts.length > 0;
  const hasUrgent = totalUrgent > 0;
  
  // Color principal basado en la prioridad más alta
  const primaryColor = hasAlerts ? (hasUrgent ? error : totalWarning > 0 ? warning : info) : success;

  // Iconos por tipo de alerta
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'piano': return 'wrench.and.screwdriver.fill';
      case 'appointment': return 'calendar';
      case 'invoice': return 'doc.text.fill';
      case 'quote': return 'doc.on.clipboard.fill';
      case 'reminder': return 'bell.fill';
      default: return 'exclamationmark.circle.fill';
    }
  };

  // Color por prioridad
  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'urgent': return error;
      case 'warning': return warning;
      case 'info': return info;
      default: return info;
    }
  };

  const handleAlertPress = (alert: Alert) => {
    if (alert.actionUrl) {
      router.push(alert.actionUrl as any);
    }
  };

  if (!hasAlerts) {
    return (
      <View style={[styles.alertBanner, { backgroundColor: cardBackground, borderColor: border }]}>
        <IconSymbol 
          name="checkmark.circle.fill" 
          size={22} 
          color={success} 
        />
        <View style={styles.alertContent}>
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: success }]} />
            <ThemedText style={[styles.alertText, { color: success }]}>
              No hay alertas
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  // Mostrar solo las primeras 3 alertas
  const displayedAlerts = alerts.slice(0, 3);
  const hasMore = alerts.length > 3;

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor: border }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol 
          name={hasUrgent ? "exclamationmark.triangle.fill" : "clock.fill"} 
          size={22} 
          color={primaryColor} 
        />
        <ThemedText style={styles.headerText}>
          {alerts.length} {alerts.length === 1 ? 'Alerta' : 'Alertas'}
        </ThemedText>
        {hasUrgent && (
          <View style={[styles.badge, { backgroundColor: error }]}>
            <ThemedText style={styles.badgeText}>{totalUrgent}</ThemedText>
          </View>
        )}
      </View>

      {/* Lista de alertas */}
      <View style={styles.alertsList}>
        {displayedAlerts.map((alert) => (
          <Pressable
            key={alert.id}
            style={styles.alertItem}
            onPress={() => handleAlertPress(alert)}
          >
            <View style={[styles.alertIconContainer, { backgroundColor: getPriorityColor(alert.priority) + '20' }]}>
              <IconSymbol 
                name={getAlertIcon(alert.type)} 
                size={16} 
                color={getPriorityColor(alert.priority)} 
              />
            </View>
            <View style={styles.alertTextContainer}>
              <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
              <ThemedText style={styles.alertMessage}>{alert.message}</ThemedText>
            </View>
            <IconSymbol 
              name="chevron.right" 
              size={16} 
              color={getPriorityColor(alert.priority)} 
            />
          </Pressable>
        ))}
      </View>

      {/* Ver todas */}
      {hasMore && (
        <Pressable style={styles.viewAllButton}>
          <ThemedText style={[styles.viewAllText, { color: primaryColor }]}>
            Ver todas las alertas ({alerts.length})
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertsList: {
    gap: 1,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextContainer: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 12,
    opacity: 0.7,
  },
  viewAllButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
