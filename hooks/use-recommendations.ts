import { useMemo } from 'react';

import {
  Piano,
  Service,
  Recommendation,
  ServiceType,
  daysSince,
  RECOMMENDED_INTERVALS,
} from '@/types';

// Umbrales para prioridades de afinación (en días)
// Afinación recomendada cada 6 meses (180 días)
const TUNING_THRESHOLDS = {
  urgent: 270, // Más de 9 meses = urgente
  pending: 180, // Entre 6 y 9 meses = pendiente
};

// Umbrales para regulación (en días)
// Regulación recomendada cada 2 años aproximadamente
const REGULATION_THRESHOLDS = {
  urgent: 1095, // Más de 3 años = urgente
  pending: 730, // Entre 2 y 3 años = pendiente
};

export function useRecommendations(pianos: Piano[], services: Service[]) {
  const recommendations = useMemo(() => {
    const result: Recommendation[] = [];

    pianos.forEach((piano) => {
      // Obtener servicios de este piano ordenados por fecha (más reciente primero)
      const pianoServices = services
        .filter((s) => s.pianoId === piano.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // 1. VERIFICAR ESTADO DEL PIANO
      // Si el piano necesita reparación, esa es la prioridad máxima
      if (piano.condition === 'needs_repair') {
        result.push({
          pianoId: piano.id,
          clientId: piano.clientId,
          type: 'repair',
          priority: 'urgent',
          message: 'Este piano requiere reparación antes de poder ser afinado.',
          daysSinceLastService: 0,
        });
        // No agregar recomendación de afinación si necesita reparación
        return;
      }

      // 2. RECOMENDACIÓN DE AFINACIÓN (servicio principal, 2 veces al año)
      const lastTuning = pianoServices.find((s) => s.type === 'tuning');
      
      if (!lastTuning) {
        // Nunca se ha afinado - usar fecha de creación del piano
        const daysSinceCreation = daysSince(piano.createdAt);
        let priority: 'urgent' | 'pending' | 'ok' = 'ok';
        
        if (daysSinceCreation > TUNING_THRESHOLDS.urgent) {
          priority = 'urgent';
        } else if (daysSinceCreation > TUNING_THRESHOLDS.pending) {
          priority = 'pending';
        }

        result.push({
          pianoId: piano.id,
          clientId: piano.clientId,
          type: 'tuning',
          priority,
          message: `Piano sin registro de afinación. Registrado hace ${formatTimePeriod(daysSinceCreation)}.`,
          daysSinceLastService: daysSinceCreation,
        });
      } else {
        const daysSinceLastTuning = daysSince(lastTuning.date);
        let priority: 'urgent' | 'pending' | 'ok' = 'ok';
        let message: string;

        if (daysSinceLastTuning > TUNING_THRESHOLDS.urgent) {
          priority = 'urgent';
          message = `Hace ${formatTimePeriod(daysSinceLastTuning)} desde la última afinación. Se recomienda afinar urgentemente.`;
        } else if (daysSinceLastTuning > TUNING_THRESHOLDS.pending) {
          priority = 'pending';
          message = `Hace ${formatTimePeriod(daysSinceLastTuning)} desde la última afinación. Es momento de programar la próxima.`;
        } else {
          message = `Última afinación hace ${formatTimePeriod(daysSinceLastTuning)}. Próxima afinación recomendada en ${formatTimePeriod(RECOMMENDED_INTERVALS.tuning - daysSinceLastTuning)}.`;
        }

        result.push({
          pianoId: piano.id,
          clientId: piano.clientId,
          type: 'tuning',
          priority,
          message,
          daysSinceLastService: daysSinceLastTuning,
        });
      }

      // 3. RECOMENDACIÓN DE REGULACIÓN (periódica, cada ~2 años)
      const lastRegulation = pianoServices.find((s) => s.type === 'regulation');
      
      if (!lastRegulation) {
        // Verificar si el piano tiene suficiente antigüedad para necesitar regulación
        const daysSinceCreation = daysSince(piano.createdAt);
        
        if (daysSinceCreation > REGULATION_THRESHOLDS.pending) {
          result.push({
            pianoId: piano.id,
            clientId: piano.clientId,
            type: 'regulation',
            priority: daysSinceCreation > REGULATION_THRESHOLDS.urgent ? 'urgent' : 'pending',
            message: `Sin registro de regulación. Se recomienda una regulación para optimizar el mecanismo.`,
            daysSinceLastService: daysSinceCreation,
          });
        }
      } else {
        const daysSinceLastRegulation = daysSince(lastRegulation.date);
        
        if (daysSinceLastRegulation > REGULATION_THRESHOLDS.urgent) {
          result.push({
            pianoId: piano.id,
            clientId: piano.clientId,
            type: 'regulation',
            priority: 'urgent',
            message: `Hace ${formatTimePeriod(daysSinceLastRegulation)} desde la última regulación. Se recomienda programar una regulación.`,
            daysSinceLastService: daysSinceLastRegulation,
          });
        } else if (daysSinceLastRegulation > REGULATION_THRESHOLDS.pending) {
          result.push({
            pianoId: piano.id,
            clientId: piano.clientId,
            type: 'regulation',
            priority: 'pending',
            message: `Hace ${formatTimePeriod(daysSinceLastRegulation)} desde la última regulación. Considerar programar una regulación próximamente.`,
            daysSinceLastService: daysSinceLastRegulation,
          });
        }
      }
    });

    // Ordenar por prioridad (urgente primero, luego pendiente, luego ok)
    // Dentro de cada prioridad, ordenar por días (más días = más arriba)
    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, pending: 1, ok: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.daysSinceLastService - a.daysSinceLastService;
    });
  }, [pianos, services]);

  // Contadores
  const urgentCount = useMemo(
    () => recommendations.filter((r) => r.priority === 'urgent').length,
    [recommendations]
  );

  const pendingCount = useMemo(
    () => recommendations.filter((r) => r.priority === 'pending').length,
    [recommendations]
  );

  const pianosNeedingRepair = useMemo(
    () => pianos.filter((p) => p.condition === 'needs_repair').length,
    [pianos]
  );

  // Funciones de filtrado
  const getRecommendationsForPiano = (pianoId: string) =>
    recommendations.filter((r) => r.pianoId === pianoId);

  const getRecommendationsForClient = (clientId: string) =>
    recommendations.filter((r) => r.clientId === clientId);

  const getUrgentRecommendations = () =>
    recommendations.filter((r) => r.priority === 'urgent');

  const getPendingRecommendations = () =>
    recommendations.filter((r) => r.priority === 'pending');

  const getTuningRecommendations = () =>
    recommendations.filter((r) => r.type === 'tuning' && r.priority !== 'ok');

  const getRegulationRecommendations = () =>
    recommendations.filter((r) => r.type === 'regulation');

  const getRepairRecommendations = () =>
    recommendations.filter((r) => r.type === 'repair');

  return {
    recommendations,
    urgentCount,
    pendingCount,
    pianosNeedingRepair,
    getRecommendationsForPiano,
    getRecommendationsForClient,
    getUrgentRecommendations,
    getPendingRecommendations,
    getTuningRecommendations,
    getRegulationRecommendations,
    getRepairRecommendations,
  };
}

// Formatear período de tiempo en español
function formatTimePeriod(days: number): string {
  if (days < 0) {
    return 'próximamente';
  }
  
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  
  if (years >= 2) {
    return `${years} años`;
  } else if (years === 1) {
    if (months > 0) {
      return `1 año y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return '1 año';
  } else if (months >= 1) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else {
    return `${days} ${days === 1 ? 'día' : 'días'}`;
  }
}
