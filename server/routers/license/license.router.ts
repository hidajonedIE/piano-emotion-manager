/**
 * Router de Licencias
 * Piano Emotion Manager
 * 
 * Endpoints para gestión y activación de licencias.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../../.core/trpc.js';
import { createLicenseService } from '../../services/license/license.service.js';

// ============================================================================
// Schemas
// ============================================================================

const moduleConfigSchema = z.object({
  suppliersEnabled: z.boolean(),
  inventoryEnabled: z.boolean(),
  invoicingEnabled: z.boolean(),
  advancedInvoicingEnabled: z.boolean(),
  accountingEnabled: z.boolean(),
  teamEnabled: z.boolean(),
  crmEnabled: z.boolean(),
  reportsEnabled: z.boolean(),
  shopEnabled: z.boolean(),
  showPrices: z.boolean(),
  allowDirectOrders: z.boolean(),
  showStock: z.boolean(),
  stockAlertsEnabled: z.boolean(),
});

const licenseTypeSchema = z.enum(['trial', 'free', 'starter', 'professional', 'enterprise']);

// ============================================================================
// Router
// ============================================================================

export const licenseRouter = router({
  // ============================================================================
  // User Endpoints (para técnicos)
  // ============================================================================

  /**
   * Activar una licencia con código
   */
  activate: protectedProcedure
    .input(z.object({
      code: z.string().min(1, 'Código requerido'),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createLicenseService();
      const result = await service.activateLicense(input.code, ctx.user.id);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message,
        });
      }
      
      return result;
    }),

  /**
   * Obtener mi licencia activa
   */
  getMyLicense: protectedProcedure
    .query(async ({ ctx }) => {
      const service = createLicenseService();
      return service.getUserLicense(ctx.user.id);
    }),

  /**
   * Verificar si un código es válido (sin activar)
   */
  verifyCode: publicProcedure
    .input(z.object({
      code: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const service = createLicenseService();
      // Solo verificar si existe y está disponible
      const licenses = await service.listLicenses();
      const license = licenses.find(l => l.code === input.code);
      
      if (!license) {
        return { valid: false, message: 'Código no encontrado' };
      }
      
      if (license.status !== 'available') {
        return { valid: false, message: 'Código no disponible' };
      }
      
      return { 
        valid: true, 
        licenseType: license.licenseType,
        distributorName: license.distributorName,
      };
    }),

  // ============================================================================
  // Admin Endpoints (para administradores de Piano Emotion)
  // ============================================================================

  /**
   * Crear una licencia individual
   */
  create: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      distributorId: z.number().optional(),
      licenseType: licenseTypeSchema,
      moduleConfig: moduleConfigSchema,
      maxUsers: z.number().min(1).optional(),
      maxClients: z.number().optional(),
      maxPianos: z.number().optional(),
      durationDays: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verificar que el usuario es admin de plataforma
      const service = createLicenseService();
      return service.createLicense({
        ...input,
        createdByAdminId: ctx.user.id,
      });
    }),

  /**
   * Crear un lote de licencias
   */
  createBatch: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      templateId: z.number().optional(),
      distributorId: z.number(),
      licenseType: licenseTypeSchema,
      moduleConfig: moduleConfigSchema,
      quantity: z.number().min(1).max(1000),
      durationDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verificar que el usuario es admin de plataforma
      const service = createLicenseService();
      return service.createBatch({
        ...input,
        createdByAdminId: ctx.user.id,
      });
    }),

  /**
   * Listar licencias
   */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      licenseType: z.string().optional(),
      distributorId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // TODO: Verificar que el usuario es admin de plataforma
      const service = createLicenseService();
      return service.listLicenses(input);
    }),

  /**
   * Revocar una licencia
   */
  revoke: protectedProcedure
    .input(z.object({
      licenseId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verificar que el usuario es admin de plataforma
      const service = createLicenseService();
      const success = await service.revokeLicense(input.licenseId, ctx.user.id, input.reason);
      
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Licencia no encontrada',
        });
      }
      
      return { success: true };
    }),

  /**
   * Obtener estadísticas de licencias
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: Verificar que el usuario es admin de plataforma
      const service = createLicenseService();
      const licenses = await service.listLicenses();
      
      return {
        total: licenses.length,
        available: licenses.filter(l => l.status === 'available').length,
        active: licenses.filter(l => l.status === 'active').length,
        expired: licenses.filter(l => l.status === 'expired').length,
        revoked: licenses.filter(l => l.status === 'revoked').length,
        byType: {
          trial: licenses.filter(l => l.licenseType === 'trial').length,
          free: licenses.filter(l => l.licenseType === 'free').length,
          starter: licenses.filter(l => l.licenseType === 'starter').length,
          professional: licenses.filter(l => l.licenseType === 'professional').length,
          enterprise: licenses.filter(l => l.licenseType === 'enterprise').length,
        },
      };
    }),
});

export type LicenseRouter = typeof licenseRouter;
