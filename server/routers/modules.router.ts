/**
 * Modules Router
 * Gestión de módulos y planes
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { getModulesForPlan, type ModuleInfo } from "../data/modules-data.js";

export const modulesRouter = router({
  // Obtener módulos con estado
  getModulesWithStatus: publicProcedure.query(async ({ ctx }): Promise<ModuleInfo[]> => {
    // TEMPORARY: Devolver módulos para plan professional durante desarrollo
    // Esto asegura que todos los usuarios tengan acceso completo
    return getModulesForPlan('professional');
  }),

  // Obtener suscripción actual
  getCurrentSubscription: publicProcedure.query(async () => {
    // TEMPORARY: Devolver professional durante desarrollo
    return { plan: 'professional', status: 'active', expiresAt: null };
  }),

  // Obtener plan actual
  getCurrentPlan: publicProcedure.query(async () => {
    // TEMPORARY: Devolver professional durante desarrollo
    return 'professional';
  }),

  // Obtener planes disponibles
  getAvailablePlans: publicProcedure.query(async () => {
    return [
      {
        code: 'free',
        name: 'Gratuito',
        description: 'Para técnicos independientes que empiezan',
        monthlyPrice: '0',
        yearlyPrice: '0',
        features: ['Gestión básica de clientes', 'Registro de pianos', 'Calendario simple', 'Facturación básica'],
        isPopular: false,
      },
      {
        code: 'starter',
        name: 'Inicial',
        description: 'Para técnicos que quieren crecer',
        monthlyPrice: '9.99',
        yearlyPrice: '99.99',
        features: ['Todo lo del plan Gratuito', 'Facturación electrónica', 'Sincronización calendario', 'Tienda online', 'Soporte por email'],
        isPopular: false,
      },
      {
        code: 'professional',
        name: 'Profesional',
        description: 'Para empresas con equipos de técnicos',
        monthlyPrice: '29.99',
        yearlyPrice: '299.99',
        features: ['Todo lo del plan Inicial', 'Gestión de equipos', 'Inventario', 'Contabilidad', 'Reportes avanzados', 'CRM', 'Soporte prioritario'],
        isPopular: true,
      },
      {
        code: 'enterprise',
        name: 'Empresarial',
        description: 'Para grandes empresas con necesidades avanzadas',
        monthlyPrice: '99.99',
        yearlyPrice: '999.99',
        features: ['Todo lo del plan Profesional', 'Usuarios ilimitados', 'Marca blanca', 'API personalizada', 'Soporte dedicado', 'SLA garantizado'],
        isPopular: false,
      },
    ];
  }),

  // Obtener uso de recursos
  getResourceUsage: publicProcedure.query(async () => {
    return {
      users: { current: 1, limit: 1, percentage: 100 },
      clients: { current: 0, limit: 50, percentage: 0 },
      pianos: { current: 0, limit: 100, percentage: 0 },
      invoices: { current: 0, limit: 10, percentage: 0 },
      storage: { current: 0, limit: 100, percentage: 0 },
    };
  }),

  // Activar/desactivar módulo
  toggleModule: protectedProcedure
    .input(z.object({
      moduleCode: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async () => {
      return { success: true };
    }),

  // Cambiar plan
  changePlan: protectedProcedure
    .input(z.object({
      planCode: z.enum(['free', 'starter', 'professional', 'enterprise']),
      billingCycle: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async () => {
      return { success: true };
    }),

  // Verificar si puede realizar una acción
  canPerformAction: protectedProcedure
    .input(z.object({
      resource: z.enum(['users', 'clients', 'pianos', 'invoices', 'storage']),
    }))
    .mutation(async () => {
      return { allowed: true };
    }),
});
