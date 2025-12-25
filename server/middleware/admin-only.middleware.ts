/**
 * Middleware de Control de Acceso para Configuraciones Sensibles
 * Piano Emotion Manager
 * 
 * Restringe el acceso a configuraciones de credenciales solo a administradores
 */

import { TRPCError } from '@trpc/server';

// Roles que pueden acceder a configuraciones sensibles
const ADMIN_ROLES = ['owner', 'admin'];

// Recursos que requieren permisos de administrador
const SENSITIVE_RESOURCES = [
  'payment_gateway',
  'whatsapp_config',
  'smtp_config',
  'calendar_oauth',
  'woocommerce_config',
  'verifactu_config'
];

/**
 * Verifica si el usuario tiene rol de administrador
 */
export function isAdmin(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ADMIN_ROLES.includes(userRole.toLowerCase());
}

/**
 * Verifica si el usuario puede acceder a un recurso sensible
 */
export function canAccessSensitiveResource(
  userRole: string | undefined,
  resource: string
): boolean {
  // Si no es un recurso sensible, permitir acceso
  if (!SENSITIVE_RESOURCES.includes(resource)) {
    return true;
  }
  
  // Solo administradores pueden acceder a recursos sensibles
  return isAdmin(userRole);
}

/**
 * Middleware para verificar acceso de administrador
 * Usar en procedimientos tRPC que manejan credenciales
 */
export function requireAdmin(userRole: string | undefined, action: string): void {
  if (!isAdmin(userRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Solo los administradores pueden ${action}. Tu rol actual no tiene permisos suficientes.`,
    });
  }
}

/**
 * Middleware para verificar acceso a recurso sensible
 */
export function requireSensitiveAccess(
  userRole: string | undefined,
  resource: string,
  action: string
): void {
  if (!canAccessSensitiveResource(userRole, resource)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `No tienes permisos para ${action}. Esta operación requiere rol de administrador.`,
    });
  }
}

/**
 * Registra un intento de acceso denegado (para auditoría)
 */
export interface AccessDeniedEvent {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
  userRole: string;
  ipAddress?: string;
}

export function logAccessDenied(event: AccessDeniedEvent): void {
  console.warn(
    `[SECURITY] Acceso denegado: Usuario ${event.userId} (rol: ${event.userRole}) ` +
    `intentó ${event.action} en ${event.resource} para org ${event.organizationId}`
  );
}

/**
 * Tipos de permisos granulares para configuraciones
 */
export interface ConfigPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

/**
 * Obtiene los permisos de configuración según el rol
 */
export function getConfigPermissions(userRole: string | undefined): ConfigPermissions {
  if (isAdmin(userRole)) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
    };
  }
  
  // Técnicos y otros roles: solo lectura limitada
  return {
    canView: false, // No pueden ver credenciales
    canEdit: false,
    canDelete: false,
    canExport: false,
  };
}
