/**
 * Dashboard Screen - Elegant Professional Design
 * Piano Emotion Manager
 * 
 * Diseño aprobado con:
 * - Barra de alertas (verde/roja, compacta y elegante)
 * - Grid 2x2 de métricas "Este Mes"
 * - Predicciones IA con indicadores circulares
 * - Próximas citas
 * - Acciones rápidas (botones terracota)
 * - Botón flotante IA
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useHeader } from '@/contexts/HeaderContext';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks y datos
import { useClientsData, usePianosData, useServicesData, useAppointmentsData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { useAlertsOptimized } from '@/hooks/use-alerts-optimized';
import { trpc } from '@/utils/trpc';

// Colores del diseño Elegant Professional
const COLORS = {
  primary: '#003a8c',      // Azul Cobalto
  accent: '#e07a5f',       // Terracota
  white: '#ffffff',
  background: '#f5f5f5',
  
  // Alertas
  alertSuccess: '#10b981', // Verde (sin alertas)
  alertDanger: '#ff4d4f',  // Rojo (con alertas)
  
  // Métricas
  services: '#003a8c',     // Azul Cobalto
  income: '#10b981',       // Verde Esmeralda
  clients: '#0891b2',      // Cian Oscuro
  pianos: '#7c3aed',       // Violeta Profundo
  
  // IA
  aiWarning: '#f59e0b',    // Ámbar
  
  // Textos
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Configurar header
  useFocusEffect(
    React.useCallback(() => {
    setHeaderConfig({
      title: 'Inicio',
      subtitle: 'Panel de control principal',
      icon: 'house.fill',
      showBackButton: false,
    });
    }, [setHeaderConfig])
  );

  // Calcular rango de fechas del mes seleccionado para filtrado eficiente
  const dateRange = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    // Primer día del mes
    const dateFrom = new Date(year, month, 1);
    // Último día del mes
    const dateTo = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  }, [selectedMonth]);
  
  // Datos - servicios filtrados por mes seleccionado
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { services } = useServicesData(dateRange);
  const { appointments } = useAppointmentsData();
  const { alerts, stats: alertStats } = useAlertsOptimized(15);
  
  // Predicciones IA generadas por Gemini - Usando nuevo endpoint unificado
  const { data: predictionsData, isLoading: loadingPredictions } = trpc.aiPredictions.getDashboardPredictions.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  
  // Formatear datos para compatibilidad con el UI existente
  const aiPredictions = {
    predictions: {
      revenueGrowth: predictionsData?.revenue?.predicted || "N/A",
      clientsAtRisk: predictionsData?.churn?.atRisk || 0,
      pianosNeedingMaintenance: predictionsData?.maintenance?.needed || 0,
    }
  };

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Estadísticas del mes seleccionado
  const monthStats = useMemo(() => {
    const selectedYear = selectedMonth.getFullYear();
    const selectedMonthNum = selectedMonth.getMonth() + 1; // 1-12
    
    const monthServices = services.filter((s) => {
      // Extraer año y mes del timestamp ISO (formato: YYYY-MM-DDTHH:MM:SS.SSSZ o YYYY-MM-DD)
      const dateStr = String(s.date);
      // Los primeros 10 caracteres son siempre YYYY-MM-DD
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(5, 7));
      return year === selectedYear && month === selectedMonthNum;
    });

    const monthlyRevenue = monthServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    // Filtrar appointments del mes seleccionado
    const monthAppointments = appointments.filter((apt) => {
      // Extraer año y mes directamente del string de fecha (formato: YYYY-MM-DD...)
      const dateStr = String(apt.date);
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(5, 7));
      return year === selectedYear && month === selectedMonthNum;
    });

    // Contar clientes únicos con servicios/appointments en el mes
    const uniqueClientIds = new Set(
      [...monthServices.map(s => s.clientId), ...monthAppointments.map(a => a.clientId)]
        .filter(id => id !== null && id !== undefined)
    );

    // Contar pianos únicos con servicios/appointments en el mes
    const uniquePianoIds = new Set(
      [...monthServices.map(s => s.pianoId), ...monthAppointments.map(a => a.pianoId)]
        .filter(id => id !== null && id !== undefined)
    );

    return {
      services: monthServices.length,
      revenue: monthlyRevenue,
      clients: uniqueClientIds.size,
      pianos: uniquePianoIds.size,
    };
  }, [services, clients, pianos, appointments, selectedMonth]);

  // Próximas citas (3 más cercanas)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((apt) => new Date(apt.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [appointments]);

  // Navegación de meses
  const navigatePreviousMonth = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const navigateNextMonth = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedMonth(new Date());
  }, []);

  // Determinar estado de alertas
  const hasAlerts = (alertStats?.urgent || 0) + (alertStats?.warning || 0) > 0;
  const alertCount = (alertStats?.urgent || 0) + (alertStats?.warning || 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BARRA DE ALERTAS - Compacta y elegante */}
        <Pressable
          style={[
            styles.alertBanner,
            { backgroundColor: hasAlerts ? COLORS.alertDanger : COLORS.alertSuccess },
          ]}
          onPress={() => router.push('/alerts')}
        >
          <View style={styles.alertContent}>
            <Ionicons
              name={hasAlerts ? 'warning-outline' : 'checkmark-circle-outline'}
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.alertText}>
              {hasAlerts
                ? `${alertCount} ${alertCount === 1 ? 'alerta requiere' : 'alertas requieren'} tu atención`
                : 'Todo en orden'}
            </Text>
          </View>
          {hasAlerts && (
            <Text style={styles.alertLink}>Ver →</Text>
          )}
        </Pressable>

        {/* Contenedor principal con padding */}
        <View style={styles.mainContent}>
          {/* 2. SECCIÓN "ESTE MES" + PREDICCIONES IA */}
          <View style={[styles.topSection, isDesktop && styles.topSectionDesktop]}>
            {/* Este Mes - Grid 2x2 */}
            <View style={[styles.thisMonthContainer, isDesktop && styles.thisMonthDesktop]}>
              {/* Header con navegación */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Este Mes</Text>
                <View style={styles.monthNavigation}>
                  <Pressable
                    style={styles.monthButton}
                    onPress={navigatePreviousMonth}
                  >
                    <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                  </Pressable>
                  <Pressable style={styles.todayButton} onPress={goToToday}>
                    <Text style={styles.todayText}>
                      {selectedMonth.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).charAt(0).toUpperCase() + selectedMonth.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).slice(1)}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.monthButton}
                    onPress={navigateNextMonth}
                  >
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </Pressable>
                  <Pressable style={styles.calendarButton} onPress={() => router.push('/(app)/calendar')}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.aiWarning} />
                  </Pressable>
                </View>
              </View>

              {/* Grid de métricas 2x2 */}
              <View style={styles.metricsGrid}>
                <MetricCard
                  icon="construct-outline"
                  iconColor={COLORS.services}
                  value={monthStats.services.toString()}
                  label="Servicios"
                  onPress={() => router.push('/(drawer)/services')}
                />
                <MetricCard
                  icon="cash-outline"
                  iconColor={COLORS.income}
                  value={`${monthStats.revenue.toFixed(0)} €`}
                  label="Ingresos"
                  onPress={() => router.push('/(drawer)/invoices')}
                />
                <MetricCard
                  icon="people-outline"
                  iconColor={COLORS.clients}
                  value={monthStats.clients.toString()}
                  label="Clientes"
                  onPress={() => router.push('/(drawer)/clients')}
                />
                <MetricCard
                  icon="musical-notes-outline"
                  iconColor={COLORS.pianos}
                  value={monthStats.pianos.toString()}
                  label="Pianos"
                  onPress={() => router.push('/(drawer)/inventory')}
                />
              </View>
            </View>

            {/* Predicciones IA */}
            <View style={[styles.aiPredictionsContainer, isDesktop && styles.aiPredictionsDesktop]}>
              <View style={styles.sectionHeader}>
                <View style={styles.aiHeaderLeft}>
                  <Ionicons name="bulb-outline" size={22} color={COLORS.pianos} />
                  <Text style={styles.sectionTitle}>Predicciones IA</Text>
                </View>
                <Pressable onPress={() => router.push('/predictions')}>
                  <Text style={styles.linkText}>Ver todo →</Text>
                </Pressable>
              </View>

                <View style={styles.predictionsRow}>
                <CircularIndicator
                  color={COLORS.income}
                  icon="trending-up"
                  label="Ingresos prev."
                  value={loadingPredictions ? "..." : aiPredictions.predictions.revenueGrowth}
                />
                <CircularIndicator
                  color={COLORS.aiWarning}
                  icon="help-circle-outline"
                  label="Clientes riesgo"
                  value={loadingPredictions ? "..." : aiPredictions.predictions.clientsAtRisk.toString()}
                />
                <CircularIndicator
                  color={COLORS.pianos}
                  icon="build-outline"
                  label="Mant. próximo"
                  value={loadingPredictions ? "..." : aiPredictions.predictions.pianosNeedingMaintenance.toString()}
                />
              </View>
            </View>
          </View>

          {/* 3. PRÓXIMAS CITAS + ACCIONES RÁPIDAS */}
          <View style={[styles.bottomSection, isDesktop && styles.bottomSectionDesktop]}>
            {/* Próximas Citas */}
            <View style={[styles.appointmentsContainer, isDesktop && styles.appointmentsDesktop]}>
              <Text style={styles.sectionTitle}>Próximas Citas</Text>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt, index) => (
                  <AppointmentRow
                    key={apt.id}
                    appointment={apt}
                    onPress={() => router.push(`/appointment/${apt.id}`)}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No hay citas próximas</Text>
                </View>
              )}
            </View>

            {/* Acciones Rápidas */}
            <View style={[styles.quickActionsContainer, isDesktop && styles.quickActionsDesktop]}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <View style={styles.actionsGrid}>
                <ActionButton icon="person-add-outline" label="Nuevo Cliente" onPress={() => router.push('/client/new')} />
                <ActionButton icon="construct-outline" label="Nuevo Servicio" onPress={() => router.push('/service/new')} />
                <ActionButton icon="receipt-outline" label="Nueva Factura" onPress={() => router.push('/invoice/new')} />
                <ActionButton icon="musical-notes-outline" label="Nuevo Piano" onPress={() => router.push('/piano/new')} />
                <ActionButton icon="document-text-outline" label="Nuevo Presupuesto" onPress={() => router.push('/quote/new')} />
                <ActionButton icon="calendar-outline" label="Nueva Cita" onPress={() => router.push('/appointment/new')} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>


    </View>
  );
}

