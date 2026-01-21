/**
 * Client Timeline
 * 
 * Aggregates events from multiple sources into a unified timeline
 */

import { getDb } from '../../getDb().js';
import { sql } from 'drizzle-orm';

// ============================================================================
// Types
// ============================================================================

export enum TimelineEventType {
  SERVICE_CREATED = 'service_created',
  SERVICE_COMPLETED = 'service_completed',
  INVOICE_CREATED = 'invoice_created',
  INVOICE_PAID = 'invoice_paid',
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  PIANO_ADDED = 'piano_added',
  PIANO_UPDATED = 'piano_updated',
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
}

export interface TimelineEvent {
  id: string;
  clientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
  performedBy?: string;
  icon: string;
  color: string;
}

export interface TimelineFilters {
  types?: TimelineEventType[];
  dateFrom?: Date;
  dateTo?: Date;
  pianoId?: string;
  search?: string;
}

// ============================================================================
// Event Type Configuration
// ============================================================================

const EVENT_CONFIG: Record<TimelineEventType, { icon: string; color: string }> = {
  [TimelineEventType.SERVICE_CREATED]: { icon: '🔧', color: '#4CAF50' },
  [TimelineEventType.SERVICE_COMPLETED]: { icon: '✅', color: '#4CAF50' },
  [TimelineEventType.INVOICE_CREATED]: { icon: '💰', color: '#FF9800' },
  [TimelineEventType.INVOICE_PAID]: { icon: '💳', color: '#4CAF50' },
  [TimelineEventType.APPOINTMENT_CREATED]: { icon: '📅', color: '#2196F3' },
  [TimelineEventType.APPOINTMENT_COMPLETED]: { icon: '✅', color: '#4CAF50' },
  [TimelineEventType.APPOINTMENT_CANCELLED]: { icon: '❌', color: '#F44336' },
  [TimelineEventType.MESSAGE_SENT]: { icon: '💬', color: '#9C27B0' },
  [TimelineEventType.MESSAGE_RECEIVED]: { icon: '💬', color: '#9C27B0' },
  [TimelineEventType.PIANO_ADDED]: { icon: '🎹', color: '#795548' },
  [TimelineEventType.PIANO_UPDATED]: { icon: '🎹', color: '#795548' },
  [TimelineEventType.CLIENT_CREATED]: { icon: '👤', color: '#2196F3' },
  [TimelineEventType.CLIENT_UPDATED]: { icon: '👤', color: '#2196F3' },
};

// ============================================================================
// Timeline Aggregation
// ============================================================================

/**
 * Get timeline events for a client
 */
export async function getClientTimeline(
  clientId: string,
  filters?: TimelineFilters
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // Aggregate events from different sources
  const [services, invoices, appointments, messages, pianos] = await Promise.all([
    getServiceEvents(clientId),
    getInvoiceEvents(clientId),
    getAppointmentEvents(clientId),
    getMessageEvents(clientId),
    getPianoEvents(clientId),
  ]);

  events.push(...services, ...invoices, ...appointments, ...messages, ...pianos);

  // Sort by timestamp (most recent first)
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply filters
  return applyFilters(events, filters);
}

/**
 * Get service events
 */
async function getServiceEvents(clientId: string): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await getDb().execute(sql`
    SELECT 
      s.id,
      s.serviceType,
      s.serviceDate,
      s.notes,
      s.status,
      s.pianoId,
      p.brand,
      p.model
    FROM services s
    LEFT JOIN pianos p ON s.pianoId = p.id
    WHERE s.clientId = ${clientId}
    ORDER BY s.serviceDate DESC
  `);

  return (result.rows as any[]).map((row) => {
    const config = EVENT_CONFIG[TimelineEventType.SERVICE_COMPLETED];
    return {
      id: `service_${row.id}`,
      clientId,
      type: TimelineEventType.SERVICE_COMPLETED,
      title: `Servicio: ${row.serviceType}`,
      description: row.notes || `Servicio realizado en ${row.brand} ${row.model}`,
      timestamp: new Date(row.serviceDate),
      metadata: {
        serviceType: row.serviceType,
        status: row.status,
        pianoId: row.pianoId,
      },
      relatedEntityId: row.id,
      relatedEntityType: 'service',
      icon: config.icon,
      color: config.color,
    };
  });
}

/**
 * Get invoice events
 */
async function getInvoiceEvents(clientId: string): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await getDb().execute(sql`
    SELECT 
      id,
      invoiceNumber,
      total,
      status,
      createdAt,
      paidAt
    FROM invoices
    WHERE clientId = ${clientId}
    ORDER BY createdAt DESC
  `);

  const events: TimelineEvent[] = [];

  for (const row of result.rows as any[]) {
    // Invoice created event
    const createdConfig = EVENT_CONFIG[TimelineEventType.INVOICE_CREATED];
    events.push({
      id: `invoice_created_${row.id}`,
      clientId,
      type: TimelineEventType.INVOICE_CREATED,
      title: `Factura #${row.invoiceNumber} emitida`,
      description: `Total: $${row.total}`,
      timestamp: new Date(row.createdAt),
      metadata: {
        invoiceNumber: row.invoiceNumber,
        total: row.total,
        status: row.status,
      },
      relatedEntityId: row.id,
      relatedEntityType: 'invoice',
      icon: createdConfig.icon,
      color: createdConfig.color,
    });

    // Invoice paid event (if paid)
    if (row.status === 'paid' && row.paidAt) {
      const paidConfig = EVENT_CONFIG[TimelineEventType.INVOICE_PAID];
      events.push({
        id: `invoice_paid_${row.id}`,
        clientId,
        type: TimelineEventType.INVOICE_PAID,
        title: `Factura #${row.invoiceNumber} pagada`,
        description: `Pago recibido: $${row.total}`,
        timestamp: new Date(row.paidAt),
        metadata: {
          invoiceNumber: row.invoiceNumber,
          total: row.total,
        },
        relatedEntityId: row.id,
        relatedEntityType: 'invoice',
        icon: paidConfig.icon,
        color: paidConfig.color,
      });
    }
  }

  return events;
}

