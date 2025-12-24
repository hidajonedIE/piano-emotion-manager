/**
 * Servicio del Portal del Cliente
 * Genera y valida tokens únicos para acceso al portal
 */

import { createHash, randomBytes } from 'crypto';

// Duración del token en días (0 = sin expiración)
const TOKEN_EXPIRY_DAYS = 0;

// Prefijo para identificar tokens de portal
const TOKEN_PREFIX = 'cp_';

/**
 * Genera un token único para un cliente
 * El token es una combinación del ID del cliente + salt + timestamp
 */
export function generateClientToken(clientId: string, technicianId: string): string {
  const salt = randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  const data = `${clientId}:${technicianId}:${salt}:${timestamp}`;
  const hash = createHash('sha256').update(data).digest('hex').substring(0, 24);
  return `${TOKEN_PREFIX}${hash}`;
}

/**
 * Genera un token simple basado en el ID del cliente (para uso en frontend)
 * Este token es determinístico y siempre genera el mismo resultado para el mismo cliente
 */
export function generateSimpleToken(clientId: string, secret: string = 'piano-emotion-portal'): string {
  const data = `${clientId}:${secret}`;
  const hash = createHash('sha256').update(data).digest('hex').substring(0, 16);
  return `${TOKEN_PREFIX}${hash}`;
}

/**
 * Valida un token y extrae el ID del cliente
 * En una implementación real, esto consultaría una base de datos
 */
export function validateToken(token: string): { valid: boolean; clientId?: string } {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return { valid: false };
  }
  
  // En una implementación real, buscaríamos el token en la BD
  // Por ahora, solo validamos el formato
  const tokenPart = token.substring(TOKEN_PREFIX.length);
  if (tokenPart.length !== 16 && tokenPart.length !== 24) {
    return { valid: false };
  }
  
  return { valid: true };
}

/**
 * Genera la URL completa del portal para un cliente
 */
export function generatePortalUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/portal?token=${token}`;
}

/**
 * Información del portal del cliente
 */
export interface ClientPortalData {
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  pianos: Array<{
    id: string;
    brand: string;
    model: string;
    serialNumber?: string;
    category: string;
    lastServiceDate?: string;
    nextServiceDate?: string;
  }>;
  services: Array<{
    id: string;
    type: string;
    date: string;
    pianoId: string;
    pianoBrand?: string;
    pianoModel?: string;
    status: string;
    cost?: number;
    notes?: string;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    time: string;
    type: string;
    pianoId?: string;
    pianoBrand?: string;
    pianoModel?: string;
    status: string;
    notes?: string;
  }>;
  technician: {
    name: string;
    phone?: string;
    email?: string;
    businessName?: string;
  };
}

/**
 * Etiquetas de tipos de servicio
 */
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  tuning: 'Afinación',
  repair: 'Reparación',
  maintenance: 'Mantenimiento',
  regulation: 'Regulación',
  voicing: 'Armonización',
  restoration: 'Restauración',
  appraisal: 'Tasación',
  moving: 'Transporte',
  other: 'Otros',
};

/**
 * Etiquetas de categorías de piano
 */
export const PIANO_CATEGORY_LABELS: Record<string, string> = {
  vertical: 'Vertical',
  grand: 'De Cola',
  digital: 'Digital',
  organ: 'Órgano',
  other: 'Otros',
};

/**
 * Etiquetas de estado de servicio
 */
export const SERVICE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  scheduled: 'Programado',
  in_progress: 'En progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

/**
 * Etiquetas de estado de cita
 */
export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/**
 * Formatea una fecha para mostrar
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea una hora para mostrar
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
}
