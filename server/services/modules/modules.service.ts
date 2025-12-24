/**
 * Servicio de Gestión de Módulos y Suscripciones
 * Piano Emotion Manager
 */

import { db } from '@/drizzle/db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import {
  modules,
  subscriptionPlans,
  subscriptions,
  organizationModules,
  subscriptionHistory,
  resourceUsage,
  type ModuleType,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/drizzle/modules-schema';

// ============================================================================
// Types
// ============================================================================

export interface ModuleInfo {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: ModuleType;
  isEnabled: boolean;
  isAvailable: boolean;
  requiresUpgrade: boolean;
  includedInCurrentPlan: boolean;
}

export interface PlanLimits {
  maxUsers: number | null;
  maxClients: number | null;
  maxPianos: number | null;
  maxInvoicesPerMonth: number | null;
  maxStorageMb: number | null;
}

export interface UsageInfo {
  users: { current: number; limit: number | null; percentage: number };
  clients: { current: number; limit: number | null; percentage: number };
  pianos: { current: number; limit: number | null; percentage: number };
  invoices: { current: number; limit: number | null; percentage: number };
  storage: { current: number; limit: number | null; percentage: number };
}

// ============================================================================
// Default Modules Configuration
// ============================================================================

export const DEFAULT_MODULES: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: ModuleType;
  includedInPlans: SubscriptionPlan[];
}> = [
  // Core modules (always available)
  {
    code: 'clients',
    name: 'Gestión de Clientes',
    description: 'Gestiona tu cartera de clientes y sus datos de contacto',
    icon: 'people',
    color: '#8b5cf6',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'pianos',
    name: 'Registro de Pianos',
    description: 'Mantén un registro detallado de todos los pianos',
    icon: 'musical-notes',
    color: '#ec4899',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'services',
    name: 'Servicios',
    description: 'Registra afinaciones, reparaciones y otros servicios',
    icon: 'construct',
    color: '#f59e0b',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  {
    code: 'calendar',
    name: 'Calendario',
    description: 'Agenda y gestiona tus citas',
    icon: 'calendar',
    color: '#3b82f6',
    type: 'core',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  // Free optional modules
  {
    code: 'basic_invoicing',
    name: 'Facturación Básica',
    description: 'Genera facturas simples para tus servicios',
    icon: 'document-text',
    color: '#14b8a6',
    type: 'free',
    includedInPlans: ['free', 'starter', 'professional', 'enterprise'],
  },
  // Premium modules
  {
    code: 'team_management',
    name: 'Gestión de Equipos',
    description: 'Gestiona equipos de técnicos con roles y permisos',
    icon: 'people-circle',
    color: '#10b981',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'inventory',
    name: 'Inventario',
    description: 'Control de stock de piezas y materiales',
    icon: 'cube',
    color: '#6366f1',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'advanced_invoicing',
    name: 'Facturación Avanzada',
    description: 'Facturación electrónica multi-país con cumplimiento legal',
    icon: 'receipt',
    color: '#0891b2',
    type: 'premium',
    includedInPlans: ['starter', 'professional', 'enterprise'],
  },
  {
    code: 'accounting',
    name: 'Contabilidad',
    description: 'Gestión de gastos, ingresos y reportes financieros',
    icon: 'calculator',
    color: '#f97316',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'reports',
    name: 'Reportes y Analytics',
    description: 'Análisis avanzado y reportes personalizados',
    icon: 'analytics',
    color: '#06b6d4',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'crm',
    name: 'CRM Avanzado',
    description: 'Segmentación de clientes, campañas y automatizaciones',
    icon: 'heart',
    color: '#ef4444',
    type: 'premium',
    includedInPlans: ['professional', 'enterprise'],
  },
  {
    code: 'shop',
    name: 'Tienda Online',
    description: 'Acceso a tiendas de proveedores integradas',
    icon: 'cart',
    color: '#84cc16',
    type: 'premium',
    includedInPlans: ['starter', 'professional', 'enterprise'],
  },
  {
    code: 'calendar_sync',
    name: 'Sincronización de Calendario',
    description: 'Sincroniza con Google Calendar y Outlook',
    icon: 'sync',
    color: '#a855f7',
    type: 'premium',
    includedInPlans: ['starter', 'professional', 'enterprise'],
  },
  {
    code: 'sms_reminders',
    name: 'Recordatorios SMS',
    description: 'Envía recordatorios por SMS a tus clientes',
    icon: 'chatbubble',
    color: '#22c55e',
    type: 'addon',
    includedInPlans: [],
  },
  {
    code: 'white_label',
    name: 'Marca Blanca',
    description: 'Personaliza la app con tu propia marca',
    icon: 'color-palette',
    color: '#7c3aed',
    type: 'addon',
    includedInPlans: ['enterprise'],
  },
];

// ============================================================================
// Default Plans Configuration
// ============================================================================

export const DEFAULT_PLANS: Array<{
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number | null;
  maxClients: number | null;
  maxPianos: number | null;
  maxInvoicesPerMonth: number | null;
  maxStorageMb: number | null;
  features: string[];
  isPopular: boolean;
}> = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para técnicos independientes que empiezan',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxClients: 50,
    maxPianos: 100,
    maxInvoicesPerMonth: 10,
    maxStorageMb: 100,
    features: ['Gestión básica de clientes', 'Registro de pianos', 'Calendario simple', 'Facturación básica'],
    isPopular: false,
  },
  {
    code: 'starter',
    name: 'Inicial',
    description: 'Para técnicos que quieren crecer',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    maxUsers: 2,
    maxClients: 200,
    maxPianos: 500,
    maxInvoicesPerMonth: 50,
    maxStorageMb: 500,
    features: ['Todo lo del plan Gratuito', 'Facturación electrónica', 'Sincronización calendario', 'Tienda online', 'Soporte por email'],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Profesional',
    description: 'Para empresas con equipos de técnicos',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    maxUsers: 10,
    maxClients: null, // Ilimitado
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: 5000,
    features: ['Todo lo del plan Inicial', 'Gestión de equipos', 'Inventario', 'Contabilidad', 'Reportes avanzados', 'CRM', 'Soporte prioritario'],
    isPopular: true,
  },
  {
    code: 'enterprise',
    name: 'Empresarial',
    description: 'Para grandes empresas con necesidades avanzadas',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    maxUsers: null, // Ilimitado
    maxClients: null,
    maxPianos: null,
    maxInvoicesPerMonth: null,
    maxStorageMb: null,
    features: ['Todo lo del plan Profesional', 'Usuarios ilimitados', 'Marca blanca', 'API personalizada', 'Soporte dedicado', 'SLA garantizado'],
    isPopular: false,
  },
];

