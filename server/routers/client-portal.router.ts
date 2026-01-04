/**
 * Client Portal Router
 * 
 * API endpoints for client portal functionality
 */

import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc.js';
import * as portalDb from '../_core/client-portal/db';
import * as auth from '../_core/client-portal/auth';
import { TRPCError } from '@trpc/server';

// ============================================================================
// Middleware for Portal Authentication
// ============================================================================

const portalAuthMiddleware = async (opts: any) => {
  const { ctx } = opts;
  
  // Get token from header
  const authHeader = ctx.req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No se proporcionó token de autenticación',
    });
  }
  
  const token = authHeader.substring(7);
  
  // Verify token
  const payload = auth.verifyToken(token);
  if (!payload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token inválido o expirado',
    });
  }
  
  // Get user from database
  const user = await portalDb.getPortalUserById(payload.clientPortalUserId);
  if (!user || !user.isActive) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuario no encontrado o inactivo',
    });
  }
  
  return opts.next({
    ctx: {
      ...ctx,
      portalUser: user,
      clientId: user.clientId,
    },
  });
};

const authenticatedProcedure = publicProcedure.use(portalAuthMiddleware);

// ============================================================================
// Client Portal Router
// ============================================================================

export const clientPortalRouter = router({
  
  // ==========================================================================
  // Authentication
  // ==========================================================================
  
  auth: router({
    
    /**
     * Login with email and password
     */
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        // Get user by email
        const user = await portalDb.getPortalUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Email o contraseña incorrectos',
          });
        }
        
        // Check if account is active
        if (!user.isActive) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Tu cuenta está desactivada. Contacta con tu técnico.',
          });
        }
        
        // Verify password
        const isValid = await auth.verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Email o contraseña incorrectos',
          });
        }
        
        // Update last login
        await portalDb.updatePortalUser(user.id, {
          lastLoginAt: new Date(),
        });
        
        // Generate JWT token
        const token = auth.generateToken({
          clientPortalUserId: user.id,
          clientId: user.clientId,
          email: user.email,
        });
        
        // Create session
        const expiresAt = auth.generateExpirationDate(7);
        await portalDb.createSession({
          clientPortalUserId: user.id,
          token,
          expiresAt,
        });
        
        return {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            clientId: user.clientId,
          },
        };
      }),
    
    /**
     * Logout (invalidate session)
     */
    logout: authenticatedProcedure
      .mutation(async ({ ctx }) => {
        // Get token from header
        const authHeader = ctx.req?.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const session = await portalDb.getSessionByToken(token);
          if (session) {
            await portalDb.deleteSession(session.id);
          }
        }
        
        return { success: true };
      }),
    
    /**
     * Setup account with invitation token
     */
    setupAccount: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        // Validate password
        const validation = auth.validatePassword(input.password);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.errors.join(', '),
          });
        }
        
        // Get invitation
        const invitation = await portalDb.getInvitationByToken(input.token);
        if (!invitation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invitación no encontrada',
          });
        }
        
        // Check if already used
        if (invitation.usedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Esta invitación ya fue utilizada',
          });
        }
        
        // Check if expired
        if (auth.isTokenExpired(invitation.expiresAt)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Esta invitación ha expirado',
          });
        }
        
        // Check if user already exists
        const existingUser = await portalDb.getPortalUserByClientId(invitation.clientId);
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ya existe una cuenta para este cliente',
          });
        }
        
        // Create portal user
        const user = await portalDb.createPortalUser({
          clientId: invitation.clientId,
          email: invitation.email,
          password: input.password,
        });
        
        // Mark invitation as used
        await portalDb.markInvitationAsUsed(invitation.id);
        
        // Generate JWT token
        const token = auth.generateToken({
          clientPortalUserId: user.id,
          clientId: user.clientId,
          email: user.email,
        });
        
        // Create session
        const expiresAt = auth.generateExpirationDate(7);
        await portalDb.createSession({
          clientPortalUserId: user.id,
          token,
          expiresAt,
        });
        
        return {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            clientId: user.clientId,
          },
        };
      }),
    
    /**
     * Request password reset
     */
    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        // Get user by email
        const user = await portalDb.getPortalUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists
          return { success: true };
        }
        
        // Create password reset token
        const reset = await portalDb.createPasswordReset(user.id);
        
        // TODO: Send email with reset link
        console.log('🔑 Password reset token:', reset.token);
        console.log('🔗 Reset link: /portal/reset-password?token=' + reset.token);
        
        return { success: true };
      }),
    
    /**
     * Reset password with token
     */
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        // Validate password
        const validation = auth.validatePassword(input.newPassword);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.errors.join(', '),
          });
        }
        
        // Get reset token
        const reset = await portalDb.getPasswordResetByToken(input.token);
        if (!reset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Token de recuperación no encontrado',
          });
        }
        
        // Check if already used
        if (reset.usedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Este token ya fue utilizado',
          });
        }
        
        // Check if expired
        if (auth.isTokenExpired(reset.expiresAt)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Este token ha expirado',
          });
        }
        
        // Update password
        const passwordHash = await auth.hashPassword(input.newPassword);
        await portalDb.updatePortalUser(reset.clientPortalUserId, {
          passwordHash,
        });
        
        // Mark reset as used
        await portalDb.markPasswordResetAsUsed(reset.id);
        
        return { success: true };
      }),
    
    /**
     * Change password (authenticated)
     */
    changePassword: authenticatedProcedure
      .input(z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.portalUser;
        
        // Verify old password
        const isValid = await auth.verifyPassword(input.oldPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Contraseña actual incorrecta',
          });
        }
        
        // Validate new password
        const validation = auth.validatePassword(input.newPassword);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.errors.join(', '),
          });
        }
        
        // Update password
        const passwordHash = await auth.hashPassword(input.newPassword);
        await portalDb.updatePortalUser(user.id, {
          passwordHash,
        });
        
        return { success: true };
      }),
    
  }),
  
  // ==========================================================================
  // Dashboard
  // ==========================================================================
  
  dashboard: router({
    
    /**
     * Get dashboard summary
     */
    getSummary: authenticatedProcedure
      .query(async ({ ctx }) => {
        const clientId = ctx.clientId;
        
        // TODO: Implement actual queries
        // For now, return mock data
        
        return {
          recentServices: [],
          upcomingAppointments: [],
          pendingInvoices: [],
          totalPianos: 0,
          totalServices: 0,
        };
      }),
    
  }),
  
  // ==========================================================================
  // Messages
  // ==========================================================================
  
  messages: router({
    
    /**
     * Get messages
     */
    list: authenticatedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ ctx, input }) => {
        const messages = await portalDb.getMessagesByClientId(ctx.clientId, input.limit);
        return messages;
      }),
    
    /**
     * Send message
     */
    send: authenticatedProcedure
      .input(z.object({
        message: z.string().min(1).max(5000),
      }))
      .mutation(async ({ ctx, input }) => {
        const message = await portalDb.createMessage({
          clientId: ctx.clientId,
          fromClientPortalUserId: ctx.portalUser.id,
          message: input.message,
        });
        
        return { success: true, message };
      }),
    
    /**
     * Mark messages as read
     */
    markAsRead: authenticatedProcedure
      .input(z.object({
        ids: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        await portalDb.markMessagesAsRead(input.ids);
        return { success: true };
      }),
    
    /**
     * Get unread count
     */
    getUnreadCount: authenticatedProcedure
      .query(async ({ ctx }) => {
        const count = await portalDb.getUnreadMessageCount(ctx.clientId);
        return { count };
      }),
    
  }),
  
  // ==========================================================================
  // Profile
  // ==========================================================================
  
  profile: router({
    
    /**
     * Get profile
     */
    get: authenticatedProcedure
      .query(async ({ ctx }) => {
        const user = ctx.portalUser;
        
        return {
          id: user.id,
          email: user.email,
          clientId: user.clientId,
          lastLoginAt: user.lastLoginAt,
        };
      }),
    
    /**
     * Update email
     */
    updateEmail: authenticatedProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if email is already taken
        const existing = await portalDb.getPortalUserByEmail(input.email);
        if (existing && existing.id !== ctx.portalUser.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Este email ya está en uso',
          });
        }
        
        await portalDb.updatePortalUser(ctx.portalUser.id, {
          email: input.email,
        });
        
        return { success: true };
      }),
    
  }),
  
});

export type ClientPortalRouter = typeof clientPortalRouter;
