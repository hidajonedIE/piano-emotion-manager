/**
 * Modules Router
 * Gestión de módulos y planes
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { getModulesForPlan, DEFAULT_PLANS, getPlanByCode, type ModuleInfo } from "../data/modules-data.js";
import type { SubscriptionPlan } from "../../drizzle/modules-schema.js";

/**
 * Obtiene el plan de suscripción actual del usuario
 * @param userId - Clerk ID del usuario (string)
 */
async function getUserPlan(userId: string | undefined): Promise<SubscriptionPlan> {
  if (!userId) {
    console.log('[getUserPlan] No userId provided');
    return 'free'; // Usuario no autenticado = plan gratuito
  }

  try {
    const db = await getDb();
    
    console.log('[getUserPlan] Looking for user with Clerk ID:', userId);
    
    // Buscar usuario por openId (Clerk ID) en lugar de por id numérico
    const result = await db.select().from(users).where(eq(users.openId, userId)).limit(1);
    const user = result.length > 0 ? result[0] : null;

    console.log('[getUserPlan] User found:', user ? { id: user.id, email: user.email, plan: user.subscriptionPlan, status: user.subscriptionStatus } : 'null');

    if (user && user.subscriptionStatus === 'active') {
      // Mapear el plan de la tabla users al tipo SubscriptionPlan
      const planMap: Record<string, SubscriptionPlan> = {
        'free': 'free',
        'pro': 'pro',
        'premium': 'premium',
      };
      
      const mappedPlan = planMap[user.subscriptionPlan] || 'free';
      console.log('[getUserPlan] Returning plan:', mappedPlan);
      return mappedPlan;
    }

    console.log('[getUserPlan] User not found or subscription not active, returning free');
    // Si no tiene suscripción activa, devolver plan gratuito
    return 'free';
  } catch (error) {
    console.error('[getUserPlan] Error getting user plan:', error);
    return 'free';
  }
}

/**
 * Calcula el uso de recursos del usuario según su plan
 */
async function calculateResourceUsage(userId: string | undefined, plan: SubscriptionPlan) {
  const planInfo = getPlanByCode(plan);
  
  if (!planInfo) {
    // Plan no encontrado, devolver límites del plan gratuito
    const freePlan = getPlanByCode('free')!;
    return {
      users: { current: 1, limit: freePlan.maxUsers, percentage: 100 },
      clients: { current: 0, limit: freePlan.maxClients, percentage: 0 },
      pianos: { current: 0, limit: freePlan.maxPianos, percentage: 0 },
      invoices: { current: 0, limit: freePlan.maxInvoicesPerMonth, percentage: 0 },
      storage: { current: 0, limit: freePlan.maxStorageMb, percentage: 0 },
    };
  }

  // TODO: Obtener uso real de la base de datos
  // Por ahora, devolver valores de ejemplo con los límites correctos del plan
  return {
    users: { 
      current: 1, 
      limit: planInfo.maxUsers, 
      percentage: planInfo.maxUsers ? (1 / planInfo.maxUsers) * 100 : 0 
    },
    clients: { 
      current: 0, 
      limit: planInfo.maxClients, 
      percentage: 0 
    },
    pianos: { 
      current: 0, 
      limit: planInfo.maxPianos, 
      percentage: 0 
    },
    invoices: { 
      current: 0, 
      limit: planInfo.maxInvoicesPerMonth, 
      percentage: 0 
    },
    storage: { 
      current: 0, 
      limit: planInfo.maxStorageMb, 
      percentage: 0 
    },
  };
}

export const modulesRouter = router({
  // Obtener módulos con estado
  getModulesWithStatus: publicProcedure.query(async ({ ctx }): Promise<ModuleInfo[]> => {
    const userId = ctx.user?.openId;
    // userId es el Clerk ID (string)
    const plan = await getUserPlan(userId);
    return getModulesForPlan(plan);
  }),

  // Obtener suscripción actual
  getCurrentSubscription: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.openId;
    
    if (!userId) {
      return { plan: 'free', status: 'active', expiresAt: null };
    }

    try {
      const db = await getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.openId, userId),
      });

      if (user) {
        // Mapear el plan de la tabla users al tipo SubscriptionPlan
        const planMap: Record<string, SubscriptionPlan> = {
          'free': 'free',
          'pro': 'pro',
          'premium': 'premium',
        };
        
        return {
          plan: planMap[user.subscriptionPlan] || 'free',
          status: user.subscriptionStatus,
          expiresAt: user.subscriptionEndDate,
        };
      }

      // Sin suscripción = plan gratuito
      return { plan: 'free', status: 'active', expiresAt: null };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return { plan: 'free', status: 'active', expiresAt: null };
    }
  }),

  // Obtener plan actual
  getCurrentPlan: publicProcedure.query(async ({ ctx }) => {
    console.log('[getCurrentPlan] ctx.user:', ctx.user ? { id: ctx.user.id, email: ctx.user.email, openId: ctx.user.openId } : null);
    const userId = ctx.user?.openId;
    console.log('[getCurrentPlan] userId:', userId);
    // userId es el Clerk ID (string), se pasa directamente a getUserPlan
    const plan = await getUserPlan(userId);
    console.log('[getCurrentPlan] plan:', plan);
    return { plan };
  }),

  // Obtener planes disponibles
  getAvailablePlans: publicProcedure.query(async () => {
    return DEFAULT_PLANS.map(plan => ({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice > 0 ? plan.monthlyPrice.toString() : null,
      yearlyPrice: plan.yearlyPrice.toString(),
      features: plan.features,
      isPopular: plan.isPopular,
    }));
  }),

  // Obtener uso de recursos
  getResourceUsage: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.openId;
    // userId es el Clerk ID (string)
    const plan = await getUserPlan(userId);
    return await calculateResourceUsage(userId, plan);
  }),

  // Activar/desactivar módulo
  toggleModule: protectedProcedure
    .input(z.object({
      moduleCode: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.openId;
      
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // userId es el Clerk ID (string)
      // TODO: Guardar preferencia de módulo en la base de datos
      // Por ahora, solo devolver éxito
      return { success: true };
    }),

  // Cambiar plan
  changePlan: protectedProcedure
    .input(z.object({
      planCode: z.enum(['free', 'professional', 'premium']),
      billingCycle: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.openId;
      
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // userId es el Clerk ID (string)
      // TODO: Implementar cambio de plan real
      // Por ahora, solo devolver éxito
      return { success: true };
    }),

  // Verificar si puede realizar una acción
  canPerformAction: protectedProcedure
    .input(z.object({
      resource: z.enum(['users', 'clients', 'pianos', 'invoices', 'storage']),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.openId;
      
      if (!userId) {
        return { allowed: false };
      }

      // userId es el Clerk ID (string)
      const plan = await getUserPlan(userId);
      const usage = await calculateResourceUsage(userId, plan);
      
      // Verificar si está en el límite
      const resourceUsage = usage[input.resource];
      const isAtLimit = resourceUsage.limit !== null && resourceUsage.current >= resourceUsage.limit;
      
      return { allowed: !isAtLimit };
    }),
});
