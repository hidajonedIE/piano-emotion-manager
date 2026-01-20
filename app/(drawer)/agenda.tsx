/**
 * Agenda Screen - Professional Minimalist Design
 * Piano Emotion Manager
 * 
 * Diseño profesional y minimalista:
 * - Sin colorines infantiles
 * - Paleta neutra con acentos azules
 * - Calendario limpio y funcional
 * - Lista de citas sobria
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

// Hooks y componentes
import { useClientsData, usePianosData, useAppointmentsData } from '@/hooks/data';
import { useTranslation } from '@/hooks/use-translation';
import { CalendarView } from '@/components/calendar-view';
import { EmptyState } from '@/components/cards';
import { FAB } from '@/components/fab';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Appointment, APPOINTMENT_STATUS_LABELS, formatDate, getClientFullName } from '@/types';
import { BorderRadius, Spacing } from '@/constants/theme';

// Paleta profesional minimalista
const COLORS = {
  primary: '#003a8c',       // Azul corporativo
  background: '#ffffff',    // Blanco puro
  surface: '#f8f9fa',       // Gris muy claro
  border: '#e5e7eb',        // Gris claro para bordes
  textPrimary: '#1a1a1a',   // Negro casi puro
  textSecondary: '#6b7280', // Gris medio
  textTertiary: '#9ca3af',  // Gris claro
  accent: '#e07a5f',        // Terracota (solo para acciones)
  success: '#10b981',       // Verde para confirmado
  warning: '#f59e0b',       // Ámbar para pendiente
};

export default function AgendaScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setHeaderConfig } = useHeader();
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Datos
  const { clients } = useClientsData();
  const { pianos } = usePianosData();
  const { appointments, loading } = useAppointmentsData();

  // Determinar si es móvil, tablet o desktop
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  // Configurar header
  useEffect(() => {
    setHeaderConfig({
      title: 'Agenda',
      subtitle: 'Gestión de citas y calendario',
      icon: 'calendar.fill',
      showBackButton: false,
    });
  }, [setHeaderConfig]);

  // Estadísticas de citas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments.filter(a => {
      const appDate = new Date(a.date);
      appDate.setHours(0, 0, 0, 0);
      return appDate.getTime() === today.getTime();
    });
    
    const pending = appointments.filter(a => a.status === 'pending').length;
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    
    return {
      total: appointments.length,
      today: todayAppointments.length,
      pending,
      confirmed,
      completed,
    };
  }, [appointments]);

  // Citas del día seleccionado
  const dayAppointments = useMemo(() => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    return appointments
      .filter(a => {
        const appDate = new Date(a.date);
        appDate.setHours(0, 0, 0, 0);
        return appDate.getTime() === selected.getTime();
      })
      .sort((a, b) => {
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [appointments, selectedDate]);

  // Helpers
  const getClient = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const getPiano = useCallback((pianoId: string) => {
    return pianos.find(p => p.id === pianoId);
  }, [pianos]);

  // Handlers
  const handleAddAppointment = () => {
    router.push({
      pathname: '/appointment/[id]' as any,
      params: { id: 'new' },
    });
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    router.push({
      pathname: '/appointment/[id]' as any,
      params: { id: appointment.id },
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Mostrar animación de carga inicial
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
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
      >
        {/* Estadísticas minimalistas */}
        <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        {/* Calendario */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Calendario</Text>
          <View style={styles.calendarContainer}>
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              appointments={appointments}
            />
          </View>
        </View>

        {/* Citas del día seleccionado */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>
            Citas del {formatDate(selectedDate, 'dd/MM/yyyy')}
          </Text>
          
          {dayAppointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="calendar-outline"
                title="No hay citas"
                message="No hay citas programadas para este día"
                actionLabel="Añadir Cita"
                onAction={handleAddAppointment}
              />
            </View>
          ) : (
            <View style={styles.appointmentsList}>
              {dayAppointments.map((appointment) => {
                const client = appointment.clientId ? getClient(appointment.clientId) : null;
                const piano = appointment.pianoId ? getPiano(appointment.pianoId) : null;
                
                return (
                  <Pressable
                    key={appointment.id}
                    style={styles.appointmentCard}
                    onPress={() => handleAppointmentPress(appointment)}
                  >
                    <View style={styles.appointmentHeader}>
                      <View style={styles.appointmentTime}>
                        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.timeText}>{appointment.startTime || '00:00'}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: appointment.status === 'confirmed' 
                            ? COLORS.success 
                            : appointment.status === 'completed'
                            ? COLORS.primary
                            : COLORS.warning 
                        }
                      ]}>
                        <Text style={styles.statusText}>
                          {APPOINTMENT_STATUS_LABELS[appointment.status] || 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.appointmentBody}>
                      <Text style={styles.appointmentTitle}>{appointment.title || 'Sin título'}</Text>
                      {client && (
                        <View style={styles.appointmentDetail}>
                          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.appointmentDetailText}>
                            {getClientFullName(client)}
                          </Text>
                        </View>
                      )}
                      {piano && (
                        <View style={styles.appointmentDetail}>
                          <Ionicons name="musical-notes-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.appointmentDetailText}>
                            {piano.brand} {piano.model}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

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
                setSelectedDate(new Date());
              }}
            >
              <Ionicons name="today-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionButtonText}>Hoy</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // Filtrar pendientes
              }}
            >
              <Ionicons name="list-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionButtonText}>Pendientes</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB icon="add" onPress={handleAddAppointment} label="Nueva Cita" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentDesktop: {
    paddingHorizontal: Spacing.xl,
  },
  
  // Estadísticas
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  statsSectionDesktop: {
    paddingHorizontal: 0,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Secciones
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: Spacing.sm,
  },
  
  // Calendario
  calendarSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  
  // Citas
  appointmentsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
  },
  appointmentsList: {
    gap: Spacing.sm,
  },
  appointmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentBody: {
    gap: 6,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // Acciones
  actionsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionsGridDesktop: {
    maxWidth: 400,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