// ============================================================================
// Modules Service
// ============================================================================

export class ModulesService {
  private organizationId: number;

  constructor(organizationId: number) {
    this.organizationId = organizationId;
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Obtiene la suscripción actual de la organización
   */
  async getCurrentSubscription(): Promise<typeof subscriptions.$inferSelect | null> {
    return db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.organizationId, this.organizationId),
        eq(subscriptions.status, 'active')
      ),
    });
  }

  /**
   * Obtiene el plan actual
   */
  async getCurrentPlan(): Promise<SubscriptionPlan> {
    const subscription = await this.getCurrentSubscription();
    return subscription?.planCode || 'free';
  }

  /**
   * Obtiene información del plan
   */
  async getPlanInfo(planCode?: SubscriptionPlan): Promise<typeof subscriptionPlans.$inferSelect | null> {
    const code = planCode || await this.getCurrentPlan();
    return db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.code, code),
    });
  }

  /**
   * Obtiene todos los planes disponibles
   */
  async getAvailablePlans(): Promise<Array<typeof subscriptionPlans.$inferSelect>> {
    return db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.isActive, true),
      orderBy: (plans, { asc }) => [asc(plans.monthlyPrice)],
    });
  }

  /**
   * Cambia el plan de suscripción
   */
  async changePlan(newPlanCode: SubscriptionPlan, billingCycle: 'monthly' | 'yearly'): Promise<void> {
    const currentSubscription = await this.getCurrentSubscription();
    const oldPlan = currentSubscription?.planCode || 'free';

    if (currentSubscription) {
      // Actualizar suscripción existente
      await db
        .update(subscriptions)
        .set({
          planCode: newPlanCode,
          billingCycle,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSubscription.id));

      // Registrar en historial
      await db.insert(subscriptionHistory).values({
        subscriptionId: currentSubscription.id,
        action: newPlanCode > oldPlan ? 'upgraded' : 'downgraded',
        fromPlan: oldPlan,
        toPlan: newPlanCode,
      });
    } else {
      // Crear nueva suscripción
      const [newSubscription] = await db.insert(subscriptions).values({
        organizationId: this.organizationId,
        planCode: newPlanCode,
        status: 'active',
        startDate: new Date(),
        billingCycle,
      }).returning();

      await db.insert(subscriptionHistory).values({
        subscriptionId: newSubscription.id,
        action: 'created',
        toPlan: newPlanCode,
      });
    }

    // Actualizar módulos según el nuevo plan
    await this.syncModulesWithPlan(newPlanCode);
  }

  // ============================================================================
  // Module Management
  // ============================================================================

  /**
   * Obtiene todos los módulos con su estado para la organización
   */
  async getModulesWithStatus(): Promise<ModuleInfo[]> {
    const currentPlan = await this.getCurrentPlan();
    const allModules = await db.query.modules.findMany({
      where: eq(modules.isActive, true),
      orderBy: (m, { asc }) => [asc(m.sortOrder)],
    });

    const orgModules = await db.query.organizationModules.findMany({
      where: eq(organizationModules.organizationId, this.organizationId),
    });

    const orgModulesMap = new Map(orgModules.map((m) => [m.moduleCode, m]));

    return allModules.map((module) => {
      const orgModule = orgModulesMap.get(module.code);
      const includedInPlans = (module.includedInPlans as string[]) || [];
      const includedInCurrentPlan = includedInPlans.includes(currentPlan);

      return {
        code: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        color: module.color,
        type: module.type,
        isEnabled: orgModule?.isEnabled ?? (module.type === 'core'),
        isAvailable: includedInCurrentPlan || module.type === 'core' || module.type === 'free' || orgModule?.accessType === 'addon',
        requiresUpgrade: !includedInCurrentPlan && module.type === 'premium',
        includedInCurrentPlan,
      };
    });
  }

  /**
   * Verifica si un módulo está disponible para la organización
   */
  async hasModuleAccess(moduleCode: string): Promise<boolean> {
    const currentPlan = await this.getCurrentPlan();

    // Verificar si está en los módulos de la organización
    const orgModule = await db.query.organizationModules.findFirst({
      where: and(
        eq(organizationModules.organizationId, this.organizationId),
        eq(organizationModules.moduleCode, moduleCode),
        eq(organizationModules.isEnabled, true)
      ),
    });

    if (orgModule) {
      // Verificar si no ha expirado
      if (orgModule.expiresAt && orgModule.expiresAt < new Date()) {
        return false;
      }
      return true;
    }

    // Verificar si está incluido en el plan
    const module = await db.query.modules.findFirst({
      where: eq(modules.code, moduleCode),
    });

    if (!module) return false;
    if (module.type === 'core') return true;

    const includedInPlans = (module.includedInPlans as string[]) || [];
    return includedInPlans.includes(currentPlan);
  }

  /**
   * Verifica si un módulo es premium
   */
  async isModulePremium(moduleCode: string): Promise<boolean> {
    const module = await db.query.modules.findFirst({
      where: eq(modules.code, moduleCode),
    });
    return module?.type === 'premium' || module?.type === 'addon';
  }

  /**
   * Activa o desactiva un módulo
   */
  async toggleModule(moduleCode: string, enabled: boolean): Promise<void> {
    // Verificar que tiene acceso al módulo
    const hasAccess = await this.hasModuleAccess(moduleCode);
    if (!hasAccess && enabled) {
      throw new Error('No tienes acceso a este módulo. Actualiza tu plan.');
    }

    const existing = await db.query.organizationModules.findFirst({
      where: and(
        eq(organizationModules.organizationId, this.organizationId),
        eq(organizationModules.moduleCode, moduleCode)
      ),
    });

    if (existing) {
      await db
        .update(organizationModules)
        .set({ isEnabled: enabled, updatedAt: new Date() })
        .where(eq(organizationModules.id, existing.id));
    } else {
      await db.insert(organizationModules).values({
        organizationId: this.organizationId,
        moduleCode,
        isEnabled: enabled,
        accessType: 'plan',
      });
    }
  }

  /**
   * Sincroniza módulos con el plan actual
   */
  private async syncModulesWithPlan(planCode: SubscriptionPlan): Promise<void> {
    const allModules = await db.query.modules.findMany({
      where: eq(modules.isActive, true),
    });

    for (const module of allModules) {
      const includedInPlans = (module.includedInPlans as string[]) || [];
      const isIncluded = includedInPlans.includes(planCode) || module.type === 'core';

      const existing = await db.query.organizationModules.findFirst({
        where: and(
          eq(organizationModules.organizationId, this.organizationId),
          eq(organizationModules.moduleCode, module.code)
        ),
      });

      if (existing) {
        // No desactivar si es addon comprado
        if (existing.accessType === 'addon') continue;

        await db
          .update(organizationModules)
          .set({
            isEnabled: isIncluded,
            accessType: 'plan',
            updatedAt: new Date(),
          })
          .where(eq(organizationModules.id, existing.id));
      } else if (isIncluded) {
        await db.insert(organizationModules).values({
          organizationId: this.organizationId,
          moduleCode: module.code,
          isEnabled: true,
          accessType: 'plan',
        });
      }
    }
  }

  // ============================================================================
  // Usage & Limits
  // ============================================================================

  /**
   * Obtiene los límites del plan actual
   */
  async getPlanLimits(): Promise<PlanLimits> {
    const plan = await this.getPlanInfo();
    return {
      maxUsers: plan?.maxUsers ?? 1,
      maxClients: plan?.maxClients ?? 50,
      maxPianos: plan?.maxPianos ?? 100,
      maxInvoicesPerMonth: plan?.maxInvoicesPerMonth ?? 10,
      maxStorageMb: plan?.maxStorageMb ?? 100,
    };
  }

  /**
   * Obtiene el uso actual de recursos
   */
  async getResourceUsage(): Promise<UsageInfo> {
    const limits = await this.getPlanLimits();

    // Obtener uso actual del período
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let usage = await db.query.resourceUsage.findFirst({
      where: and(
        eq(resourceUsage.organizationId, this.organizationId),
        gte(resourceUsage.periodStart, periodStart)
      ),
    });

    // Si no existe, crear registro vacío
    if (!usage) {
      usage = {
        id: 0,
        organizationId: this.organizationId,
        periodStart,
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        usersCount: 0,
        clientsCount: 0,
        pianosCount: 0,
        invoicesCount: 0,
        storageMb: 0,
        updatedAt: now,
      };
    }

    const calcPercentage = (current: number, limit: number | null) => {
      if (!limit) return 0;
      return Math.min(100, Math.round((current / limit) * 100));
    };

    return {
      users: {
        current: usage.usersCount || 0,
        limit: limits.maxUsers,
        percentage: calcPercentage(usage.usersCount || 0, limits.maxUsers),
      },
      clients: {
        current: usage.clientsCount || 0,
        limit: limits.maxClients,
        percentage: calcPercentage(usage.clientsCount || 0, limits.maxClients),
      },
      pianos: {
        current: usage.pianosCount || 0,
        limit: limits.maxPianos,
        percentage: calcPercentage(usage.pianosCount || 0, limits.maxPianos),
      },
      invoices: {
        current: usage.invoicesCount || 0,
        limit: limits.maxInvoicesPerMonth,
        percentage: calcPercentage(usage.invoicesCount || 0, limits.maxInvoicesPerMonth),
      },
      storage: {
        current: usage.storageMb || 0,
        limit: limits.maxStorageMb,
        percentage: calcPercentage(usage.storageMb || 0, limits.maxStorageMb),
      },
    };
  }

  /**
   * Verifica si se puede realizar una acción según los límites
   */
  async canPerformAction(resource: 'users' | 'clients' | 'pianos' | 'invoices' | 'storage'): Promise<{ allowed: boolean; reason?: string }> {
    const usage = await this.getResourceUsage();
    const resourceUsage = usage[resource];

    if (resourceUsage.limit === null) {
      return { allowed: true };
    }

    if (resourceUsage.current >= resourceUsage.limit) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${resource} de tu plan. Actualiza para continuar.`,
      };
    }

    return { allowed: true };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createModulesService(organizationId: number): ModulesService {
  return new ModulesService(organizationId);
}

// ============================================================================
// Seed Functions
// ============================================================================

export async function seedModules(): Promise<void> {
  for (const module of DEFAULT_MODULES) {
    const existing = await db.query.modules.findFirst({
      where: eq(modules.code, module.code),
    });

    if (!existing) {
      await db.insert(modules).values({
        code: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        color: module.color,
        type: module.type,
        includedInPlans: module.includedInPlans,
      });
    }
  }
}

export async function seedPlans(): Promise<void> {
  for (const plan of DEFAULT_PLANS) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.code, plan.code),
    });

    if (!existing) {
      await db.insert(subscriptionPlans).values({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice.toString(),
        yearlyPrice: plan.yearlyPrice.toString(),
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        maxPianos: plan.maxPianos,
        maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
        maxStorageMb: plan.maxStorageMb,
        features: plan.features,
        isPopular: plan.isPopular,
      });
    }
  }
}
