/**
 * Calendar Router (tRPC)
 * 
 * API endpoints for calendar synchronization
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { nanoid } from 'nanoid';
import * as db from '../db.js';
import * as googleOAuth from '../_core/calendar/oauth-google.js';
import * as microsoftOAuth from '../_core/calendar/oauth-microsoft.js';
import * as googleCalendar from '../_core/calendar/google-calendar.js';
import * as microsoftCalendar from '../_core/calendar/microsoft-calendar.js';
import * as syncEngine from '../_core/calendar/sync-engine.js';
import * as webhookHandler from '../_core/calendar/webhook-handler.js';
import { TRPCError } from '@trpc/server';

export const calendarRouter = router({
  /**
   * Get authorization URL for Google Calendar
   */
  getGoogleAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const state = `${ctx.user.id}-${nanoid()}`;
    const url = googleOAuth.getAuthorizationUrl(state);
    
    return { url, state };
  }),

  /**
   * Get authorization URL for Microsoft Calendar
   */
  getMicrosoftAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const state = `${ctx.user.id}-${nanoid()}`;
    const url = await microsoftOAuth.getAuthorizationUrl(state);
    
    return { url, state };
  }),

  /**
   * Handle OAuth callback and create connection
   * (This would typically be called from a server-side route, not tRPC)
   */
  connectGoogle: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for tokens
        const tokens = await googleOAuth.exchangeCodeForTokens(input.code);
        
        // Check if connection already exists
        const existing = await db.getDb().getConnectionByUserAndProvider(ctx.user.id, 'google');
        
        if (existing) {
          // Update existing connection
          await db.getDb().updateConnection(existing.id, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            syncEnabled: true,
          });
          
          // Setup webhook
          await webhookHandler.setupWebhookSubscription(existing);
          
          return { success: true, connectionId: existing.id };
        }
        
        // Create new connection
        const connectionId = nanoid();
        
        await db.getDb().createConnection({
          id: connectionId,
          userId: ctx.user.id,
          provider: 'google',
          calendarId: 'primary',
          calendarName: 'Google Calendar',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          webhookId: null,
          webhookExpiration: null,
          lastSyncToken: null,
          lastDeltaLink: null,
          syncEnabled: true,
          lastSyncAt: null,
        });
        
        const connection = await db.getDb().getConnectionById(connectionId);
        
        if (!connection) {
          throw new Error('Failed to create connection');
        }
        
        // Setup webhook
        await webhookHandler.setupWebhookSubscription(connection);
        
        // Perform initial sync
        await syncEngine.performFullSync(connection);
        
        return { success: true, connectionId };
      } catch (error: any) {
        console.error('❌ Error connecting Google Calendar:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect Google Calendar',
        });
      }
    }),

  /**
   * Connect Microsoft Calendar
   */
  connectMicrosoft: protectedProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Exchange code for tokens
        const tokens = await microsoftOAuth.exchangeCodeForTokens(input.code);
        
        // Check if connection already exists
        const existing = await db.getDb().getConnectionByUserAndProvider(ctx.user.id, 'microsoft');
        
        if (existing) {
          // Update existing connection
          await db.getDb().updateConnection(existing.id, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            syncEnabled: true,
          });
          
          // Setup webhook
          await webhookHandler.setupWebhookSubscription(existing);
          
          return { success: true, connectionId: existing.id };
        }
        
        // Create new connection
        const connectionId = nanoid();
        
        await db.getDb().createConnection({
          id: connectionId,
          userId: ctx.user.id,
          provider: 'microsoft',
          calendarId: 'calendar',
          calendarName: 'Outlook Calendar',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          webhookId: null,
          webhookExpiration: null,
          lastSyncToken: null,
          lastDeltaLink: null,
          syncEnabled: true,
          lastSyncAt: null,
        });
        
        const connection = await db.getDb().getConnectionById(connectionId);
        
        if (!connection) {
          throw new Error('Failed to create connection');
        }
        
        // Setup webhook
        await webhookHandler.setupWebhookSubscription(connection);
        
        // Perform initial sync
        await syncEngine.performFullSync(connection);
        
        return { success: true, connectionId };
      } catch (error: any) {
        console.error('❌ Error connecting Microsoft Calendar:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect Microsoft Calendar',
        });
      }
    }),

  /**
   * Get all calendar connections for current user
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await db.getDb().getConnectionsByUserId(ctx.user.id);
    
    // Remove sensitive data
    return connections.map(conn => ({
      id: conn.id,
      provider: conn.provider,
      calendarName: conn.calendarName,
      syncEnabled: conn.syncEnabled,
      lastSyncAt: conn.lastSyncAt,
      createdAt: conn.createdAt,
    }));
  }),

  /**
   * Disconnect a calendar
   */
  disconnect: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await db.getDb().getConnectionById(input.connectionId);
      
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }
      
      // Remove webhook
      await webhookHandler.removeWebhookSubscription(connection);
      
      // Revoke tokens
      if (connection.provider === 'google') {
        await googleOAuth.revokeToken(connection.accessToken);
      } else {
        await microsoftOAuth.revokeToken(connection.accessToken);
      }
      
      // Delete connection
      await db.getDb().deleteConnection(connection.id);
      
      return { success: true };
    }),

  /**
   * Manually trigger sync
   */
  syncNow: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await db.getDb().getConnectionById(input.connectionId);
      
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }
      
      const result = await syncEngine.performFullSync(connection);
      
      return result;
    }),

  /**
   * Get sync log for a connection
   */
  getSyncLog: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connection = await db.getDb().getConnectionById(input.connectionId);
      
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }
      
      const logs = await db.getDb().getSyncLogsByConnection(
        input.connectionId,
        input.limit || 50
      );
      
      return logs;
    }),

  /**
   * Get sync statistics
   */
  getSyncStats: protectedProcedure.query(async ({ ctx }) => {
    const connections = await db.getDb().getConnectionsByUserId(ctx.user.id);
    
    const stats = {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.syncEnabled).length,
      googleConnections: connections.filter(c => c.provider === 'google').length,
      microsoftConnections: connections.filter(c => c.provider === 'microsoft').length,
      lastSyncAt: connections.reduce((latest, conn) => {
        if (!conn.lastSyncAt) return latest;
        if (!latest) return conn.lastSyncAt;
        return conn.lastSyncAt > latest ? conn.lastSyncAt : latest;
      }, null as Date | null),
    };
    
    return stats;
  }),

  /**
   * Check for conflicts
   */
  checkConflicts: protectedProcedure
    .input(
      z.object({
        startTime: z.date(),
        endTime: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await db.getDb().getConnectionsByUserId(ctx.user.id);
      
      const allConflicts: any[] = [];
      
      for (const connection of connections) {
        if (!connection.syncEnabled) continue;
        
        const conflicts = await syncEngine.detectConflicts(
          connection,
          input.startTime,
          input.endTime
        );
        
        allConflicts.push(...conflicts.map(c => ({
          ...c,
          provider: connection.provider,
        })));
      }
      
      return {
        hasConflicts: allConflicts.length > 0,
        conflicts: allConflicts,
      };
    }),

  /**
   * Toggle sync enabled/disabled
   */
  toggleSync: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await db.getDb().getConnectionById(input.connectionId);
      
      if (!connection || connection.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }
      
      await db.getDb().updateConnection(connection.id, {
        syncEnabled: input.enabled,
      });
      
      return { success: true };
    }),
});
