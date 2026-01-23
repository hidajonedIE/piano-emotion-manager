/**
 * Módulo de Gestión de Equipos
 * Piano Emotion Manager
 * 
 * Pantalla principal para gestionar organizaciones, miembros y asignaciones
 */

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/language-context';
import { BorderRadius, Borders, Shadows, Spacing } from '@/constants/theme';
import { trpc } from '@/lib/trpc';

// Tipos
type TabType = 'members' | 'assignments' | 'zones' | 'absences';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'senior_tech' | 'technician' | 'apprentice' | 'receptionist' | 'accountant' | 'viewer';
  status: 'active' | 'pending_invitation' | 'suspended' | 'inactive';
  phone?: string;
  color?: string;
  specialties?: string[];
  assignedZones?: string[];
  lastActiveAt?: string;
  avatar?: string;
};

type WorkAssignment = {
  id: string;
  technicianId: string;
  technicianName: string;
  clientName: string;
  pianoInfo: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'unassigned' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
};

type ServiceZone = {
  id: string;
  name: string;
  postalCodes: string[];
  assignedTechnicians: string[];
  color: string;
};

type Absence = {
  id: string;
  memberId: string;
  memberName: string;
  type: 'vacation' | 'sick_leave' | 'personal' | 'training' | 'other';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
};

// NO MOCK DATA - Solo datos reales de la base de datos

const ROLE_LABELS: Record<TeamMember['role'], string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  manager: 'Gerente',
  senior_tech: 'Técnico Senior',
  technician: 'Técnico',
  apprentice: 'Aprendiz',
  receptionist: 'Recepcionista',
  accountant: 'Contable',
  viewer: 'Visor',
};

const STATUS_LABELS: Record<TeamMember['status'], string> = {
  active: 'Activo',
  pending_invitation: 'Invitación pendiente',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
};

const ASSIGNMENT_STATUS_LABELS: Record<WorkAssignment['status'], string> = {
  unassigned: 'Sin asignar',
  assigned: 'Asignado',
  accepted: 'Aceptado',
  in_progress: 'En progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const PRIORITY_LABELS: Record<WorkAssignment['priority'], string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const ABSENCE_TYPE_LABELS: Record<Absence['type'], string> = {
  vacation: 'Vacaciones',
  sick_leave: 'Baja médica',
  personal: 'Asuntos personales',
  training: 'Formación',
  other: 'Otro',
};

