/**
 * Pantalla Principal de Analíticas
 * Dashboard con métricas, gráficos y estadísticas del negocio
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { KPICard, BarChart, LineChart, PieChart, ProgressBar } from '@/components/charts';
import { useClientsData, usePianosData, useServicesData, useAppointmentsData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTranslation } from '@/hooks/use-translation';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import {
  calculateAllAnalytics,
  formatCurrency,
  formatPercentage,
  AnalyticsData,
} from '@/services/analytics-service';

// Colores para los gráficos
const CHART_COLORS = [
  '#4A90A4', // Accent
  '#7CB342', // Verde
  '#FFA726', // Naranja
  '#AB47BC', // Púrpura
  '#26A69A', // Teal
  '#EF5350', // Rojo
  '#5C6BC0', // Índigo
  '#8D6E63', // Marrón
];

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('year');
  const [refreshing, setRefreshing] = useState(false);

  // Obtener datos
  const { clients, refresh: refreshClients } = useClientsData();
  const { pianos, refresh: refreshPianos } = usePianosData();
  const { services, refresh: refreshServices } = useServicesData();
  const { appointments, refresh: refreshAppointments } = useAppointmentsData();

  // Colores del tema
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');

  // Calcular analíticas
  const analytics: AnalyticsData = useMemo(() => {
    return calculateAllAnalytics(clients, services, pianos, appointments);
  }, [clients, services, pianos, appointments]);

  // Preparar datos para gráficos
  const revenueChartData = useMemo(() => {
    const months = timeRange === 'month' ? 1 : timeRange === 'quarter' ? 3 : timeRange === 'year' ? 12 : analytics.monthlyTrend.length;
    return analytics.monthlyTrend.slice(-months).map(m => ({
      label: m.label.split(' ')[0], // Solo el mes
      value: m.revenue,
    }));
  }, [analytics.monthlyTrend, timeRange]);

  const servicesChartData = useMemo(() => {
    return analytics.serviceTypeStats.slice(0, 5).map((s, i) => ({
      label: s.label,
      value: s.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [analytics.serviceTypeStats]);

  const pianoChartData = useMemo(() => {
    return analytics.pianoDistribution.map((p, i) => ({
      label: p.label,
      value: p.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [analytics.pianoDistribution]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refreshClients?.(),
      refreshPianos?.(),
      refreshServices?.(),
      refreshAppointments?.(),
    ]);
    setRefreshing(false);
  }, [refreshClients, refreshPianos, refreshServices, refreshAppointments]);

  const handleExportReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/analytics/report');
  }, [router]);

  const handleViewDetails = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/analytics/${section}` as any);
  }, [router]);

  // Filtros de tiempo
  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Año' },
    { key: 'all', label: 'Todo' },
  ];

  return (
    <LinearGradient
      colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        title="Analíticas"
        subtitle="Métricas y estadísticas de tu negocio"
        icon="chart.bar.fill"
        rightAction={
          <Pressable onPress={handleExportReport} style={styles.exportButton}>
            <IconSymbol name="square.and.arrow.up" size={20} color={accent} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
          />
        }
      >
        {/* Filtros de tiempo */}
        <View style={styles.timeFilters}>
          {timeRanges.map((range) => (
            <Pressable
              key={range.key}
              style={[
                styles.timeFilter,
                { backgroundColor: cardBg, borderColor },
                timeRange === range.key && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setTimeRange(range.key);
              }}
            >
              <ThemedText
                style={[
                  styles.timeFilterText,
                  { color: timeRange === range.key ? '#FFFFFF' : textSecondary },
                ]}
              >
                {range.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* KPIs principales */}
        <View style={styles.kpiGrid}>
          <KPICard
            title="Ingresos"
            value={formatCurrency(analytics.kpis.revenueThisMonth)}
            trend={analytics.kpis.revenueGrowth}
            trendLabel="vs mes anterior"
            color={success}
          />
          <KPICard
            title="Servicios"
            value={analytics.kpis.servicesThisMonth}
            subtitle="este mes"
            color={accent}
          />
          <KPICard
            title="Clientes"
            value={analytics.kpis.totalClients}
            subtitle={`+${analytics.kpis.newClientsThisMonth} nuevos`}
            color={warning}
          />
          <KPICard
            title="Pianos"
            value={analytics.kpis.totalPianos}
            subtitle="registrados"
            color="#AB47BC"
          />
        </View>

        {/* Métricas adicionales */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Resumen General</ThemedText>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: accent }]}>
                {formatCurrency(analytics.kpis.averageServicePrice)}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: textSecondary }]}>
                Precio medio
              </ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: success }]}>
                {analytics.kpis.clientRetentionRate.toFixed(0)}%
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: textSecondary }]}>
                Retención
              </ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: warning }]}>
                {analytics.upcomingAppointments}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: textSecondary }]}>
                Citas pendientes
              </ThemedText>
            </View>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricValue, { color: accent }]}>
                {formatCurrency(analytics.kpis.totalRevenue)}
              </ThemedText>
              <ThemedText style={[styles.metricLabel, { color: textSecondary }]}>
                Total histórico
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Gráfico de ingresos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => handleViewDetails('revenue')}
          >
            <ThemedText type="defaultSemiBold">Evolución de Ingresos</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </Pressable>
          <LineChart
            data={revenueChartData}
            height={180}
            color={success}
            formatValue={(v) => `€${v}`}
          />
        </View>

        {/* Gráfico de servicios por tipo */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => handleViewDetails('services')}
          >
            <ThemedText type="defaultSemiBold">Servicios por Tipo</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </Pressable>
          <BarChart
            data={servicesChartData}
            height={160}
          />
        </View>

        {/* Distribución de pianos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => handleViewDetails('pianos')}
          >
            <ThemedText type="defaultSemiBold">Distribución de Pianos</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </Pressable>
          <PieChart
            data={pianoChartData}
            size={140}
          />
        </View>

        {/* Top clientes */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => handleViewDetails('clients')}
          >
            <ThemedText type="defaultSemiBold">Top Clientes</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </Pressable>
          {analytics.topClients.slice(0, 5).map((client, index) => (
            <View key={client.id} style={styles.topClientItem}>
              <View style={styles.topClientRank}>
                <ThemedText style={[styles.rankNumber, { color: accent }]}>
                  #{index + 1}
                </ThemedText>
              </View>
              <View style={styles.topClientInfo}>
                <ThemedText numberOfLines={1}>{client.name}</ThemedText>
                <ThemedText style={[styles.topClientStats, { color: textSecondary }]}>
                  {client.totalServices} servicios · {client.pianoCount} pianos
                </ThemedText>
              </View>
              <ThemedText style={[styles.topClientSpent, { color: success }]}>
                {formatCurrency(client.totalSpent)}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Tasa de retención */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Tasa de Retención de Clientes</ThemedText>
          </View>
          <ProgressBar
            value={analytics.kpis.clientRetentionRate}
            label="Clientes que repiten"
            color={success}
            height={12}
          />
          <ThemedText style={[styles.retentionNote, { color: textSecondary }]}>
            {analytics.kpis.clientRetentionRate.toFixed(0)}% de tus clientes han contratado más de un servicio
          </ThemedText>
        </View>

        {/* Espacio inferior */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  exportButton: {
    padding: Spacing.sm,
  },

  // Filtros de tiempo
  timeFilters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeFilter: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // KPIs
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Secciones
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // Métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    paddingVertical: Spacing.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Top clientes
  topClientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  topClientRank: {
    width: 32,
  },
  rankNumber: {
    fontWeight: '700',
  },
  topClientInfo: {
    flex: 1,
  },
  topClientStats: {
    fontSize: 12,
    marginTop: 2,
  },
  topClientSpent: {
    fontWeight: '600',
  },

  // Retención
  retentionNote: {
    fontSize: 12,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
