/**
 * Router de Módulos con acceso a base de datos
 * Piano Emotion Manager
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { modules } from "../../drizzle/modules-schema";
import { eq, asc } from "drizzle-orm";

// Tipo para los módulos
interface ModuleInfo {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: 'core' | 'free' | 'premium' | 'addon';
  isEnabled: boolean;
  isAvailable: boolean;
  requiresUpgrade: boolean;
  includedInCurrentPlan: boolean;
}

// Módulos por defecto (fallback si la base de datos no está disponible)
const DEFAULT_MODULES: ModuleInfo[] = [
  { code: 'clients', name: 'Gestión de Clientes', description: 'Gestiona tu cartera de clientes y sus datos de contacto', icon: 'people', color: '#8b5cf6', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'pianos', name: 'Registro de Pianos', description: 'Mantén un registro detallado de todos los pianos', icon: 'musical-notes', color: '#ec4899', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'services', name: 'Servicios', description: 'Registra afinaciones, reparaciones y otros servicios', icon: 'construct', color: '#f59e0b', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'calendar', name: 'Calendario', description: 'Agenda y gestiona tus citas', icon: 'calendar', color: '#3b82f6', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'basic_invoicing', name: 'Facturación Básica', description: 'Genera facturas simples para tus servicios', icon: 'document-text', color: '#14b8a6', type: 'free', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'team_management', name: 'Gestión de Equipos', description: 'Gestiona equipos de técnicos con roles y permisos', icon: 'people-circle', color: '#10b981', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'inventory', name: 'Inventario', description: 'Control de stock de piezas y materiales', icon: 'cube', color: '#6366f1', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'advanced_invoicing', name: 'Facturación Avanzada', description: 'Facturación electrónica multi-país con cumplimiento legal', icon: 'receipt', color: '#0891b2', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'accounting', name: 'Contabilidad', description: 'Gestión de gastos, ingresos y reportes financieros', icon: 'calculator', color: '#f97316', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'reports', name: 'Reportes y Analytics', description: 'Análisis avanzado y reportes personalizados', icon: 'analytics', color: '#06b6d4', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'crm', name: 'CRM Avanzado', description: 'Segmentación de clientes, campañas y automatizaciones', icon: 'heart', color: '#ef4444', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'shop', name: 'Tienda Online', description: 'Acceso a tiendas de proveedores integradas', icon: 'cart', color: '#84cc16', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
];

export const modulesRouter = router({
  // Obtener módulos con estado (consulta la base de datos)
  getModulesWithStatus: protectedProcedure.query(async ({ ctx }): Promise<ModuleInfo[]> => {
    try {
      const db = await getDb();
      if (!db) {
        console.log('[Modules] Database not available, returning default modules');
        return DEFAULT_MODULES;
      }

      // Consultar módulos de la base de datos
      const dbModules = await db
        .select()
        .from(modules)
        .where(eq(modules.isActive, true))
        .orderBy(asc(modules.sortOrder));

      if (!dbModules || dbModules.length === 0) {
        console.log('[Modules] No modules found in database, returning default modules');
        return DEFAULT_MODULES;
      }

      console.log(`[Modules] Found ${dbModules.length} modules in database`);

      // Plan actual del usuario (por ahora asumimos 'free')
      const currentPlan = 'free';

      // Transformar módulos de la base de datos al formato esperado
      return dbModules.map((module) => {
        const includedInPlans = (module.includedInPlans as string[]) || [];
        const includedInCurrentPlan = includedInPlans.includes(currentPlan);
        const isCore = module.type === 'core';
        const isFree = module.type === 'free';

        return {
          code: module.code,
          name: module.name,
          description: module.description,
          icon: module.icon,
          color: module.color,
          type: module.type as 'core' | 'free' | 'premium' | 'addon',
          isEnabled: isCore || includedInCurrentPlan,
          isAvailable: isCore || isFree || includedInCurrentPlan,
          requiresUpgrade: !isCore && !isFree && !includedInCurrentPlan,
          includedInCurrentPlan,
        };
      });
    } catch (error) {
      console.error('[Modules] Error fetching modules:', error);
      return DEFAULT_MODULES;
    }
  }),

  // Obtener suscripción actual
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    return {
      plan: 'free',
      status: 'active',
      expiresAt: null,
    };
  }),

  // Obtener plan actual
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    return 'free';
  }),

  // Obtener planes disponibles
  getAvailablePlans: protectedProcedure.query(async ({ ctx }) => {
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
  getResourceUsage: protectedProcedure.query(async ({ ctx }) => {
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
    .mutation(async ({ ctx, input }) => {
      // Por ahora solo retornamos éxito
      // TODO: Implementar persistencia en organization_modules
      return { success: true };
    }),

  // Cambiar plan
  changePlan: protectedProcedure
    .input(z.object({
      planCode: z.enum(['free', 'starter', 'professional', 'enterprise']),
      billingCycle: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implementar cambio de plan con pasarela de pago
      return { success: true };
    }),

  // Verificar si puede realizar una acción
  canPerformAction: protectedProcedure
    .input(z.object({
      resource: z.enum(['users', 'clients', 'pianos', 'invoices', 'storage']),
    }))
    .mutation(async ({ ctx, input }) => {
      return { allowed: true };
    }),
});
