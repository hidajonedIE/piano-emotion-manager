/**
 * Análisis Detallado de Servicios
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BarChart, PieChart, KPICard, ProgressBar } from '@/components/charts';
import { useServicesData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { calculateServiceTypeStats, formatCurrency } from '@/services/analytics-service';

const CHART_COLORS = ['#4A90A4', '#7CB342', '#FFA726', '#AB47BC', '#26A69A', '#EF5350', '#5C6BC0'];

export default function ServicesAnalyticsScreen() {
  const { services } = useServicesData();

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');

  // Estadísticas por tipo
  const serviceStats = useMemo(() => {
    return calculateServiceTypeStats(services);
  }, [services]);

  // Totales
  const totals = useMemo(() => {
    const total = services.length;
    const totalRevenue = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const avgPrice = total > 0 ? totalRevenue / total : 0;
    const completedServices = services.filter(s => s.status === 'completed').length;
    const completionRate = total > 0 ? (completedServices / total) * 100 : 0;

    return { total, totalRevenue, avgPrice, completedServices, completionRate };
  }, [services]);

  // Datos para gráficos
  const pieChartData = useMemo(() => {
    return serviceStats.slice(0, 6).map((s, i) => ({
      label: s.label,
      value: s.count,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [serviceStats]);

  const revenueBarData = useMemo(() => {
    return serviceStats.slice(0, 6).map((s, i) => ({
      label: s.label.substring(0, 4),
      value: s.revenue,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [serviceStats]);

  return (
    <LinearGradient
      colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        title="Análisis de Servicios"
        subtitle="Tipos y rendimiento"
        icon="wrench.and.screwdriver.fill"
        showBack
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Servicios"
            value={totals.total}
            color={accent}
          />
          <KPICard
            title="Ingresos"
            value={formatCurrency(totals.totalRevenue)}
            color={success}
          />
          <KPICard
            title="Precio Medio"
            value={formatCurrency(totals.avgPrice)}
            color="#FFA726"
          />
          <KPICard
            title="Completados"
            value={`${totals.completionRate.toFixed(0)}%`}
            color="#AB47BC"
          />
        </View>

        {/* Distribución por tipo */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Distribución por Tipo</ThemedText>
          </View>
          <PieChart
            data={pieChartData}
            size={150}
          />
        </View>

        {/* Ingresos por tipo */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Ingresos por Tipo</ThemedText>
          </View>
          <BarChart
            data={revenueBarData}
            height={180}
            formatValue={(v) => `€${v}`}
          />
        </View>

        {/* Tabla detallada */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Desglose por Tipo</ThemedText>
          </View>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
              <ThemedText style={[styles.tableHeaderCell, styles.typeCell, { color: textSecondary }]}>
                Tipo
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>
                Cant.
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>
                Ingresos
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>
                Media
              </ThemedText>
            </View>
            {serviceStats.map((stat, index) => (
              <View key={stat.type} style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                <View style={[styles.tableCell, styles.typeCell]}>
                  <View style={[styles.typeDot, { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
                  <ThemedText numberOfLines={1}>{stat.label}</ThemedText>
                </View>
                <ThemedText style={styles.tableCell}>{stat.count}</ThemedText>
                <ThemedText style={[styles.tableCell, { color: success }]}>
                  {formatCurrency(stat.revenue)}
                </ThemedText>
                <ThemedText style={styles.tableCell}>
                  {formatCurrency(stat.averagePrice)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Barras de progreso por tipo */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Proporción por Tipo</ThemedText>
          </View>
          {serviceStats.map((stat, index) => (
            <ProgressBar
              key={stat.type}
              value={stat.percentage}
              label={stat.label}
              color={CHART_COLORS[index % CHART_COLORS.length]}
              height={10}
            />
          ))}
        </View>

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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
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
  table: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
  },
  typeCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
