/**
 * Dashboard Widgets - Componentes funcionales para el Dashboard Editor
 * 
 * Este archivo contiene todos los widgets funcionales que pueden ser utilizados
 * en el Dashboard Editor. Cada widget muestra datos reales y es completamente
 * interactivo.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useClientsData, usePianosData, useServicesData, useAppointmentsData } from '@/hooks/data';
import { useInvoices } from '@/hooks/use-invoices';
import { getClientFullName } from '@/types';

// Widgets extraídos - Grupo 1
export { AlertsWidget } from './widgets/AlertsWidget';
export { QuickActionsWidget } from './widgets/QuickActionsWidget';
export { HelpWidget } from './widgets/HelpWidget';
export { AccessShortcutsWidget } from './widgets/AccessShortcutsWidget';
export { AdvancedToolsWidget } from './widgets/AdvancedToolsWidget';

// Widgets extraídos - Grupo 2
export { PredictionsWidget } from './widgets/PredictionsWidget';
export { StatsWidget } from './widgets/StatsWidget';
export { RecentClientsWidget } from './widgets/RecentClientsWidget';
export { RecentInvoicesWidget } from './widgets/RecentInvoicesWidget';
export { UpcomingAppointmentsWidget } from './widgets/UpcomingAppointmentsWidget';

// Widgets extraídos - Grupo 3
export { RecentServicesWidget } from './widgets/RecentServicesWidget';
export { StatsCardWidget } from './widgets/StatsCardWidget';
export { RevenueSummaryWidget } from './widgets/RevenueSummaryWidget';
export { PaymentStatusWidget } from './widgets/PaymentStatusWidget';
export { InventoryAlertsWidget } from './widgets/InventoryAlertsWidget';

// Widgets extraídos - Grupo 3
export { RecentServicesWidget } from './widgets/RecentServicesWidget';
export { StatsCardWidget } from './widgets/StatsCardWidget';
export { RevenueSummaryWidget } from './widgets/RevenueSummaryWidget';
export { PaymentStatusWidget } from './widgets/PaymentStatusWidget';
export { InventoryAlertsWidget } from './widgets/InventoryAlertsWidget';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================================
// TIPOS
// ============================================================================

interface WidgetProps {
  config?: Record<string, any>;
  isEditing?: boolean;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';
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

  // Stats Widget
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    padding: 4,
  },
  todayButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calendarButton: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Combinar estilos
Object.assign(styles, additionalStyles);

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


// ============================================================================
// WIDGET: GRÁFICO DE LÍNEAS
// ============================================================================

export function ChartLineWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Calcular datos para el gráfico según el período
  const chartData = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (period === 'week') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayServices = services.filter(s => {
          const serviceDate = new Date(s.date);
          return serviceDate.toDateString() === date.toDateString();
        });
        labels.push(['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()]);
        data.push(dayServices.reduce((sum, s) => sum + (s.cost || 0), 0));
      }
    } else if (period === 'month') {
      // Últimas 4 semanas
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        
        const weekServices = services.filter(s => {
          const serviceDate = new Date(s.date);
          return serviceDate >= weekStart && serviceDate <= weekEnd;
        });
        
        labels.push(`S${4-i}`);
        data.push(weekServices.reduce((sum, s) => sum + (s.cost || 0), 0));
      }
    } else {
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthServices = services.filter(s => {
          const serviceDate = new Date(s.date);
          return serviceDate >= monthStart && serviceDate <= monthEnd;
        });
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        labels.push(monthNames[monthDate.getMonth()]);
        data.push(monthServices.reduce((sum, s) => sum + (s.cost || 0), 0));
      }
    }

    return { labels, data };
  }, [services, period]);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#10B981',
    },
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Gráfico de Líneas
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {/* Header con selector de período */}
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
          Ingresos
        </ThemedText>
        <View style={styles.periodSelector}>
          <Pressable
            style={[styles.periodButton, period === 'week' && { backgroundColor: colors.primary }]}
            onPress={() => setPeriod('week')}
          >
            <ThemedText style={[styles.periodButtonText, { color: period === 'week' ? '#fff' : colors.textSecondary }]}>
              Semana
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.periodButton, period === 'month' && { backgroundColor: colors.primary }]}
            onPress={() => setPeriod('month')}
          >
            <ThemedText style={[styles.periodButtonText, { color: period === 'month' ? '#fff' : colors.textSecondary }]}>
              Mes
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.periodButton, period === 'year' && { backgroundColor: colors.primary }]}
            onPress={() => setPeriod('year')}
          >
            <ThemedText style={[styles.periodButtonText, { color: period === 'year' ? '#fff' : colors.textSecondary }]}>
              Año
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Gráfico */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.data }],
          }}
          width={Math.max(SCREEN_WIDTH - 80, chartData.labels.length * 60)}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// WIDGET: GRÁFICO DE BARRAS
// ============================================================================

export function ChartBarWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();
  const { clients } = useClientsData();

  // Top 5 clientes por ingresos
  const chartData = useMemo(() => {
    const clientRevenue = new Map<string, { name: string; revenue: number }>();

    services.forEach(service => {
      const client = clients.find(c => c.id === service.clientId);
      if (client) {
        const clientName = getClientFullName(client);
        const current = clientRevenue.get(service.clientId) || { name: clientName, revenue: 0 };
        current.revenue += service.cost || 0;
        clientRevenue.set(service.clientId, current);
      }
    });

    const topClients = Array.from(clientRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      labels: topClients.map(c => c.name.split(' ')[0]), // Solo primer nombre
      data: topClients.map(c => c.revenue),
    };
  }, [services, clients]);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Gráfico de Barras
        </ThemedText>
      </View>
    );
  }

  if (chartData.data.length === 0) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay datos suficientes
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
          Top Clientes
        </ThemedText>
      </View>

      {/* Gráfico */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.data }],
          }}
          width={Math.max(SCREEN_WIDTH - 80, chartData.labels.length * 80)}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
        />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// WIDGET: GRÁFICO CIRCULAR
// ============================================================================

export function ChartPieWidget({ config, isEditing }: WidgetProps) {
  const { colors } = useTheme();
  const { services } = useServicesData();

  // Distribución de servicios por tipo
  const chartData = useMemo(() => {
    const serviceTypes = new Map<string, number>();

    services.forEach(service => {
      const type = service.type || 'Otros';
      serviceTypes.set(type, (serviceTypes.get(type) || 0) + 1);
    });

    const pieColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1'];
    
    return Array.from(serviceTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        count,
        color: pieColors[index],
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      }));
  }, [services, colors]);

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  if (isEditing) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Vista previa de Gráfico Circular
        </ThemedText>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={32} color={colors.textSecondary} />
          <ThemedText style={{ color: colors.textSecondary, marginTop: 8 }}>
            No hay datos suficientes
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.widgetContent, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
          Tipos de Servicio
        </ThemedText>
      </View>

      {/* Gráfico */}
      <PieChart
        data={chartData}
        width={SCREEN_WIDTH - 80}
        height={200}
        chartConfig={chartConfig}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="0"
        center={[10, 0]}
        absolute
      />
    </View>
  );
}

// ============================================================================
// ESTILOS PARA GRÁFICOS
// ============================================================================

const chartStyles = StyleSheet.create({
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  periodButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

// Combinar estilos de gráficos
Object.assign(styles, chartStyles);
