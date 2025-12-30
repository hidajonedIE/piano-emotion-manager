/**
 * Clients Router
 * Gestión de clientes con validación mejorada y paginación optimizada
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { clients } from "../../drizzle/schema.js";
import { eq, and, or, ilike, isNotNull, asc, desc, count, sql } from "drizzle-orm";
import * as cache from "../cache.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Validación de teléfono internacional
 * Acepta formatos: +34612345678, 612345678, +1-555-123-4567, etc.
 */
const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{6,14}$/;

const phoneSchema = z.string()
  .regex(phoneRegex, "Formato de teléfono no válido")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform(val => val === "" ? null : val);

/**
 * Esquema de dirección estructurada
 */
const addressSchema = z.object({
  street: z.string().max(255).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  floor: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
}).optional().nullable();

/**
 * Validación de NIF/CIF español
 */
const taxIdRegex = /^([A-Z]\d{8}|\d{8}[A-Z]|[A-Z]\d{7}[A-Z])$/i;

const taxIdSchema = z.string()
  .regex(taxIdRegex, "NIF/CIF no válido")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform(val => val === "" ? null : val?.toUpperCase());

/**
 * Tipos de cliente
 */
const clientTypeSchema = z.enum([
  "particular",
  "individual", // Alias de particular
  "student", 
  "professional",
  "music_school",
  "conservatory",
  "concert_hall"
]).default("particular")
  .transform(val => val === "individual" ? "particular" : val);

/**
 * Esquema base de cliente
 */
const clientBaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().email("Email no válido").optional().nullable(),
  phone: phoneSchema,
  address: z.string().optional().nullable(), // Dirección como texto (legacy)
  addressStructured: addressSchema, // Dirección estructurada
  clientType: clientTypeSchema.optional(),
  notes: z.string().max(5000).optional().nullable(),
  taxId: taxIdSchema, // NIF/CIF
  region: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  routeGroup: z.string().max(50).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

