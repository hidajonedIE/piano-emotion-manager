/**
 * Partners Router
 * Gestión de partners (fabricantes/distribuidores) en el sistema multi-tenant
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc.js";
import { getDb } from "../getDb().js";
import { partners, partnerSettings, partnerPricing, partnerUsers, users } from "../../drizzle/schema.js";
import { eq, and, or, ilike, asc, desc, count, sql } from "drizzle-orm";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Estado del partner
 */
const partnerStatusSchema = z.enum(["active", "suspended", "inactive"]);

/**
 * Schema base para partner
 */
const partnerBaseSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().email("Email no válido").max(320),
  customDomain: z.string().max(255).optional().nullable(),
  logo: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex válido requerido").default("#3b82f6"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex válido requerido").default("#10b981"),
  brandName: z.string().max(255).optional().nullable(),
  status: partnerStatusSchema.default("active"),
  allowMultipleSuppliers: z.boolean().default(false),
  supportEmail: z.string().email().max(320).optional().nullable(),
  supportPhone: z.string().max(50).optional().nullable(),
});

/**
 * Schema para configuración de partner
 */
const partnerSettingsSchema = z.object({
  ecommerceEnabled: z.boolean().default(false),
  ecommerceApiUrl: z.string().url().optional().nullable(),
  ecommerceApiKey: z.string().optional().nullable(),
  autoOrderEnabled: z.boolean().default(false),
  autoOrderThreshold: z.number().int().min(0).default(5),
  notificationEmail: z.string().email().max(320).optional().nullable(),
  notificationWebhook: z.string().url().optional().nullable(),
  maxUsers: z.number().int().positive().optional().nullable(),
  maxOrganizations: z.number().int().positive().optional().nullable(),
});

/**
 * Schema para precios personalizados
 */
const partnerPricingSchema = z.object({
  planCode: z.enum(["free", "professional", "premium"]),
  monthlyPrice: z.string().optional().nullable(),
  yearlyPrice: z.string().optional().nullable(),
  minMonthlyRevenue: z.string().optional().nullable(),
  discountPercentage: z.number().int().min(0).max(100).default(0),
  customFeatures: z.string().optional().nullable(), // JSON string
});

/**
 * Schema para usuario de partner
 */
const partnerUserSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["owner", "admin", "manager"]).default("manager"),
  canManageBranding: z.boolean().default(false),
  canManagePricing: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

// ============================================================================
// ROUTER
// ============================================================================

