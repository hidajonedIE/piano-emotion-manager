/**
 * Servicio de Calendario Avanzado
 * Piano Emotion Manager
 */

import { getDb } from '../../../drizzle/db.js';
import { eq, and, or, gte, lte, between, desc, asc, sql } from 'drizzle-orm';
import {
  calendarEvents,
  eventReminders,
  technicianAvailability,
  timeBlocks,
  reminderSettings,
  type EventType,
  type EventStatus,
  type ReminderType,
} from '../../../drizzle/calendar-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface EventInput {
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay?: boolean;
  clientId?: number;
  pianoId?: number;
  serviceId?: number;
  assignedTo?: number;
  color?: string;
  reminders?: Array<{
    type: ReminderType;
    minutesBefore: number;
  }>;
  recurrence?: {
    frequency: string;
    interval: number;
    endDate?: string;
    count?: number;
    daysOfWeek?: number[];
  };
}

export interface EventFilters {
  startDate: string;
  endDate: string;
  types?: EventType[];
  statuses?: EventStatus[];
  assignedTo?: number;
  clientId?: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
  isWorkingDay: boolean;
}

// ============================================================================
// Calendar Service
// ============================================================================

export class CalendarService {
  private organizationId: number;
  private userId: number;

  constructor(organizationId: number, userId: number) {
    this.organizationId! = organizationId;
    this.userId! = userId;
  }

  // ============================================================================
  // Events
  // ============================================================================

  /**
   * Crea un nuevo evento
   */
  async createEvent(input: EventInput): Promise<typeof calendarEvents.$inferSelect> {
    const [event] = (await getDb())!.insert(calendarEvents).values({
      organizationId: this.organizationId!,
      userId: this.userId!,
      type: input.type,
      status: 'confirmed',
      title: input.title,
      description: input.description,
      location: input.location,
      startDate: input.startDate,
      startTime: input.startTime,
      endDate: input.endDate,
      endTime: input.endTime,
      isAllDay: input.isAllDay || false,
      clientId: input.clientId,
      pianoId: input.pianoId,
      serviceId: input.serviceId,
      assignedTo: input.assignedTo || this.userId!,
      color: input.color,
      isRecurring: !!input.recurrence,
      recurrenceRule: input.recurrence,
    });

    // Crear recordatorios
    if (input.reminders && input.reminders.length > 0) {
      await this.createReminders(event.id, input.reminders, input.startDate, input.startTime);
    }

    return event;
  }

  /**
   * Actualiza un evento
   */
  async updateEvent(
    eventId: number,
    input: Partial<EventInput>
  ): Promise<typeof calendarEvents.$inferSelect> {
    const [updated] = await db
      .update(calendarEvents)
      .set({
        ...input,
        recurrenceRule: input.recurrence,
        isRecurring: input.recurrence ? true : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.organizationId!, this.organizationId!)
        )
      )
      ;

