/**
 * Dashboard de Analytics - Rediseñado
 * Piano Emotion Manager
 * Diseño alineado con el dashboard principal
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useDashboardMetrics,
  useRevenueChart,
  useServicesByType,
  useMonthlyTrends,
  useReportExport,
  type PeriodPreset,
  type DateRange,
} from '@/hooks/reports';
import { useTranslation } from '@/hooks/use-translation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Colores del diseño Elegant Professional (igual que dashboard)
const COLORS = {
  primary: '#003a8c',      // Azul Cobalto
  accent: '#e07a5f',       // Terracota
  white: '#ffffff',
  background: '#f5f5f5',
  
  // Métricas
  services: '#003a8c',     // Azul Cobalto
  income: '#10b981',       // Verde Esmeralda
  clients: '#0891b2',      // Cian Oscuro
  pianos: '#7c3aed',       // Morado
};

// ============================================================================
// Types
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface CircularIndicatorProps {
  value: string | number;
  label: string;
  color: string;
}

// ============================================================================
// Metric Card Component (Grid 2x2)
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {change !== undefined && (
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={isPositive ? '#22c55e' : '#ef4444'}
          />
          <Text
            style={[
              styles.changeText,
              { color: isPositive ? '#22c55e' : '#ef4444' },
            ]}
          >
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Circular Indicator Component
// ============================================================================

const CircularIndicator: React.FC<CircularIndicatorProps> = ({ value, label, color }) => {
  return (
    <View style={styles.circularIndicator}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.circleValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface AnalyticsDashboardProps {
  onNavigateToReports?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onNavigateToReports,
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>('thisMonth');
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const {
    metrics,
    isLoading: metricsLoading,
    dateRange,
    changePeriod,
  } = useDashboardMetrics(selectedPeriod);
  const { data: revenueData } = useRevenueChart(dateRange, 'month');
  const { data: rawServicesData } = useServicesByType(dateRange);
  const { downloadPDF } = useReportExport();

  // Transformar servicesData para incluir name, percentage y color
  const servicesData = useMemo(() => {
    if (!rawServicesData) return [];
    const total = rawServicesData.reduce((sum, s) => sum + s.count, 0);
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return rawServicesData.map((service, index) => ({
      name: service.typeName,
      count: service.count,
      percentage: total > 0 ? ((service.count / total) * 100).toFixed(1) : '0',
      color: colors[index % colors.length],
    }));
  }, [rawServicesData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Aquí iría la lógica de refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleExport = useCallback(() => {
    downloadPDF('executive', dateRange);
  }, [dateRange, downloadPDF]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const periods: { key: PeriodPreset; label: string }[] = [
    { key: 'thisWeek', label: t('reports.thisWeek') },
    { key: 'thisMonth', label: t('reports.thisMonth') },
    { key: 'thisQuarter', label: t('reports.thisQuarter') },
    { key: 'thisYear', label: t('reports.thisYear') },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header con Period Selector integrado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t('reports.analytics')}</Text>
          <Text style={styles.headerSubtitle}>Análisis y estadísticas del negocio</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.key)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={16} color={COLORS.primary} />
            <Text style={styles.exportButtonText}>{t('reports.export')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid de Métricas 2x2 */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title={t('reports.revenue')}
          value={formatCurrency(metrics?.revenue?.total || 0)}
          change={metrics?.revenue?.changePercent}
          icon="cash-outline"
          color={COLORS.income}
        />
        <MetricCard
          title={t('reports.services')}
          value={metrics?.services?.total || 0}
          icon="construct-outline"
          color={COLORS.services}
        />
        <MetricCard
          title={t('reports.clients')}
          value={metrics?.clients?.total || 0}
          change={metrics?.clients?.changePercent}
          icon="people-outline"
          color={COLORS.clients}
        />
        <MetricCard
          title={t('reports.avgTicket')}
          value={formatCurrency(metrics?.averages?.ticketValue || 0)}
          icon="receipt-outline"
          color={COLORS.pianos}
        />
      </View>

      {/* Layout horizontal: Gráficos */}
      <View style={styles.chartsRow}>
        {/* Gráfico Evolución de Ingresos (60%) */}
        <View style={styles.chartLarge}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('reports.revenueEvolution')}</Text>
          </View>
          <View style={styles.chartContent}>
            {revenueData && revenueData.length > 0 ? (
              <View style={styles.barsContainer}>
                {revenueData.slice(0, 6).map((item, index) => {
                  const maxValue = Math.max(...revenueData.map(d => d.value));
                  const height = (item.value / maxValue) * 100;
                  return (
                    <View key={index} style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${height}%`,
                            backgroundColor: COLORS.income,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Sin datos</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gráfico Servicios por Tipo (40%) */}
        <View style={styles.chartSmall}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('reports.servicesByType')}</Text>
          </View>
          <View style={styles.servicesListCompact}>
            {servicesData && servicesData.length > 0 ? (
              servicesData.slice(0, 5).map((service, index) => (
                <View key={index} style={styles.serviceItemCompact}>
                  <View style={styles.serviceInfo}>
                    <View style={[styles.serviceDot, { backgroundColor: service.color }]} />
                    <Text style={styles.serviceName}>{service.name}</Text>
                  </View>
                  <View style={styles.serviceStats}>
                    <Text style={styles.serviceCount}>{service.count}</Text>
                    <Text style={styles.servicePercent}>{service.percentage}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Sin datos</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Estadísticas Rápidas (6 indicadores circulares en 2 filas) */}
      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>{t('reports.quickStats')}</Text>
        <View style={styles.quickStatsRow}>
          <CircularIndicator
            value={`${metrics?.services?.completionRate?.toFixed(0) || 0}%`}
            label={t('reports.completionRate')}
            color={COLORS.income}
          />
          <CircularIndicator
            value={`${metrics?.clients?.retention?.toFixed(0) || 0}%`}
            label={t('reports.retention')}
            color="#f59e0b"
          />
          <CircularIndicator
            value={metrics?.pianos?.total || 0}
            label={t('reports.pianos')}
            color={COLORS.pianos}
          />
        </View>
        <View style={styles.quickStatsRow}>
          <CircularIndicator
            value={metrics?.services?.pending || 0}
            label="Servicios pendientes"
            color="#ef4444"
          />
          <CircularIndicator
            value={metrics?.clients?.active || 0}
            label="Clientes activos"
            color={COLORS.clients}
          />
          <CircularIndicator
            value={`${metrics?.averages?.servicesPerClient?.toFixed(1) || 0}`}
            label="Servicios/Cliente"
            color="#8b5cf6"
          />
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.white + 'CC',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white + '20',
  },
  periodButtonActive: {
    backgroundColor: COLORS.white,
  },
  periodButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.primary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  exportButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  // Metrics Grid 2x2
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  metricCard: {
    width: isWeb ? 'calc(50% - 4px)' : (SCREEN_WIDTH - 32) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  metricTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  // Charts Row
  chartsRow: {
    flexDirection: isWeb ? 'row' : 'column',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  chartLarge: {
    flex: isWeb ? 0.6 : 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartSmall: {
    flex: isWeb ? 0.4 : 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartHeader: {
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chartContent: {
    height: 140,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 6,
  },
  emptyChart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  // Services List Compact
  servicesListCompact: {
    gap: 6,
  },
  serviceItemCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 12,
    color: '#374151',
  },
  serviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 6,
  },
  servicePercent: {
    fontSize: 11,
    color: '#9ca3af',
  },
  // Quick Stats Section
  quickStatsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Circular Indicator
  circularIndicator: {
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circleValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  circleLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
