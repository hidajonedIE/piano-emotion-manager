/**
 * Portal Admin Router
 * 
 * Endpoints for technicians to manage client portal access
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import * as portalDb from '../_core/client-portal/db.js';
import { TRPCError } from '@trpc/server';

export const portalAdminRouter = router({
  
  /**
   * Create invitation for a client
   */
  createInvitation: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if client already has a portal user
      const existingUser = await portalDb.getPortalUserByClientId(input.clientId);
      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este cliente ya tiene acceso al portal',
        });
      }
      
      // Create invitation
      const invitation = await portalDb.createInvitation({
        clientId: input.clientId,
        email: input.email,
        createdBy: ctx.user.email,
      });
      
      // TODO: Send invitation email
      const invitationLink = `${process.env.PORTAL_URL || 'http://localhost:3000'}/portal/setup?token=${invitation.token}`;
      console.log('📧 Invitation link:', invitationLink);
      
      return {
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          link: invitationLink,
        },
      };
    }),
  
  /**
   * Get portal status for a client
   */
  getClientPortalStatus: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .query(async ({ input }) => {
      const user = await portalDb.getPortalUserByClientId(input.clientId);
      
      if (!user) {
        return {
          hasAccess: false,
          isActive: false,
          email: null,
          lastLoginAt: null,
        };
      }
      
      return {
        hasAccess: true,
        isActive: user.isActive,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      };
    }),
  
  /**
   * Deactivate portal access for a client
   */
  deactivateAccess: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await portalDb.getPortalUserByClientId(input.clientId);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Este cliente no tiene acceso al portal',
        });
      }
      
      await portalDb.updatePortalUser(user.id, {
        isActive: false,
      });
      
      return { success: true };
    }),
  
  /**
   * Reactivate portal access for a client
   */
  reactivateAccess: protectedProcedure
    .input(z.object({
      clientId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await portalDb.getPortalUserByClientId(input.clientId);
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Este cliente no tiene acceso al portal',
        });
      }
      
      await portalDb.updatePortalUser(user.id, {
        isActive: true,
      });
      
      return { success: true };
    }),
  
  /**
   * Send message to client
   */
  sendMessage: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      message: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await portalDb.createMessage({
        clientId: input.clientId,
        fromUserId: ctx.user.email,
        message: input.message,
      });
      
      return { success: true, message };
    }),
  
  /**
   * Get messages for a client
   */
  getMessages: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const messages = await portalDb.getMessagesByClientId(input.clientId, input.limit);
      return messages;
    }),
  
  /**
   * Get all clients with portal access
   */
  listPortalClients: protectedProcedure
    .query(async () => {
      // TODO: Implement query to get all clients with portal access
      // For now return empty array
      return [];
    }),
  
});

export type PortalAdminRouter = typeof portalAdminRouter;
