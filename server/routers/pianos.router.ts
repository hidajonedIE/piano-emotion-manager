/**
 * Pianos Router
 * Gestión de pianos con validación mejorada, paginación optimizada y caché
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { pianos } from "../../drizzle/schema.js";
import { eq, and, or, ilike, isNotNull, asc, desc, count, sql, lte, gte } from "drizzle-orm";
import * as cache from "../cache.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Categorías de piano
 */
const pianoCategorySchema = z.enum(["vertical", "grand"]);

/**
 * Tipos de piano vertical
 */
const verticalTypeSchema = z.enum(["spinet", "console", "studio", "upright_professional"]);

/**
 * Tipos de piano de cola
 */
const grandTypeSchema = z.enum(["baby_grand", "medium_grand", "parlor_grand", "concert_grand"]);

/**
 * Condición del piano
 */
const pianoConditionSchema = z.enum(["excellent", "good", "fair", "poor", "needs_repair", "unknown"]);

/**
 * Esquema de condiciones ambientales
 */
const environmentSchema = z.object({
  humidity: z.number().min(0).max(100).optional().nullable(),
  temperature: z.number().min(-20).max(50).optional().nullable(),
  hasHumidityControl: z.boolean().optional(),
  hasClimateControl: z.boolean().optional(),
  sunExposure: z.enum(["none", "indirect", "direct"]).optional(),
  nearHeatSource: z.boolean().optional(),
}).optional().nullable();

/**
 * Esquema de accesorios
 */
const accessoriesSchema = z.object({
  bench: z.boolean().optional(),
  benchType: z.string().optional(),
  lamp: z.boolean().optional(),
  cover: z.boolean().optional(),
  metronome: z.boolean().optional(),
  humidifier: z.boolean().optional(),
  other: z.array(z.string()).optional(),
}).optional().nullable();

/**
 * Esquema de paginación para pianos
 */
const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.number().optional(),
  sortBy: z.enum(["brand", "model", "year", "createdAt", "updatedAt"]).default("brand"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  category: pianoCategorySchema.optional(),
  brand: z.string().optional(),
  condition: pianoConditionSchema.optional(),
  clientId: z.number().optional(),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
});

/**
 * Esquema base de piano
 */
const pianoBaseSchema = z.object({
  clientId: z.number().int().positive(),
  brand: z.string().min(1, "La marca es obligatoria").max(100),
  model: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1700).max(new Date().getFullYear() + 1).optional().nullable(),
  category: pianoCategorySchema,
  pianoType: z.string().min(1).max(50),
  condition: pianoConditionSchema.default("unknown"),
  location: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  photos: z.array(z.string().url()).max(20).optional(),
  color: z.string().max(50).optional().nullable(),
  finish: z.enum(["polished", "satin", "matte", "other"]).optional().nullable(),
  size: z.number().positive().optional().nullable(),
  keys: z.number().int().min(44).max(97).default(88).optional(),
  pedals: z.number().int().min(1).max(4).default(3).optional(),
  environment: environmentSchema,
  accessories: accessoriesSchema,
});

// ============================================================================
// MARCAS DE PIANO CONOCIDAS
// ============================================================================

const KNOWN_BRANDS = [
  "Steinway & Sons", "Bösendorfer", "Fazioli", "Bechstein", "Blüthner",
  "Yamaha", "Kawai", "Schimmel", "Grotrian", "Steingraeber",
  "Mason & Hamlin", "Baldwin", "Petrof", "Estonia", "Shigeru Kawai",
  "Boston", "Essex", "Samick", "Young Chang", "Seiler",
  "Sauter", "Förster", "Feurich", "Haessler", "Rönisch",
  "Pleyel", "Érard", "Gaveau", "Chickering", "Knabe",
  "Weber", "Wurlitzer", "Kemble", "Knight", "Welmar",
  "Broadwood", "Brinsmead", "Challen", "Danemann", "Zender",
  "Pearl River", "Hailun", "Ritmuller", "Perzina", "Wendl & Lung",
];

// ============================================================================
// ROUTER
// ============================================================================

