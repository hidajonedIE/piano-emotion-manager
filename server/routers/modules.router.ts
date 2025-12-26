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
    // Obtener el plan actual del usuario desde la BD
    let userPlan: 'free' | 'premium' | 'enterprise' = 'free';
    
    try {
      if (ctx?.userId) {
        const db = await getDb();
        if (!db) return getModulesForPlan(userPlan);
        const [user] = await db
          .select({ plan: users.subscriptionPlan, planExpiresAt: users.planExpiresAt })
          .from(users)
          .where(eq(users.id, ctx.userId));
        
        if (user?.plan) {
          // Verificar si el plan no ha expirado
          if (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date()) {
            userPlan = user.plan as 'free' | 'premium' | 'enterprise';
          }
        }
      }
    } catch (error) {
      // Error silencioso - usar plan free por defecto
    }
    
    return getModulesForPlan(userPlan);
  }),

  // Obtener suscripción actual
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return { plan: 'free', status: 'active', expiresAt: null };
      const [user] = await db
        .select({ 
          plan: users.subscriptionPlan, 
          status: users.subscriptionStatus,
          expiresAt: users.planExpiresAt 
        })
        .from(users)
        .where(eq(users.id, ctx.userId));
      
      return {
        plan: user?.plan || 'free',
        status: user?.status || 'active',
        expiresAt: user?.expiresAt || null,
      };
    } catch (error) {
      return {
        plan: 'free',
        status: 'active',
        expiresAt: null,
      };
    }
  }),

  // Obtener plan actual
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return 'free';
      const [user] = await db
        .select({ plan: users.subscriptionPlan })
        .from(users)
        .where(eq(users.id, ctx.userId));
      
      return user?.plan || 'free';
    } catch (error) {
      return 'free';
    }
  }),

  // Obtener planes disponibles
  getAvailablePlans: protectedProcedure.query(async () => {
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
  getResourceUsage: protectedProcedure.query(async () => {
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
