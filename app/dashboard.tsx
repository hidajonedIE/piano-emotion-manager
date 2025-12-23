import { useRouter, Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useServices, useClients, usePianos } from '@/hooks/use-storage';
import { useInvoices } from '@/hooks/use-invoices';
import { getClientFullName } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Este trimestre',
  year: 'Este año',
  all: 'Todo',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  regulation: 'Regulación',
  maintenance: 'Mantenimiento',
  inspection: 'Inspección',
  other: 'Otro',
};

const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: 'Particular',
  student: 'Estudiante',
  professional: 'Profesional',
  music_school: 'Escuela de música',
  conservatory: 'Conservatorio',
  concert_hall: 'Sala de conciertos',
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { services } = useServices();
  const { clients } = useClients();
  const { pianos } = usePianos();
  const { invoices } = useInvoices();
  
  const [period, setPeriod] = useState<Period>('month');

  const getStartDate = (p: Period): Date => {
    const now = new Date();
    switch (p) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterMonth, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'all':
        return new Date(0);
    }
  };

  const stats = useMemo(() => {
    const startDate = getStartDate(period);
    
    // Filtrar servicios por período
    const filteredServices = services.filter(s => new Date(s.date) >= startDate);
    
    // Filtrar facturas por período
    const filteredInvoices = invoices.filter(i => new Date(i.date) >= startDate);
    
    // Ingresos totales
    const totalRevenue = filteredServices.reduce((sum, s) => sum + (s.cost || 0), 0);
    
    // Ingresos facturados
    const invoicedRevenue = filteredInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    
    // Pendiente de cobro
    const pendingRevenue = filteredInvoices
      .filter(i => i.status === 'sent')
      .reduce((sum, i) => sum + i.total, 0);
    
    // Servicios por tipo
    const servicesByType: Record<string, number> = {};
    filteredServices.forEach(s => {
      servicesByType[s.type] = (servicesByType[s.type] || 0) + 1;
    });
    
    // Clientes por tipo
    const clientsByType: Record<string, number> = {};
    clients.forEach(c => {
      clientsByType[c.type] = (clientsByType[c.type] || 0) + 1;
    });
    
    // Clientes activos (con servicios en el período)
    const activeClientIds = new Set(filteredServices.map(s => s.clientId));
    
    // Pianos por categoría
    const pianosByCategory = {
      vertical: pianos.filter(p => p.category === 'vertical').length,
      grand: pianos.filter(p => p.category === 'grand').length,
    };
    
    // Ingresos por mes (últimos 6 meses)
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthRevenue = services
        .filter(s => {
          const sDate = new Date(s.date);
          return sDate >= monthStart && sDate <= monthEnd;
        })
        .reduce((sum, s) => sum + (s.cost || 0), 0);
      
      monthlyRevenue.push({
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        revenue: monthRevenue,
      });
    }
    
    // Top clientes por ingresos
    const clientRevenue: Record<string, number> = {};
    filteredServices.forEach(s => {
      clientRevenue[s.clientId] = (clientRevenue[s.clientId] || 0) + (s.cost || 0);
    });
    
    const topClients = Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === clientId);
        return { client, revenue };
      })
      .filter(item => item.client)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Promedio por servicio
    const avgServiceValue = filteredServices.length > 0 
      ? totalRevenue / filteredServices.length 
      : 0;
    
    return {
      totalRevenue,
      invoicedRevenue,
      pendingRevenue,
      totalServices: filteredServices.length,
      totalClients: clients.length,
      activeClients: activeClientIds.size,
      totalPianos: pianos.length,
      servicesByType,
      clientsByType,
      pianosByCategory,
      monthlyRevenue,
      topClients,
      avgServiceValue,
    };
  }, [services, clients, pianos, invoices, period]);

  const maxMonthlyRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Panel de Control',
          headerBackTitle: 'Inicio',
        }} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
      >
        {/* Selector de período */}
        <View style={styles.periodSelector}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <ThemedText style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive
              ]}>
                {PERIOD_LABELS[p]}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* KPIs principales */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, styles.kpiCardLarge]}>
            <ThemedText style={styles.kpiLabel}>Ingresos</ThemedText>
            <ThemedText style={styles.kpiValueLarge}>
              {stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </ThemedText>
            <View style={styles.kpiSubRow}>
              <ThemedText style={styles.kpiSub}>
                Cobrado: {stats.invoicedRevenue.toLocaleString('es-ES')} €
              </ThemedText>
              <ThemedText style={[styles.kpiSub, styles.kpiPending]}>
                Pendiente: {stats.pendingRevenue.toLocaleString('es-ES')} €
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.kpiCard}>
            <ThemedText style={styles.kpiLabel}>Servicios</ThemedText>
            <ThemedText style={styles.kpiValue}>{stats.totalServices}</ThemedText>
            <ThemedText style={styles.kpiSub}>
              Media: {stats.avgServiceValue.toFixed(0)} €
            </ThemedText>
          </View>
          
          <View style={styles.kpiCard}>
            <ThemedText style={styles.kpiLabel}>Clientes Activos</ThemedText>
            <ThemedText style={styles.kpiValue}>{stats.activeClients}</ThemedText>
            <ThemedText style={styles.kpiSub}>
              de {stats.totalClients} totales
            </ThemedText>
          </View>
          
          <View style={styles.kpiCard}>
            <ThemedText style={styles.kpiLabel}>Pianos</ThemedText>
            <ThemedText style={styles.kpiValue}>{stats.totalPianos}</ThemedText>
            <ThemedText style={styles.kpiSub}>
              {stats.pianosByCategory.vertical} vert. / {stats.pianosByCategory.grand} cola
            </ThemedText>
          </View>
        </View>

        {/* Gráfico de ingresos mensuales */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Evolución de Ingresos (6 meses)
          </ThemedText>
          <View style={styles.chartContainer}>
            {stats.monthlyRevenue.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <ThemedText style={styles.barValue}>
                  {item.revenue > 0 ? `${(item.revenue / 1000).toFixed(1)}k` : '0'}
                </ThemedText>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: `${(item.revenue / maxMonthlyRevenue) * 100}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.barLabel}>{item.month}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        {/* Servicios por tipo */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Servicios por Tipo
          </ThemedText>
          {Object.entries(stats.servicesByType).length > 0 ? (
            Object.entries(stats.servicesByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const total = stats.totalServices || 1;
                const percentage = (count / total) * 100;
                return (
                  <View key={type} style={styles.statRow}>
                    <ThemedText style={styles.statLabel}>
                      {SERVICE_TYPE_LABELS[type] || type}
                    </ThemedText>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, { width: `${percentage}%` }]} />
                    </View>
                    <ThemedText style={styles.statValue}>{count}</ThemedText>
                  </View>
                );
              })
          ) : (
            <ThemedText style={styles.emptyText}>Sin servicios en este período</ThemedText>
          )}
        </ThemedView>

        {/* Clientes por tipo */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Clientes por Tipo
          </ThemedText>
          {Object.entries(stats.clientsByType).length > 0 ? (
            Object.entries(stats.clientsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const total = stats.totalClients || 1;
                const percentage = (count / total) * 100;
                return (
                  <View key={type} style={styles.statRow}>
                    <ThemedText style={styles.statLabel}>
                      {CLIENT_TYPE_LABELS[type] || type}
                    </ThemedText>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.statBarClients, { width: `${percentage}%` }]} />
                    </View>
                    <ThemedText style={styles.statValue}>{count}</ThemedText>
                  </View>
                );
              })
          ) : (
            <ThemedText style={styles.emptyText}>Sin clientes registrados</ThemedText>
          )}
        </ThemedView>

        {/* Top clientes */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Top 5 Clientes por Ingresos
          </ThemedText>
          {stats.topClients.length > 0 ? (
            stats.topClients.map((item, index) => (
              <Pressable 
                key={item.client?.id} 
                style={styles.topClientRow}
                onPress={() => router.push(`/client/${item.client?.id}`)}
              >
                <View style={styles.topClientRank}>
                  <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                </View>
                <View style={styles.topClientInfo}>
                  <ThemedText style={styles.topClientName}>{item.client ? getClientFullName(item.client) : '-'}</ThemedText>
                  <ThemedText style={styles.topClientType}>
                    {CLIENT_TYPE_LABELS[item.client?.type || ''] || item.client?.type}
                  </ThemedText>
                </View>
                <ThemedText style={styles.topClientRevenue}>
                  {item.revenue.toLocaleString('es-ES')} €
                </ThemedText>
              </Pressable>
            ))
          ) : (
            <ThemedText style={styles.emptyText}>Sin datos en este período</ThemedText>
          )}
        </ThemedView>

        {/* Acciones rápidas */}
        <View style={styles.actionsRow}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push('/stats')}
          >
            <ThemedText style={styles.actionButtonText}>Ver más estadísticas</ThemedText>
          </Pressable>
          
          <Pressable 
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => router.push('/invoices')}
          >
            <ThemedText style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Ver facturas
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  periodButtonActive: {
    backgroundColor: '#2D5A27',
  },
  periodButtonText: {
    fontSize: 13,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiCardLarge: {
    minWidth: '100%',
    backgroundColor: '#2D5A27',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5A27',
  },
  kpiValueLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  kpiSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  kpiSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  kpiPending: {
    color: '#FFA500',
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  barWrapper: {
    width: 30,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: '#2D5A27',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    width: 120,
    fontSize: 13,
    color: '#444',
  },
  statBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#2D5A27',
    borderRadius: 10,
    minWidth: 4,
  },
  statBarClients: {
    backgroundColor: '#4A90D9',
  },
  statValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  topClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topClientRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D5A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  topClientInfo: {
    flex: 1,
  },
  topClientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  topClientType: {
    fontSize: 11,
    color: '#888',
  },
  topClientRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D5A27',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2D5A27',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2D5A27',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#2D5A27',
  },
});
