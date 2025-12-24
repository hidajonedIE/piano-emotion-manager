/**
 * Hook para el Portal del Cliente
 * Gestiona la generación de tokens y acceso al portal
 */

import { useState, useCallback, useMemo } from 'react';
import { createHash } from 'crypto';
import { Client, Piano, Service } from '@/types';
import { Appointment } from '@/types/business';

// Prefijo para identificar tokens de portal
const TOKEN_PREFIX = 'cp_';
const SECRET = 'piano-emotion-portal-2024';

/**
 * Genera un token único para un cliente
 */
export function generateClientToken(clientId: string): string {
  // En el navegador usamos una implementación simple
  const data = `${clientId}:${SECRET}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
  return `${TOKEN_PREFIX}${hashStr}`;
}

/**
 * Valida un token y encuentra el cliente correspondiente
 */
export function findClientByToken(token: string, clients: Client[]): Client | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  for (const client of clients) {
    const clientToken = generateClientToken(client.id);
    if (clientToken === token) {
      return client;
    }
  }

  return null;
}

/**
 * Genera la URL del portal para un cliente
 */
export function generatePortalUrl(clientId: string, baseUrl?: string): string {
  const token = generateClientToken(clientId);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/portal?token=${token}`;
}

/**
 * Hook principal del portal del cliente
 */
export function useClientPortal(
  clients: Client[],
  pianos: Piano[],
  services: Service[],
  appointments: Appointment[]
) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  /**
   * Genera un enlace de portal para un cliente
   */
  const generatePortalLink = useCallback((clientId: string) => {
    return generatePortalUrl(clientId);
  }, []);

  /**
   * Obtiene los datos del portal para un cliente por token
   */
  const getPortalData = useCallback((token: string) => {
    const client = findClientByToken(token, clients);
    
    if (!client) {
      return null;
    }

    // Filtrar pianos del cliente
    const clientPianos = pianos.filter(p => p.clientId === client.id);

    // Filtrar servicios del cliente
    const clientServices = services
      .filter(s => s.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filtrar citas futuras del cliente
    const today = new Date().toISOString().split('T')[0];
    const clientAppointments = appointments
      .filter(a => a.clientId === client.id && a.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Mapear pianos con su último servicio
    const pianosWithService = clientPianos.map(piano => {
      const pianoServices = clientServices.filter(s => s.pianoId === piano.id);
      const lastService = pianoServices[0];
      
      return {
        ...piano,
        lastServiceDate: lastService?.date,
        lastServiceType: lastService?.type,
        servicesCount: pianoServices.length,
      };
    });

    // Mapear servicios con datos del piano
    const servicesWithPiano = clientServices.slice(0, 20).map(service => {
      const piano = clientPianos.find(p => p.id === service.pianoId);
      return {
        ...service,
        pianoBrand: piano?.brand,
        pianoModel: piano?.model,
      };
    });

    // Mapear citas con datos del piano
    const appointmentsWithPiano = clientAppointments.map(apt => {
      const piano = clientPianos.find(p => p.id === apt.pianoId);
      return {
        ...apt,
        pianoBrand: piano?.brand,
        pianoModel: piano?.model,
      };
    });

    return {
      client: {
        id: client.id,
        name: client.type === 'company'
          ? client.companyName || 'Sin nombre'
          : `${client.firstName} ${client.lastName}`.trim() || 'Sin nombre',
        email: client.email,
        phone: client.phone,
        address: client.address,
        type: client.type,
      },
      pianos: pianosWithService,
      services: servicesWithPiano,
      appointments: appointmentsWithPiano,
    };
  }, [clients, pianos, services, appointments]);

  return {
    generatePortalLink,
    getPortalData,
    selectedClientId,
    setSelectedClientId,
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
 * Formatea una fecha para mostrar
 */
export function formatPortalDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