export const partnersRouter = router({
  /**
   * Listar todos los partners (solo admin)
   */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        cursor: z.number().optional(),
        search: z.string().optional(),
        status: partnerStatusSchema.optional(),
        sortBy: z.enum(["name", "slug", "createdAt", "status"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
      }).optional()
    )
    .query(async ({ input }) => {
      const { limit = 30, cursor, search, status, sortBy = "name", sortOrder = "asc" } = input || {};
      const database = await getDb();
      if (!database) return { items: [], total: 0 };

      const whereClauses = [];
      
      if (search) {
        whereClauses.push(
          or(
            ilike(partners.name, `%${search}%`),
            ilike(partners.slug, `%${search}%`),
            ilike(partners.email, `%${search}%`)
          )!
        );
      }
      
      if (status) {
        whereClauses.push(eq(partners.status, status));
      }

      const sortColumn = partners[sortBy as keyof typeof partners] || partners.name;
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const offset = cursor || 0;
      const whereClause = whereClauses.length > 0 ? and(...whereClauses) : undefined;

      const items = await database
        .select()
        .from(partners)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      const [{ total }] = await database
        .select({ total: count() })
        .from(partners)
        .where(whereClause);

      let nextCursor: number | undefined = undefined;
      if (items.length === limit) {
        nextCursor = offset + limit;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Obtener partner por ID (solo admin)
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const [partner] = await database
        .select()
        .from(partners)
        .where(eq(partners.id, input.id));

      if (!partner) throw new Error("Partner no encontrado");
      return partner;
    }),

  /**
   * Obtener partner actual del usuario autenticado
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.partnerId) throw new Error("No partner ID in context");
    
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const [partner] = await database
      .select()
      .from(partners)
      .where(eq(partners.id, ctx.partnerId));

    if (!partner) throw new Error("Partner no encontrado");
    return partner;
  }),

  /**
   * Crear nuevo partner (solo admin)
   */
  create: adminProcedure
    .input(partnerBaseSchema)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Verificar que el slug no exista
      const [existing] = await database
        .select()
        .from(partners)
        .where(eq(partners.slug, input.slug));

      if (existing) {
        throw new Error("Ya existe un partner con ese slug");
      }

      const result = await database.insert(partners).values(input);
      const partnerId = result[0].insertId;

      // Crear settings por defecto
      await database.insert(partnerSettings).values({
        partnerId,
        ecommerceEnabled: false,
        autoOrderEnabled: false,
        autoOrderThreshold: 5,
      });

      return { id: partnerId, ...input };
    }),

  /**
   * Actualizar partner (solo admin)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
      }).merge(partnerBaseSchema.partial())
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Si se está actualizando el slug, verificar que no exista
      if (updateData.slug) {
        const [existing] = await database
          .select()
          .from(partners)
          .where(and(eq(partners.slug, updateData.slug), sql`${partners.id} != ${id}`));

        if (existing) {
          throw new Error("Ya existe un partner con ese slug");
        }
      }

      await database
        .update(partners)
        .set(updateData)
        .where(eq(partners.id, id));

      return { id, ...updateData };
    }),

  /**
   * Cambiar estado del partner (solo admin)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: partnerStatusSchema,
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(partners)
        .set({ status: input.status })
        .where(eq(partners.id, input.id));

      return { success: true };
    }),

  /**
   * Obtener configuración del partner
   */
  getSettings: protectedProcedure
    .input(z.object({ partnerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const partnerId = input.partnerId || ctx.partnerId;
      if (!partnerId) throw new Error("No partner ID available");

      const [settings] = await database
        .select()
        .from(partnerSettings)
        .where(eq(partnerSettings.partnerId, partnerId));

      return settings || null;
    }),

  /**
   * Actualizar configuración del partner (solo admin)
   */
  updateSettings: adminProcedure
    .input(
      z.object({
        partnerId: z.number(),
      }).merge(partnerSettingsSchema.partial())
    )
    .mutation(async ({ input }) => {
      const { partnerId, ...data } = input;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Verificar si ya existe configuración
      const [existing] = await database
        .select()
        .from(partnerSettings)
        .where(eq(partnerSettings.partnerId, partnerId));

      if (existing) {
        // Actualizar
        await database
          .update(partnerSettings)
          .set(data)
          .where(eq(partnerSettings.partnerId, partnerId));
      } else {
        // Crear
        await database.insert(partnerSettings).values({
          partnerId,
          ...data,
        });
      }

      return { success: true };
    }),

  /**
   * Obtener precios del partner
   */
  getPricing: protectedProcedure
    .input(z.object({ partnerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const partnerId = input.partnerId || ctx.partnerId;
      if (!partnerId) throw new Error("No partner ID available");

      const pricing = await database
        .select()
        .from(partnerPricing)
        .where(eq(partnerPricing.partnerId, partnerId));

      return pricing;
    }),

  /**
   * Crear o actualizar precio para un plan (solo admin)
   */
  upsertPricing: adminProcedure
    .input(
      z.object({
        partnerId: z.number(),
      }).merge(partnerPricingSchema)
    )
    .mutation(async ({ input }) => {
      const { partnerId, planCode, ...data } = input;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Verificar si ya existe
      const [existing] = await database
        .select()
        .from(partnerPricing)
        .where(and(
          eq(partnerPricing.partnerId, partnerId),
          eq(partnerPricing.planCode, planCode)
        ));

      if (existing) {
        // Actualizar
        await database
          .update(partnerPricing)
          .set(data)
          .where(and(
            eq(partnerPricing.partnerId, partnerId),
            eq(partnerPricing.planCode, planCode)
          ));
      } else {
        // Crear
        await database.insert(partnerPricing).values({
          partnerId,
          planCode,
          ...data,
        });
      }

      return { success: true };
    }),

  /**
   * Listar usuarios de un partner
   */
  listUsers: protectedProcedure
    .input(z.object({ partnerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const partnerId = input.partnerId || ctx.partnerId;
      if (!partnerId) throw new Error("No partner ID available");

      const partnerUsersData = await database
        .select({
          id: partnerUsers.id,
          userId: partnerUsers.userId,
          role: partnerUsers.role,
          canManageBranding: partnerUsers.canManageBranding,
          canManagePricing: partnerUsers.canManagePricing,
          canManageUsers: partnerUsers.canManageUsers,
          canViewAnalytics: partnerUsers.canViewAnalytics,
          createdAt: partnerUsers.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(partnerUsers)
        .leftJoin(users, eq(partnerUsers.userId, users.id))
        .where(eq(partnerUsers.partnerId, partnerId));

      return partnerUsersData;
    }),

  /**
   * Agregar usuario a un partner (solo admin)
   */
  addUser: adminProcedure
    .input(
      z.object({
        partnerId: z.number(),
      }).merge(partnerUserSchema)
    )
    .mutation(async ({ input }) => {
      const { partnerId, userId, ...data } = input;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // Verificar que el usuario no esté ya asignado
      const [existing] = await database
        .select()
        .from(partnerUsers)
        .where(and(
          eq(partnerUsers.partnerId, partnerId),
          eq(partnerUsers.userId, userId)
        ));

      if (existing) {
        throw new Error("El usuario ya está asignado a este partner");
      }

      await database.insert(partnerUsers).values({
        partnerId,
        userId,
        ...data,
      });

      return { success: true };
    }),

  /**
   * Actualizar permisos de usuario en partner (solo admin)
   */
  updateUserPermissions: adminProcedure
    .input(
      z.object({
        id: z.number(), // ID del registro en partner_users
      }).merge(partnerUserSchema.partial().omit({ userId: true }))
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .update(partnerUsers)
        .set(data)
        .where(eq(partnerUsers.id, id));

      return { success: true };
    }),

  /**
   * Remover usuario de un partner (solo admin)
   */
  removeUser: adminProcedure
    .input(z.object({ id: z.number() })) // ID del registro en partner_users
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      await database
        .delete(partnerUsers)
        .where(eq(partnerUsers.id, input.id));

      return { success: true };
    }),

  /**
   * Obtener estadísticas del partner
   */
  getStats: protectedProcedure
    .input(z.object({ partnerId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const partnerId = input.partnerId || ctx.partnerId;
      if (!partnerId) throw new Error("No partner ID available");

      // Contar usuarios
      const [usersCount] = await database
        .select({ count: count() })
        .from(users)
        .where(eq(users.partnerId, partnerId));

      // Contar usuarios administrativos
      const [adminUsersCount] = await database
        .select({ count: count() })
        .from(partnerUsers)
        .where(eq(partnerUsers.partnerId, partnerId));

      return {
        totalUsers: usersCount.count,
        adminUsers: adminUsersCount.count,
        partnerId,
      };
    }),
});
