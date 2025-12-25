import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'revenue' | 'churn' | 'maintenance' | 'workload' | 'inventory';

// Datos de ejemplo
const MOCK_DATA = {
  revenue: [
    { period: 'Enero 2026', value: 4250, confidence: 78, trend: 'up', factors: ['Tendencia de crecimiento', 'Temporada alta'] },
    { period: 'Febrero 2026', value: 3980, confidence: 72, trend: 'stable', factors: ['Estabilidad histórica'] },
    { period: 'Marzo 2026', value: 4520, confidence: 65, trend: 'up', factors: ['Temporada de conciertos'] },
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
    { itemName: 'Cuerdas de bajo', currentStock: 5, monthlyUsage: 3, monthsUntilMin: 0.8, urgency: 'high' },
    { itemName: 'Fieltro de martillos', currentStock: 12, monthlyUsage: 4, monthsUntilMin: 1.5, urgency: 'medium' },
    { itemName: 'Clavijas de afinación', currentStock: 45, monthlyUsage: 8, monthsUntilMin: 4.2, urgency: 'low' },
  ],
};

export default function PredictionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(MOCK_DATA);

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const background = colors.background;
  const cardBg = colors.card;
  const border = colors.border;

  const onRefresh = async () => {
    setRefreshing(true);
    // Aquí se cargarían los datos reales del backend
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      </View>

      {data.churn.map((client, index) => (
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
      ))}
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
      </View>

      {data.maintenance.map((item, index) => (
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
      ))}
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
      </View>

      {data.inventory.map((item, index) => (
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
                {item.monthlyUsage}/mes
              </ThemedText>
              <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>
                Consumo
              </ThemedText>
            </View>
            <View style={styles.inventoryStat}>
              <ThemedText style={[styles.inventoryValue, { color: getUrgencyColor(item.urgency) }]}>
                {item.monthsUntilMin} meses
              </ThemedText>
              <ThemedText style={[styles.inventoryLabel, { color: textSecondary }]}>
                Hasta mínimo
              </ThemedText>
            </View>
          </View>

          {item.urgency !== 'low' && (
            <TouchableOpacity style={[styles.orderButton, { backgroundColor: getUrgencyColor(item.urgency) }]}>
              <Ionicons name="cart" size={16} color="#fff" />
              <ThemedText style={styles.orderButtonText}>Crear pedido</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'revenue': return renderRevenueTab();
      case 'churn': return renderChurnTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'workload': return renderWorkloadTab();
      case 'inventory': return renderInventoryTab();
    }
  };

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
            onPress={() => setActiveTab(tab.id as TabType)}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryDescription: {
    fontSize: 14,
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionPeriod: {
    fontSize: 16,
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
    gap: 12,
    marginBottom: 12,
  },
  valueText: {
    fontSize: 28,
    fontWeight: '700',
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  churnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  churnInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pianoInfo: {
    fontSize: 15,
    fontWeight: '600',
  },
  clientNameSmall: {
    fontSize: 13,
    marginTop: 2,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  maintenanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  scheduleButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  workloadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  workloadStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  workloadStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  workloadBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inventoryStat: {
    alignItems: 'center',
  },
  inventoryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  inventoryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
