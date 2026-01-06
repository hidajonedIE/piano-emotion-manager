/**
 * Auto-Scheduling Service
 * Crea automáticamente citas y servicios desde alertas
 */
import * as db from '../db.js';
import { 
  pianos, 
  clients, 
  services, 
  alertHistory,
  appointments,
  InsertAppointment,
  InsertService,
} from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import { AlertSchedulingService } from './alert-scheduling.service.js';

interface AutoScheduleResult {
  success: boolean;
  appointmentId?: number;
  serviceId?: number;
  error?: string;
  details?: {
    pianoInfo: string;
    clientInfo: string;
    scheduledDate: Date;
    scheduledTime: string;
    serviceType: string;
  };
}

interface AutoScheduleOptions {
  createAppointment?: boolean; // Crear cita en calendario
  createService?: boolean; // Crear registro de servicio
  includeWeekends?: boolean;
  workingHoursStart?: number;
  workingHoursEnd?: number;
  minDaysAhead?: number;
  maxDaysAhead?: number;
  preferredDate?: Date; // Fecha preferida (si está disponible)
  notes?: string; // Notas adicionales
}

export class AutoSchedulingService {
  /**
   * Auto-programar servicio desde una alerta
   */
  static async scheduleFromAlert(
    userId: string,
    alertId: number,
    options: AutoScheduleOptions = {}
  ): Promise<AutoScheduleResult> {
    const database = await db.getDb();
    if (!database) {
      return {
        success: false,
        error: 'Database not available',
      };
    }

    try {
      // Obtener la alerta
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
        return {
          success: false,
          error: 'Alerta no encontrada',
        };
      }

      if (alert.status !== 'active') {
        return {
          success: false,
          error: 'La alerta ya no está activa',
        };
      }

      // Obtener sugerencia de fecha
      let suggestedDate: Date;
      let suggestedTime: string;

      if (options.preferredDate) {
        // Verificar si la fecha preferida está disponible
        const isAvailable = await this.isDateAvailable(
          userId,
          options.preferredDate,
          this.getEstimatedDuration(alert.alertType)
        );

        if (isAvailable) {
          suggestedDate = options.preferredDate;
          suggestedTime = this.formatTime(options.preferredDate);
        } else {
          // Si no está disponible, buscar la siguiente
          const suggestion = await AlertSchedulingService.getSuggestionForAlert(
            userId,
            alertId,
            {
              includeWeekends: options.includeWeekends,
              workingHoursStart: options.workingHoursStart,
              workingHoursEnd: options.workingHoursEnd,
              minDaysAhead: options.minDaysAhead,
              maxDaysAhead: options.maxDaysAhead,
            }
          );

          if (!suggestion) {
            return {
              success: false,
              error: 'No se encontró fecha disponible',
            };
          }

          suggestedDate = suggestion.suggestedDate;
          suggestedTime = this.formatTime(suggestedDate);
        }
      } else {
        // Obtener sugerencia automática
        const suggestion = await AlertSchedulingService.getSuggestionForAlert(
          userId,
          alertId,
          {
            includeWeekends: options.includeWeekends,
            workingHoursStart: options.workingHoursStart,
            workingHoursEnd: options.workingHoursEnd,
            minDaysAhead: options.minDaysAhead,
            maxDaysAhead: options.maxDaysAhead,
          }
        );

        if (!suggestion) {
          return {
            success: false,
            error: 'No se encontró fecha disponible',
          };
        }

        suggestedDate = suggestion.suggestedDate;
        suggestedTime = this.formatTime(suggestedDate);
      }

      let appointmentId: number | undefined;
      let serviceId: number | undefined;

      // Crear cita si se solicita
      if (options.createAppointment !== false) {
        appointmentId = await this.createAppointment(
          userId,
          alert,
          suggestedDate,
          suggestedTime,
          options.notes
        );
      }

      // Crear servicio si se solicita
      if (options.createService !== false) {
        serviceId = await this.createService(
          userId,
          alert,
          suggestedDate,
          options.notes,
          appointmentId
        );
      }

      // Marcar alerta como reconocida
      await database.update(alertHistory)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(alertHistory.id, alertId));

