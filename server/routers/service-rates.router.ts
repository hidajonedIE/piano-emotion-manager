/**
 * Service Rates Router
 * Gestión de tarifas de servicios (catálogo de servicios con precios)
 * Soporte completo para organizaciones con sharing configurable
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { serviceRates } from "../../drizzle/schema.js";
import { eq, and, asc, desc, count } from "drizzle-orm";
import { 
  filterByPartnerAndOrganization,
  addOrganizationToInsert,
  validateWritePermission
} from "../utils/multi-tenant.js";
import { withOrganizationContext } from "../middleware/organization-context.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Categorías de servicio
 */
const serviceCategorySchema = z.enum([
  "tuning",
  "maintenance",
  "regulation",
  "repair",
  "restoration",
  "inspection",
  "other"
]);

/**
 * Esquema de paginación
 */
const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.number().optional(),
  sortBy: z.enum(["name", "category", "basePrice", "estimatedDuration", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  category: serviceCategorySchema.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Esquema base de tarifa de servicio
 */
const serviceRateBaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  description: z.string().max(2000).optional().nullable(),
  category: serviceCategorySchema,
  basePrice: z.number().min(0, "El precio no puede ser negativo"),
  taxRate: z.number().min(0).max(100).default(21), // IVA por defecto 21%
  estimatedDuration: z.number().int().min(0).optional().nullable(), // Duración estimada en minutos
  isActive: z.boolean().default(true),
});

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula el precio con impuestos
 */
function calculatePriceWithTax(basePrice: string | number, taxRate: number): number {
  const base = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
  return base * (1 + taxRate / 100);
}

/**
 * Calcula estadísticas de tarifas
 */
function calculateServiceRateStats(ratesList: any[]) {
  const total = ratesList.length;
  const active = ratesList.filter(r => r.isActive).length;
  const inactive = total - active;
  
  const byCategory: Record<string, number> = {};
  serviceCategorySchema.options.forEach(cat => {
    byCategory[cat] = ratesList.filter(r => r.category === cat).length;
  });
  
  const avgBasePrice = total > 0
    ? ratesList.reduce((sum, r) => {
        const price = typeof r.basePrice === 'string' ? parseFloat(r.basePrice) : r.basePrice;
        return sum + price;
      }, 0) / total
    : 0;
  
  const avgDuration = ratesList.filter(r => r.estimatedDuration).length > 0
    ? ratesList
        .filter(r => r.estimatedDuration)
        .reduce((sum, r) => sum + r.estimatedDuration, 0) / 
      ratesList.filter(r => r.estimatedDuration).length
    : 0;

  return {
    total,
    active,
    inactive,
    byCategory,
    avgBasePrice,
    avgDuration,
  };
}

// ============================================================================
// PROCEDURE CON CONTEXTO DE ORGANIZACIÓN
// ============================================================================

const orgProcedure = protectedProcedure.use(withOrganizationContext);

// ============================================================================
// ROUTER
// ============================================================================

