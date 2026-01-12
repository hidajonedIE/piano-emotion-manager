/**
 * Dashboard Alerts Component V2
 * Muestra alertas y avisos consolidados de todo el sistema
 * - Alertas: Urgentes (requieren atención inmediata)
 * - Avisos: Informativos (para conocimiento)
 * - Colapsable por defecto
 */
import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const error = useThemeColor({}, 'error');
  const warning = useThemeColor({}, 'warning');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const border = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Separar alertas urgentes y avisos informativos
  const urgentAlerts = alerts.filter(a => a.priority === 'urgent');
  const infoAlerts = alerts.filter(a => a.priority === 'warning' || a.priority === 'info');
  
  const hasAlerts = alerts.length > 0;
  const hasUrgent = urgentAlerts.length > 0;
  
  // Color principal basado en la prioridad más alta
  const primaryColor = hasAlerts ? (hasUrgent ? error : warning) : success;

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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
          <ThemedText style={[styles.alertText, { color: success }]}>
            No hay alertas ni avisos
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor: border }]}>
      {/* Header - Siempre visible */}
      <Pressable 
        style={styles.header}
        onPress={toggleExpanded}
      >
        <IconSymbol 
          name={hasUrgent ? "exclamationmark.triangle.fill" : "info.circle.fill"} 
          size={22} 
          color={primaryColor} 
        />
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerText}>
            {hasUrgent ? 'Alertas y Avisos' : 'Avisos'}
          </ThemedText>
          <ThemedText style={[styles.headerSubtext, { color: textSecondary }]}>
            {urgentAlerts.length > 0 && `${urgentAlerts.length} alerta${urgentAlerts.length !== 1 ? 's' : ''}`}
            {urgentAlerts.length > 0 && infoAlerts.length > 0 && ' • '}
            {infoAlerts.length > 0 && `${infoAlerts.length} aviso${infoAlerts.length !== 1 ? 's' : ''}`}
          </ThemedText>
        </View>
        {hasUrgent && (
          <View style={[styles.badge, { backgroundColor: error }]}>
            <ThemedText style={styles.badgeText}>{urgentAlerts.length}</ThemedText>
          </View>
        )}
        <IconSymbol 
          name={isExpanded ? "chevron.up" : "chevron.down"} 
          size={20} 
          color={textSecondary} 
        />
      </Pressable>

      {/* Contenido expandible */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Sección de Alertas Urgentes */}
          {urgentAlerts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol 
                  name="exclamationmark.triangle.fill" 
                  size={16} 
                  color={error} 
                />
                <ThemedText style={[styles.sectionTitle, { color: error }]}>
                  Alertas ({urgentAlerts.length})
                </ThemedText>
              </View>
              <View style={styles.alertsList}>
                {urgentAlerts.map((alert) => (
                  <Pressable
                    key={alert.id}
                    style={[styles.alertItem, { borderLeftColor: error }]}
                    onPress={() => handleAlertPress(alert)}
                  >
                    <View style={[styles.alertIconContainer, { backgroundColor: error + '20' }]}>
                      <IconSymbol 
                        name={getAlertIcon(alert.type)} 
                        size={16} 
                        color={error} 
                      />
                    </View>
                    <View style={styles.alertTextContainer}>
                      <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
                      <ThemedText style={[styles.alertMessage, { color: textSecondary }]}>
                        {alert.message}
                      </ThemedText>
                    </View>
                    <IconSymbol 
                      name="chevron.right" 
                      size={16} 
                      color={textSecondary} 
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Sección de Avisos Informativos */}
          {infoAlerts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol 
                  name="info.circle.fill" 
                  size={16} 
                  color={warning} 
                />
                <ThemedText style={[styles.sectionTitle, { color: warning }]}>
                  Avisos ({infoAlerts.length})
                </ThemedText>
              </View>
              <View style={styles.alertsList}>
                {infoAlerts.map((alert) => (
                  <Pressable
                    key={alert.id}
                    style={[styles.alertItem, { borderLeftColor: getPriorityColor(alert.priority) }]}
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
                      <ThemedText style={[styles.alertMessage, { color: textSecondary }]}>
                        {alert.message}
                      </ThemedText>
                    </View>
                    <IconSymbol 
                      name="chevron.right" 
                      size={16} 
                      color={textSecondary} 
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
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
  },
  headerContent: {
    flex: 1,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#00000005',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertsList: {
    gap: Spacing.xs,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#00000005',
    borderLeftWidth: 3,
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
  },
});
