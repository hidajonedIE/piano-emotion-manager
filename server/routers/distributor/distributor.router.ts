/**
 * Router del Distribuidor
 * Piano Emotion Manager
 * 
 * Endpoints para gestionar la configuración del distribuidor,
 * conexión con WooCommerce, módulos y técnicos.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../../_core/trpc.js';
import { createDistributorService } from '../../services/distributor/distributor.service.js';
import { getDb } from '../../db.js';
import { distributors } from '../../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Helper function to get or create distributor for current user
async function getDistributorIdForUser(userId: number, userEmail: string): Promise<number> {
  const db = await getDb();
  
  // Try to find existing distributor by email
  const [existing] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.email, userEmail))
    .limit(1);
  
  if (existing) {
    return existing.id;
  }
  
  // Create new distributor if not exists
  const [newDistributor] = await db
    .insert(distributors)
    .values({
      name: userEmail.split('@')[0],
      email: userEmail,
      isActive: true,
    });
  
  return newDistributor.insertId;
}

// ============================================================================
// Schemas de validación
// ============================================================================

const wooCommerceConfigSchema = z.object({
  url: z.string().url('URL inválida'),
  consumerKey: z.string().min(1, 'Consumer Key requerido'),
  consumerSecret: z.string().min(1, 'Consumer Secret requerido'),
  enabled: z.boolean().optional(),
});

const premiumConfigSchema = z.object({
  minimumPurchaseAmount: z.number().min(0),
  trialPeriodDays: z.number().min(1).max(365),
  gracePeriodDays: z.number().min(0).max(30),
  whatsappEnabled: z.boolean(),
  portalEnabled: z.boolean(),
  autoRemindersEnabled: z.boolean(),
});

const moduleConfigSchema = z.object({
  // Módulos de Negocio
  suppliersEnabled: z.boolean(),
  inventoryEnabled: z.boolean(),
  invoicingEnabled: z.boolean(),
  advancedInvoicingEnabled: z.boolean(),
  accountingEnabled: z.boolean(),
  
  // Módulos Premium
  teamEnabled: z.boolean(),
  crmEnabled: z.boolean(),
  reportsEnabled: z.boolean(),
  
  // Configuración de Tienda
  shopEnabled: z.boolean(),
  showPrices: z.boolean(),
  allowDirectOrders: z.boolean(),
  showStock: z.boolean(),
  stockAlertsEnabled: z.boolean(),
  
  // Configuración de Marca
  customBranding: z.boolean(),
  hideCompetitorLinks: z.boolean(),
});

const technicianTierSchema = z.enum(['trial', 'basic', 'premium']);

// ============================================================================
// Router
// ============================================================================

export const distributorRouter = router({
  // ============================================================================
  // User's Distributor Config (for clients of a distributor)
  // ============================================================================

  /**
   * Obtener la configuración del distribuidor del usuario actual
   * Este endpoint es usado por los técnicos/clientes para saber qué módulos tienen disponibles
   */
  getMyDistributorConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const service = createDistributorService(ctx.user.id);
      return service.getMyDistributorConfig();
    }),

  // ============================================================================
  // Module Configuration (for distributor admins)
  // ============================================================================

  /**
   * Obtener configuración de módulos del distribuidor
   */
  getModuleConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.getModuleConfig();
    }),

  /**
   * Guardar configuración de módulos del distribuidor
   */
  saveModuleConfig: protectedProcedure
    .input(moduleConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.saveModuleConfig(input);
    }),

  // ============================================================================
  // WooCommerce Configuration
  // ============================================================================

  /**
   * Obtener configuración de WooCommerce
   */
  getWooCommerceConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.getWooCommerceConfig();
    }),

  /**
   * Guardar configuración de WooCommerce
   */
  saveWooCommerceConfig: protectedProcedure
    .input(wooCommerceConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.saveWooCommerceConfig(input);
    }),

  /**
   * Probar conexión con WooCommerce
   */
  testWooCommerceConnection: protectedProcedure
    .input(wooCommerceConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.testWooCommerceConnection({
        ...input,
        connectionStatus: 'testing',
      });
    }),

  // ============================================================================
  // Premium Configuration
  // ============================================================================

  /**
   * Obtener configuración Premium
   */
  getPremiumConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.getPremiumConfig();
    }),

  /**
   * Guardar configuración Premium
   */
  savePremiumConfig: protectedProcedure
    .input(premiumConfigSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const distributorId = await getDistributorIdForUser(ctx.user.id, ctx.user.email!);
      const service = createDistributorService(distributorId);
      return service.savePremiumConfig(input);
    }),

  // ============================================================================
  // Technicians (Clients)
  // ============================================================================

  /**
   * Listar técnicos/clientes
   */
  listTechnicians: protectedProcedure
    .query(async ({ ctx }) => {
      const service = createDistributorService(ctx.user.id);
      return service.getTechnicians();
    }),

  /**
   * Obtener técnico específico
   */
  getTechnician: protectedProcedure
    .input(z.object({ technicianId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = createDistributorService(ctx.user.id);
      const technician = await service.getTechnician(input.technicianId);
      
      if (!technician) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Técnico no encontrado',
        });
      }
      
      return technician;
    }),

  /**
   * Actualizar tier de un técnico
   */
  updateTechnicianTier: protectedProcedure
    .input(z.object({
      technicianId: z.string(),
      tier: technicianTierSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const service = createDistributorService(ctx.user.id);
      const result = await service.updateTechnicianTier(input.technicianId, input.tier);
      
      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Técnico no encontrado',
        });
      }
      
      return result;
    }),

  /**
   * Obtener compras de WooCommerce para un técnico
   */
  getTechnicianPurchases: protectedProcedure
    .input(z.object({
      technicianEmail: z.string().email(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = createDistributorService(ctx.user.id);
      return service.getWooCommercePurchases(
        input.technicianEmail,
        input.startDate ? new Date(input.startDate) : undefined,
        input.endDate ? new Date(input.endDate) : undefined
      );
    }),

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Obtener estadísticas del distribuidor
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const service = createDistributorService(ctx.user.id);
      return service.getStats();
    }),

  // ============================================================================
  // Sync
  // ============================================================================

  /**
   * Sincronizar técnicos con WooCommerce
   */
  syncWithWooCommerce: protectedProcedure
    .mutation(async ({ ctx }) => {
      const service = createDistributorService(ctx.user.id);
      return service.syncTechniciansWithWooCommerce();
    }),
});

export type DistributorRouter = typeof distributorRouter;
