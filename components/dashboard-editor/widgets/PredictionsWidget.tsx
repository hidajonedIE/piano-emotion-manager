/**
 * PredictionsWidget - Widget de predicciones IA del dashboard
 * Muestra proyecciones de ingresos y servicios basadas en tendencias
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useClientsData, useServicesData } from '@/hooks/data';

interface WidgetProps {
  config?: Record<string, any>;
  isEditing?: boolean;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';
}

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

const styles = StyleSheet.create({
  widgetContent: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
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
});
