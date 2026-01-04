/**
 * Timeline Router
 * 
 * API endpoints for client timeline functionality
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as timeline from '../_core/timeline/timeline';

export const timelineRouter = router({
  
  /**
   * Get timeline for a client
   */
  getClientTimeline: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
      filters: z.object({
        types: z.array(z.nativeEnum(timeline.TimelineEventType)).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        pianoId: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const events = await timeline.getClientTimeline(
        input.clientId,
        input.filters
      );

      // Paginate
      const paginated = events.slice(
        input.offset,
        input.offset + input.limit
      );

      return {
        events: paginated,
        total: events.length,
        hasMore: events.length > input.offset + input.limit,
      };
    }),

  /**
   * Get timeline statistics
   */
  getTimelineStats: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .query(async ({ input }) => {
      return await timeline.getTimelineStats(input.clientId);
    }),

  /**
   * Get available event types (for filters)
   */
  getEventTypes: protectedProcedure
    .query(() => {
      return Object.values(timeline.TimelineEventType).map((type) => ({
        value: type,
        label: formatEventTypeLabel(type),
      }));
    }),

});

/**
 * Format event type for display
 */
function formatEventTypeLabel(type: timeline.TimelineEventType): string {
  const labels: Record<timeline.TimelineEventType, string> = {
    [timeline.TimelineEventType.SERVICE_CREATED]: 'Servicio creado',
    [timeline.TimelineEventType.SERVICE_COMPLETED]: 'Servicio completado',
    [timeline.TimelineEventType.INVOICE_CREATED]: 'Factura emitida',
    [timeline.TimelineEventType.INVOICE_PAID]: 'Factura pagada',
    [timeline.TimelineEventType.APPOINTMENT_CREATED]: 'Cita programada',
    [timeline.TimelineEventType.APPOINTMENT_COMPLETED]: 'Cita completada',
    [timeline.TimelineEventType.APPOINTMENT_CANCELLED]: 'Cita cancelada',
    [timeline.TimelineEventType.MESSAGE_SENT]: 'Mensaje enviado',
    [timeline.TimelineEventType.MESSAGE_RECEIVED]: 'Mensaje recibido',
    [timeline.TimelineEventType.PIANO_ADDED]: 'Piano agregado',
    [timeline.TimelineEventType.PIANO_UPDATED]: 'Piano actualizado',
    [timeline.TimelineEventType.CLIENT_CREATED]: 'Cliente creado',
    [timeline.TimelineEventType.CLIENT_UPDATED]: 'Cliente actualizado',
  };

  return labels[type] || type;
}

export type TimelineRouter = typeof timelineRouter;