      return {
        success: true,
        appointmentId,
        serviceId,
        details: {
          pianoInfo: `${alert.piano.brand} ${alert.piano.model} (${alert.piano.serialNumber || 'S/N'})`,
          clientInfo: alert.client.name,
          scheduledDate: suggestedDate,
          scheduledTime: suggestedTime,
          serviceType: this.getServiceTypeName(alert.alertType),
        },
      };
    } catch (error) {
      console.error('[AutoScheduling] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Auto-programar múltiples alertas
   */
  static async scheduleMultipleAlerts(
    userId: string,
    alertIds: number[],
    options: AutoScheduleOptions = {}
  ): Promise<AutoScheduleResult[]> {
    const results: AutoScheduleResult[] = [];

    for (const alertId of alertIds) {
      const result = await this.scheduleFromAlert(userId, alertId, options);
      results.push(result);

      // Pequeña pausa entre programaciones para evitar conflictos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Auto-programar todas las alertas urgentes
   */
  static async scheduleAllUrgentAlerts(
    userId: string,
    options: AutoScheduleOptions = {}
  ): Promise<AutoScheduleResult[]> {
    const database = await db.getDb();
    if (!database) {
      return [{
        success: false,
        error: 'Database not available',
      }];
    }

    // Obtener todas las alertas urgentes activas
    const urgentAlerts = await database.query.alertHistory.findMany({
      where: and(
        eq(alertHistory.userId, userId),
        eq(alertHistory.status, 'active'),
        eq(alertHistory.priority, 'urgent')
      ),
    });

    const alertIds = urgentAlerts.map(alert => alert.id);
    return this.scheduleMultipleAlerts(userId, alertIds, options);
  }

  /**
   * Verificar si una fecha está disponible
   */
  private static async isDateAvailable(
    userId: string,
    date: Date,
    durationMinutes: number
  ): Promise<boolean> {
    const database = await db.getDb();
    if (!database) return false;

    const startTime = new Date(date);
    const endTime = new Date(date);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    // Buscar citas que se solapen
    const overlappingAppointments = await database.query.appointments.findMany({
      where: and(
        eq(appointments.odId, userId),
        eq(appointments.date, startTime)
      ),
    });

    // Verificar solapamiento de horarios
    for (const apt of overlappingAppointments) {
      const aptTime = apt.time || '09:00';
      const [aptHour, aptMinute] = aptTime.split(':').map(Number);
      const aptStart = new Date(apt.date);
      aptStart.setHours(aptHour, aptMinute, 0, 0);
      
      const aptEnd = new Date(aptStart);
      aptEnd.setMinutes(aptEnd.getMinutes() + (apt.duration || 60));

      // Verificar si hay solapamiento
      if (
        (startTime >= aptStart && startTime < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (startTime <= aptStart && endTime >= aptEnd)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Crear cita en el calendario
   */
  private static async createAppointment(
    userId: string,
    alert: any,
    date: Date,
    time: string,
    notes?: string
  ): Promise<number> {
    const database = await db.getDb();
    if (!database) throw new Error('Database not available');

    const duration = this.getEstimatedDuration(alert.alertType);
    const serviceTypeName = this.getServiceTypeName(alert.alertType);

    const appointmentData: InsertAppointment = {
      odId: userId,
      pianoId: alert.pianoId,
      clientId: alert.clientId,
      date,
      time,
      duration,
      type: alert.alertType,
      status: 'scheduled',
      notes: notes || `${serviceTypeName} programada automáticamente desde alerta`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const appointmentId = await db.createAppointment(appointmentData);
    return appointmentId;
  }

  /**
   * Crear registro de servicio
   */
  private static async createService(
    userId: string,
    alert: any,
    date: Date,
    notes?: string,
    appointmentId?: number
  ): Promise<number> {
    const database = await db.getDb();
    if (!database) throw new Error('Database not available');

    const serviceTypeName = this.getServiceTypeName(alert.alertType);

    const serviceData: InsertService = {
      odId: userId,
      pianoId: alert.pianoId,
      clientId: alert.clientId,
      date,
      type: alert.alertType,
      status: 'scheduled',
      description: `${serviceTypeName} programada desde alerta`,
      notes: notes || `Programado automáticamente - Alerta #${alert.id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const serviceId = await db.createService(serviceData);
    return serviceId;
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
   * Obtener nombre del tipo de servicio
   */
  private static getServiceTypeName(serviceType: string): string {
    switch (serviceType) {
      case 'tuning':
        return 'Afinación';
      case 'regulation':
        return 'Regulación';
      case 'repair':
        return 'Reparación';
      default:
        return 'Servicio';
    }
  }

  /**
   * Formatear hora desde Date
   */
  private static formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Obtener estadísticas de auto-programación
   */
  static async getAutoScheduleStatistics(userId: string): Promise<{
    totalScheduled: number;
    scheduledThisWeek: number;
    scheduledThisMonth: number;
    averageLeadTime: number; // días promedio entre alerta y cita programada
  }> {
    const database = await db.getDb();
    if (!database) {
      return {
        totalScheduled: 0,
        scheduledThisWeek: 0,
        scheduledThisMonth: 0,
        averageLeadTime: 0,
      };
    }

    // Obtener alertas reconocidas (programadas)
    const acknowledgedAlerts = await database.query.alertHistory.findMany({
      where: and(
        eq(alertHistory.userId, userId),
        eq(alertHistory.status, 'acknowledged')
      ),
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const scheduledThisWeek = acknowledgedAlerts.filter(
      alert => alert.acknowledgedAt && alert.acknowledgedAt >= oneWeekAgo
    ).length;

    const scheduledThisMonth = acknowledgedAlerts.filter(
      alert => alert.acknowledgedAt && alert.acknowledgedAt >= oneMonthAgo
    ).length;

    // Calcular tiempo promedio entre creación de alerta y reconocimiento
    let totalLeadTime = 0;
    let count = 0;

    for (const alert of acknowledgedAlerts) {
      if (alert.acknowledgedAt) {
        const leadTime = alert.acknowledgedAt.getTime() - alert.createdAt.getTime();
        const leadTimeDays = leadTime / (1000 * 60 * 60 * 24);
        totalLeadTime += leadTimeDays;
        count++;
      }
    }

    const averageLeadTime = count > 0 ? Math.round(totalLeadTime / count) : 0;

    return {
      totalScheduled: acknowledgedAlerts.length,
      scheduledThisWeek,
      scheduledThisMonth,
      averageLeadTime,
    };
  }
}