export default function TeamsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Obtener datos reales del backend
  const organizationsQuery = trpc.team.organizations.list.useQuery();
  const currentOrgId = organizationsQuery.data?.[0]?.id;
  
  const membersQuery = trpc.team.members.list.useQuery(
    { organizationId: currentOrgId! },
    { enabled: !!currentOrgId }
  );
  
  const assignmentsQuery = trpc.team.workAssignments.list.useQuery(
    { organizationId: currentOrgId! },
    { enabled: !!currentOrgId }
  );

  // Colores del tema
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  const members = membersQuery.data || [];
  const assignments = assignmentsQuery.data || [];

  // Estadísticas
  const stats = useMemo(() => ({
    totalMembers: members.length,
    activeMembers: members.filter((m: any) => m.status === 'active').length,
    pendingInvitations: members.filter((m: any) => m.status === 'pending_invitation').length,
    unassignedWork: assignments.filter((a: any) => a.status === 'unassigned').length,
    todayAssignments: assignments.filter((a: any) => 
      a.scheduledDate === new Date().toISOString().split('T')[0]
    ).length,
    pendingAbsences: 0, // TODO: Implementar cuando haya endpoint de ausencias
  }), [members, assignments]);

  // Filtrar miembros
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((m: any) =>
      m.name?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.role?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Tabs
  const tabs: { key: TabType; label: string; icon: string; badge?: number }[] = [
    { key: 'members', label: 'Miembros', icon: 'person.3', badge: stats.totalMembers },
    { key: 'assignments', label: 'Asignaciones', icon: 'calendar.badge.clock', badge: stats.unassignedWork },
    { key: 'zones', label: 'Zonas', icon: 'map' },
    { key: 'absences', label: 'Ausencias', icon: 'calendar.badge.exclamationmark', badge: stats.pendingAbsences },
  ];

  const handleTabChange = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handleInviteMember = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowInviteModal(true);
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    if (membersQuery.isLoading || assignmentsQuery.isLoading) {
      return (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>Cargando...</ThemedText>
        </View>
      );
    }

    if (membersQuery.isError || assignmentsQuery.isError) {
      return (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>Error al cargar datos</ThemedText>
        </View>
      );
    }

    switch (activeTab) {
      case 'members':
        return renderMembersTab();
      case 'assignments':
        return renderAssignmentsTab();
      case 'zones':
        return renderZonesTab();
      case 'absences':
        return renderAbsencesTab();
      default:
        return null;
    }
  };

  const renderMembersTab = () => {
    if (filteredMembers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="person.3" size={64} color={textSecondary} />
          <ThemedText style={styles.emptyText}>
            {searchQuery ? 'No se encontraron miembros' : 'No hay miembros en el equipo'}
          </ThemedText>
          {!searchQuery && (
            <Pressable
              style={[styles.emptyButton, { backgroundColor: accent }]}
              onPress={handleInviteMember}
            >
              <ThemedText style={styles.emptyButtonText}>Invitar miembro</ThemedText>
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {filteredMembers.map((member: any) => (
          <View key={member.id} style={[styles.memberCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.memberHeader}>
              <View style={[styles.memberAvatar, { backgroundColor: member.color || accent }]}>
                <ThemedText style={styles.memberAvatarText}>
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </ThemedText>
              </View>
              <View style={styles.memberInfo}>
                <ThemedText style={styles.memberName}>{member.name || 'Sin nombre'}</ThemedText>
                <ThemedText style={[styles.memberEmail, { color: textSecondary }]}>
                  {member.email || 'Sin email'}
                </ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: member.status === 'active' ? success : warning }
              ]}>
                <ThemedText style={styles.statusText}>
                  {STATUS_LABELS[member.status as TeamMember['status']] || member.status}
                </ThemedText>
              </View>
            </View>
            <View style={styles.memberDetails}>
              <View style={styles.memberDetailRow}>
                <IconSymbol name="briefcase" size={16} color={textSecondary} />
                <ThemedText style={[styles.memberDetailText, { color: textSecondary }]}>
                  {ROLE_LABELS[member.role as TeamMember['role']] || member.role}
                </ThemedText>
              </View>
              {member.phone && (
                <View style={styles.memberDetailRow}>
                  <IconSymbol name="phone" size={16} color={textSecondary} />
                  <ThemedText style={[styles.memberDetailText, { color: textSecondary }]}>
                    {member.phone}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAssignmentsTab = () => {
    if (assignments.length === 0) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol name="calendar.badge.clock" size={64} color={textSecondary} />
          <ThemedText style={styles.emptyText}>No hay asignaciones de trabajo</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {assignments.map((assignment: any) => (
          <View key={assignment.id} style={[styles.assignmentCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.assignmentHeader}>
              <ThemedText style={styles.assignmentClient}>{assignment.clientName}</ThemedText>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: assignment.priority === 'urgent' ? error : assignment.priority === 'high' ? warning : accent }
              ]}>
                <ThemedText style={styles.priorityText}>
                  {PRIORITY_LABELS[assignment.priority as WorkAssignment['priority']]}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.assignmentPiano, { color: textSecondary }]}>
              {assignment.pianoInfo}
            </ThemedText>
            <ThemedText style={[styles.assignmentService, { color: textSecondary }]}>
              {assignment.serviceType}
            </ThemedText>
            <View style={styles.assignmentFooter}>
              <View style={styles.assignmentDate}>
                <IconSymbol name="calendar" size={16} color={textSecondary} />
                <ThemedText style={[styles.assignmentDateText, { color: textSecondary }]}>
                  {assignment.scheduledDate} {assignment.scheduledTime}
                </ThemedText>
              </View>
              {assignment.technicianName && (
                <View style={styles.assignmentTechnician}>
                  <IconSymbol name="person" size={16} color={textSecondary} />
                  <ThemedText style={[styles.assignmentTechnicianText, { color: textSecondary }]}>
                    {assignment.technicianName}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderZonesTab = () => {
    return (
      <View style={styles.emptyState}>
        <IconSymbol name="map" size={64} color={textSecondary} />
        <ThemedText style={styles.emptyText}>Funcionalidad de zonas en desarrollo</ThemedText>
      </View>
    );
  };

  const renderAbsencesTab = () => {
    return (
      <View style={styles.emptyState}>
        <IconSymbol name="calendar.badge.exclamationmark" size={64} color={textSecondary} />
        <ThemedText style={styles.emptyText}>Funcionalidad de ausencias en desarrollo</ThemedText>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con estadísticas */}
      <View style={[styles.statsContainer, { backgroundColor: cardBg }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.totalMembers}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Miembros</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.activeMembers}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Activos</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.unassignedWork}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Sin asignar</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{stats.todayAssignments}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Hoy</ThemedText>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: borderColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && [styles.tabActive, { borderBottomColor: accent }]
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <IconSymbol
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? accent : textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && { color: accent }
                ]}
              >
                {tab.label}
              </ThemedText>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <ThemedText style={styles.badgeText}>{tab.badge}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Barra de búsqueda (solo en tab de miembros) */}
      {activeTab === 'members' && (
        <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: useThemeColor({}, 'text') }]}
            placeholder="Buscar miembros..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Botón flotante */}
      {activeTab === 'members' && (
        <Pressable
          style={[styles.fab, { backgroundColor: accent }]}
          onPress={handleInviteMember}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  memberCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  memberDetails: {
    gap: Spacing.xs,
  },
  memberDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberDetailText: {
    fontSize: 14,
  },
  assignmentCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  assignmentClient: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentPiano: {
    fontSize: 14,
    marginBottom: 4,
  },
  assignmentService: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assignmentDateText: {
    fontSize: 14,
  },
  assignmentTechnician: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assignmentTechnicianText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
});
