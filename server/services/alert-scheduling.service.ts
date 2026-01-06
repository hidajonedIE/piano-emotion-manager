/**
 * Alert Scheduling Service
 * Genera sugerencias de fechas para servicios basadas en alertas
 */
import * as db from '../db.js';
import { 
  pianos, 
  clients, 
  services, 
  alertHistory,
  appointments,
} from '../../drizzle/schema.js';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';

interface DateSuggestion {
  suggestedDate: Date;
  reason: string;
  priority: 'urgent' | 'pending' | 'optimal';
  pianoId: number;
  clientId: number;
  serviceType: 'tuning' | 'regulation' | 'repair';
  daysOverdue?: number;
}

interface AvailableSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // en minutos
}

export class AlertSchedulingService {
  /**
   * Obtener sugerencias de fechas para todas las alertas activas del usuario
   */
  static async getSuggestedDates(
    userId: string,
    options: {
      includeWeekends?: boolean;
      workingHoursStart?: number; // hora de inicio (0-23)
      workingHoursEnd?: number; // hora de fin (0-23)
      minDaysAhead?: number; // días mínimos en el futuro
      maxDaysAhead?: number; // días máximos en el futuro
    } = {}
  ): Promise<DateSuggestion[]> {
    const database = await db.getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    // Configuración por defecto
    const config = {
      includeWeekends: options.includeWeekends ?? false,
      workingHoursStart: options.workingHoursStart ?? 9,
      workingHoursEnd: options.workingHoursEnd ?? 18,
      minDaysAhead: options.minDaysAhead ?? 1,
      maxDaysAhead: options.maxDaysAhead ?? 30,
    };

    // Obtener alertas activas del usuario
    const activeAlerts = await database.query.alertHistory.findMany({
      where: and(
        eq(alertHistory.userId, userId),
        eq(alertHistory.status, 'active')
      ),
      orderBy: [desc(alertHistory.priority), desc(alertHistory.createdAt)],
      with: {
        piano: true,
        client: true,
      },
    });

    if (activeAlerts.length === 0) {
      return [];
    }

    // Obtener citas existentes del usuario para evitar conflictos
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + config.minDaysAhead);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + config.maxDaysAhead);

    const existingAppointments = await database.query.appointments.findMany({
      where: and(
        eq(appointments.odId, userId),
        gte(appointments.date, startDate),
        lte(appointments.date, endDate)
      ),
    });

    // Generar sugerencias para cada alerta
    const suggestions: DateSuggestion[] = [];

    for (const alert of activeAlerts) {
      const suggestion = await this.generateSuggestionForAlert(
        alert,
        existingAppointments,
        config
      );
      
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Generar sugerencia de fecha para una alerta específica
   */
  private static async generateSuggestionForAlert(
    alert: any,
    existingAppointments: any[],
    config: {
      includeWeekends: boolean;
      workingHoursStart: number;
      workingHoursEnd: number;
      minDaysAhead: number;
      maxDaysAhead: number;
    }
  ): Promise<DateSuggestion | null> {
    // Determinar duración estimada según tipo de servicio
    const estimatedDuration = this.getEstimatedDuration(alert.alertType);

    // Buscar primer slot disponible
    const availableSlot = this.findNextAvailableSlot(
      existingAppointments,
      config,
      estimatedDuration,
      alert.priority === 'urgent' ? config.minDaysAhead : config.minDaysAhead + 3
    );

    if (!availableSlot) {
      return null;
    }

    // Calcular días de retraso
    let daysOverdue: number | undefined;
    if (alert.daysSinceLastService) {
      const threshold = alert.alertType === 'tuning' ? 270 : 1095; // 9 meses o 3 años
      if (alert.daysSinceLastService > threshold) {
        daysOverdue = alert.daysSinceLastService - threshold;
      }
    }

    // Generar razón de la sugerencia
    const reason = this.generateReason(alert, daysOverdue);

    return {
      suggestedDate: availableSlot.date,
      reason,
      priority: alert.priority,
      pianoId: alert.pianoId,
      clientId: alert.clientId,
      serviceType: alert.alertType,
      daysOverdue,
    };
  }

  /**
   * Encontrar el siguiente slot disponible
   */
  private static findNextAvailableSlot(
    existingAppointments: any[],
    config: {
      includeWeekends: boolean;
      workingHoursStart: number;
      workingHoursEnd: number;
      minDaysAhead: number;
      maxDaysAhead: number;
    },
    durationMinutes: number,
    startDaysAhead: number
  ): AvailableSlot | null {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + startDaysAhead);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + config.maxDaysAhead);

    // Iterar día por día
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Saltar fines de semana si no están incluidos
      const dayOfWeek = currentDate.getDay();
      if (!config.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Buscar slot disponible en este día
      const slot = this.findSlotInDay(
        currentDate,
        existingAppointments,
        config.workingHoursStart,
        config.workingHoursEnd,
        durationMinutes
      );

      if (slot) {
        return slot;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null;
  }

  /**
   * Buscar slot disponible en un día específico
   */
  private static findSlotInDay(
    date: Date,
    existingAppointments: any[],
    startHour: number,
    endHour: number,
    durationMinutes: number
  ): AvailableSlot | null {
    // Filtrar citas de este día
    const dayAppointments = existingAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });

    // Ordenar por hora
    dayAppointments.sort((a, b) => {
      const timeA = a.time || '09:00';
      const timeB = b.time || '09:00';
      return timeA.localeCompare(timeB);
    });

    // Buscar gaps entre citas
    let currentTime = startHour * 60; // en minutos desde medianoche
    const endTime = endHour * 60;

    for (const apt of dayAppointments) {
      const aptTime = apt.time || '09:00';
      const [aptHour, aptMinute] = aptTime.split(':').map(Number);
      const aptStartMinutes = aptHour * 60 + aptMinute;
      const aptDuration = apt.duration || 60;
      const aptEndMinutes = aptStartMinutes + aptDuration;

      // Si hay gap antes de esta cita
      if (aptStartMinutes - currentTime >= durationMinutes) {
        const slotDate = new Date(date);
        slotDate.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
        
        return {
          date: slotDate,
          startTime: this.minutesToTime(currentTime),
          endTime: this.minutesToTime(currentTime + durationMinutes),
          duration: durationMinutes,
        };
      }

      currentTime = Math.max(currentTime, aptEndMinutes);
    }

    // Verificar si hay espacio al final del día
    if (endTime - currentTime >= durationMinutes) {
      const slotDate = new Date(date);
      slotDate.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
      
      return {
        date: slotDate,
        startTime: this.minutesToTime(currentTime),
        endTime: this.minutesToTime(currentTime + durationMinutes),
        duration: durationMinutes,
      };
    }

    return null;
  }

  /**
   * Obtener duración estimada según tipo de servicio
   */
  private static getEstimatedDuration(serviceType: string): number {
    switch (serviceType) {
      case 'tuning':
        return 90; // 1.5 horas
      case 'regulation':
        return 180; // 3 horas
      case 'repair':
        return 120; // 2 horas
      default:
        return 60; // 1 hora por defecto
    }
  }

  /**
   * Generar razón de la sugerencia
   */
  private static generateReason(alert: any, daysOverdue?: number): string {
    const serviceTypeText = {
      tuning: 'afinación',
      regulation: 'regulación',
      repair: 'reparación',
    }[alert.alertType] || 'servicio';

    if (alert.priority === 'urgent') {
      if (daysOverdue) {
        return `${serviceTypeText.charAt(0).toUpperCase() + serviceTypeText.slice(1)} urgente - ${daysOverdue} días de retraso`;
      }
      return `${serviceTypeText.charAt(0).toUpperCase() + serviceTypeText.slice(1)} urgente requerida`;
    }

    if (alert.priority === 'pending') {
      return `${serviceTypeText.charAt(0).toUpperCase() + serviceTypeText.slice(1)} pendiente - programar pronto`;
    }

    return `${serviceTypeText.charAt(0).toUpperCase() + serviceTypeText.slice(1)} recomendada`;
  }

  /**
   * Convertir minutos a formato HH:MM
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Obtener sugerencia para una alerta específica
   */
  static async getSuggestionForAlert(
    userId: string,
    alertId: number,
    options: {
      includeWeekends?: boolean;
      workingHoursStart?: number;
      workingHoursEnd?: number;
      minDaysAhead?: number;
      maxDaysAhead?: number;
    } = {}
  ): Promise<DateSuggestion | null> {
    const database = await db.getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const alert = await database.query.alertHistory.findFirst({
      where: and(
        eq(alertHistory.id, alertId),
        eq(alertHistory.userId, userId)
      ),
      with: {
        piano: true,
        client: true,
      },
    });

    if (!alert) {
      return null;
    }

    const config = {
      includeWeekends: options.includeWeekends ?? false,
      workingHoursStart: options.workingHoursStart ?? 9,
      workingHoursEnd: options.workingHoursEnd ?? 18,
      minDaysAhead: options.minDaysAhead ?? 1,
      maxDaysAhead: options.maxDaysAhead ?? 30,
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + config.minDaysAhead);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + config.maxDaysAhead);

    const existingAppointments = await database.query.appointments.findMany({
      where: and(
        eq(appointments.odId, userId),
        gte(appointments.date, startDate),
        lte(appointments.date, endDate)
      ),
    });

    return this.generateSuggestionForAlert(alert, existingAppointments, config);
  }

  /**
   * Obtener múltiples opciones de fecha para una alerta
   */
  static async getMultipleDateOptions(
    userId: string,
    alertId: number,
    numberOfOptions: number = 3,
    options: {
      includeWeekends?: boolean;
      workingHoursStart?: number;
      workingHoursEnd?: number;
      minDaysAhead?: number;
      maxDaysAhead?: number;
    } = {}
  ): Promise<DateSuggestion[]> {
    const suggestions: DateSuggestion[] = [];
    
    for (let i = 0; i < numberOfOptions; i++) {
      const suggestion = await this.getSuggestionForAlert(userId, alertId, {
        ...options,
        minDaysAhead: (options.minDaysAhead ?? 1) + (i * 2), // Espaciar las sugerencias
      });

      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }
}
