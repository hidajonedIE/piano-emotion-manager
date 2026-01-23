/**
 * Hooks de Analytics y Reportes
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type PeriodPreset = 
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

// ============================================================================
// Helper Functions
// ============================================================================

function getDateRangeFromPreset(preset: PeriodPreset, offset: number = 0): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: now };

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: today };

    case 'thisWeek':
      const refDateWeek = new Date(today);
      refDateWeek.setDate(refDateWeek.getDate() + (offset * 7));
      const startOfWeek = new Date(refDateWeek);
      startOfWeek.setDate(refDateWeek.getDate() - refDateWeek.getDay() + 1); // Lunes
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { startDate: startOfWeek, endDate: offset === 0 ? now : endOfWeek };

    case 'lastWeek':
      const lastWeekEnd = new Date(today);
      lastWeekEnd.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(lastWeekEnd);
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
      return { startDate: lastWeekStart, endDate: lastWeekEnd };

    case 'thisMonth':
      const refMonth = now.getMonth() + offset;
      const refYear = now.getFullYear() + Math.floor(refMonth / 12);
      const adjustedMonth = ((refMonth % 12) + 12) % 12;
      const startOfMonth = new Date(refYear, adjustedMonth, 1);
      const endOfMonth = new Date(refYear, adjustedMonth + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { startDate: startOfMonth, endDate: offset === 0 ? now : endOfMonth };

    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };

    case 'thisQuarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const targetQuarter = currentQuarter + offset;
      const quarterYear = now.getFullYear() + Math.floor(targetQuarter / 4);
      const adjustedQuarter = ((targetQuarter % 4) + 4) % 4;
      const quarterMonth = adjustedQuarter * 3;
      const startOfQuarter = new Date(quarterYear, quarterMonth, 1);
      const endOfQuarter = new Date(quarterYear, quarterMonth + 3, 0);
      endOfQuarter.setHours(23, 59, 59, 999);
      return { startDate: startOfQuarter, endDate: offset === 0 ? now : endOfQuarter };

    case 'lastQuarter':
      const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const lastQuarterStart = new Date(now.getFullYear(), lastQuarterMonth, 1);
      const lastQuarterEnd = new Date(now.getFullYear(), lastQuarterMonth + 3, 0);
      return { startDate: lastQuarterStart, endDate: lastQuarterEnd };

    case 'thisYear':
      const targetYear = now.getFullYear() + offset;
      const startOfYear = new Date(targetYear, 0, 1);
      const endOfYear = new Date(targetYear, 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return { startDate: startOfYear, endDate: offset === 0 ? now : endOfYear };

    case 'lastYear':
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: lastYearStart, endDate: lastYearEnd };

    default:
      return { startDate: today, endDate: now };
  }
}

// ============================================================================
// useDashboardMetrics Hook
// ============================================================================

export function useDashboardMetrics(initialPreset: PeriodPreset = 'thisMonth', offset: number = 0) {
  const [preset, setPreset] = useState<PeriodPreset>(initialPreset);
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const dateRange = useMemo(() => {
    if (preset === 'custom' && customRange) {
      return customRange;
    }
    return getDateRangeFromPreset(preset, offset);
  }, [preset, customRange, offset]);

  const { data: metrics, isLoading, error, refetch } = trpc.analytics.getDashboardMetrics.useQuery({
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
  });

  const changePeriod = useCallback((newPreset: PeriodPreset) => {
    setPreset(newPreset);
  }, []);

  const setCustomDateRange = useCallback((range: DateRange) => {
    setCustomRange(range);
    setPreset('custom');
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refetch,
    dateRange,
    preset,
    changePeriod,
    setCustomDateRange,
  };
}

// ============================================================================
// useRevenueChart Hook
// ============================================================================

export function useRevenueChart(
  dateRange: DateRange,
  groupBy: 'day' | 'week' | 'month' = 'month'
) {
  const { data, isLoading, error } = trpc.analytics.getRevenueByPeriod.useQuery({
    dateRange: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    },
    groupBy,
  });

  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };

    return {
      labels: data.map((d) => d.period),
      datasets: [
        {
          label: 'Ingresos',
          data: data.map((d) => d.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return { revenue: 0, services: 0, averageTicket: 0 };

    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalServices = data.reduce((sum, d) => sum + d.services, 0);

    return {
      revenue: totalRevenue,
      services: totalServices,
      averageTicket: totalServices > 0 ? totalRevenue / totalServices : 0,
    };
  }, [data]);

  return {
    data,
    chartData,
    totals,
    isLoading,
    error,
  };
}

// ============================================================================
// useServicesByType Hook
// ============================================================================

export function useServicesByType(dateRange: DateRange) {
  const { data, isLoading, error } = trpc.analytics.getServicesByType.useQuery({
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
  });

  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };

    return {
      labels: data.map((d) => d.typeName),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: [
            '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
          ],
        },
      ],
    };
  }, [data]);

  return {
    data,
    chartData,
    isLoading,
    error,
  };
}

// ============================================================================
// useMonthlyTrends Hook
// ============================================================================

export function useMonthlyTrends(months: number = 12) {
  const { data, isLoading, error } = trpc.analytics.getMonthlyTrends.useQuery({ months });

  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };

    return {
      labels: data.map((d) => `${d.month} ${d.year}`),
      datasets: [
        {
          label: 'Ingresos',
          data: data.map((d) => d.revenue),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Servicios',
          data: data.map((d) => d.services * 50), // Escalar para visualización
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'transparent',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  }, [data]);

  return {
    data,
    chartData,
    isLoading,
    error,
  };
}

// ============================================================================
// useQuickKPIs Hook
// ============================================================================

export function useQuickKPIs() {
  const { data, isLoading, error, refetch } = trpc.analytics.getQuickKPIs.useQuery();

  return {
    kpis: data,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useYearComparison Hook
// ============================================================================

export function useYearComparison() {
  const { data, isLoading, error } = trpc.analytics.getYearOverYearComparison.useQuery();

  return {
    comparison: data,
    isLoading,
    error,
  };
}

// ============================================================================
// useReportExport Hook
// ============================================================================

export function useReportExport() {
  const exportCSV = trpc.analytics.exportToCSV.useMutation();
  const generateExecutiveSummary = trpc.analytics.generateExecutiveSummary.useMutation();
  const generateServicesReport = trpc.analytics.generateServicesReport.useMutation();
  const generateFinancialReport = trpc.analytics.generateFinancialReport.useMutation();
  const generateClientsReport = trpc.analytics.generateClientsReport.useMutation();

  const downloadCSV = useCallback(async (
    reportType: 'revenue' | 'services' | 'clients' | 'pianos',
    dateRange: DateRange
  ) => {
    const result = await exportCSV.mutateAsync({
      reportType,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
    });

    // Crear y descargar archivo
    const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportCSV]);

  const downloadPDF = useCallback(async (
    reportType: 'executive' | 'services' | 'financial' | 'clients',
    dateRange: DateRange
  ) => {
    let result;

    switch (reportType) {
      case 'executive':
        result = await generateExecutiveSummary.mutateAsync({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        break;
      case 'services':
        result = await generateServicesReport.mutateAsync({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        break;
      case 'financial':
        result = await generateFinancialReport.mutateAsync({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        break;
      case 'clients':
        result = await generateClientsReport.mutateAsync({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        });
        break;
    }

    if (result) {
      // Abrir HTML en nueva pestaña (en producción sería PDF)
      const blob = new Blob([result.content as string], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }, [generateExecutiveSummary, generateServicesReport, generateFinancialReport, generateClientsReport]);

  return {
    downloadCSV,
    downloadPDF,
    isExporting: exportCSV.isPending || 
                 generateExecutiveSummary.isPending ||
                 generateServicesReport.isPending ||
                 generateFinancialReport.isPending ||
                 generateClientsReport.isPending,
  };
}

// ============================================================================
// Export Index
// ============================================================================

export {
  getDateRangeFromPreset,
};
