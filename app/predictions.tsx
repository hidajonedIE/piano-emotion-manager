import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { trpc } from '@/lib/trpc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'revenue' | 'churn' | 'maintenance' | 'workload' | 'inventory';

// Datos de ejemplo (fallback cuando no hay datos del backend)
const MOCK_DATA = {
  revenue: [
    { period: 'Enero 2026', value: 4250, confidence: 78, trend: 'up' as const, factors: ['Tendencia de crecimiento', 'Temporada alta'] },
    { period: 'Febrero 2026', value: 3980, confidence: 72, trend: 'stable' as const, factors: ['Estabilidad histórica'] },
    { period: 'Marzo 2026', value: 4520, confidence: 65, trend: 'up' as const, factors: ['Temporada de conciertos'] },
  ],
  churn: [
    { clientName: 'María García', riskScore: 85, daysSince: 245, suggestedAction: 'Contactar urgentemente' },
    { clientName: 'Conservatorio Municipal', riskScore: 72, daysSince: 198, suggestedAction: 'Enviar recordatorio' },
    { clientName: 'Carlos Rodríguez', riskScore: 58, daysSince: 156, suggestedAction: 'Programar seguimiento' },
  ],
  maintenance: [
    { pianoInfo: 'Yamaha U3 (Vertical)', clientName: 'Ana López', predictedDate: '15 Ene 2026', serviceType: 'Afinación', confidence: 85 },
    { pianoInfo: 'Steinway D (Cola)', clientName: 'Teatro Nacional', predictedDate: '22 Ene 2026', serviceType: 'Regulación', confidence: 78 },
    { pianoInfo: 'Kawai K-500 (Vertical)', clientName: 'Escuela de Música', predictedDate: '28 Ene 2026', serviceType: 'Afinación', confidence: 82 },
  ],
  workload: [
    { week: 'Semana del 30 Dic', scheduled: 8, estimated: 10, recommendation: 'Semana ocupada' },
    { week: 'Semana del 6 Ene', scheduled: 5, estimated: 7, recommendation: 'Carga normal' },
    { week: 'Semana del 13 Ene', scheduled: 12, estimated: 14, recommendation: 'Muy ocupada - reorganizar' },
    { week: 'Semana del 20 Ene', scheduled: 3, estimated: 5, recommendation: 'Semana tranquila' },
  ],
  inventory: [
    { itemName: 'Cuerdas de bajo', currentStock: 5, monthlyUsage: 3, monthsUntilMin: 0.8, urgency: 'high' as const },
    { itemName: 'Fieltro de martillos', currentStock: 12, monthlyUsage: 4, monthsUntilMin: 1.5, urgency: 'medium' as const },
    { itemName: 'Clavijas de afinación', currentStock: 45, monthlyUsage: 8, monthsUntilMin: 4.2, urgency: 'low' as const },
  ],
};

