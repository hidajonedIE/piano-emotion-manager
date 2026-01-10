/**
 * Pianos Router
 * Gestión de pianos con validación mejorada, paginación optimizada
 * y soporte para organizaciones con sharing configurable
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { pianos } from "../../drizzle/schema.js";
import { eq, and, or, ilike, isNotNull, asc, desc, count, sql, lte, gte } from "drizzle-orm";
import { 
  filterByPartner, 
  filterByPartner, filterByPartnerAnd
} from "../utils/multi-tenant.js";


// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const pianoCategorySchema = z.enum(["vertical", "grand"]);
const pianoConditionSchema = z.enum(["excellent", "good", "fair", "poor", "needs_repair", "unknown"]);

const environmentSchema = z.object({
  humidity: z.number().min(0).max(100).optional().nullable(),
  temperature: z.number().min(-20).max(50).optional().nullable(),
  hasHumidityControl: z.boolean().optional(),
  hasClimateControl: z.boolean().optional(),
  sunExposure: z.enum(["none", "indirect", "direct"]).optional(),
  nearHeatSource: z.boolean().optional(),
}).optional().nullable();

const accessoriesSchema = z.object({
  bench: z.boolean().optional(),
  benchType: z.string().optional(),
  lamp: z.boolean().optional(),
  cover: z.boolean().optional(),
  metronome: z.boolean().optional(),
  humidifier: z.boolean().optional(),
  other: z.array(z.string()).optional(),
}).optional().nullable();

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
// PROCEDURE CON CONTEXTO DE ORGANIZACIÓN
// ============================================================================

const orgProcedure = protectedProcedure;

// ============================================================================
// ROUTER
// ============================================================================

export const pianosRouter = router({
  list: orgProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(30),
        cursor: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.string().default("brand"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { limit, cursor, search, sortBy, sortOrder } = input;
        console.log('[pianos.list] ===== INICIO CONSULTA =====' );
        console.log('[pianos.list] Input:', { limit, cursor, search, sortBy, sortOrder });
        console.log('[pianos.list] ctx.user:', ctx.user);
        console.log('[pianos.list] ctx.partnerId:', ctx.partnerId, 'type:', typeof ctx.partnerId);
        console.log('[pianos.list] ctx.orgContext:', ctx.orgContext);
        console.log('[pianos.list] userId:', ctx.user?.id, 'partnerId:', ctx.partnerId);
        
        const database = await db.getDb();
        if (!database) {
          console.log('[pianos.list] Database not available');
          return { items: [], total: 0 };
        }

        // Usar el partnerId del contexto (ya está disponible desde la autenticación)
        const partnerId = ctx.partnerId;
        
        console.log('[pianos.list] After database connection, partnerId:', partnerId);

        // Si no hay partnerId y el usuario no es owner, devolver lista vacía
        if (partnerId === undefined) {
          console.log('[pianos.list] NO partnerId available, returning empty list');
          return { items: [], total: 0 };
        }
        console.log('[pianos.list] partnerId disponible:', partnerId);
        
        // Usar solo filterByPartner para filtrar por partnerId (null = sin filtro para owners)
        const whereClauses: any[] = [];
        if (partnerId !== null) {
          whereClauses.push(filterByPartner(pianos.partnerId, partnerId));
        }
        // If partnerId is null (owner), no filter is applied - they see all pianos
        
        if (search) {
          whereClauses.push(
            or(
              ilike(pianos.brand, `%${search}%`),
              ilike(pianos.model, `%${search}%`),
              ilike(pianos.serialNumber, `%${search}%`)
            )!
          );
        }

        const sortColumn = pianos[sortBy as keyof typeof pianos] || pianos.brand;
        const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

        const offset = cursor || 0;
        
        // DEBUG: Log the WHERE clause
        console.log('[pianos.list] WHERE clauses count:', whereClauses.length);
        console.log('[pianos.list] Offset:', offset, 'Limit:', limit);
        console.log('[pianos.list] Using partnerId:', partnerId, 'for filter');
        
        // Build query with proper where clause handling
        let query = database
          .select({
            id: pianos.id,
            odId: pianos.odId,
            clientId: pianos.clientId,
            brand: pianos.brand,
            model: pianos.model,
            serialNumber: pianos.serialNumber,
            year: pianos.year,
            category: pianos.category,
            pianoType: pianos.pianoType,
            condition: pianos.condition,
            location: pianos.location,
            notes: pianos.notes,
            photos: pianos.photos,
            createdAt: pianos.createdAt,
            updatedAt: pianos.updatedAt,
            partnerId: pianos.partnerId,
            tuningIntervalDays: pianos.tuningIntervalDays,
            regulationIntervalDays: pianos.regulationIntervalDays,
            alertsEnabled: pianos.alertsEnabled,
            customThresholdsEnabled: pianos.customThresholdsEnabled,
          })
          .from(pianos);
        if (whereClauses.length > 0) {
          query = query.where(and(...whereClauses));
        }
        const items = await query
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);

        console.log('[pianos.list] Query returned:', items.length, 'items');
        
        // Build count query with proper where clause handling
        let countQuery = database.select({ total: count() }).from(pianos);
        if (whereClauses.length > 0) {
          countQuery = countQuery.where(and(...whereClauses));
        }
        const [{ total }] = await countQuery;
        
        console.log('[pianos.list] Total count:', total);

        let nextCursor: number | undefined = undefined;
        if (items.length === limit) {
          nextCursor = offset + limit;
        }

        console.log('[pianos.list] ===== RETORNANDO RESULTADO =====' );
        console.log('[pianos.list] Result:', { itemsCount: items.length, total, nextCursor });
        return { items, nextCursor, total };
      } catch (error) {
        console.error('[pianos.list] ERROR:', error);
        throw error;
      }
    }),
  
  listAll: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    return database
      .select(pianos)
      .from(pianos)
      .where(filterByPartner(pianos.partnerId, ctx.partnerId));
  }),
  
  getById: orgProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return null;
      
      const [piano] = await database
        .select(pianos)
        .from(pianos)
        .where(
          and(
            eq(pianos.id, input.id),
            filterByPartner(pianos.partnerId, ctx.partnerId)
          )
        )
        .limit(1);
      
      return piano || null;
    }),

  create: orgProcedure
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // validateWritePermission(ctx);

      const result = await database.insert(pianos).values({
        ...input,
        odId: ctx.user!.openId || String(ctx.user!.id),
        partnerId: ctx.partnerId || 1,
      });

      return { id: result.insertId };
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.number(),
        brand: z.string().min(1).max(100).optional(),
        model: z.string().max(100).optional().nullable(),
        serialNumber: z.string().max(100).optional().nullable(),
        year: z.number().int().min(1700).max(new Date().getFullYear() + 1).optional().nullable(),
        category: pianoCategorySchema.optional(),
        pianoType: z.string().min(1).max(50).optional(),
        condition: pianoConditionSchema.optional(),
        location: z.string().max(500).optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
        photos: z.array(z.string().url()).max(20).optional(),
        color: z.string().max(50).optional().nullable(),
        finish: z.enum(["polished", "satin", "matte", "other"]).optional().nullable(),
        size: z.number().positive().optional().nullable(),
        keys: z.number().int().min(44).max(97).optional(),
        pedals: z.number().int().min(1).max(4).optional(),
        environment: environmentSchema,
        accessories: accessoriesSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // validateWritePermission(ctx);

      const { id, ...updateData } = input;

      await database
        .update(pianos)
        .set(updateData)
        .where(
          and(
            eq(pianos.id, id),
            filterByPartner(pianos.partnerId, ctx.partnerId)
          )
        );

      return { success: true };
    }),

  delete: orgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // validateWritePermission(ctx);

      await database
        .delete(pianos)
        .where(
          and(
            eq(pianos.id, input.id),
            filterByPartner(pianos.partnerId, ctx.partnerId)
          )
        );

      return { success: true };
    }),

  getBrands: orgProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const result = await database
      .selectDistinct({ brand: pianos.brand })
      .from(pianos)
      .where(
filterByPartner(pianos.partnerId, ctx.partnerId)
      )
      .orderBy(asc(pianos.brand));

    return result.map(r => r.brand).filter(Boolean);
  }),
});