    return updated;
  }

  /**
   * Cancela un evento
   */
  async cancelEvent(eventId: number): Promise<void> {
    await db
      .update(calendarEvents)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.organizationId!, this.organizationId!)
        )
      );

    // Cancelar recordatorios pendientes
    await db
      .update(eventReminders)
      .set({ isSent: true })
      .where(
        and(
          eq(eventReminders.eventId, eventId),
          eq(eventReminders.isSent, false)
        )
      );
  }

  /**
   * Completa un evento
   */
  async completeEvent(eventId: number): Promise<void> {
    await db
      .update(calendarEvents)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.organizationId!, this.organizationId!)
        )
      );
  }

  /**
   * Obtiene eventos por rango de fechas
   */
  async getEvents(filters: EventFilters): Promise<Array<typeof calendarEvents.$inferSelect>> {
    const conditions = [
      eq(calendarEvents.organizationId!, this.organizationId!),
      gte(calendarEvents.startDate, filters.startDate),
      lte(calendarEvents.endDate, filters.endDate),
    ];

    if (filters.types && filters.types.length > 0) {
      conditions.push(sql`${calendarEvents.type} = ANY(${filters.types})`);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      conditions.push(sql`${calendarEvents.status} = ANY(${filters.statuses})`);
    }

    if (filters.assignedTo) {
      conditions.push(eq(calendarEvents.assignedTo, filters.assignedTo));
    }

    if (filters.clientId) {
      conditions.push(eq(calendarEvents.clientId, filters.clientId));
    }

    return (await getDb())!.query.calendarEvents.findMany({
      where: and(...conditions),
      orderBy: [asc(calendarEvents.startDate), asc(calendarEvents.startTime)],
    });
  }

  /**
   * Obtiene un evento por ID
   */
  async getEvent(eventId: number): Promise<typeof calendarEvents.$inferSelect | undefined> {
    return (await getDb())!.query.calendarEvents.findFirst({
      where: and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId!, this.organizationId!)
      ),
    });
  }

  /**
   * Obtiene eventos de hoy
   */
  async getTodayEvents(userId?: number): Promise<Array<typeof calendarEvents.$inferSelect>> {
    const today = new Date().toISOString().split('T')[0];
    
    const conditions = [
      eq(calendarEvents.organizationId!, this.organizationId!),
      eq(calendarEvents.startDate, today),
    ];

    if (userId) {
      conditions.push(eq(calendarEvents.assignedTo, userId));
    }

    return (await getDb())!.query.calendarEvents.findMany({
      where: and(...conditions),
      orderBy: [asc(calendarEvents.startTime)],
    });
  }

  /**
   * Obtiene próximos eventos
   */
  async getUpcomingEvents(
    limit: number = 10,
    userId?: number
  ): Promise<Array<typeof calendarEvents.$inferSelect>> {
    const today = new Date().toISOString().split('T')[0];
    
    const conditions = [
      eq(calendarEvents.organizationId!, this.organizationId!),
      gte(calendarEvents.startDate, today),
      eq(calendarEvents.status, 'confirmed'),
    ];

    if (userId) {
      conditions.push(eq(calendarEvents.assignedTo, userId));
    }

    return (await getDb())!.query.calendarEvents.findMany({
      where: and(...conditions),
      orderBy: [asc(calendarEvents.startDate), asc(calendarEvents.startTime)],
      limit,
    });
  }

  // ============================================================================
  // Reminders
  // ============================================================================

  /**
   * Crea recordatorios para un evento
   */
  private async createReminders(
    eventId: number,
    reminders: Array<{ type: ReminderType; minutesBefore: number }>,
    startDate: string,
    startTime?: string
  ): Promise<void> {
    const eventDateTime = startTime
      ? new Date(`${startDate}T${startTime}`)
      : new Date(`${startDate}T09:00:00`);

    const reminderValues = reminders.map((reminder) => {
      const scheduledAt = new Date(eventDateTime.getTime() - reminder.minutesBefore * 60 * 1000);
      
      return {
        eventId,
        type: reminder.type,
        minutesBefore: reminder.minutesBefore,
        scheduledAt,
      };
    });

    (await getDb())!.insert(eventReminders).values(reminderValues);
  }

  /**
   * Obtiene recordatorios pendientes de enviar
   */
  async getPendingReminders(): Promise<Array<typeof eventReminders.$inferSelect & { event: typeof calendarEvents.$inferSelect }>> {
    const now = new Date();

    const reminders = (await getDb())!.query.eventReminders.findMany({
      where: and(
        eq(eventReminders.isSent, false),
        lte(eventReminders.scheduledAt, now)
      ),
      with: {
        event: true,
      },
    });

    return reminders as any;
  }

  /**
   * Marca un recordatorio como enviado
   */
  async markReminderSent(reminderId: number, status: string = 'sent'): Promise<void> {
    await db
      .update(eventReminders)
      .set({
        isSent: true,
        sentAt: new Date(),
        deliveryStatus: status,
      })
      .where(eq(eventReminders.id, reminderId));
  }

  // ============================================================================
  // Availability
  // ============================================================================

  /**
   * Configura disponibilidad de un técnico
   */
  async setAvailability(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isAvailable: boolean = true
  ): Promise<void> {
    await db
      .insert(technicianAvailability)
      .values({
        userId: this.userId!,
        organizationId: this.organizationId!,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      })
      .onConflictDoUpdate({
        target: [technicianAvailability.userId!, technicianAvailability.dayOfWeek],
        set: {
          startTime,
          endTime,
          isAvailable,
        },
      });
  }

  /**
   * Obtiene disponibilidad de un técnico
   */
  async getAvailability(userId?: number): Promise<Array<typeof technicianAvailability.$inferSelect>> {
    return (await getDb())!.query.technicianAvailability.findMany({
      where: eq(technicianAvailability.userId!, userId || this.userId!),
      orderBy: [asc(technicianAvailability.dayOfWeek)],
    });
  }

  /**
   * Obtiene slots disponibles para un día
   */
  async getAvailableSlots(
    date: string,
    userId?: number,
    slotDuration: number = 60 // minutos
  ): Promise<TimeSlot[]> {
    const targetUserId = userId || this.userId!;
    const dayOfWeek = new Date(date).getDay();

    // Obtener disponibilidad del día
    const availability = (await getDb())!.query.technicianAvailability.findFirst({
      where: and(
        eq(technicianAvailability.userId!, targetUserId),
        eq(technicianAvailability.dayOfWeek, dayOfWeek)
      ),
    });

    if (!availability || !availability.isAvailable) {
      return [];
    }

    // Obtener eventos del día
    const events = (await getDb())!.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.assignedTo, targetUserId),
        eq(calendarEvents.startDate, date),
        eq(calendarEvents.status, 'confirmed')
      ),
    });

    // Obtener bloqueos del día
    const blocks = (await getDb())!.query.timeBlocks.findMany({
      where: and(
        eq(timeBlocks.userId!, targetUserId),
        lte(timeBlocks.startDate, date),
        gte(timeBlocks.endDate, date)
      ),
    });

    // Generar slots
    const slots: TimeSlot[] = [];
    const startMinutes = this.timeToMinutes(availability.startTime);
    const endMinutes = this.timeToMinutes(availability.endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const slotStart = this.minutesToTime(minutes);
      const slotEnd = this.minutesToTime(minutes + slotDuration);

      // Verificar si el slot está ocupado
      const isOccupied = events.some((event) => {
        if (!event.startTime || !event.endTime) return false;
        const eventStart = this.timeToMinutes(event.startTime);
        const eventEnd = this.timeToMinutes(event.endTime);
        return minutes < eventEnd && minutes + slotDuration > eventStart;
      });

      // Verificar si hay bloqueo
      const isBlocked = blocks.some((block) => {
        if (block.isAllDay) return true;
        if (!block.startTime || !block.endTime) return false;
        const blockStart = this.timeToMinutes(block.startTime);
        const blockEnd = this.timeToMinutes(block.endTime);
        return minutes < blockEnd && minutes + slotDuration > blockStart;
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isOccupied && !isBlocked,
      });
    }

    return slots;
  }

  // ============================================================================
  // Time Blocks
  // ============================================================================

  /**
   * Crea un bloqueo de tiempo
   */
  async createTimeBlock(
    title: string,
    startDate: string,
    endDate: string,
    options: {
      reason?: string;
      startTime?: string;
      endTime?: string;
      isAllDay?: boolean;
    } = {}
  ): Promise<typeof timeBlocks.$inferSelect> {
    const [block] = (await getDb())!.insert(timeBlocks).values({
      userId: this.userId!,
      organizationId: this.organizationId!,
      title,
      reason: options.reason,
      startDate,
      endDate,
      startTime: options.startTime,
      endTime: options.endTime,
      isAllDay: options.isAllDay ?? true,
    });

    return block;
  }

  /**
   * Obtiene bloqueos de tiempo
   */
  async getTimeBlocks(
    startDate: string,
    endDate: string,
    userId?: number
  ): Promise<Array<typeof timeBlocks.$inferSelect>> {
    return (await getDb())!.query.timeBlocks.findMany({
      where: and(
        eq(timeBlocks.userId!, userId || this.userId!),
        lte(timeBlocks.startDate, endDate),
        gte(timeBlocks.endDate, startDate)
      ),
    });
  }

  /**
   * Elimina un bloqueo de tiempo
   */
  async deleteTimeBlock(blockId: number): Promise<void> {
    await db
      .delete(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, blockId),
          eq(timeBlocks.userId!, this.userId!)
        )
      );
  }

  // ============================================================================
  // Reminder Settings
  // ============================================================================

  /**
   * Obtiene configuración de recordatorios
   */
  async getReminderSettings(): Promise<typeof reminderSettings.$inferSelect | null> {
    const settings = (await getDb())!.query.reminderSettings.findFirst({
      where: eq(reminderSettings.userId!, this.userId!),
    });

    return settings || null;
  }

  /**
   * Actualiza configuración de recordatorios
   */
  async updateReminderSettings(
    settings: Partial<typeof reminderSettings.$inferInsert>
  ): Promise<typeof reminderSettings.$inferSelect> {
    const existing = await this.getReminderSettings();

    if (existing) {
      const [updated] = await db
        .update(reminderSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(reminderSettings.userId!, this.userId!))
        ;
      return updated;
    }

    const [created] = (await getDb())!.insert(reminderSettings).values({
      userId: this.userId!,
      organizationId: this.organizationId!,
      ...settings,
    });

    return created;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createCalendarService(organizationId: number, userId: number): CalendarService {
  return new CalendarService(organizationId, userId);
}