export const serviceRatesRouter = router({
  /**
   * Lista de tarifas con paginación y filtros
   */
  list: orgProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const { 
        limit = 50, 
        cursor, 
        sortBy = "name", 
        sortOrder = "asc", 
        category,
        isActive
      } = input || {};
      
      const database = await db.getDb();
      if (!database) return { items: [], total: 0, stats: null };

      // Construir condiciones WHERE con filtrado por organización
      const whereClauses = [
        filterByPartnerAndOrganization(
          serviceRates,
          ctx.partnerId,
          ctx.orgContext,
          "serviceRates"
        )
      ];
      
      if (category !== undefined) {
        whereClauses.push(eq(serviceRates.category, category));
      }
      
      if (isActive !== undefined) {
        whereClauses.push(eq(serviceRates.isActive, isActive));
      }

      // Construir ORDER BY
      const sortColumn = serviceRates[sortBy as keyof typeof serviceRates] || serviceRates.name;
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Consulta principal con paginación
      const offset = cursor || 0;
      const items = await database
        .select()
        .from(serviceRates)
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Añadir precio con impuestos calculado
      const itemsWithTax = items.map(item => ({
        ...item,
        priceWithTax: calculatePriceWithTax(item.basePrice, item.taxRate),
      }));

      // Contar total
      const [{ total }] = await database
        .select({ total: count() })
        .from(serviceRates)
        .where(and(...whereClauses));

      // Calcular estadísticas
      const allRates = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates"
          )
        );

      const stats = calculateServiceRateStats(allRates);

      let nextCursor: number | undefined = undefined;
      if (items.length === limit) {
        nextCursor = offset + limit;
      }

      return { items: itemsWithTax, nextCursor, total, stats };
    }),
  
  /**
   * Lista completa sin paginación (para selects)
   */
  listAll: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    const items = await database
      .select()
      .from(serviceRates)
      .where(
        filterByPartnerAndOrganization(
          serviceRates,
          ctx.partnerId,
          ctx.orgContext,
          "serviceRates"
        )
      )
      .orderBy(asc(serviceRates.name));

    return items.map(item => ({
      ...item,
      priceWithTax: calculatePriceWithTax(item.basePrice, item.taxRate),
    }));
  }),
  
  /**
   * Lista solo tarifas activas
   */
  listActive: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    const items = await database
      .select()
      .from(serviceRates)
      .where(
        filterByPartnerAndOrganization(
          serviceRates,
          ctx.partnerId,
          ctx.orgContext,
          "serviceRates",
          eq(serviceRates.isActive, true)
        )
      )
      .orderBy(asc(serviceRates.name));

    return items.map(item => ({
      ...item,
      priceWithTax: calculatePriceWithTax(item.basePrice, item.taxRate),
    }));
  }),
  
  /**
   * Obtener tarifa por ID
   */
  get: orgProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [rate] = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.id, input.id)
          )
        );

      if (!rate) throw new Error("Tarifa de servicio no encontrada");
      
      return {
        ...rate,
        priceWithTax: calculatePriceWithTax(rate.basePrice, rate.taxRate),
      };
    }),
  
  /**
   * Obtener tarifas por categoría
   */
  getByCategory: orgProcedure
    .input(z.object({ category: serviceCategorySchema }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.category, input.category)
          )
        )
        .orderBy(asc(serviceRates.name));

      return items.map(item => ({
        ...item,
        priceWithTax: calculatePriceWithTax(item.basePrice, item.taxRate),
      }));
    }),
  
  /**
   * Crear nueva tarifa de servicio
   */
  create: orgProcedure
    .input(serviceRateBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Preparar datos con partnerId, odId y organizationId
      const rateData = addOrganizationToInsert(
        {
          name: input.name,
          description: input.description,
          category: input.category,
          basePrice: input.basePrice.toString(),
          taxRate: input.taxRate,
          estimatedDuration: input.estimatedDuration,
          isActive: input.isActive,
        },
        ctx.orgContext,
        "serviceRates"
      );
      
      const result = await database.insert(serviceRates).values(rateData);
      return result[0].insertId;
    }),
  
  /**
   * Actualizar tarifa de servicio
   */
  update: orgProcedure
    .input(z.object({
      id: z.number(),
    }).merge(serviceRateBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener la tarifa para verificar permisos
      const [existingRate] = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.id, input.id)
          )
        );

      if (!existingRate) {
        throw new Error("Tarifa de servicio no encontrada");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "serviceRates", existingRate.odId);

      const { id, ...data } = input;
      
      // Preparar datos para actualización
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.basePrice !== undefined) updateData.basePrice = data.basePrice.toString();
      if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
      if (data.estimatedDuration !== undefined) updateData.estimatedDuration = data.estimatedDuration;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await database
        .update(serviceRates)
        .set(updateData)
        .where(eq(serviceRates.id, id));
      
      return { success: true };
    }),
  
  /**
   * Activar/desactivar tarifa
   */
  toggleActive: orgProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener la tarifa para verificar permisos
      const [existingRate] = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.id, input.id)
          )
        );

      if (!existingRate) {
        throw new Error("Tarifa de servicio no encontrada");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "serviceRates", existingRate.odId);

      await database
        .update(serviceRates)
        .set({ isActive: input.isActive })
        .where(eq(serviceRates.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Eliminar tarifa de servicio
   */
  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener la tarifa para verificar permisos
      const [existingRate] = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.id, input.id)
          )
        );

      if (!existingRate) {
        throw new Error("Tarifa de servicio no encontrada");
      }

      // Validar permisos de escritura
      validateWritePermission(ctx.orgContext, "serviceRates", existingRate.odId);

      await database.delete(serviceRates).where(eq(serviceRates.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Obtener estadísticas de tarifas
   */
  getStats: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return null;

    const items = await database
      .select()
      .from(serviceRates)
      .where(
        filterByPartnerAndOrganization(
          serviceRates,
          ctx.partnerId,
          ctx.orgContext,
          "serviceRates"
        )
      );

    return calculateServiceRateStats(items);
  }),
  
  /**
   * Duplicar tarifa de servicio
   */
  duplicate: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Obtener la tarifa original
      const [original] = await database
        .select()
        .from(serviceRates)
        .where(
          filterByPartnerAndOrganization(
            serviceRates,
            ctx.partnerId,
            ctx.orgContext,
            "serviceRates",
            eq(serviceRates.id, input.id)
          )
        );

      if (!original) {
        throw new Error("Tarifa de servicio no encontrada");
      }

      // Preparar datos de la nueva tarifa
      const newRateData = addOrganizationToInsert(
        {
          name: `${original.name} (Copia)`,
          description: original.description,
          category: original.category,
          basePrice: original.basePrice,
          taxRate: original.taxRate,
          estimatedDuration: original.estimatedDuration,
          isActive: false, // Las copias se crean inactivas por defecto
        },
        ctx.orgContext,
        "serviceRates"
      );

      const result = await database.insert(serviceRates).values(newRateData);
      return result[0].insertId;
    }),
});
