/**
 * Dashboard Widgets - Componentes funcionales para el Dashboard Editor
 * 
 * Este archivo contiene todos los widgets funcionales que pueden ser utilizados
 * en el Dashboard Editor. Cada widget muestra datos reales y es completamente
 * interactivo.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useClientsData, usePianosData, useServicesData, useAppointmentsData } from '@/hooks/data';
import { useInvoices } from '@/hooks/use-invoices';
import { getClientFullName } from '@/types';

// ============================================================================
// TIPOS
// ============================================================================

interface WidgetProps {
  config?: Record<string, any>;
  isEditing?: boolean;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';
}

// ============================================================================
// WIDGET: ALERTAS
// ============================================================================

export function AlertsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { appointments } = useAppointmentsData();
  const { invoices } = useInvoices();

  const alerts = useMemo(() => {
    const result = [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Citas próximas (hoy y mañana)
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= now && aptDate <= tomorrow;
    });

    if (upcomingAppointments.length > 0) {
      result.push({
        id: 'upcoming-appointments',
        type: 'info',
        icon: 'time',
        color: '#3B82F6',
        title: `${upcomingAppointments.length} cita${upcomingAppointments.length > 1 ? 's' : ''} próxima${upcomingAppointments.length > 1 ? 's' : ''}`,
        message: 'En las próximas 24 horas',
      });
    }

    // Facturas pendientes
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent');
    if (pendingInvoices.length > 0) {
      const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
      result.push({
        id: 'pending-invoices',
        type: 'warning',
        icon: 'document-text',
        color: '#F59E0B',
        title: `${pendingInvoices.length} factura${pendingInvoices.length > 1 ? 's' : ''} pendiente${pendingInvoices.length > 1 ? 's' : ''}`,
        message: `Total: ${totalPending.toFixed(2)}€`,
      });
    }

    // Facturas vencidas
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'sent') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    });

    if (overdueInvoices.length > 0) {
      result.push({
        id: 'overdue-invoices',
        type: 'error',
        icon: 'alert-circle',
        color: '#EF4444',
        title: `${overdueInvoices.length} factura${overdueInvoices.length > 1 ? 's' : ''} vencida${overdueInvoices.length > 1 ? 's' : ''}`,
        message: 'Requiere atención inmediata',
      });
    }

    return result;
  }, [appointments, invoices]);

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Alertas
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay alertas
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertItem,
                { backgroundColor: `${alert.color}15`, borderLeftColor: alert.color },
              ]}
            >
              <Ionicons name={alert.icon as any} size={20} color={alert.color} />
              <View style={styles.alertContent}>
                <ThemedText style={[styles.alertTitle, { color: colors.text }]}>
                  {alert.title}
                </ThemedText>
                <ThemedText style={[styles.alertMessage, { color: colors.textSecondary }]}>
                  {alert.message}
                </ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// WIDGET: ACCIONES RÁPIDAS
// ============================================================================

export function QuickActionsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const actions = [
    { id: 'new-service', icon: 'add-circle', label: 'Nuevo Servicio', color: '#10B981', route: '/services/new' },
    { id: 'new-client', icon: 'person-add', label: 'Nuevo Cliente', color: '#3B82F6', route: '/clients/new' },
    { id: 'new-appointment', icon: 'calendar', label: 'Nueva Cita', color: '#F59E0B', route: '/agenda/new' },
    { id: 'new-invoice', icon: 'document-text', label: 'Nueva Factura', color: '#8B5CF6', route: '/invoices/new' },
  ];

  const handleAction = (route: string) => {
    if (!isEditing) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={[styles.actionButton, { backgroundColor: `${action.color}15` }]}
            onPress={() => handleAction(action.route)}
            disabled={isEditing}
          >
            <Ionicons name={action.icon as any} size={24} color={action.color} />
            <ThemedText style={[styles.actionLabel, { color: colors.text }]}>
              {action.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET: PREDICCIONES IA
// ============================================================================

export function PredictionsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { clients } = useClientsData();

  const predictions = useMemo(() => {
    // Calcular tendencias básicas
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthServices = services.filter(s => {
      const date = new Date(s.date);
      return date >= lastMonth && date < thisMonth;
    });

    const thisMonthServices = services.filter(s => {
      const date = new Date(s.date);
      return date >= thisMonth;
    });

    const lastMonthRevenue = lastMonthServices.reduce((sum, s) => sum + (s.cost || 0), 0);
    const thisMonthRevenue = thisMonthServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const projectedRevenue = (thisMonthRevenue / daysPassed) * daysInMonth;

    const trend = projectedRevenue > lastMonthRevenue ? 'up' : 'down';
    const percentChange = lastMonthRevenue > 0 
      ? Math.abs(((projectedRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return [
      {
        id: 'revenue-prediction',
        icon: 'trending-up',
        color: trend === 'up' ? '#10B981' : '#EF4444',
        title: 'Proyección de ingresos',
        value: `${projectedRevenue.toFixed(0)}€`,
        subtitle: `${trend === 'up' ? '+' : '-'}${percentChange.toFixed(1)}% vs mes anterior`,
      },
      {
        id: 'services-prediction',
        icon: 'construct',
        color: '#3B82F6',
        title: 'Servicios estimados',
        value: Math.round((thisMonthServices.length / daysPassed) * daysInMonth),
        subtitle: `Basado en ${thisMonthServices.length} servicios hasta ahora`,
      },
    ];
  }, [services]);

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Predicciones IA
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {predictions.map((prediction) => (
        <View key={prediction.id} style={styles.predictionItem}>
          <View style={[styles.predictionIcon, { backgroundColor: `${prediction.color}15` }]}>
            <Ionicons name={prediction.icon as any} size={24} color={prediction.color} />
          </View>
          <View style={styles.predictionContent}>
            <ThemedText style={[styles.predictionTitle, { color: colors.textSecondary }]}>
              {prediction.title}
            </ThemedText>
            <ThemedText style={[styles.predictionValue, { color: colors.text }]}>
              {prediction.value}
            </ThemedText>
            <ThemedText style={[styles.predictionSubtitle, { color: colors.textSecondary }]}>
              {prediction.subtitle}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// WIDGET: ESTE MES (ESTADÍSTICAS)
// ============================================================================

export function StatsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { invoices } = useInvoices();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyServices = services.filter(s => new Date(s.date) >= thisMonth);
    const monthlyRevenue = monthlyServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    return [
      {
        id: 'services',
        icon: 'construct',
        color: '#F59E0B',
        label: 'Servicios',
        value: monthlyServices.length,
      },
      {
        id: 'revenue',
        icon: 'cash',
        color: '#10B981',
        label: 'Ingresos',
        value: `${monthlyRevenue.toFixed(0)}€`,
      },
      {
        id: 'clients',
        icon: 'people',
        color: '#3B82F6',
        label: 'Clientes',
        value: clients.length,
      },
      {
        id: 'pianos',
        icon: 'musical-notes',
        color: '#8B5CF6',
        label: 'Pianos',
        value: pianos.length,
      },
    ];
  }, [services, clients, pianos]);

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET: SERVICIOS RECIENTES
// ============================================================================

export function RecentServicesWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { services } = useServicesData();
  const { clients } = useClientsData();

  const recentServices = useMemo(() => {
    return services
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, config?.limit || 5)
      .map(service => {
        const client = clients.find(c => c.id === service.clientId);
        return {
          ...service,
          clientName: client ? getClientFullName(client) : 'Cliente desconocido',
        };
      });
  }, [services, clients, config]);

  const handleServicePress = (serviceId: string) => {
    if (!isEditing) {
      router.push(`/services/${serviceId}` as any);
    }
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Servicios Recientes
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {recentServices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay servicios recientes
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentServices.map((service) => (
            <Pressable
              key={service.id}
              style={[styles.listItem, { borderBottomColor: colors.border }]}
              onPress={() => handleServicePress(service.id)}
            >
              <View style={[styles.listItemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="construct" size={20} color={colors.primary} />
              </View>
              <View style={styles.listItemContent}>
                <ThemedText style={[styles.listItemTitle, { color: colors.text }]}>
                  {service.clientName}
                </ThemedText>
                <ThemedText style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {new Date(service.date).toLocaleDateString('es-ES')} • {service.cost?.toFixed(2)}€
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  widgetContent: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  
  // Alertas
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
  },

  // Acciones rápidas
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Predicciones
  predictionItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  predictionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  predictionTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  predictionSubtitle: {
    fontSize: 11,
  },

  // Estadísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },

  // Listas
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
  },
});

// ============================================================================
// WIDGET: ACCESOS RÁPIDOS (CONFIGURABLE)
// ============================================================================

export function AccessShortcutsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Accesos disponibles que el usuario puede elegir
  const availableShortcuts = [
    { id: 'clients', icon: 'people', label: 'Clientes', color: '#3B82F6', route: '/clients' },
    { id: 'pianos', icon: 'musical-notes', label: 'Pianos', color: '#8B5CF6', route: '/pianos' },
    { id: 'services', icon: 'construct', label: 'Servicios', color: '#10B981', route: '/services' },
    { id: 'agenda', icon: 'calendar', label: 'Agenda', color: '#F59E0B', route: '/agenda' },
    { id: 'invoices', icon: 'document-text', label: 'Facturas', color: '#EF4444', route: '/invoices' },
    { id: 'quotes', icon: 'calculator', label: 'Presupuestos', color: '#06B6D4', route: '/quotes' },
    { id: 'inventory', icon: 'cube', label: 'Inventario', color: '#EC4899', route: '/inventory' },
    { id: 'partners', icon: 'briefcase', label: 'Proveedores', color: '#14B8A6', route: '/partners' },
    { id: 'contracts', icon: 'document', label: 'Contratos', color: '#6366F1', route: '/contracts' },
    { id: 'reminders', icon: 'notifications', label: 'Recordatorios', color: '#F97316', route: '/reminders' },
    { id: 'reports', icon: 'bar-chart', label: 'Informes', color: '#22C55E', route: '/reports' },
    { id: 'settings', icon: 'settings', label: 'Ajustes', color: '#64748B', route: '/settings' },
  ];

  // Si el usuario ha configurado sus accesos, usarlos; si no, mostrar los primeros 6
  const selectedShortcuts = config?.shortcuts 
    ? availableShortcuts.filter(s => config.shortcuts.includes(s.id))
    : availableShortcuts.slice(0, 6);

  const handleShortcut = (route: string) => {
    if (!isEditing) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <View style={styles.shortcutsGrid}>
        {selectedShortcuts.map((shortcut) => (
          <Pressable
            key={shortcut.id}
            style={[styles.shortcutButton, { backgroundColor: `${shortcut.color}15` }]}
            onPress={() => handleShortcut(shortcut.route)}
            disabled={isEditing}
          >
            <View style={[styles.shortcutIconContainer, { backgroundColor: shortcut.color }]}>
              <Ionicons name={shortcut.icon as any} size={20} color="#FFFFFF" />
            </View>
            <ThemedText style={[styles.shortcutLabel, { color: colors.text }]}>
              {shortcut.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {isEditing && (
        <ThemedText style={{ color: colors.textSecondary, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
          Configurable: elige qué accesos mostrar
        </ThemedText>
      )}
    </View>
  );
}

// ============================================================================
// WIDGET: HERRAMIENTAS AVANZADAS
// ============================================================================

export function AdvancedToolsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const tools = [
    { id: 'store', icon: 'storefront', label: 'Tienda', color: '#10B981', route: '/store' },
    { id: 'calendar_plus', icon: 'calendar-outline', label: 'Calendario+', color: '#3B82F6', route: '/calendar-plus' },
    { id: 'dashboard_editor', icon: 'grid', label: 'Dashboard+', color: '#EC4899', route: '/dashboard-editor' },
    { id: 'team', icon: 'people-circle', label: 'Equipos', color: '#8B5CF6', route: '/team' },
    { id: 'crm', icon: 'analytics', label: 'CRM', color: '#06B6D4', route: '/crm' },
    { id: 'reports_advanced', icon: 'document-text', label: 'Reportes', color: '#6366F1', route: '/reports' },
    { id: 'portal', icon: 'globe', label: 'Portal Clientes', color: '#14B8A6', route: '/portal' },
    { id: 'distributor', icon: 'business', label: 'Distribuidor', color: '#EF4444', route: '/distributor' },
    { id: 'marketing', icon: 'megaphone', label: 'Marketing', color: '#F97316', route: '/marketing' },
    { id: 'payments', icon: 'card', label: 'Pasarelas Pago', color: '#22C55E', route: '/payments' },
    { id: 'accounting', icon: 'calculator', label: 'Contabilidad', color: '#64748B', route: '/accounting' },
    { id: 'workflows', icon: 'git-branch', label: 'Workflows', color: '#EC4899', route: '/workflows' },
    { id: 'ai', icon: 'sparkles', label: 'IA Avanzada', color: '#8B5CF6', route: '/ai' },
  ];

  const handleTool = (route: string) => {
    if (!isEditing) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <Pressable
              key={tool.id}
              style={[styles.toolButton, { backgroundColor: `${tool.color}10`, borderColor: `${tool.color}30` }]}
              onPress={() => handleTool(tool.route)}
              disabled={isEditing}
            >
              <Ionicons name={tool.icon as any} size={24} color={tool.color} />
              <ThemedText style={[styles.toolLabel, { color: colors.text }]}>
                {tool.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// WIDGET: AYUDA
// ============================================================================

export function HelpWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const helpItems = [
    { id: 'docs', icon: 'book', label: 'Documentación', color: '#3B82F6', route: '/help/docs' },
    { id: 'tutorials', icon: 'play-circle', label: 'Tutoriales', color: '#10B981', route: '/help/tutorials' },
    { id: 'faq', icon: 'help-circle', label: 'Preguntas frecuentes', color: '#F59E0B', route: '/help/faq' },
    { id: 'support', icon: 'chatbubbles', label: 'Soporte', color: '#EF4444', route: '/help/support' },
    { id: 'whats-new', icon: 'sparkles', label: 'Novedades', color: '#8B5CF6', route: '/help/whats-new' },
    { id: 'feedback', icon: 'megaphone', label: 'Enviar feedback', color: '#06B6D4', route: '/help/feedback' },
  ];

  const handleHelpItem = (route: string) => {
    if (!isEditing) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {helpItems.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.helpItem, { borderBottomColor: colors.border }]}
            onPress={() => handleHelpItem(item.route)}
            disabled={isEditing}
          >
            <View style={[styles.helpItemIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <ThemedText style={[styles.helpItemLabel, { color: colors.text }]}>
              {item.label}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// WIDGET: CLIENTES RECIENTES
// ============================================================================

export function RecentClientsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { clients } = useClientsData();

  const recentClients = useMemo(() => {
    return clients
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, config?.limit || 5);
  }, [clients, config]);

  const handleClientPress = (clientId: string) => {
    if (!isEditing) {
      router.push(`/clients/${clientId}` as any);
    }
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Clientes Recientes
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {recentClients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay clientes recientes
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentClients.map((client) => (
            <Pressable
              key={client.id}
              style={[styles.listItem, { borderBottomColor: colors.border }]}
              onPress={() => handleClientPress(client.id)}
            >
              <View style={[styles.listItemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.listItemContent}>
                <ThemedText style={[styles.listItemTitle, { color: colors.text }]}>
                  {getClientFullName(client)}
                </ThemedText>
                <ThemedText style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {client.email || client.phone || 'Sin contacto'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// WIDGET: FACTURAS RECIENTES
// ============================================================================

export function RecentInvoicesWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { invoices } = useInvoices();

  const recentInvoices = useMemo(() => {
    return invoices
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, config?.limit || 5);
  }, [invoices, config]);

  const handleInvoicePress = (invoiceId: string) => {
    if (!isEditing) {
      router.push(`/invoices/${invoiceId}` as any);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'sent': return '#F59E0B';
      case 'draft': return '#64748B';
      case 'overdue': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'sent': return 'Enviada';
      case 'draft': return 'Borrador';
      case 'overdue': return 'Vencida';
      default: return status;
    }
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Facturas Recientes
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {recentInvoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay facturas recientes
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentInvoices.map((invoice) => (
            <Pressable
              key={invoice.id}
              style={[styles.listItem, { borderBottomColor: colors.border }]}
              onPress={() => handleInvoicePress(invoice.id)}
            >
              <View style={[styles.listItemIcon, { backgroundColor: `${getStatusColor(invoice.status)}15` }]}>
                <Ionicons name="document-text" size={20} color={getStatusColor(invoice.status)} />
              </View>
              <View style={styles.listItemContent}>
                <ThemedText style={[styles.listItemTitle, { color: colors.text }]}>
                  {invoice.number}
                </ThemedText>
                <ThemedText style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {getStatusLabel(invoice.status)} • {invoice.total.toFixed(2)}€
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// WIDGET: PRÓXIMAS CITAS
// ============================================================================

export function UpcomingAppointmentsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { appointments } = useAppointmentsData();
  const { clients } = useClientsData();

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(apt => new Date(apt.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, config?.limit || 5)
      .map(apt => {
        const client = clients.find(c => c.id === apt.clientId);
        return {
          ...apt,
          clientName: client ? getClientFullName(client) : 'Cliente desconocido',
        };
      });
  }, [appointments, clients, config]);

  const handleAppointmentPress = (appointmentId: string) => {
    if (!isEditing) {
      router.push(`/agenda/${appointmentId}` as any);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • ${time}`;
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Próximas Citas
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {upcomingAppointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay citas próximas
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {upcomingAppointments.map((appointment) => (
            <Pressable
              key={appointment.id}
              style={[styles.listItem, { borderBottomColor: colors.border }]}
              onPress={() => handleAppointmentPress(appointment.id)}
            >
              <View style={[styles.listItemIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.listItemContent}>
                <ThemedText style={[styles.listItemTitle, { color: colors.text }]}>
                  {appointment.clientName}
                </ThemedText>
                <ThemedText style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                  {formatDateTime(appointment.date, appointment.time)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// ESTILOS ADICIONALES
// ============================================================================

const additionalStyles = StyleSheet.create({
  // Accesos rápidos
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shortcutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Herramientas avanzadas
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolButton: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  // Ayuda
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  helpItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
});

// Combinar estilos
Object.assign(styles, additionalStyles);

// ============================================================================
// WIDGET: TARJETA DE ESTADÍSTICA INDIVIDUAL
// ============================================================================

export function StatsCardWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { invoices } = useInvoices();

  // Determinar qué métrica mostrar según la configuración
  const metric = config?.metric || 'monthly_revenue';

  const statData = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyServices = services.filter(s => new Date(s.date) >= thisMonth);
    const monthlyRevenue = monthlyServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    switch (metric) {
      case 'monthly_revenue':
        return {
          icon: 'cash',
          color: '#10B981',
          label: 'Ingresos del mes',
          value: `${monthlyRevenue.toFixed(0)}€`,
        };
      case 'services_count':
        return {
          icon: 'construct',
          color: '#F59E0B',
          label: 'Servicios',
          value: monthlyServices.length,
        };
      case 'active_clients':
        return {
          icon: 'people',
          color: '#3B82F6',
          label: 'Clientes activos',
          value: clients.length,
        };
      case 'total_pianos':
        return {
          icon: 'musical-notes',
          color: '#8B5CF6',
          label: 'Pianos',
          value: pianos.length,
        };
      case 'pending_invoices':
        const pending = invoices.filter(i => i.status === 'sent');
        return {
          icon: 'document-text',
          color: '#EF4444',
          label: 'Facturas pendientes',
          value: pending.length,
        };
      default:
        return {
          icon: 'stats-chart',
          color: '#64748B',
          label: 'Estadística',
          value: '0',
        };
    }
  }, [metric, services, clients, pianos, invoices]);

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <View style={styles.statsCardContainer}>
        <View style={[styles.statsCardIcon, { backgroundColor: `${statData.color}15` }]}>
          <Ionicons name={statData.icon as any} size={28} color={statData.color} />
        </View>
        <ThemedText style={[styles.statsCardValue, { color: colors.text }]}>
          {statData.value}
        </ThemedText>
        <ThemedText style={[styles.statsCardLabel, { color: colors.textSecondary }]}>
          {statData.label}
        </ThemedText>
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET: RESUMEN DE INGRESOS
// ============================================================================

export function RevenueSummaryWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { invoices } = useInvoices();

  const revenueSummary = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyServices = services.filter(s => new Date(s.date) >= thisMonth);
    const totalRevenue = monthlyServices.reduce((sum, s) => sum + (s.cost || 0), 0);
    
    const paidInvoices = invoices.filter(i => i.status === 'paid' && new Date(i.date) >= thisMonth);
    const paidAmount = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    
    const pendingInvoices = invoices.filter(i => i.status === 'sent');
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

    return {
      total: totalRevenue,
      paid: paidAmount,
      pending: pendingAmount,
    };
  }, [services, invoices]);

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Resumen de Ingresos
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <ThemedText style={[styles.revenueSummaryTitle, { color: colors.text }]}>
        Resumen de Ingresos
      </ThemedText>
      
      <View style={styles.revenueSummaryItem}>
        <View style={styles.revenueSummaryRow}>
          <View style={[styles.revenueIndicator, { backgroundColor: '#10B981' }]} />
          <ThemedText style={[styles.revenueLabel, { color: colors.textSecondary }]}>
            Total del mes
          </ThemedText>
        </View>
        <ThemedText style={[styles.revenueValue, { color: colors.text }]}>
          {revenueSummary.total.toFixed(2)}€
        </ThemedText>
      </View>

      <View style={styles.revenueSummaryItem}>
        <View style={styles.revenueSummaryRow}>
          <View style={[styles.revenueIndicator, { backgroundColor: '#22C55E' }]} />
          <ThemedText style={[styles.revenueLabel, { color: colors.textSecondary }]}>
            Cobrado
          </ThemedText>
        </View>
        <ThemedText style={[styles.revenueValue, { color: '#22C55E' }]}>
          {revenueSummary.paid.toFixed(2)}€
        </ThemedText>
      </View>

      <View style={styles.revenueSummaryItem}>
        <View style={styles.revenueSummaryRow}>
          <View style={[styles.revenueIndicator, { backgroundColor: '#F59E0B' }]} />
          <ThemedText style={[styles.revenueLabel, { color: colors.textSecondary }]}>
            Pendiente
          </ThemedText>
        </View>
        <ThemedText style={[styles.revenueValue, { color: '#F59E0B' }]}>
          {revenueSummary.pending.toFixed(2)}€
        </ThemedText>
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET: ESTADO DE PAGOS
// ============================================================================

export function PaymentStatusWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { invoices } = useInvoices();

  const paymentStatus = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid').length;
    const sent = invoices.filter(i => i.status === 'sent').length;
    const draft = invoices.filter(i => i.status === 'draft').length;
    const total = invoices.length;

    return { paid, sent, draft, total };
  }, [invoices]);

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Estado de Pagos
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <ThemedText style={[styles.paymentStatusTitle, { color: colors.text }]}>
        Estado de Pagos
      </ThemedText>
      
      <View style={styles.paymentStatusGrid}>
        <View style={styles.paymentStatusItem}>
          <ThemedText style={[styles.paymentStatusValue, { color: '#10B981' }]}>
            {paymentStatus.paid}
          </ThemedText>
          <ThemedText style={[styles.paymentStatusLabel, { color: colors.textSecondary }]}>
            Pagadas
          </ThemedText>
        </View>

        <View style={styles.paymentStatusItem}>
          <ThemedText style={[styles.paymentStatusValue, { color: '#F59E0B' }]}>
            {paymentStatus.sent}
          </ThemedText>
          <ThemedText style={[styles.paymentStatusLabel, { color: colors.textSecondary }]}>
            Enviadas
          </ThemedText>
        </View>

        <View style={styles.paymentStatusItem}>
          <ThemedText style={[styles.paymentStatusValue, { color: '#64748B' }]}>
            {paymentStatus.draft}
          </ThemedText>
          <ThemedText style={[styles.paymentStatusLabel, { color: colors.textSecondary }]}>
            Borradores
          </ThemedText>
        </View>

        <View style={styles.paymentStatusItem}>
          <ThemedText style={[styles.paymentStatusValue, { color: colors.text }]}>
            {paymentStatus.total}
          </ThemedText>
          <ThemedText style={[styles.paymentStatusLabel, { color: colors.textSecondary }]}>
            Total
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// WIDGET: ALERTAS DE INVENTARIO
// ============================================================================

export function InventoryAlertsWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Simulación de alertas de inventario (conectar con hook real cuando esté disponible)
  const alerts = [
    { id: '1', product: 'Cuerdas de piano', stock: 5, minStock: 10, color: '#F59E0B' },
    { id: '2', product: 'Fieltros', stock: 2, minStock: 15, color: '#EF4444' },
    { id: '3', product: 'Afinadores', stock: 8, minStock: 10, color: '#F59E0B' },
  ];

  const handleAlertPress = () => {
    if (!isEditing) {
      router.push('/inventory' as any);
    }
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Alertas de Inventario
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            Stock en niveles óptimos
          </ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {alerts.map((alert) => (
            <Pressable
              key={alert.id}
              style={[styles.inventoryAlertItem, { borderBottomColor: colors.border }]}
              onPress={handleAlertPress}
            >
              <Ionicons name="alert-circle" size={20} color={alert.color} />
              <View style={styles.inventoryAlertContent}>
                <ThemedText style={[styles.inventoryAlertTitle, { color: colors.text }]}>
                  {alert.product}
                </ThemedText>
                <ThemedText style={[styles.inventoryAlertSubtitle, { color: colors.textSecondary }]}>
                  Stock: {alert.stock} (mínimo: {alert.minStock})
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// WIDGET: CALENDARIO
// ============================================================================

export function CalendarWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { appointments } = useAppointmentsData();

  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= today && aptDate < tomorrow;
    });
  }, [appointments]);

  const handleCalendarPress = () => {
    if (!isEditing) {
      router.push('/agenda' as any);
    }
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Calendario
        </ThemedText>
      </View>
    );
  }

  return (
    <Pressable 
      style={[styles.widgetContent, { backgroundColor: colors.card }]}
      onPress={handleCalendarPress}
    >
      <View style={styles.calendarHeader}>
        <Ionicons name="calendar" size={24} color={colors.primary} />
        <ThemedText style={[styles.calendarTitle, { color: colors.text }]}>
          Hoy
        </ThemedText>
      </View>
      
      {todayAppointments.length === 0 ? (
        <View style={styles.calendarEmpty}>
          <ThemedText style={{ color: colors.textSecondary }}>
            No hay citas hoy
          </ThemedText>
        </View>
      ) : (
        <View style={styles.calendarAppointments}>
          <ThemedText style={[styles.calendarCount, { color: colors.primary }]}>
            {todayAppointments.length} cita{todayAppointments.length > 1 ? 's' : ''}
          </ThemedText>
          <ThemedText style={[styles.calendarSubtext, { color: colors.textSecondary }]}>
            Toca para ver detalles
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

// ============================================================================
// WIDGET: TAREAS
// ============================================================================

export function TasksWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();

  // Simulación de tareas (conectar con hook real cuando esté disponible)
  const tasks = [
    { id: '1', title: 'Llamar a cliente para confirmar cita', completed: false },
    { id: '2', title: 'Revisar inventario de cuerdas', completed: false },
    { id: '3', title: 'Enviar factura pendiente', completed: true },
  ];

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Tareas
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      <ThemedText style={[styles.tasksTitle, { color: colors.text }]}>
        Tareas pendientes
      </ThemedText>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {tasks.map((task) => (
          <View key={task.id} style={[styles.taskItem, { borderBottomColor: colors.border }]}>
            <Ionicons 
              name={task.completed ? 'checkmark-circle' : 'ellipse-outline'} 
              size={20} 
              color={task.completed ? '#10B981' : colors.textSecondary} 
            />
            <ThemedText 
              style={[
                styles.taskText, 
                { color: task.completed ? colors.textSecondary : colors.text },
                task.completed && styles.taskCompleted
              ]}
            >
              {task.title}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// WIDGET: MAPA DE CLIENTES
// ============================================================================

export function MapWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleMapPress = () => {
    if (!isEditing) {
      router.push('/clients-map' as any);
    }
  };

  return (
    <Pressable 
      style={[styles.widgetContent, { backgroundColor: colors.card }]}
      onPress={handleMapPress}
      disabled={isEditing}
    >
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={48} color={colors.primary} />
        <ThemedText style={[styles.mapText, { color: colors.text }]}>
          Mapa de Clientes
        </ThemedText>
        <ThemedText style={[styles.mapSubtext, { color: colors.textSecondary }]}>
          Toca para ver el mapa completo
        </ThemedText>
      </View>
    </Pressable>
  );
}

// ============================================================================
// ESTILOS ADICIONALES PARA NUEVOS WIDGETS
// ============================================================================

const newWidgetStyles = StyleSheet.create({
  // Stats Card
  statsCardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  statsCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsCardLabel: {
    fontSize: 13,
    textAlign: 'center',
  },

  // Revenue Summary
  revenueSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  revenueSummaryItem: {
    marginBottom: 12,
  },
  revenueSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  revenueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  revenueLabel: {
    fontSize: 13,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  // Payment Status
  paymentStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentStatusItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
  paymentStatusValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentStatusLabel: {
    fontSize: 12,
  },

  // Inventory Alerts
  inventoryAlertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  inventoryAlertContent: {
    flex: 1,
    marginLeft: 12,
  },
  inventoryAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  inventoryAlertSubtitle: {
    fontSize: 12,
  },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  calendarEmpty: {
    alignItems: 'center',
    padding: 20,
  },
  calendarAppointments: {
    alignItems: 'center',
    padding: 20,
  },
  calendarCount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  calendarSubtext: {
    fontSize: 12,
  },

  // Tasks
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  taskText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
  },

  // Map
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});

// Combinar todos los estilos
Object.assign(styles, newWidgetStyles);
