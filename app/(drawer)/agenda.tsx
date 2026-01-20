/**
 * Agenda Screen - Elegant Professional Design
 * Piano Emotion Manager
 * 
 * Diseño siguiendo el patrón del Dashboard:
 * - Header configurado con useHeader
 * - Grid de estadísticas de citas
 * - Vista de calendario
 * - Lista de próximas citas
 * - Optimizador de rutas
 * - Acciones rápidas
 * - FAB para añadir cita
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks y componentes
import { useClientsData, usePianosData, useAppointmentsData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { CalendarView } from '@/components/calendar-view';
import { RouteOptimizer } from '@/components/route-optimizer';
import { EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Appointment, APPOINTMENT_STATUS_LABELS, formatDate, getClientFullName } from '@/types';
import { BorderRadius, Spacing } from '@/constants/theme';

// Colores del diseño Elegant Professional
const COLORS = {
  primary: '#003a8c',      // Azul Cobalto
  accent: '#e07a5f',       // Terracota
  white: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  cardBg: '#ffffff',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ff4d4f',
};

export default function AgendaScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // Datos
  const { appointments, loading } = useAppointmentsData();
  const { getClient } = useClientsData();
  const { getPiano } = usePianosData();

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Estadísticas de citas
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pending = appointments.filter(a => a.status === 'pending' && a.date >= today).length;
    const confirmed = appointments.filter(a => a.status === 'confirmed' && a.date >= today).length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    
    return { pending, confirmed, completed, cancelled };
  }, [appointments]);

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: 'Agenda',
      subtitle: `${stats.pending + stats.confirmed} citas pendientes`,
      icon: 'calendar',
      showBackButton: false,
    });
  }, [stats.pending, stats.confirmed, setHeaderConfig]);

  // Próximas citas (hoy y futuras)
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(a => a.date >= today && a.status !== 'cancelled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5); // Mostrar solo las próximas 5
  }, [appointments]);

  // Navegación
  const handleAddAppointment = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/appointments/new');
  }, [router]);

  const handleAppointmentPress = useCallback((appointment: Appointment) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/appointments/${appointment.id}`);
  }, [router]);

  // Render de loading inicial
  if (loading && appointments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <LoadingSpinner size="large" messageType="appointments" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contenedor principal con padding */}
        <View style={styles.mainContent}>
          {/* Estadísticas de citas */}
          <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="time" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.confirmed}</Text>
              <Text style={styles.statLabel}>Confirmadas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#0891b2' }]}>
              <Ionicons name="checkmark-done" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ff4d4f' }]}>
              <Ionicons name="close-circle" size={24} color={COLORS.white} />
              <Text style={styles.statNumber}>{stats.cancelled}</Text>
              <Text style={styles.statLabel}>Canceladas</Text>
            </View>
          </View>

          {/* Vista de calendario */}
          <View style={styles.calendarSection}>
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onAppointmentPress={handleAppointmentPress}
            />
          </View>

          {/* Próximas citas */}
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximas Citas</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/appointments');
                }}
              >
                <Text style={styles.seeAllText}>Ver todo →</Text>
              </Pressable>
            </View>

            {upcomingAppointments.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No hay citas próximas"
                message="Añade una cita para comenzar"
                actionLabel="Añadir Cita"
                onAction={handleAddAppointment}
              />
            ) : (
              <View style={styles.appointmentsList}>
                {upcomingAppointments.map((appointment) => {
                  const client = appointment.clientId ? getClient(appointment.clientId) : null;
                  const piano = appointment.pianoId ? getPiano(appointment.pianoId) : null;
                  
                  return (
                    <Pressable
                      key={appointment.id}
                      style={styles.appointmentCard}
                      onPress={() => handleAppointmentPress(appointment)}
                    >
                      <View style={styles.appointmentTime}>
                        <Text style={styles.timeText}>{appointment.startTime}</Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: appointment.status === 'confirmed' ? COLORS.success : COLORS.warning }
                        ]}>
                          <Text style={styles.statusText}>
                            {APPOINTMENT_STATUS_LABELS[appointment.status]}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                        {client && (
                          <Text style={styles.appointmentClient}>
                            {getClientFullName(client)}
                          </Text>
                        )}
                        {piano && (
                          <Text style={styles.appointmentPiano}>
                            {piano.brand} {piano.model}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Optimizador de rutas */}
          {upcomingAppointments.length > 1 && (
            <View style={styles.optimizerSection}>
              <Pressable
                style={styles.optimizerButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowRouteOptimizer(!showRouteOptimizer);
                }}
              >
                <Ionicons name="map" size={20} color={COLORS.white} />
                <Text style={styles.optimizerButtonText}>
                  {showRouteOptimizer ? 'Ocultar' : 'Optimizar'} Ruta del Día
                </Text>
              </Pressable>
              
              {showRouteOptimizer && (
                <View style={styles.optimizerContainer}>
                  <RouteOptimizer appointments={upcomingAppointments} />
                </View>
              )}
            </View>
          )}

          {/* Acciones rápidas */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/appointments/calendar');
                }}
              >
                <Ionicons name="calendar-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Vista Mensual</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push('/appointments/export');
                }}
              >
                <Ionicons name="cloud-download-outline" size={24} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Exportar Agenda</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB para añadir cita */}
      <FAB 
        onPress={handleAddAppointment} 
        accessibilityLabel="Añadir cita"
        accessibilityHint="Añade una nueva cita a la agenda"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    padding: Spacing.lg,
  },
  
  // Estadísticas
  statsSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  statsSectionDesktop: {
    maxWidth: 1000,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },

  // Calendario
  calendarSection: {
    marginBottom: Spacing.lg,
  },

  // Próximas citas
  upcomingSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  appointmentsList: {
    gap: Spacing.sm,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appointmentTime: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  appointmentInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appointmentClient: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  appointmentPiano: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Optimizador
  optimizerSection: {
    marginBottom: Spacing.lg,
  },
  optimizerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: COLORS.primary,
    borderRadius: BorderRadius.lg,
  },
  optimizerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  optimizerContainer: {
    marginTop: Spacing.md,
  },

  // Acciones rápidas
  actionsSection: {
    marginTop: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionsGridDesktop: {
    maxWidth: 600,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: COLORS.accent,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