export const pianosRouter = router({
  /**
   * Lista de pianos con paginación optimizada en base de datos
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const { limit = 30, cursor, sortBy = "brand", sortOrder = "asc", search, category, brand, condition, clientId, yearFrom, yearTo } = input || {};
      
      const database = await db.getDb();
      if (!database) {
        return {
          items: [],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
          stats: {
            total: 0,
            byCategory: { vertical: 0, grand: 0 },
            byCondition: { excellent: 0, good: 0, fair: 0, poor: 0, needs_repair: 0 },
          },
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [eq(pianos.odId, ctx.user.openId)];
      
      if (search) {
        whereClauses.push(
          or(
            ilike(pianos.brand, `%${search}%`),
            ilike(pianos.model, `%${search}%`),
            ilike(pianos.serialNumber, `%${search}%`)
          )!
        );
      }
      
      if (category) {
        whereClauses.push(eq(pianos.category, category));
      }
      
      if (brand) {
        whereClauses.push(ilike(pianos.brand, brand));
      }
      
      if (condition) {
        whereClauses.push(eq(pianos.condition, condition));
      }
      
      if (clientId) {
        whereClauses.push(eq(pianos.clientId, clientId));
      }
      
      if (yearFrom) {
        whereClauses.push(gte(pianos.year, yearFrom));
      }
      
      if (yearTo) {
        whereClauses.push(lte(pianos.year, yearTo));
      }

      // Construir ORDER BY
      const sortColumn = pianos[sortBy as keyof typeof pianos];
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Consulta de datos con paginación
      const offset = cursor || 0;
      const items = await database
        .select()
        .from(pianos)
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(limit + 1)
        .offset(offset);

      // Consulta de conteo total
      const [{ total }] = await database
        .select({ total: count() })
        .from(pianos)
        .where(and(...whereClauses));

      // Estadísticas (optimizadas con consultas agregadas)
      const [statsVertical] = await database
        .select({ count: count() })
        .from(pianos)
        .where(and(eq(pianos.odId, ctx.user.openId), eq(pianos.category, "vertical")));

      const [statsGrand] = await database
        .select({ count: count() })
        .from(pianos)
        .where(and(eq(pianos.odId, ctx.user.openId), eq(pianos.category, "grand")));

      const conditions = ["excellent", "good", "fair", "poor", "needs_repair"] as const;
      const byCondition: Record<string, number> = {};
      
      for (const condition of conditions) {
        const [result] = await database
          .select({ count: count() })
          .from(pianos)
          .where(and(eq(pianos.odId, ctx.user.openId), eq(pianos.condition, condition)));
        byCondition[condition] = result.count;
      }

      

      let nextCursor: number | undefined = undefined;
      if (items.length > limit) {
        items.pop();
        nextCursor = offset + limit;
      }

      return {
        items,
        nextCursor,
        total,
        stats: {
          total,
          byCategory: {
            vertical: statsVertical.count,
            grand: statsGrand.count,
          },
          byCondition,
        },
      };
    }),
  
  /**
   * Lista simple sin paginación (para selectores)
   */
  listAll: protectedProcedure.query(({ ctx }) => db.getPianos(ctx.user.openId)),
  
  /**
   * Obtener piano por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getPiano(ctx.user.openId, input.id)),
  
  /**
   * Obtener pianos de un cliente
   */
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ ctx, input }) => db.getPianosByClient(ctx.user.openId, input.clientId)),
  
  /**
   * Crear nuevo piano
   */
  create: protectedProcedure
    .input(pianoBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Invalidar caché de marcas
      await cache.deleteCachedValue(`brands:${ctx.user.openId}`);
      
      return db.createPiano({
        ...input,
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar piano existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(pianoBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Invalidar caché de marcas si se actualiza la marca
      if (data.brand) {
        await cache.deleteCachedValue(`brands:${ctx.user.openId}`);
      }
      
      return db.updatePiano(ctx.user.openId, id, data);
    }),
  
  /**
   * Eliminar piano
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Invalidar caché de marcas
      await cache.deleteCachedValue(`brands:${ctx.user.openId}`);
      
      return db.deletePiano(ctx.user.openId, input.id);
    }),
  
  /**
   * Obtener marcas únicas (con caché)
   */
  getBrands: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `brands:${ctx.user.openId}`;
    
    // Intentar obtener del caché
    const cached = await cache.getCachedValue<string[]>(cacheKey);
    if (cached) return cached;

    const database = await db.getDb();
    if (!database) return KNOWN_BRANDS.sort();

    // Consulta optimizada con SELECT DISTINCT
    const brandsQuery = await database
      .selectDistinct({ brand: pianos.brand })
      .from(pianos)
      .where(eq(pianos.odId, ctx.user.openId));
    
    const userBrands = brandsQuery.map(b => b.brand);
    
    // Combinar con marcas conocidas
    const allBrands = [...new Set([...userBrands, ...KNOWN_BRANDS])].sort();

    // Cachear por 1 hora
    await cache.setCachedValue(cacheKey, allBrands, 3600);
    
    return allBrands;
  }),
  
  /**
   * Obtener pianos que necesitan servicio (optimizado)
   */
  getNeedingService: protectedProcedure
    .input(z.object({
      daysAhead: z.number().int().min(0).max(365).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const daysAhead = input?.daysAhead || 30;
      
      // Usar la función existente de db.js
      // Esta consulta debería optimizarse en db.js para usar WHERE en lugar de filtrar en memoria
      const pianos = await db.getPianos(ctx.user.openId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
      
      return pianos
        .filter(p => {
          if (!p.nextServiceDate) return false;
          return new Date(p.nextServiceDate) <= cutoffDate;
        })
        .sort((a, b) => {
          const aDate = a.nextServiceDate ? new Date(a.nextServiceDate) : new Date(0);
          const bDate = b.nextServiceDate ? new Date(b.nextServiceDate) : new Date(0);
          return aDate.getTime() - bDate.getTime();
        });
    }),
  
  /**
   * Obtener historial de servicios de un piano
   */
  getServiceHistory: protectedProcedure
    .input(z.object({ pianoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const services = await db.getServicesByPiano(ctx.user.openId, input.pianoId);
      return services.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }),
  
  /**
   * Actualizar condiciones ambientales
   */
  updateEnvironment: protectedProcedure
    .input(z.object({
      id: z.number(),
      environment: environmentSchema,
    }))
    .mutation(({ ctx, input }) => {
      return db.updatePiano(ctx.user.openId, input.id, { environment: input.environment });
    }),
  
  /**
   * Registrar lectura de condiciones ambientales
   */
  logEnvironmentReading: protectedProcedure
    .input(z.object({
      pianoId: z.number(),
      humidity: z.number().min(0).max(100),
      temperature: z.number().min(-20).max(50),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const piano = await db.getPiano(ctx.user.openId, input.pianoId);
      if (!piano) {
        throw new Error("Piano no encontrado");
      }
      
      const environment = {
        ...(piano.environment || {}),
        humidity: input.humidity,
        temperature: input.temperature,
        lastReading: new Date().toISOString(),
      };
      
      return db.updatePiano(ctx.user.openId, input.pianoId, { environment });
    }),
});
