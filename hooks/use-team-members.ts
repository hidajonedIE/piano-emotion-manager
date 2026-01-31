/**
 * Hook de Gestión de Miembros del Equipo
 * Piano Emotion Manager
 * 
 * Proporciona acceso a las operaciones de miembros desde componentes React.
 */

import { useState, useCallback } from 'react';
import { trpc } from '../utils/trpc';

// ==========================================
// TIPOS
// ==========================================

export interface TeamMember {
  id: number;
  organizationId: number;
  userId: number;
  role: OrganizationRole;
  status: MemberStatus;
  displayName: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  color: string;
  canBeAssigned: boolean;
  maxDailyAppointments: number;
  assignedZones?: number[];
  specialties?: string[];
  joinedAt?: Date;
  invitedBy?: number;
}

export type OrganizationRole = 
  | 'owner'
  | 'admin'
  | 'manager'
  | 'senior_tech'
  | 'technician'
  | 'apprentice'
  | 'receptionist'
  | 'accountant'
  | 'viewer';

export type MemberStatus = 
  | 'active'
  | 'pending_invitation'
  | 'suspended'
  | 'inactive';

export interface InviteMemberInput {
  organizationId: number;
  email: string;
  role: Exclude<OrganizationRole, 'owner'>;
  message?: string;
}

export interface ChangeMemberRoleInput {
  organizationId: number;
  memberId: number;
  newRole: Exclude<OrganizationRole, 'owner'>;
}

export interface UserPermissions {
  role: OrganizationRole | null;
  permissions: Record<string, string[]>;
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
}

// ==========================================
// HOOK: useTeamMembers
// ==========================================

export function useTeamMembers(organizationId: number) {
  const utils = trpc.useUtils();
  
  // Queries
  const membersQuery = trpc.team.members.list.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );
  
  const assignableQuery = trpc.team.members.assignable.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );
  
  // Mutations
  const inviteMutation = trpc.team.members.invite.useMutation({
    onSuccess: () => {
      utils.team.members.list.invalidate({ organizationId });
    },
  });
  
  const changeRoleMutation = trpc.team.members.changeRole.useMutation({
    onSuccess: () => {
      utils.team.members.list.invalidate({ organizationId });
    },
  });
  
  const suspendMutation = trpc.team.members.suspend.useMutation({
    onSuccess: () => {
      utils.team.members.list.invalidate({ organizationId });
    },
  });
  
  const removeMutation = trpc.team.members.remove.useMutation({
    onSuccess: () => {
      utils.team.members.list.invalidate({ organizationId });
    },
  });
  
  // Actions
  const inviteMember = useCallback(async (input: Omit<InviteMemberInput, 'organizationId'>) => {
    return inviteMutation.mutateAsync({ ...input, organizationId });
  }, [inviteMutation, organizationId]);
  
  const changeMemberRole = useCallback(async (memberId: number, newRole: Exclude<OrganizationRole, 'owner'>) => {
    return changeRoleMutation.mutateAsync({ organizationId, memberId, newRole });
  }, [changeRoleMutation, organizationId]);
  
  const suspendMember = useCallback(async (memberId: number, reason: string) => {
    return suspendMutation.mutateAsync({ organizationId, memberId, reason });
  }, [suspendMutation, organizationId]);
  
  const removeMember = useCallback(async (memberId: number) => {
    return removeMutation.mutateAsync({ organizationId, memberId });
  }, [removeMutation, organizationId]);
  
  const refetch = useCallback(() => {
    membersQuery.refetch();
    assignableQuery.refetch();
  }, [membersQuery, assignableQuery]);
  
  // Computed values
  const activeMembers = (membersQuery.data ?? []).filter(m => m.status === 'active');
  const pendingInvitations = (membersQuery.data ?? []).filter(m => m.status === 'pending_invitation');
  const suspendedMembers = (membersQuery.data ?? []).filter(m => m.status === 'suspended');
  
  const technicians = activeMembers.filter(m => 
    ['owner', 'admin', 'manager', 'senior_tech', 'technician', 'apprentice'].includes(m.role)
  );
  
  const admins = activeMembers.filter(m => 
    ['owner', 'admin'].includes(m.role)
  );
  
  return {
    // Data
    members: membersQuery.data ?? [],
    assignableTechnicians: assignableQuery.data ?? [],
    activeMembers,
    pendingInvitations,
    suspendedMembers,
    technicians,
    admins,
    
    // Loading states
    isLoading: membersQuery.isLoading,
    isLoadingAssignable: assignableQuery.isLoading,
    isInviting: inviteMutation.isPending,
    isChangingRole: changeRoleMutation.isPending,
    isSuspending: suspendMutation.isPending,
    isRemoving: removeMutation.isPending,
    
    // Errors
    error: membersQuery.error,
    inviteError: inviteMutation.error,
    changeRoleError: changeRoleMutation.error,
    suspendError: suspendMutation.error,
    removeError: removeMutation.error,
    
    // Actions
    inviteMember,
    changeMemberRole,
    suspendMember,
    removeMember,
    refetch,
  };
}

// ==========================================
// HOOK: useMyPermissions
// ==========================================

/**
 * Hook para obtener los permisos del usuario actual en una organización.
 */
export function useMyPermissions(organizationId: number) {
  const permissionsQuery = trpc.team.members.myPermissions.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  );
  
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    const permissions = permissionsQuery.data?.permissions;
    if (!permissions) return false;
    return permissions[resource]?.includes(action) ?? false;
  }, [permissionsQuery.data]);
  
  return {
    permissions: permissionsQuery.data,
    role: permissionsQuery.data?.role,
    isAdmin: permissionsQuery.data?.isAdmin ?? false,
    isManager: permissionsQuery.data?.isManager ?? false,
    isTechnician: permissionsQuery.data?.isTechnician ?? false,
    isLoading: permissionsQuery.isLoading,
    error: permissionsQuery.error,
    hasPermission,
  };
}

// ==========================================
// HOOK: useInvitation
// ==========================================

/**
 * Hook para gestionar invitaciones.
 */
export function useInvitation() {
  const utils = trpc.useUtils();
  
  const acceptMutation = trpc.team.members.acceptInvitation.useMutation({
    onSuccess: () => {
      utils.team.organizations.list.invalidate();
    },
  });
  
  const acceptInvitation = useCallback(async (token: string) => {
    return acceptMutation.mutateAsync({ token });
  }, [acceptMutation]);
  
  return {
    acceptInvitation,
    isAccepting: acceptMutation.isPending,
    error: acceptMutation.error,
  };
}

// ==========================================
// HOOK: useMemberProfile
// ==========================================

/**
 * Hook para gestionar el perfil de un miembro específico.
 */
export function useMemberProfile(organizationId: number, memberId: number) {
  const { members, isLoading, changeMemberRole, suspendMember, removeMember } = useTeamMembers(organizationId);
  
  const member = members.find(m => m.id === memberId);
  
  return {
    member,
    isLoading,
    changeMemberRole: (newRole: Exclude<OrganizationRole, 'owner'>) => changeMemberRole(memberId, newRole),
    suspendMember: (reason: string) => suspendMember(memberId, reason),
    removeMember: () => removeMember(memberId),
  };
}

export default useTeamMembers;
