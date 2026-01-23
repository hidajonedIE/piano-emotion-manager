import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors } from '../constants/theme';
import { trpc } from '../lib/trpc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'revenue' | 'churn' | 'maintenance' | 'workload' | 'inventory';

// NO MOCK DATA - Solo datos reales de la base de datos

export default function PredictionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  const colors = {
    ...themeColors,
    primary: themeColors.tint,
    card: themeColors.cardBackground,
  };

  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [refreshing, setRefreshing] = useState(false);
  const contentScrollRef = useRef<ScrollView>(null);

  const revenueQuery = trpc.advanced.predictions.getRevenue.useQuery(
    { months: 6 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const [churnPage, setChurnPage] = useState(1);
  const churnQuery = trpc.advanced.predictions.getChurnRisk.useQuery(
    { page: churnPage, limit: 30 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, keepPreviousData: true }
  );
  
  const [maintenancePage, setMaintenancePage] = useState(1);
  const maintenanceQuery = trpc.advanced.predictions.getMaintenance.useQuery(
    { page: maintenancePage, limit: 10 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, keepPreviousData: true }
  );
  
  const workloadQuery = trpc.advanced.predictions.getWorkload.useQuery(
    { weeks: 8 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryQuery = trpc.advanced.predictions.getInventoryDemand.useQuery(
    { page: inventoryPage, limit: 6 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, keepPreviousData: true }
  );

  const data = {
    revenue: revenueQuery.data && revenueQuery.data.length > 0 
      ? revenueQuery.data.map(r => ({
          period: r.period,
          value: r.value,
          confidence: r.confidence,
          trend: r.trend,
          factors: r.factors,
        }))
      : [],
    churn: churnQuery.data?.data && churnQuery.data.data.length > 0
      ? churnQuery.data.data.map((c: any) => ({
          clientName: c.clientName,
          riskScore: c.riskScore,
          daysSince: c.daysSinceLastService,
          suggestedAction: c.suggestedAction,
        }))
      : [],
    maintenance: maintenanceQuery.data?.data && maintenanceQuery.data.data.length > 0
      ? maintenanceQuery.data.data.map((m: any) => ({
          pianoInfo: m.pianoInfo,
          clientName: m.clientName,
          predictedDate: new Date(m.predictedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          serviceType: m.serviceType,
          confidence: m.confidence,
        }))
      : [],
    workload: workloadQuery.data && workloadQuery.data.length > 0
      ? workloadQuery.data.map((w: any) => ({
          week: w.week,
          scheduled: w.scheduledAppointments,
          estimated: w.estimatedTotal,
          recommendation: w.recommendation,
        }))
      : [],
    inventory: inventoryQuery.data?.data && inventoryQuery.data.data.length > 0
      ? inventoryQuery.data.data.map((i: any) => ({
          itemName: i.itemName,
          itemId: i.itemId,
          currentStock: i.currentStock,
          monthlyUsage: i.monthlyUsage,
          monthsUntilMin: i.monthsUntilMin,
          urgency: i.urgency,
        }))
      : [],
  };

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const border = colors.border;
  const cardBg = colors.card;

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

  const renderChurnTab = () => {
    const pagination = churnQuery.data?.pagination;
    
    return (
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
          {pagination && (
            <ThemedText style={[styles.paginationInfo, { color: textSecondary, marginTop: 8 }]}>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
            </ThemedText>
          )}
        </View>

        {data.churn.map((client, index) => (
          <View key={index} style={[styles.churnCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.churnHeader}>
              <View style={styles.churnInfo}>
                <ThemedText style={[styles.clientName, { color: textPrimary }]}>{client.clientName}</ThemedText>
                <ThemedText style={[styles.daysSince, { color: textSecondary }]}>
                  Último servicio hace {client.daysSince} días
                </ThemedText>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(client.riskScore)}20` }]}>
                <ThemedText style={{ color: getRiskColor(client.riskScore), fontWeight: '700' }}>
                  {client.riskScore}% riesgo
                </ThemedText>
              </View>
            </View>
            <View style={[styles.riskBar, { backgroundColor: `${getRiskColor(client.riskScore)}10` }]}>
              <View style={[styles.riskBarFill, { width: `${client.riskScore}%`, backgroundColor: getRiskColor(client.riskScore) }]} />
            </View>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <ThemedText style={styles.actionButtonText}>{client.suggestedAction}</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Controles de Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <View style={[styles.paginationControls, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity
              style={[styles.paginationButton, { opacity: pagination.page === 1 ? 0.5 : 1 }]}
              onPress={() => setChurnPage(Math.max(1, churnPage - 1))}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, marginLeft: 4 }}>Anterior</ThemedText>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <ThemedText style={{ color: textPrimary, fontWeight: '600' }}>
                Página {pagination.page} de {pagination.totalPages}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, { opacity: !pagination.hasMore ? 0.5 : 1 }]}
              onPress={() => setChurnPage(Math.min(pagination.totalPages, churnPage + 1))}
              disabled={!pagination.hasMore}
            >
              <ThemedText style={{ color: colors.primary, marginRight: 4 }}>Siguiente</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMaintenanceTab = () => {
    const pagination = maintenanceQuery.data?.pagination;
    
    return (
      <View style={styles.tabContent}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="construct" size={24} color={colors.primary} />
            <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
              Mantenimiento Predictivo
            </ThemedText>
          </View>
          <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
            Próximos servicios recomendados por la IA
          </ThemedText>
          {pagination && (
            <ThemedText style={[styles.paginationInfo, { color: textSecondary, marginTop: 8 }]}>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} servicios
            </ThemedText>
          )}
        </View>

        {data.maintenance.map((item, index) => (
          <View key={index} style={[styles.maintenanceCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.maintenanceHeader}>
              <View style={[styles.maintenanceIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="musical-notes" size={20} color={colors.primary} />
              </View>
              <View style={styles.maintenanceInfo}>
                <ThemedText style={[styles.pianoInfo, { color: textPrimary }]}>{item.pianoInfo}</ThemedText>
                <ThemedText style={[styles.clientNameSmall, { color: textSecondary }]}>{item.clientName}</ThemedText>
              </View>
            </View>
            <View style={styles.maintenanceDetails}>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="calendar-outline" size={16} color={textSecondary} />
                <ThemedText style={{ marginLeft: 4, color: textSecondary, fontSize: 13 }}>{item.predictedDate}</ThemedText>
              </View>
              <View style={styles.maintenanceDetail}>
                <Ionicons name="settings-outline" size={16} color={textSecondary} />
                <ThemedText style={{ marginLeft: 4, color: textSecondary, fontSize: 13 }}>{item.serviceType}</ThemedText>
              </View>
              <View style={[styles.confidenceSmall, { backgroundColor: '#22C55E20' }]}>
                <ThemedText style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>{item.confidence}% confianza</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={[styles.scheduleButton, { borderColor: colors.primary }]}>
              <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Programar Cita</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Controles de Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <View style={[styles.paginationControls, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity
              style={[styles.paginationButton, { opacity: pagination.page === 1 ? 0.5 : 1 }]}
              onPress={() => setMaintenancePage(Math.max(1, maintenancePage - 1))}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, marginLeft: 4 }}>Anterior</ThemedText>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <ThemedText style={{ color: textPrimary, fontWeight: '600' }}>
                Página {pagination.page} de {pagination.totalPages}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, { opacity: !pagination.hasMore ? 0.5 : 1 }]}
              onPress={() => setMaintenancePage(Math.min(pagination.totalPages, maintenancePage + 1))}
              disabled={!pagination.hasMore}
            >
              <ThemedText style={{ color: colors.primary, marginRight: 4 }}>Siguiente</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderWorkloadTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Carga de Trabajo
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Estimación de demanda para las próximas semanas
        </ThemedText>
      </View>

      {data.workload.filter(week => week && typeof week.scheduled === 'number' && typeof week.estimated === 'number').map((week, index) => {
        const percentage = (week.scheduled / week.estimated) * 100;
        return (
          <View key={index} style={[styles.workloadCard, { backgroundColor: cardBg, borderColor: border }]}>
            <ThemedText style={[styles.weekTitle, { color: textPrimary }]}>{week.week}</ThemedText>
            <View style={styles.workloadStats}>
              <View style={styles.workloadStat}>
                <ThemedText style={[styles.statValue, { color: textPrimary }]}>{week.scheduled}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Agendadas</ThemedText>
              </View>
              <View style={styles.workloadStat}>
                <ThemedText style={[styles.statValue, { color: colors.primary }]}>{week.estimated}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Estimadas</ThemedText>
              </View>
            </View>
            <View style={[styles.workloadBar, { backgroundColor: `${colors.primary}10` }]}>
              <View style={[styles.workloadBarFill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
            </View>
            <ThemedText style={[styles.recommendation, { color: textSecondary }]}>
              💡 {week.recommendation}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );

  const renderInventoryTab = () => {
    const pagination = inventoryQuery.data?.pagination;
    
    const handleOrderItem = (itemName: string, itemId?: string) => {
      // Navegar a la tienda de inventario con el item seleccionado
      router.push({
        pathname: '/inventory',
        params: { highlightItem: itemId || itemName }
      });
    };
    
    return (
      <View style={styles.tabContent}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="cube" size={24} color={colors.primary} />
            <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
              Demanda de Inventario
            </ThemedText>
          </View>
          <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
            Predicción de agotamiento de stock
          </ThemedText>
          {pagination && (
            <ThemedText style={[styles.paginationInfo, { color: textSecondary, marginTop: 8 }]}>
              Mostrando {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} items
            </ThemedText>
          )}
        </View>

        {data.inventory.map((item, index) => (
          <View key={index} style={[styles.inventoryCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.inventoryHeader}>
              <ThemedText style={[styles.itemName, { color: textPrimary }]}>{item.itemName}</ThemedText>
              <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(item.urgency)}20` }]}>
                <Ionicons name="time-outline" size={14} color={getUrgencyColor(item.urgency)} />
                <ThemedText style={{ color: getUrgencyColor(item.urgency), fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                  {item.monthsUntilMin < 1 ? 'Crítico' : 'Próximo'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.inventoryStats}>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: textPrimary }]}>{item.currentStock}</ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>Stock Actual</ThemedText>
              </View>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: textPrimary }]}>{item.monthlyUsage}</ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>Uso Mensual</ThemedText>
              </View>
              <View style={styles.inventoryStat}>
                <ThemedText style={[styles.inventoryValue, { color: getUrgencyColor(item.urgency) }]}>{item.monthsUntilMin}</ThemedText>
                <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>Meses Restantes</ThemedText>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.orderButton, { backgroundColor: colors.primary }]}
              onPress={() => handleOrderItem(item.itemName, item.itemId)}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <ThemedText style={styles.orderButtonText}>Pedir Repuestos</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Controles de Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <View style={[styles.paginationControls, { backgroundColor: cardBg, borderColor: border }]}>
            <TouchableOpacity
              style={[styles.paginationButton, { opacity: pagination.page === 1 ? 0.5 : 1 }]}
              onPress={() => setInventoryPage(Math.max(1, inventoryPage - 1))}
              disabled={pagination.page === 1}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <ThemedText style={{ color: colors.primary, marginLeft: 4 }}>Anterior</ThemedText>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <ThemedText style={{ color: textPrimary, fontWeight: '600' }}>
                Página {pagination.page} de {pagination.totalPages}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, { opacity: !pagination.hasMore ? 0.5 : 1 }]}
              onPress={() => setInventoryPage(Math.min(pagination.totalPages, inventoryPage + 1))}
              disabled={!pagination.hasMore}
            >
              <ThemedText style={{ color: colors.primary, marginRight: 4 }}>Siguiente</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: textPrimary }]}>Predicciones IA</ThemedText>
      </View>

      <View style={[styles.tabsContainer, { borderBottomColor: border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Ionicons 
                name={tab.icon as any} 
                size={24} 
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
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={contentScrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={colors.primary} />
        }
      >
        {renderTabContent()}
        <View style={{ height: 40 }} />
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
    borderBottomWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  tabsContainer: {
    height: 160,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
    display: 'flex',
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    minWidth: 120,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  tabLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  tabContent: {
    flex: 1,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  summaryDescription: {
    fontSize: 14,
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
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  paginationInfo: {
    alignItems: 'center',
  },
});
