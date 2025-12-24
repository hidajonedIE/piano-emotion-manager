/**
 * Página de Calendario del Equipo
 * Piano Emotion Manager
 * 
 * Vista de calendario compartido con todas las asignaciones del equipo.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/use-theme-color';
import { useCurrentOrganization } from '../../../hooks/use-organization';
import { useTeamMembers, useMyPermissions } from '../../../hooks/use-team-members';
import { useWorkAssignments } from '../../../hooks/use-work-assignments';
import { TeamCalendar, WorkAssignment } from '../../../components/team/TeamCalendar';
import { WorkAssignmentModal } from '../../../components/team/WorkAssignmentModal';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function TeamCalendarPage() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<WorkAssignment | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  
  // Hooks
  const { currentOrganization, currentOrganizationId } = useCurrentOrganization();
  
  const { assignableTechnicians } = useTeamMembers(currentOrganizationId ?? 0);
  
  const {
    dailySchedule,
    availability,
    selectedDate,
    isLoading,
    createAssignment,
    reassignWork,
    goToDate,
    goToToday,
    refetch,
  } = useWorkAssignments(currentOrganizationId ?? 0);
  
  const { hasPermission } = useMyPermissions(currentOrganizationId ?? 0);
  
  // Handlers
  const handleDateChange = useCallback((date: Date) => {
    goToDate(date);
  }, [goToDate]);
  
  const handleAssignmentPress = useCallback((assignment: WorkAssignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  }, []);
  
  const handleCreateAssignment = useCallback((technicianId: number, time: string) => {
    if (!hasPermission('assignments', 'assign')) {
      Alert.alert('Sin permiso', 'No tienes permiso para crear asignaciones');
      return;
    }
    
    setSelectedAssignment(null);
    setSelectedTechnicianId(technicianId);
    setSelectedTime(time);
    setShowAssignmentModal(true);
  }, [hasPermission]);
  
  const handleAssign = useCallback(async (data: {
    appointmentId?: number;
    technicianId: number;
    scheduledDate: Date;
    scheduledStartTime: string;
    estimatedDuration: number;
    priority: string;
    notes?: string;
  }) => {
    await createAssignment({
      technicianId: data.technicianId,
      scheduledDate: data.scheduledDate.toISOString(),
      scheduledStartTime: data.scheduledStartTime,
      estimatedDuration: data.estimatedDuration,
      priority: data.priority as any,
      assignmentNotes: data.notes,
      appointmentId: data.appointmentId,
    });
  }, [createAssignment]);
  
  const handleReassign = useCallback(async (data: {
    assignmentId: number;
    newTechnicianId: number;
    reason: string;
  }) => {
    await reassignWork(data);
  }, [reassignWork]);
  
  const handleCloseModal = useCallback(() => {
    setShowAssignmentModal(false);
    setSelectedAssignment(null);
    setSelectedTechnicianId(null);
  }, []);
  
  // Prepare schedule data
  const schedule = dailySchedule ?? {
    date: selectedDate,
    technicians: assignableTechnicians.map(tech => ({
      id: tech.id,
      userId: tech.userId,
      displayName: tech.displayName,
      color: tech.color,
      assignments: [],
    })),
  };
  
  // Prepare availability data for modal
  const technicianAvailability = assignableTechnicians.map(tech => {
    const avail = availability.find(a => a.userId === tech.userId);
    return {
      memberId: tech.id,
      userId: tech.userId,
      displayName: tech.displayName,
      color: tech.color,
      isAvailable: avail?.isAvailable ?? true,
      currentLoad: avail?.currentLoad ?? 0,
      maxLoad: tech.maxDailyAppointments,
      nextAvailableSlot: avail?.nextAvailableSlot,
      absenceReason: avail?.absenceReason,
    };
  });
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Calendario del Equipo',
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={goToToday}
              >
                <Ionicons name="today-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={refetch}
              >
                <Ionicons name="refresh-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TeamCalendar
          schedule={schedule}
          onDateChange={handleDateChange}
          onAssignmentPress={handleAssignmentPress}
          onCreateAssignment={handleCreateAssignment}
          workingHoursStart={currentOrganization?.workingHoursStart ?? '08:00'}
          workingHoursEnd={currentOrganization?.workingHoursEnd ?? '20:00'}
        />
      </View>
      
      <WorkAssignmentModal
        visible={showAssignmentModal}
        onClose={handleCloseModal}
        technicians={technicianAvailability}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onAssign={handleAssign}
        onReassign={selectedAssignment ? handleReassign : undefined}
        existingAssignmentId={selectedAssignment?.id}
        currentTechnicianId={selectedAssignment?.technicianId}
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
});