export default function PredictionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [refreshing, setRefreshing] = useState(false);
  const contentScrollRef = useRef<ScrollView>(null);

  // Queries tRPC para obtener datos del backend
  const revenueQuery = trpc.advanced.predictions.getRevenue.useQuery(
    { months: 3 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const churnQuery = trpc.advanced.predictions.getChurnRisk.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const maintenanceQuery = trpc.advanced.predictions.getMaintenance.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const workloadQuery = trpc.advanced.predictions.getWorkload.useQuery(
    { weeks: 4 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const inventoryQuery = trpc.advanced.predictions.getInventoryDemand.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  // Combinar datos del backend con fallback a mock data
  const data = {
    revenue: revenueQuery.data && revenueQuery.data.length > 0 
      ? revenueQuery.data.map(r => ({
          period: r.period,
          value: r.value,
          confidence: r.confidence,
          trend: r.trend,
          factors: r.factors,
        }))
      : MOCK_DATA.revenue,
    churn: churnQuery.data && churnQuery.data.length > 0
      ? churnQuery.data.map((c: { clientId: string; clientName: string; riskScore: number; daysSinceLastService: number; suggestedAction: string }) => ({
          clientName: c.clientName,
          riskScore: c.riskScore,
          daysSince: c.daysSinceLastService,
          suggestedAction: c.suggestedAction,
        }))
      : MOCK_DATA.churn,
    maintenance: maintenanceQuery.data && maintenanceQuery.data.length > 0
      ? maintenanceQuery.data.map((m: { pianoId: string; pianoInfo: string; clientName: string; predictedDate: string; serviceType: string; confidence: number }) => ({
          pianoInfo: m.pianoInfo,
          clientName: m.clientName,
          predictedDate: new Date(m.predictedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          serviceType: m.serviceType,
          confidence: m.confidence,
        }))
      : MOCK_DATA.maintenance,
    workload: workloadQuery.data && workloadQuery.data.length > 0
      ? workloadQuery.data.map((w: { week: string; scheduledAppointments: number; estimatedServices: number; workloadLevel: string }) => ({
          week: w.week,
          scheduled: w.scheduledAppointments,
          estimated: w.estimatedTotal,
          recommendation: w.recommendation,
        }))
      : MOCK_DATA.workload,
    inventory: inventoryQuery.data && inventoryQuery.data.length > 0
      ? inventoryQuery.data.map((i: { id: string }) => ({
          itemName: i.itemName,
          currentStock: i.currentStock,
          monthlyUsage: i.monthlyUsage,
          monthsUntilMin: i.monthsUntilMin,
          urgency: i.urgency,
        }))
      : MOCK_DATA.inventory,
  };

  const isLoading = revenueQuery.isLoading || churnQuery.isLoading || 
                    maintenanceQuery.isLoading || workloadQuery.isLoading || 
                    inventoryQuery.isLoading;

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const background = colors.background;
  const cardBg = colors.card;
  const border = colors.border;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      revenueQuery.refetch(),
      churnQuery.refetch(),
      maintenanceQuery.refetch(),
      workloadQuery.refetch(),
      inventoryQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const tabs = [
    { id: 'revenue', label: 'Ingresos', icon: 'cash-outline' },
    { id: 'churn', label: 'Clientes', icon: 'people-outline' },
    { id: 'maintenance', label: 'Mantenimiento', icon: 'construct-outline' },
    { id: 'workload', label: 'Carga', icon: 'calendar-outline' },
    { id: 'inventory', label: 'Inventario', icon: 'cube-outline' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return { name: 'trending-up', color: '#22C55E' };
      case 'down': return { name: 'trending-down', color: '#EF4444' };
      default: return { name: 'remove', color: '#F59E0B' };
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#22C55E';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#EF4444';
    if (score >= 50) return '#F59E0B';
    return '#22C55E';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'revenue': return renderRevenueTab();
      case 'churn': return renderChurnTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'workload': return renderWorkloadTab();
      case 'inventory': return renderInventoryTab();
      default: return null;
    }
  };

  const renderRevenueTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Predicción de Ingresos
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Basado en tu historial de los últimos 12 meses
        </ThemedText>
        {revenueQuery.isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={{ color: textSecondary, marginLeft: 8 }}>Calculando predicciones...</ThemedText>
          </View>
        )}
      </View>

      {data.revenue.map((prediction, index) => {
        const trend = getTrendIcon(prediction.trend);
        return (
          <View key={index} style={[styles.predictionCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.predictionHeader}>
              <ThemedText style={[styles.predictionPeriod, { color: textPrimary }]}>
                {prediction.period}
              </ThemedText>
              <View style={[styles.confidenceBadge, { backgroundColor: `${colors.primary}20` }]}>
                <ThemedText style={{ color: colors.primary, fontSize: 12 }}>
                  {prediction.confidence}% confianza
                </ThemedText>
              </View>
            </View>

            <View style={styles.predictionValue}>
              <ThemedText style={[styles.valueText, { color: textPrimary }]}>
                {prediction.value.toLocaleString('es-ES')} €
              </ThemedText>
              <Ionicons name={trend.name as any} size={24} color={trend.color} />
            </View>

            <View style={styles.factorsList}>
              {prediction.factors.map((factor, i) => (
                <View key={i} style={[styles.factorChip, { backgroundColor: `${colors.primary}10` }]}>
                  <ThemedText style={{ color: colors.primary, fontSize: 12 }}>
                    {factor}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderChurnTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Clientes en Riesgo
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Clientes que podrían necesitar atención
        </ThemedText>
        {churnQuery.isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={{ color: textSecondary, marginLeft: 8 }}>Analizando clientes...</ThemedText>
          </View>
        )}
      </View>

      {data.churn.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
          <ThemedText style={[styles.emptyStateTitle, { color: textPrimary }]}>
            ¡Excelente!
          </ThemedText>
          <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
            No hay clientes en riesgo de pérdida
          </ThemedText>
        </View>
      ) : (
        data.churn.map((client, index) => (
          <View key={index} style={[styles.churnCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.churnHeader}>
              <View style={styles.churnInfo}>
                <ThemedText style={[styles.clientName, { color: textPrimary }]}>
                  {client.clientName}
                </ThemedText>
                <ThemedText style={[styles.daysSince, { color: textSecondary }]}>
                  {client.daysSince} días sin servicio
                </ThemedText>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(client.riskScore)}20` }]}>
                <ThemedText style={{ color: getRiskColor(client.riskScore), fontWeight: '700' }}>
                  {client.riskScore}%
                </ThemedText>
              </View>
            </View>

            <View style={[styles.riskBar, { backgroundColor: `${getRiskColor(client.riskScore)}20` }]}>
              <View style={[styles.riskBarFill, { width: `${client.riskScore}%`, backgroundColor: getRiskColor(client.riskScore) }]} />
            </View>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="call" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>{client.suggestedAction}</ThemedText>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderMaintenanceTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="construct" size={24} color="#8B5CF6" />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Mantenimientos Previstos
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Basado en el historial de cada piano
        </ThemedText>
        {maintenanceQuery.isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={{ color: textSecondary, marginLeft: 8 }}>Calculando mantenimientos...</ThemedText>
          </View>
        )}
      </View>

      {data.maintenance.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="calendar-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.emptyStateTitle, { color: textPrimary }]}>
            Sin predicciones
          </ThemedText>
          <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
            Registra más servicios para obtener predicciones de mantenimiento
          </ThemedText>
        </View>
      ) : (
        data.maintenance.map((item, index) => (
          <View key={index} style={[styles.maintenanceCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.maintenanceHeader}>
              <View style={[styles.maintenanceIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="musical-notes" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.maintenanceInfo}>
                <ThemedText style={[styles.pianoInfo, { color: textPrimary }]}>
                  {item.pianoInfo}
                </ThemedText>
                <ThemedText style={[styles.clientNameSmall, { color: textSecondary }]}>
                  {item.clientName}
                </ThemedText>
              </View>
            </View>

            <View style={styles.maintenanceDetails}>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="calendar" size={16} color={textSecondary} />
                <ThemedText style={{ color: textSecondary, marginLeft: 6 }}>
                  {item.predictedDate}
                </ThemedText>
              </View>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="build" size={16} color={textSecondary} />
                <ThemedText style={{ color: textSecondary, marginLeft: 6 }}>
                  {item.serviceType}
                </ThemedText>
              </View>
              <View style={[styles.confidenceSmall, { backgroundColor: `${colors.primary}20` }]}>
                <ThemedText style={{ color: colors.primary, fontSize: 11 }}>
                  {item.confidence}%
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity style={[styles.scheduleButton, { borderColor: colors.primary }]}>
              <ThemedText style={{ color: colors.primary }}>Programar cita</ThemedText>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderWorkloadTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="calendar" size={24} color="#0EA5E9" />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Carga de Trabajo
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Previsión para las próximas 4 semanas
        </ThemedText>
        {workloadQuery.isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={{ color: textSecondary, marginLeft: 8 }}>Calculando carga...</ThemedText>
          </View>
        )}
      </View>

      {data.workload.map((week, index) => (
        <View key={index} style={[styles.workloadCard, { backgroundColor: cardBg, borderColor: border }]}>
          <ThemedText style={[styles.weekTitle, { color: textPrimary }]}>
            {week.week}
          </ThemedText>

          <View style={styles.workloadStats}>
            <View style={styles.workloadStat}>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {week.scheduled}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Programadas
              </ThemedText>
            </View>
            <View style={styles.workloadStat}>
              <ThemedText style={[styles.statValue, { color: textPrimary }]}>
                {week.estimated}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Estimadas
              </ThemedText>
            </View>
          </View>

          <View style={[styles.workloadBar, { backgroundColor: border }]}>
            <View 
              style={[
                styles.workloadBarFill, 
                { 
                  width: `${Math.min(100, (week.estimated / 15) * 100)}%`,
                  backgroundColor: week.estimated > 10 ? '#EF4444' : week.estimated > 7 ? '#F59E0B' : '#22C55E',
                }
              ]} 
            />
          </View>

          <ThemedText style={[styles.recommendation, { color: textSecondary }]}>
            {week.recommendation}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  const renderInventoryTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="cube" size={24} color="#14B8A6" />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Predicción de Inventario
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Basado en el consumo de los últimos 3 meses
        </ThemedText>
        {inventoryQuery.isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText style={{ color: textSecondary, marginLeft: 8 }}>Analizando inventario...</ThemedText>
          </View>
        )}
      </View>

      {data.inventory.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: border }]}>
          <Ionicons name="cube-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.emptyStateTitle, { color: textPrimary }]}>
            Sin predicciones
          </ThemedText>
          <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
            Registra movimientos de inventario para obtener predicciones
          </ThemedText>
        </View>
      ) : (
        data.inventory.map((item, index) => (
          <View key={index} style={[styles.inventoryCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.inventoryHeader}>
              <ThemedText style={[styles.itemName, { color: textPrimary }]}>
                {item.itemName}
              </ThemedText>
              <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(item.urgency)}20` }]}>
                <Ionicons 
                  name={item.urgency === 'high' ? 'alert-circle' : item.urgency === 'medium' ? 'warning' : 'checkmark-circle'} 
                  size={14} 
                  color={getUrgencyColor(item.urgency)} 
                />
                <ThemedText style={{ color: getUrgencyColor(item.urgency), fontSize: 12, marginLeft: 4 }}>
                  {item.urgency === 'high' ? 'Urgente' : item.urgency === 'medium' ? 'Pronto' : 'OK'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.inventoryStats}>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: textPrimary }]}>
                  {item.currentStock}
                </ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>
                  Stock actual
                </ThemedText>
              </View>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: textPrimary }]}>
                  {item.monthlyUsage}
                </ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>
                  Uso/mes
                </ThemedText>
              </View>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: getUrgencyColor(item.urgency) }]}>
                  {item.monthsUntilMin.toFixed(1)}
                </ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>
                  Meses hasta mín.
                </ThemedText>
              </View>
            </View>

            {item.urgency === 'high' && (
              <TouchableOpacity style={[styles.orderButton, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="cart" size={16} color="#fff" />
                <ThemedText style={styles.orderButtonText}>Pedir ahora</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: textPrimary }}>
          Predicciones IA
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { borderBottomColor: border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
            ]}
            onPress={() => {
              setActiveTab(tab.id as TabType);
              // Resetear scroll al cambiar de tab
              contentScrollRef.current?.scrollTo({ y: 0, animated: false });
            }}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? colors.primary : textSecondary} 
            />
            <ThemedText 
              style={[
                styles.tabLabel, 
                { color: activeTab === tab.id ? colors.primary : textSecondary }
              ]}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        ref={contentScrollRef}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    height: 40,
    flex: 0,
    flexShrink: 0,
  },
  tabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 12,
  },
  summaryCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryDescription: {
    fontSize: 13,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  predictionCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionPeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  predictionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 6,
  },
  factorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  churnCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  churnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  churnInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  daysSince: {
    fontSize: 13,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  riskBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  maintenanceCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  maintenanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maintenanceInfo: {
    flex: 1,
  },
  pianoInfo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  clientNameSmall: {
    fontSize: 13,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  maintenanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scheduleButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  workloadCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  workloadStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  workloadStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  workloadBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  workloadBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendation: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inventoryCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inventoryStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  inventoryStat: {
    flex: 1,
    alignItems: 'center',
  },
  inventoryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  inventoryLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
