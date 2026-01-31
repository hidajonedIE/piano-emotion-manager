/**
 * TypeScript Types for Calendar Sync System
 */

export type CalendarProvider = 'google' | 'microsoft';

export type SyncStatus = 'synced' | 'pending' | 'error';

export type SyncAction = 'create' | 'update' | 'delete';

export type SyncDirection = 'to_external' | 'from_external';

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: CalendarProvider;
  calendarId: string;
  calendarName: string | null;
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: Date | null;
  webhookId: string | null;
  webhookExpiration: Date | null;
  lastSyncToken: string | null; // For Google
  lastDeltaLink: string | null; // For Microsoft
  syncEnabled: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSyncEvent {
  id: string;
  connectionId: string;
  appointmentId: string | null;
  externalEventId: string;
  provider: CalendarProvider;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSyncLog {
  id: number;
  connectionId: string;
  action: SyncAction;
  direction: SyncDirection;
  appointmentId: string | null;
  externalEventId: string | null;
  status: 'success' | 'error';
  errorMessage: string | null;
  details: Record<string, any> | null;
  createdAt: Date;
}

export interface ExternalCalendar {
  id: string;
  name: string;
  description?: string;
  timeZone?: string;
  primary?: boolean;
}

export interface ExternalEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  created?: string;
  updated?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope?: string;
}

export interface WebhookSubscription {
  id: string;
  resourceId?: string;
  expiration: Date;
  notificationUrl: string;
}

export interface SyncResult {
  success: boolean;
  externalEventId?: string;
  error?: string;
}

export interface ConflictDetection {
  hasConflict: boolean;
  conflictingEvents: Array<{
    eventId: string;
    summary: string;
    start: string;
    end: string;
  }>;
}
