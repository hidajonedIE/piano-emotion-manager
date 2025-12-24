/**
 * Análisis Detallado de Ingresos
 */

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart, KPICard } from '@/components/charts';
import { useServicesData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { calculateMonthlyTrend, formatCurrency } from '@/services/analytics-service';

const CHART_COLORS = ['#4A90A4', '#7CB342', '#FFA726', '#AB47BC', '#26A69A'];

export default function RevenueAnalyticsScreen() {
  const { services } = useServicesData();
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');

  // Calcular tendencia mensual
  const monthlyData = useMemo(() => {
    return calculateMonthlyTrend(services, [], 12);
  }, [services]);

  // Calcular totales
  const totals = useMemo(() => {
    const totalRevenue = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const thisYear = new Date().getFullYear();
    const thisYearServices = services.filter(s => new Date(s.date).getFullYear() === thisYear);
    const yearRevenue = thisYearServices.reduce((sum, s) => sum + (s.cost || 0), 0);
    
    const avgMonthly = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length
      : 0;

    const bestMonth = monthlyData.reduce((best, m) => m.revenue > best.revenue ? m : best, monthlyData[0] || { label: '-', revenue: 0 });

    return { totalRevenue, yearRevenue, avgMonthly, bestMonth };
  }, [services, monthlyData]);

  // Datos para gráfico de líneas
  const lineChartData = useMemo(() => {
    return monthlyData.map(m => ({
      label: m.label.split(' ')[0],
      value: m.revenue,
    }));
  }, [monthlyData]);

  // Datos para gráfico de barras (por tipo de servicio)
  const revenueByType = useMemo(() => {
    const typeMap = new Map<string, number>();
    services.forEach(s => {
      typeMap.set(s.type, (typeMap.get(s.type) || 0) + (s.cost || 0));
    });

    const labels: Record<string, string> = {
      tuning: 'Afinación',
      repair: 'Reparación',
      maintenance: 'Mantenimiento',
      regulation: 'Regulación',
      voicing: 'Armonización',
      other: 'Otros',
    };

    return Array.from(typeMap.entries())
      .map(([type, revenue], i) => ({
        label: labels[type] || type,
        value: revenue,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [services]);

  return (
    <LinearGradient
      colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        title="Análisis de Ingresos"
        subtitle="Detalle de facturación"
        icon="eurosign.circle.fill"
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
            title="Total Histórico"
            value={formatCurrency(totals.totalRevenue)}
            color={success}
          />
          <KPICard
            title="Este Año"
            value={formatCurrency(totals.yearRevenue)}
            color={accent}
          />
          <KPICard
            title="Media Mensual"
            value={formatCurrency(totals.avgMonthly)}
            color="#FFA726"
          />
          <KPICard
            title="Mejor Mes"
            value={formatCurrency(totals.bestMonth?.revenue || 0)}
            subtitle={totals.bestMonth?.label || '-'}
            color="#AB47BC"
          />
        </View>

        {/* Gráfico de evolución */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Evolución Mensual</ThemedText>
          </View>
          <LineChart
            data={lineChartData}
            height={200}
            color={success}
            formatValue={(v) => `€${v}`}
          />
        </View>

        {/* Ingresos por tipo de servicio */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Ingresos por Tipo de Servicio</ThemedText>
          </View>
          <BarChart
            data={revenueByType}
            height={180}
            formatValue={(v) => `€${v}`}
          />
        </View>

        {/* Tabla de meses */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold">Desglose Mensual</ThemedText>
          </View>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>Mes</ThemedText>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>Servicios</ThemedText>
              <ThemedText style={[styles.tableHeaderCell, { color: textSecondary }]}>Ingresos</ThemedText>
            </View>
            {monthlyData.slice().reverse().map((month, index) => (
              <View key={month.month} style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                <ThemedText style={styles.tableCell}>{month.label}</ThemedText>
                <ThemedText style={styles.tableCell}>{month.services}</ThemedText>
                <ThemedText style={[styles.tableCell, { color: success, fontWeight: '600' }]}>
                  {formatCurrency(month.revenue)}
                </ThemedText>
              </View>
            ))}
          </View>
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
});
