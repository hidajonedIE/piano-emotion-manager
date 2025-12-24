/**
 * Página Principal de Gestión de Equipo
 * Piano Emotion Manager
 * 
 * Dashboard principal para la gestión del equipo de técnicos.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme-color';
import { useCurrentOrganization } from '../../../hooks/use-organization';
import { useTeamMembers, useMyPermissions } from '../../../hooks/use-team-members';
import { useWorkAssignments } from '../../../hooks/use-work-assignments';
import { TeamDashboard } from '../../../components/team/TeamDashboard';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function TeamIndexPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  // Hooks
  const { 
    currentOrganization, 
    currentOrganizationId,
    isLoading: isLoadingOrg 
  } = useCurrentOrganization();
  
  const { 
    members, 
    activeMembers,
    pendingInvitations,
    isLoading: isLoadingMembers,
    refetch: refetchMembers 
  } = useTeamMembers(currentOrganizationId ?? 0);
  
  const {
    dailySchedule,
    isLoading: isLoadingSchedule,
    refetch: refetchSchedule,
  } = useWorkAssignments(currentOrganizationId ?? 0);
  
  const { isAdmin, isManager } = useMyPermissions(currentOrganizationId ?? 0);
  
  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMembers(), refetchSchedule()]);
    setRefreshing(false);
  }, [refetchMembers, refetchSchedule]);
  
  const handleTechnicianPress = useCallback((memberId: number) => {
    router.push(`/team/members/${memberId}`);
  }, [router]);
  
  const handleViewCalendar = useCallback(() => {
    router.push('/team/calendar');
  }, [router]);
  
  const handleManageTeam = useCallback(() => {
    router.push('/team/members');
  }, [router]);
  
  // Loading state
  if (isLoadingOrg || !currentOrganization) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando organización...
        </Text>
      </View>
    );
  }
  
  // No organization state
  if (!currentOrganizationId) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Sin Organización
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Crea una organización para gestionar tu equipo de técnicos.
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/team/create-organization')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Crear Organización</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Calculate stats
  const stats = {
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    pendingInvitations: pendingInvitations.length,
    totalAppointmentsToday: dailySchedule?.technicians.reduce(
      (sum, t) => sum + t.assignments.length, 0
    ) ?? 0,
    completedToday: dailySchedule?.technicians.reduce(
      (sum, t) => sum + t.assignments.filter(a => a.status === 'completed').length, 0
    ) ?? 0,
    pendingToday: dailySchedule?.technicians.reduce(
      (sum, t) => sum + t.assignments.filter(a => 
        ['assigned', 'accepted', 'in_progress'].includes(a.status)
      ).length, 0
    ) ?? 0,
    totalRevenueMonth: 0, // TODO: Calcular desde servicios
    totalServicesMonth: 0, // TODO: Calcular desde servicios
    averageRatingMonth: 0, // TODO: Calcular desde valoraciones
  };
  
  // Calculate technician metrics
  const technicianMetrics = activeMembers
    .filter(m => m.canBeAssigned)
    .map(member => {
      const techSchedule = dailySchedule?.technicians.find(t => t.userId === member.userId);
      const assignments = techSchedule?.assignments ?? [];
      
      return {
        memberId: member.id,
        displayName: member.displayName,
        color: member.color,
        appointmentsScheduled: assignments.length,
        appointmentsCompleted: assignments.filter(a => a.status === 'completed').length,
        appointmentsCancelled: assignments.filter(a => a.status === 'cancelled').length,
        servicesCompleted: assignments.filter(a => a.status === 'completed').length,
        totalWorkMinutes: assignments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.actualDuration ?? a.estimatedDuration ?? 60), 0),
        totalRevenue: 0, // TODO: Calcular desde servicios
        averageRating: 4.5, // TODO: Calcular desde valoraciones
        ratingsCount: 10, // TODO: Calcular desde valoraciones
        onTimeArrivals: 8, // TODO: Calcular desde asignaciones
        lateArrivals: 2, // TODO: Calcular desde asignaciones
      };
    });
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Equipo',
          headerRight: () => (
            <View style={styles.headerRight}>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => router.push('/team/settings')}
                >
                  <Ionicons name="settings-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      
      <TeamDashboard
        organizationName={currentOrganization.name}
        stats={stats}
        technicianMetrics={technicianMetrics}
        period={period}
        onPeriodChange={setPeriod}
        onTechnicianPress={handleTechnicianPress}
        onViewCalendar={handleViewCalendar}
        onManageTeam={handleManageTeam}
      />
    </>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
});