/**
 * Get appointment events
 */
async function getAppointmentEvents(clientId: string): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await getDb().execute(sql`
    SELECT 
      a.id,
      a.serviceType,
      a.scheduledDate,
      a.status,
      a.notes,
      a.pianoId,
      p.brand,
      p.model
    FROM appointments a
    LEFT JOIN pianos p ON a.pianoId = p.id
    WHERE a.clientId = ${clientId}
    ORDER BY a.scheduledDate DESC
  `);

  return (result.rows as any[]).map((row) => {
    let eventType: TimelineEventType;
    
    if (row.status === 'completed') {
      eventType = TimelineEventType.APPOINTMENT_COMPLETED;
    } else if (row.status === 'cancelled') {
      eventType = TimelineEventType.APPOINTMENT_CANCELLED;
    } else {
      eventType = TimelineEventType.APPOINTMENT_CREATED;
    }

    const config = EVENT_CONFIG[eventType];

    return {
      id: `appointment_${row.id}`,
      clientId,
      type: eventType,
      title: `Cita: ${row.serviceType}`,
      description: row.notes || `${row.brand} ${row.model}`,
      timestamp: new Date(row.scheduledDate),
      metadata: {
        serviceType: row.serviceType,
        status: row.status,
        pianoId: row.pianoId,
      },
      relatedEntityId: row.id,
      relatedEntityType: 'appointment',
      icon: config.icon,
      color: config.color,
    };
  });
}

/**
 * Get message events
 */
async function getMessageEvents(clientId: string): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await getDb().execute(sql`
    SELECT 
      id,
      message,
      fromUserId,
      fromClientPortalUserId,
      createdAt
    FROM client_messages
    WHERE clientId = ${clientId}
    ORDER BY createdAt DESC
    LIMIT 100
  `);

  return (result.rows as any[]).map((row) => {
    const isFromTechnician = !!row.fromUserId;
    const eventType = isFromTechnician 
      ? TimelineEventType.MESSAGE_SENT 
      : TimelineEventType.MESSAGE_RECEIVED;
    
    const config = EVENT_CONFIG[eventType];

    return {
      id: `message_${row.id}`,
      clientId,
      type: eventType,
      title: isFromTechnician ? 'Mensaje enviado' : 'Mensaje recibido',
      description: row.message.substring(0, 100) + (row.message.length > 100 ? '...' : ''),
      timestamp: new Date(row.createdAt),
      metadata: {
        fullMessage: row.message,
      },
      relatedEntityId: row.id,
      relatedEntityType: 'message',
      performedBy: row.fromUserId || row.fromClientPortalUserId,
      icon: config.icon,
      color: config.color,
    };
  });
}

/**
 * Get piano events
 */
async function getPianoEvents(clientId: string): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await getDb().execute(sql`
    SELECT 
      id,
      brand,
      model,
      serialNumber,
      createdAt
    FROM pianos
    WHERE clientId = ${clientId}
    ORDER BY createdAt DESC
  `);

  return (result.rows as any[]).map((row) => {
    const config = EVENT_CONFIG[TimelineEventType.PIANO_ADDED];

    return {
      id: `piano_${row.id}`,
      clientId,
      type: TimelineEventType.PIANO_ADDED,
      title: `Piano agregado: ${row.brand} ${row.model}`,
      description: row.serialNumber ? `S/N: ${row.serialNumber}` : '',
      timestamp: new Date(row.createdAt),
      metadata: {
        brand: row.brand,
        model: row.model,
        serialNumber: row.serialNumber,
      },
      relatedEntityId: row.id,
      relatedEntityType: 'piano',
      icon: config.icon,
      color: config.color,
    };
  });
}

// ============================================================================
// Filters
// ============================================================================

/**
 * Apply filters to timeline events
 */
function applyFilters(
  events: TimelineEvent[],
  filters?: TimelineFilters
): TimelineEvent[] {
  if (!filters) return events;

  let filtered = events;

  // Filter by event types
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((event) => filters.types!.includes(event.type));
  }

  // Filter by date range
  if (filters.dateFrom) {
    filtered = filtered.filter((event) => event.timestamp >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    filtered = filtered.filter((event) => event.timestamp <= filters.dateTo!);
  }

  // Filter by piano
  if (filters.pianoId) {
    filtered = filtered.filter(
      (event) => event.metadata.pianoId === filters.pianoId
    );
  }

  // Filter by search query
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get timeline statistics
 */
export async function getTimelineStats(clientId: string) {
  const events = await getClientTimeline(clientId);

  const eventsByType: Record<string, number> = {};
  for (const event of events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  }

  return {
    totalEvents: events.length,
    eventsByType,
    lastActivity: events[0]?.timestamp || null,
    firstActivity: events[events.length - 1]?.timestamp || null,
  };
}