/**
 * Esquema de paginación
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "updatedAt", "city"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  clientType: clientTypeSchema.optional(),
  region: z.string().optional(),
  routeGroup: z.string().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const clientsRouter = router({
  /**
   * Lista de clientes con paginación optimizada en base de datos
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "name", sortOrder: "asc" };
      
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
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [eq(clients.odId, ctx.user.openId)];
      
      if (pagination.search) {
        whereClauses.push(
          or(
            ilike(clients.name, `%${pagination.search}%`),
            ilike(clients.email, `%${pagination.search}%`),
            ilike(clients.phone, `%${pagination.search}%`),
            ilike(clients.city, `%${pagination.search}%`)
          )!
        );
      }
      
      if (pagination.clientType) {
        whereClauses.push(eq(clients.clientType, pagination.clientType));
      }
      
      if (pagination.region) {
        whereClauses.push(eq(clients.region, pagination.region));
      }
      
      if (pagination.routeGroup) {
        whereClauses.push(eq(clients.routeGroup, pagination.routeGroup));
      }

      // Construir ORDER BY
      const sortColumn = clients[pagination.sortBy as keyof typeof clients];
      const orderByClause = pagination.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Consulta de datos con paginación
      const offset = (pagination.page - 1) * pagination.limit;
      const items = await database
        .select()
        .from(clients)
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(pagination.limit)
        .offset(offset);

      // Consulta de conteo total
      const [{ total }] = await database
        .select({ total: count() })
        .from(clients)
        .where(and(...whereClauses));

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasMore: pagination.page < totalPages,
        },
      };
    }),
  
  /**
   * Lista simple sin paginación (para selectores)
   */
  listAll: protectedProcedure.query(({ ctx }) => db.getClients(ctx.user.openId)),
  
  /**
   * Obtener cliente por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getClient(ctx.user.openId, input.id)),
  
  /**
   * Crear nuevo cliente
   */
  create: protectedProcedure
    .input(clientBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Convertir dirección estructurada a texto si no hay dirección de texto
      let address = input.address;
      if (!address && input.addressStructured) {
        const addr = input.addressStructured;
        const parts = [];
        if (addr.street) {
          let line = addr.street;
          if (addr.number) line += ` ${addr.number}`;
          if (addr.floor) line += `, ${addr.floor}`;
          parts.push(line);
        }
        if (addr.postalCode || addr.city) {
          parts.push([addr.postalCode, addr.city].filter(Boolean).join(" "));
        }
        if (addr.province) parts.push(addr.province);
        if (addr.country) parts.push(addr.country);
        address = parts.join(", ");
      }
      
      // Invalidar caché de regiones y grupos de ruta
      await cache.deleteCachedValue(`regions:${ctx.user.openId}`);
      await cache.deleteCachedValue(`routeGroups:${ctx.user.openId}`);
      
      return db.createClient({
        ...input,
        address,
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar cliente existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(clientBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, addressStructured, ...data } = input;
      
      // Convertir dirección estructurada si se proporciona
      let updateData = { ...data };
      if (addressStructured && !data.address) {
        const addr = addressStructured;
        const parts = [];
        if (addr.street) {
          let line = addr.street;
          if (addr.number) line += ` ${addr.number}`;
          if (addr.floor) line += `, ${addr.floor}`;
          parts.push(line);
        }
        if (addr.postalCode || addr.city) {
          parts.push([addr.postalCode, addr.city].filter(Boolean).join(" "));
        }
        if (addr.province) parts.push(addr.province);
        if (addr.country) parts.push(addr.country);
        updateData.address = parts.join(", ");
      }
      
      // Invalidar caché de regiones y grupos de ruta
      await cache.deleteCachedValue(`regions:${ctx.user.openId}`);
      await cache.deleteCachedValue(`routeGroups:${ctx.user.openId}`);
      
      return db.updateClient(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar cliente
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Invalidar caché de regiones y grupos de ruta
      await cache.deleteCachedValue(`regions:${ctx.user.openId}`);
      await cache.deleteCachedValue(`routeGroups:${ctx.user.openId}`);
      
      return db.deleteClient(ctx.user.openId, input.id);
    }),
  
  /**
   * Obtener regiones únicas (con caché)
   */
  getRegions: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `regions:${ctx.user.openId}`;
    
    // Intentar obtener del caché
    const cached = await cache.getCachedValue<string[]>(cacheKey);
    if (cached) return cached;

    const database = await db.getDb();
    if (!database) return [];

    // Consulta optimizada con SELECT DISTINCT
    const regionsQuery = await database
      .selectDistinct({ region: clients.region })
      .from(clients)
      .where(and(eq(clients.odId, ctx.user.openId), isNotNull(clients.region)));
    
    const result = regionsQuery.map(r => r.region!).sort();

    // Cachear por 1 hora
    await cache.setCachedValue(cacheKey, result, 3600);
    
    return result;
  }),
  
  /**
   * Obtener grupos de ruta únicos (con caché)
   */
  getRouteGroups: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `routeGroups:${ctx.user.openId}`;
    
    // Intentar obtener del caché
    const cached = await cache.getCachedValue<string[]>(cacheKey);
    if (cached) return cached;

    const database = await db.getDb();
    if (!database) return [];

    // Consulta optimizada con SELECT DISTINCT
    const groupsQuery = await database
      .selectDistinct({ routeGroup: clients.routeGroup })
      .from(clients)
      .where(and(eq(clients.odId, ctx.user.openId), isNotNull(clients.routeGroup)));
    
    const result = groupsQuery.map(g => g.routeGroup!).sort();

    // Cachear por 1 hora
    await cache.setCachedValue(cacheKey, result, 3600);
    
    return result;
  }),
  
  /**
   * Buscar clientes duplicados por nombre o email
   */
  findDuplicates: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      excludeId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const whereClauses = [eq(clients.odId, ctx.user.openId)];
      
      if (input.excludeId) {
        whereClauses.push(sql`${clients.id} != ${input.excludeId}`);
      }

      // Búsqueda exacta por email (más eficiente que Levenshtein)
      if (input.email) {
        whereClauses.push(ilike(clients.email, input.email));
      }

      // Búsqueda por similitud de nombre (usando LIKE en lugar de Levenshtein)
      if (input.name) {
        whereClauses.push(ilike(clients.name, `%${input.name}%`));
      }

      const duplicates = await database
        .select()
        .from(clients)
        .where(and(...whereClauses))
        .limit(10); // Limitar resultados para evitar sobrecarga

      return duplicates;
    }),
});
