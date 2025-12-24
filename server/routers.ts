import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import * as db from "./db.js";

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

// Módulos por defecto
const DEFAULT_MODULES: ModuleInfo[] = [
  { code: 'clients', name: 'Gestión de Clientes', description: 'Gestiona tu cartera de clientes y sus datos de contacto', icon: 'people', color: '#8b5cf6', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'pianos', name: 'Registro de Pianos', description: 'Mantén un registro detallado de todos los pianos', icon: 'musical-notes', color: '#ec4899', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'services', name: 'Servicios', description: 'Registra afinaciones, reparaciones y otros servicios', icon: 'construct', color: '#f59e0b', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'calendar', name: 'Calendario', description: 'Agenda y gestiona tus citas', icon: 'calendar', color: '#3b82f6', type: 'core', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'basic_invoicing', name: 'Facturación Básica', description: 'Genera facturas simples para tus servicios', icon: 'document-text', color: '#14b8a6', type: 'free', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'inventory', name: 'Inventario', description: 'Control de stock de piezas y materiales', icon: 'cube', color: '#6366f1', type: 'free', isEnabled: true, isAvailable: true, requiresUpgrade: false, includedInCurrentPlan: true },
  { code: 'team_management', name: 'Gestión de Equipos', description: 'Gestiona equipos de técnicos con roles y permisos', icon: 'people-circle', color: '#10b981', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'advanced_invoicing', name: 'Facturación Electrónica', description: 'Facturación electrónica multi-país con cumplimiento legal', icon: 'receipt', color: '#0891b2', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'accounting', name: 'Contabilidad', description: 'Gestión de gastos, ingresos y reportes financieros', icon: 'calculator', color: '#f97316', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'reports', name: 'Reportes y Analytics', description: 'Análisis avanzado y reportes personalizados', icon: 'analytics', color: '#06b6d4', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'crm', name: 'CRM Avanzado', description: 'Segmentación de clientes, campañas y automatizaciones', icon: 'heart', color: '#ef4444', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'shop', name: 'Tienda Online', description: 'Acceso a tiendas de proveedores integradas', icon: 'cart', color: '#84cc16', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'calendar_sync', name: 'Sincronización Calendario', description: 'Sincroniza con Google Calendar y Outlook', icon: 'sync', color: '#a855f7', type: 'premium', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
  { code: 'ai_assistant', name: 'Asistente IA', description: 'Asistente inteligente para diagnósticos y recomendaciones', icon: 'sparkles', color: '#f59e0b', type: 'addon', isEnabled: false, isAvailable: false, requiresUpgrade: true, includedInCurrentPlan: false },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Clear cookie by setting it with expired date
      const cookieValue = `${COOKIE_NAME}=; Path=${cookieOptions.path || '/'}; HttpOnly; SameSite=${cookieOptions.sameSite || 'Lax'}; Max-Age=0`;
      ctx.res.setHeader('Set-Cookie', cookieValue);
      return { success: true } as const;
    }),
  }),

  // ============ CLIENTS ============
  clients: router({
    list: protectedProcedure.query(({ ctx }) => db.getClients(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getClient(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        clientType: z.enum(["particular", "student", "professional", "music_school", "conservatory", "concert_hall"]).optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.createClient({ ...input, odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        clientType: z.enum(["particular", "student", "professional", "music_school", "conservatory", "concert_hall"]).optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateClient(ctx.user.openId, id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteClient(ctx.user.openId, input.id)),
  }),

  // ============ PIANOS ============
  pianos: router({
    list: protectedProcedure.query(({ ctx }) => db.getPianos(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getPiano(ctx.user.openId, input.id)),
    
    byClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(({ ctx, input }) => db.getPianosByClient(ctx.user.openId, input.clientId)),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        brand: z.string().min(1).max(100),
        model: z.string().optional().nullable(),
        serialNumber: z.string().optional().nullable(),
        year: z.number().optional().nullable(),
        category: z.enum(["vertical", "grand"]),
        pianoType: z.string().min(1).max(50),
        condition: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).optional(),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(({ ctx, input }) => db.createPiano({ ...input, odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        brand: z.string().min(1).max(100).optional(),
        model: z.string().optional().nullable(),
        serialNumber: z.string().optional().nullable(),
        year: z.number().optional().nullable(),
        category: z.enum(["vertical", "grand"]).optional(),
        pianoType: z.string().min(1).max(50).optional(),
        condition: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).optional(),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updatePiano(ctx.user.openId, id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deletePiano(ctx.user.openId, input.id)),
  }),

  // ============ SERVICES ============
  services: router({
    list: protectedProcedure.query(({ ctx }) => db.getServices(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getService(ctx.user.openId, input.id)),
    
    byPiano: protectedProcedure
      .input(z.object({ pianoId: z.number() }))
      .query(({ ctx, input }) => db.getServicesByPiano(ctx.user.openId, input.pianoId)),
    
    create: protectedProcedure
      .input(z.object({
        pianoId: z.number(),
        clientId: z.number(),
        serviceType: z.enum(["tuning", "repair", "regulation", "maintenance_basic", "maintenance_complete", "maintenance_premium", "inspection", "restoration", "other"]),
        date: z.string(),
        cost: z.string().optional().nullable(),
        duration: z.number().optional().nullable(),
        tasks: z.array(z.object({ name: z.string(), completed: z.boolean(), notes: z.string().optional() })).optional(),
        notes: z.string().optional().nullable(),
        technicianNotes: z.string().optional().nullable(),
        materialsUsed: z.array(z.object({ materialId: z.number(), quantity: z.number() })).optional(),
        photosBefore: z.array(z.string()).optional(),
        photosAfter: z.array(z.string()).optional(),
        clientSignature: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.createService({ ...input, date: new Date(input.date), odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        pianoId: z.number().optional(),
        clientId: z.number().optional(),
        serviceType: z.enum(["tuning", "repair", "regulation", "maintenance_basic", "maintenance_complete", "maintenance_premium", "inspection", "restoration", "other"]).optional(),
        date: z.string().optional(),
        cost: z.string().optional().nullable(),
        duration: z.number().optional().nullable(),
        tasks: z.array(z.object({ name: z.string(), completed: z.boolean(), notes: z.string().optional() })).optional(),
        notes: z.string().optional().nullable(),
        technicianNotes: z.string().optional().nullable(),
        materialsUsed: z.array(z.object({ materialId: z.number(), quantity: z.number() })).optional(),
        photosBefore: z.array(z.string()).optional(),
        photosAfter: z.array(z.string()).optional(),
        clientSignature: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, date, ...data } = input;
        return db.updateService(ctx.user.openId, id, { ...data, ...(date ? { date: new Date(date) } : {}) });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteService(ctx.user.openId, input.id)),
  }),

  // ============ INVENTORY ============
  inventory: router({
    list: protectedProcedure.query(({ ctx }) => db.getInventory(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getInventoryItem(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["strings", "hammers", "dampers", "keys", "action_parts", "pedals", "tuning_pins", "felts", "tools", "chemicals", "other"]),
        description: z.string().optional().nullable(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        minStock: z.string().optional(),
        costPerUnit: z.string().optional().nullable(),
        supplier: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.createInventoryItem({ ...input, odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        category: z.enum(["strings", "hammers", "dampers", "keys", "action_parts", "pedals", "tuning_pins", "felts", "tools", "chemicals", "other"]).optional(),
        description: z.string().optional().nullable(),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        minStock: z.string().optional(),
        costPerUnit: z.string().optional().nullable(),
        supplier: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(ctx.user.openId, id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteInventoryItem(ctx.user.openId, input.id)),
  }),

  // ============ APPOINTMENTS ============
  appointments: router({
    list: protectedProcedure.query(({ ctx }) => db.getAppointments(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getAppointment(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        pianoId: z.number().optional().nullable(),
        title: z.string().min(1).max(255),
        date: z.string(),
        duration: z.number().optional(),
        serviceType: z.string().optional().nullable(),
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
        notes: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.createAppointment({ ...input, date: new Date(input.date), odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        pianoId: z.number().optional().nullable(),
        title: z.string().min(1).max(255).optional(),
        date: z.string().optional(),
        duration: z.number().optional(),
        serviceType: z.string().optional().nullable(),
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]).optional(),
        notes: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, date, ...data } = input;
        return db.updateAppointment(ctx.user.openId, id, { ...data, ...(date ? { date: new Date(date) } : {}) });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteAppointment(ctx.user.openId, input.id)),
  }),

  // ============ INVOICES ============
  invoices: router({
    list: protectedProcedure.query(({ ctx }) => db.getInvoices(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getInvoice(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        invoiceNumber: z.string().min(1).max(50),
        clientId: z.number(),
        clientName: z.string().min(1).max(255),
        clientEmail: z.string().optional().nullable(),
        clientAddress: z.string().optional().nullable(),
        date: z.string(),
        dueDate: z.string().optional().nullable(),
        status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          taxRate: z.number(),
          total: z.number(),
        })).optional(),
        subtotal: z.string(),
        taxAmount: z.string(),
        total: z.string(),
        notes: z.string().optional().nullable(),
        businessInfo: z.object({
          name: z.string(),
          taxId: z.string(),
          address: z.string(),
          city: z.string(),
          postalCode: z.string(),
          phone: z.string(),
          email: z.string(),
          bankAccount: z.string(),
        }).optional(),
      }))
      .mutation(({ ctx, input }) => db.createInvoice({ 
        ...input, 
        date: new Date(input.date),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        odId: ctx.user.openId 
      })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          taxRate: z.number(),
          total: z.number(),
        })).optional(),
        subtotal: z.string().optional(),
        taxAmount: z.string().optional(),
        total: z.string().optional(),
        notes: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateInvoice(ctx.user.openId, id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteInvoice(ctx.user.openId, input.id)),
  }),

  // ============ SERVICE RATES ============
  serviceRates: router({
    list: protectedProcedure.query(({ ctx }) => db.getServiceRates(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getServiceRate(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional().nullable(),
        category: z.enum(["tuning", "maintenance", "regulation", "repair", "restoration", "inspection", "other"]),
        basePrice: z.string(),
        taxRate: z.number().optional(),
        estimatedDuration: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => db.createServiceRate({ ...input, odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        category: z.enum(["tuning", "maintenance", "regulation", "repair", "restoration", "inspection", "other"]).optional(),
        basePrice: z.string().optional(),
        taxRate: z.number().optional(),
        estimatedDuration: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateServiceRate(ctx.user.openId, id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteServiceRate(ctx.user.openId, input.id)),
  }),

  // ============ BUSINESS INFO ============
  businessInfo: router({
    get: protectedProcedure.query(({ ctx }) => db.getBusinessInfo(ctx.user.openId)),
    
    save: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        taxId: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        bankAccount: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => db.saveBusinessInfo({ ...input, odId: ctx.user.openId })),
  }),

  // ============ REMINDERS ============
  reminders: router({
    list: protectedProcedure.query(({ ctx }) => db.getReminders(ctx.user.openId)),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => db.getReminder(ctx.user.openId, input.id)),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        pianoId: z.number().optional().nullable(),
        reminderType: z.enum(["call", "visit", "email", "whatsapp", "follow_up"]),
        dueDate: z.string(),
        title: z.string().min(1).max(255),
        notes: z.string().optional().nullable(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => db.createReminder({ ...input, dueDate: new Date(input.dueDate), odId: ctx.user.openId })),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        pianoId: z.number().optional().nullable(),
        reminderType: z.enum(["call", "visit", "email", "whatsapp", "follow_up"]).optional(),
        dueDate: z.string().optional(),
        title: z.string().min(1).max(255).optional(),
        notes: z.string().optional().nullable(),
        isCompleted: z.boolean().optional(),
        completedAt: z.string().optional().nullable(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, dueDate, completedAt, ...data } = input;
        return db.updateReminder(ctx.user.openId, id, { 
          ...data, 
          ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
          ...(completedAt ? { completedAt: new Date(completedAt) } : {}),
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteReminder(ctx.user.openId, input.id)),
  }),

  // ============ MODULES ============
  modules: router({
    // Obtener módulos con estado
    getModulesWithStatus: protectedProcedure.query(async (): Promise<ModuleInfo[]> => {
      return DEFAULT_MODULES;
    }),

    // Obtener suscripción actual
    getCurrentSubscription: protectedProcedure.query(async () => {
      return {
        plan: 'free',
        status: 'active',
        expiresAt: null,
      };
    }),

    // Obtener plan actual
    getCurrentPlan: protectedProcedure.query(async () => {
      return 'free';
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
  }),

  // ============ ADVANCED MODULES ============
  advanced: router({
    // Team / Organization
    team: router({
      getMyOrganization: protectedProcedure.query(async () => null),
      createOrganization: protectedProcedure
        .input(z.object({
          name: z.string().min(1).max(255),
          taxId: z.string().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
        }))
        .mutation(async ({ input }) => ({ id: 1, ...input })),
      listMembers: protectedProcedure.query(async () => []),
      inviteMember: protectedProcedure
        .input(z.object({
          email: z.string().email(),
          role: z.enum(["admin", "manager", "senior_tech", "technician", "apprentice", "receptionist", "accountant", "viewer"]),
        }))
        .mutation(async () => ({ success: true, invitationId: "inv_123" })),
    }),

    // CRM
    crm: router({
      getClientProfile: protectedProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async () => null),
      getInteractions: protectedProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async () => []),
      getSegments: protectedProcedure.query(async () => []),
      getCampaigns: protectedProcedure.query(async () => []),
    }),

    // Reports
    reports: router({
      getDashboardMetrics: protectedProcedure
        .input(z.object({
          startDate: z.string(),
          endDate: z.string(),
        }))
        .query(async () => ({
          totalRevenue: 0,
          totalServices: 0,
          newClients: 0,
          avgServiceValue: 0,
          revenueByMonth: [],
          servicesByType: [],
          topClients: [],
        })),
    }),

    // Accounting
    accounting: router({
      getFinancialSummary: protectedProcedure
        .input(z.object({
          year: z.number(),
          month: z.number().optional(),
        }))
        .query(async () => ({
          income: 0,
          expenses: 0,
          profit: 0,
          pendingInvoices: 0,
          taxDue: 0,
        })),
      getExpenses: protectedProcedure
        .input(z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          category: z.string().optional(),
        }))
        .query(async () => []),
    }),

    // Shop
    shop: router({
      getStores: protectedProcedure.query(async () => []),
      getProducts: protectedProcedure
        .input(z.object({ storeId: z.number() }))
        .query(async () => []),
      getOrders: protectedProcedure
        .input(z.object({
          status: z.enum(["pending_approval", "approved", "processing", "shipped", "delivered", "cancelled"]).optional(),
        }))
        .query(async () => []),
    }),

    // Modules (legacy)
    modules: router({
      getAvailableModules: protectedProcedure.query(async () => [
        { code: "clients", name: "Clientes", category: "core", enabled: true, premium: false },
        { code: "pianos", name: "Pianos", category: "core", enabled: true, premium: false },
        { code: "services", name: "Servicios", category: "core", enabled: true, premium: false },
        { code: "calendar", name: "Calendario", category: "core", enabled: true, premium: false },
        { code: "invoicing", name: "Facturación", category: "free", enabled: true, premium: false },
        { code: "team", name: "Gestión de Equipos", category: "premium", enabled: false, premium: true },
        { code: "inventory", name: "Inventario", category: "premium", enabled: false, premium: true },
        { code: "accounting", name: "Contabilidad", category: "premium", enabled: false, premium: true },
        { code: "reports", name: "Reportes", category: "premium", enabled: false, premium: true },
        { code: "crm", name: "CRM Avanzado", category: "premium", enabled: false, premium: true },
        { code: "shop", name: "Tienda", category: "premium", enabled: false, premium: true },
      ]),
      getSubscription: protectedProcedure.query(async () => ({
        plan: "free",
        status: "active",
        expiresAt: null,
        features: ["clients", "pianos", "services", "calendar", "invoicing"],
      })),
      toggleModule: protectedProcedure
        .input(z.object({
          moduleCode: z.string(),
          enabled: z.boolean(),
        }))
        .mutation(async () => ({ success: true })),
    }),

    // Calendar Advanced
    calendarAdvanced: router({
      syncWithGoogle: protectedProcedure
        .input(z.object({ calendarId: z.string() }))
        .mutation(async () => ({ success: true, syncedEvents: 0 })),
      syncWithOutlook: protectedProcedure
        .input(z.object({ calendarId: z.string() }))
        .mutation(async () => ({ success: true, syncedEvents: 0 })),
      getAvailability: protectedProcedure
        .input(z.object({
          date: z.string(),
          technicianId: z.string().optional(),
        }))
        .query(async () => []),
    }),
  }),
});

export type AppRouter = typeof appRouter;
