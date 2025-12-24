/**
 * Hook de permisos
 * Gestiona los permisos del usuario actual en la organización
 */

import { useState, useEffect, useCallback } from 'react';

// Tipos de roles disponibles
export type Role = 
  | 'owner'
  | 'admin'
  | 'manager'
  | 'senior_tech'
  | 'technician'
  | 'apprentice'
  | 'receptionist'
  | 'accountant'
  | 'viewer';

// Permisos disponibles
export type Permission =
  | 'organization.manage'
  | 'organization.delete'
  | 'members.invite'
  | 'members.remove'
  | 'members.change_role'
  | 'members.view'
  | 'work.assign'
  | 'work.reassign'
  | 'work.view_all'
  | 'work.view_own'
  | 'work.complete'
  | 'clients.create'
  | 'clients.edit'
  | 'clients.delete'
  | 'clients.view'
  | 'pianos.create'
  | 'pianos.edit'
  | 'pianos.delete'
  | 'pianos.view'
  | 'services.create'
  | 'services.edit'
  | 'services.delete'
  | 'services.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.view'
  | 'invoices.send'
  | 'inventory.manage'
  | 'inventory.view'
  | 'inventory.order'
  | 'reports.view'
  | 'reports.export'
  | 'settings.manage'
  | 'shop.view'
  | 'shop.order'
  | 'shop.approve';

// Matriz de permisos por rol
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'organization.manage', 'organization.delete',
    'members.invite', 'members.remove', 'members.change_role', 'members.view',
    'work.assign', 'work.reassign', 'work.view_all', 'work.view_own', 'work.complete',
    'clients.create', 'clients.edit', 'clients.delete', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.delete', 'pianos.view',
    'services.create', 'services.edit', 'services.delete', 'services.view',
    'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view', 'invoices.send',
    'inventory.manage', 'inventory.view', 'inventory.order',
    'reports.view', 'reports.export',
    'settings.manage',
    'shop.view', 'shop.order', 'shop.approve',
  ],
  admin: [
    'organization.manage',
    'members.invite', 'members.remove', 'members.change_role', 'members.view',
    'work.assign', 'work.reassign', 'work.view_all', 'work.view_own', 'work.complete',
    'clients.create', 'clients.edit', 'clients.delete', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.delete', 'pianos.view',
    'services.create', 'services.edit', 'services.delete', 'services.view',
    'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view', 'invoices.send',
    'inventory.manage', 'inventory.view', 'inventory.order',
    'reports.view', 'reports.export',
    'settings.manage',
    'shop.view', 'shop.order', 'shop.approve',
  ],
  manager: [
    'members.invite', 'members.view',
    'work.assign', 'work.reassign', 'work.view_all', 'work.view_own', 'work.complete',
    'clients.create', 'clients.edit', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.view',
    'services.create', 'services.edit', 'services.view',
    'invoices.create', 'invoices.edit', 'invoices.view', 'invoices.send',
    'inventory.manage', 'inventory.view', 'inventory.order',
    'reports.view', 'reports.export',
    'shop.view', 'shop.order',
  ],
  senior_tech: [
    'members.view',
    'work.assign', 'work.view_all', 'work.view_own', 'work.complete',
    'clients.create', 'clients.edit', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.view',
    'services.create', 'services.edit', 'services.view',
    'invoices.create', 'invoices.view',
    'inventory.view', 'inventory.order',
    'reports.view',
    'shop.view', 'shop.order',
  ],
  technician: [
    'members.view',
    'work.view_own', 'work.complete',
    'clients.create', 'clients.edit', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.view',
    'services.create', 'services.edit', 'services.view',
    'invoices.create', 'invoices.view',
    'inventory.view',
    'shop.view',
  ],
  apprentice: [
    'members.view',
    'work.view_own', 'work.complete',
    'clients.view',
    'pianos.view',
    'services.view',
    'inventory.view',
    'shop.view',
  ],
  receptionist: [
    'members.view',
    'work.assign', 'work.view_all',
    'clients.create', 'clients.edit', 'clients.view',
    'pianos.create', 'pianos.edit', 'pianos.view',
    'services.create', 'services.view',
    'invoices.view',
    'shop.view',
  ],
  accountant: [
    'members.view',
    'clients.view',
    'services.view',
    'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view', 'invoices.send',
    'inventory.view',
    'reports.view', 'reports.export',
    'shop.view',
  ],
  viewer: [
    'members.view',
    'work.view_own',
    'clients.view',
    'pianos.view',
    'services.view',
    'invoices.view',
    'inventory.view',
    'reports.view',
    'shop.view',
  ],
};

interface UsePermissionsResult {
  role: Role | null;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
  canManageOrganization: boolean;
  canManageMembers: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canApproveOrders: boolean;
  isLoading: boolean;
}

export function usePermissions(organizationId?: string): UsePermissionsResult {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de rol del usuario
    // En producción, esto vendría del contexto de autenticación o de una API
    const loadRole = async () => {
      setIsLoading(true);
      try {
        // Por defecto, asumimos rol de owner para usuarios individuales
        // En una organización real, esto vendría del servidor
        setRole('owner');
      } catch (error) {
        console.error('Error loading role:', error);
        setRole('viewer');
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [organizationId]);

  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  }, [permissions]);

  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isManager: role === 'manager' || role === 'admin' || role === 'owner',
    isTechnician: ['technician', 'senior_tech', 'apprentice'].includes(role || ''),
    canManageOrganization: hasPermission('organization.manage'),
    canManageMembers: hasAnyPermission(['members.invite', 'members.remove', 'members.change_role']),
    canManageInventory: hasPermission('inventory.manage'),
    canViewReports: hasPermission('reports.view'),
    canApproveOrders: hasPermission('shop.approve'),
    isLoading,
  };
}

export default usePermissions;