// ============================================================================
// COMPONENTES
// ============================================================================

interface MetricCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  onPress?: () => void;
}

function MetricCard({ icon, iconColor, value, label, onPress }: MetricCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.metricCard,
        pressed && styles.metricCardPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={32} color={iconColor} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}

interface CircularIndicatorProps {
  color: string;
  icon: string;
  label: string;
  value: string;
}

function CircularIndicator({ color, icon, label, value }: CircularIndicatorProps) {
  return (
    <View style={styles.circularIndicator}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.circleValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
}

interface AppointmentRowProps {
  appointment: any;
  onPress: () => void;
}

function AppointmentRow({ appointment, onPress }: AppointmentRowProps) {
  const date = new Date(appointment.date);
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.appointmentRow,
        pressed && styles.appointmentRowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.appointmentTime}>
        <Text style={styles.appointmentTimeText}>{timeStr}</Text>
        <Text style={styles.appointmentDateText}>{dateStr}</Text>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.appointmentTitle} numberOfLines={1}>
          {appointment.title || 'Cita sin título'}
        </Text>
        <Text style={styles.appointmentClient} numberOfLines={1}>
          {appointment.clientName || 'Cliente no especificado'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </Pressable>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={24} color={COLORS.white} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 72, // Espacio para el botón flotante (10% menos)
  },

  // Barra de alertas - Compacta y elegante
  alertBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7, // Compacta: 10% menos
    marginTop: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },
  alertLink: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // Contenido principal
  mainContent: {
    padding: 11,
  },

  // Sección superior
  topSection: {
    gap: 11,
    marginBottom: 11,
    flexDirection: 'column',
  },
  topSectionDesktop: {
    flexDirection: 'row',
    gap: 14,
  },

  // Este Mes
  thisMonthContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 9,
    padding: 11,
    maxWidth: '95%',
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  thisMonthDesktop: {
    flex: 1,
    alignSelf: 'stretch',
  },

  // Header de sección
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Navegación de mes
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthButton: {
    padding: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calendarButton: {
    padding: 4,
  },

  // Grid de métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 9,
    padding: 11,
    alignItems: 'center',
    width: 'calc(50% - 5.7px)', // 2 columnas con gap (5% menos)
    minWidth: 133,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  metricCardPressed: {
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  // Predicciones IA
  aiPredictionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 9,
    padding: 11,
    maxWidth: '95%',
    alignSelf: 'center',
    width: '100%',
    minHeight: 160,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  aiPredictionsDesktop: {
    flex: 1,
    alignSelf: 'stretch',
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  predictionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 7,
    minHeight: 120,
    paddingVertical: 16,
  },
  circularIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  circle: {
    width: 63,
    height: 63,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    flexDirection: 'column',
  },
  circleValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  circleLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },

  // Sección inferior
  bottomSection: {
    gap: 11,
    flexDirection: 'column',
  },
  bottomSectionDesktop: {
    flexDirection: 'row',
    gap: 14,
  },

  // Próximas citas
  appointmentsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 9,
    padding: 11,
    maxWidth: '95%',
    alignSelf: 'center',
    width: '100%',
    minHeight: 250,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  appointmentsDesktop: {
    flex: 1,
    alignSelf: 'stretch',
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentRowPressed: {
    opacity: 0.7,
  },
  appointmentTime: {
    width: 70,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  appointmentDateText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appointmentClient: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 7,
  },

  // Acciones rápidas
  quickActionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 9,
    padding: 11,
    maxWidth: '95%',
    alignSelf: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  quickActionsDesktop: {
    flex: 1,
    alignSelf: 'stretch',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 7,
  },
  actionButton: {
    backgroundColor: COLORS.accent, // Terracota
    borderRadius: 9,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    width: 'calc(50% - 4.5px)', // 2 columnas
    minWidth: 117,
    minHeight: 63,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(224, 122, 95, 0.3)',
      },
      default: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },


});
