/**
 * Clients Router
 * Gestión de clientes con validación mejorada y paginación optimizada
 * SISTEMA MULTI-TENANT DESACTIVADO - Solo filtro por partnerId
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { clients } from "../../drizzle/schema.js";
import { eq, and, or, ilike, isNotNull, asc, desc, count } from "drizzle-orm";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?[\d\s.-]{6,14}$/;

const phoneSchema = z.string()
  .regex(phoneRegex, "Formato de teléfono no válido")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform(val => val === "" ? null : val);

const addressSchema = z.object({
  street: z.string().max(255).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  floor: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
}).optional().nullable();

const taxIdRegex = /^([A-Z]\d{8}|\d{8}[A-Z]|[A-Z]\d{7}[A-Z])$/i;

const taxIdSchema = z.string()
  .regex(taxIdRegex, "NIF/CIF no válido")
  .or(z.literal(""))
  .optional()
  .nullable()
  .transform(val => val === "" ? null : val?.toUpperCase());

const clientTypeSchema = z.enum([
  "particular",
  "individual",
  "student", 
  "professional",
  "music_school",
  "conservatory",
  "concert_hall"
]).default("particular")
  .transform(val => val === "individual" ? "particular" : val);

const clientBaseSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255),
  email: z.string().email("Email no válido").optional().nullable(),
  phone: phoneSchema,
  address: z.string().optional().nullable(),
  addressStructured: addressSchema,
  clientType: clientTypeSchema.optional(),
  notes: z.string().max(5000).optional().nullable(),
  taxId: taxIdSchema,
  region: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  routeGroup: z.string().max(50).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

// ============================================================================
// ROUTER
// ============================================================================

// Force redeploy to refresh DB schema cache - organization_id
export const clientsRouter = router({
  list: protectedProcedure
     .input(
        z.object({
          limit: z.number().min(1).max(100).default(30),
          cursor: z.number().optional(),
          search: z.string().optional().nullable(),
          region: z.string().optional().nullable(),
          routeGroup: z.string().optional().nullable(),
          sortBy: z.string().default("name"),
          direction: z.enum(["forward", "backward"]).default("forward"),
        })
      )
     .query(async ({ ctx, input }) => {
      console.log('[clients.list] Input received:', JSON.stringify(input));
      const { limit, cursor, search, region, routeGroup, sortBy, direction } = input;
      const sortOrder = direction === "forward" ? "asc" : "desc";
      console.log('[clients.list] Converted direction to sortOrder:', sortOrder);
      const database = await db.getDb();
      if (!database) {
        console.error('[clients.list] Database not available');
        return { items: [], total: 0 };
      }

      console.log('[clients.list] ===== TEST DESPLIEGUE d947060 ===== Filtering by partnerId:', ctx.partnerId);
      // Solo filtrar por partnerId
      const whereClauses = [eq(clients.partnerId, ctx.partnerId)];
      console.log('[clients.list] STEP 2: whereClauses created');
      
      if (search) {
        console.log('[clients.list] STEP 3: Adding search filter:', search);
        whereClauses.push(
          or(
            ilike(clients.name, `%${search}%`),
            ilike(clients.email, `%${search}%`),
            ilike(clients.phone, `%${search}%`),
            ilike(clients.city, `%${search}%`)
          )!
        );
      }
      
      if (region) {
        console.log('[clients.list] STEP 4: Adding region filter:', region);
        whereClauses.push(eq(clients.region, region));
      }
      if (routeGroup) {
        console.log('[clients.list] STEP 5: Adding routeGroup filter:', routeGroup);
        whereClauses.push(eq(clients.routeGroup, routeGroup));
      }

      console.log('[clients.list] STEP 6: Creating sortColumn map');
      // Mapeo explícito de sortBy a columnas de Drizzle
      const sortColumnMap: Record<string, any> = {
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        city: clients.city,
        region: clients.region,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      };
      const sortColumn = sortColumnMap[sortBy] || clients.name;
      console.log('[clients.list] STEP 7: sortBy:', sortBy, 'sortOrder:', sortOrder);
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const offset = cursor || 0;
      console.log('[clients.list] STEP 8: About to execute query with limit:', limit, 'offset:', offset);
      
      try {
        // Log del SQL exacto que genera Drizzle
        const queryBuilder = database
          .select({
            id: clients.id,
            odId: clients.odId,
            partnerId: clients.partnerId,
            // organization_id: clients.organization_id,  // Removed: causes undefined error
            name: clients.name,
            email: clients.email,
            phone: clients.phone,
            address: clients.address,
            clientType: clients.clientType,
            notes: clients.notes,
            region: clients.region,
            city: clients.city,
            postalCode: clients.postalCode,
            latitude: clients.latitude,
            longitude: clients.longitude,
            routeGroup: clients.routeGroup,
            createdAt: clients.createdAt,
            updatedAt: clients.updatedAt,
          })
          .from(clients)
          .where(and(...whereClauses))
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);
        
        const sqlQuery = queryBuilder.toSQL();
        console.log('[clients.list] STEP 8.5: SQL Query:', JSON.stringify(sqlQuery));
        
        const items = await queryBuilder;
        console.log('[clients.list] STEP 9: Query executed successfully, items.length:', items.length);
        console.log('[clients.list] STEP 9.1: items type:', typeof items, 'isArray:', Array.isArray(items));
        if (items.length > 0) {
          console.log('[clients.list] STEP 9.2: First 3 items:', JSON.stringify(items.slice(0, 3)));
        } else {
          console.log('[clients.list] STEP 9.2: No items returned from query');
        }

        console.log('[clients.list] STEP 10: About to count total');
        const [{ total }] = await database
          .select({ total: count() })
          .from(clients)
          .where(and(...whereClauses));
        console.log('[clients.list] STEP 11: Total counted:', total);

        let nextCursor: number | undefined = undefined;
        if (items.length === limit) {
          nextCursor = offset + limit;
        }

        console.log('[clients.list] STEP 12: Returning:', { itemsCount: items.length, nextCursor, total });
        return { items, nextCursor, total };
      } catch (error) {
        console.error('[clients.list] ERROR in query execution:', error);
        throw error;
      }
    }),
  
  listAll: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];
    
    return database
      .select()
      .from(clients)
      .where(eq(clients.partnerId, ctx.partnerId));
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const [client] = await database
        .select()
        .from(clients)
        .where(and(
          eq(clients.partnerId, ctx.partnerId),
          eq(clients.id, input.id)
        ));

      if (!client) throw new Error("Cliente no encontrado");
      return client;
    }),
  
  create: protectedProcedure
    .input(clientBaseSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[clients.create] Input received:', JSON.stringify(input));
        console.log('[clients.create] partnerId:', ctx.partnerId);
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
      
      // Eliminar campos que no existen en la tabla
      const { addressStructured, taxId, ...validInput } = input;
      
      const clientData = {
        ...validInput,
        address,
        odId: ctx.user.openId,
        partnerId: ctx.partnerId,
        organizationId: null, // Por defecto null para técnicos individuales
      };
      
      console.log('[clients.create] DEBUG clientData:', JSON.stringify(clientData));
      const result = await db.createClient(clientData);
      console.log('[clients.create] Client created successfully:', result);
      return result;
      } catch (error) {
        console.error('[clients.create] Error creating client:', error);
        throw error;
      }
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(clientBaseSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Verificar que el cliente existe y pertenece al partner
      const [existingClient] = await database
        .select()
        .from(clients)
        .where(and(
          eq(clients.partnerId, ctx.partnerId),
          eq(clients.id, input.id)
        ));

      if (!existingClient) {
        throw new Error("Cliente no encontrado");
      }

      const { id, addressStructured, ...data } = input;
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
      
      // Actualizar directamente por ID y partnerId
      await database
        .update(clients)
        .set(updateData)
        .where(and(
          eq(clients.partnerId, ctx.partnerId),
          eq(clients.id, id)
        ));
      
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      // Verificar que el cliente existe y pertenece al partner
      const [existingClient] = await database
        .select()
        .from(clients)
        .where(and(
          eq(clients.partnerId, ctx.partnerId),
          eq(clients.id, input.id)
        ));

      if (!existingClient) {
        throw new Error("Cliente no encontrado");
      }

      // Eliminar directamente por ID y partnerId
      await database
        .delete(clients)
        .where(and(
          eq(clients.partnerId, ctx.partnerId),
          eq(clients.id, input.id)
        ));
      
      return { success: true };
    }),
  
  getRegions: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const regionsQuery = await database
      .selectDistinct({ region: clients.region })
      .from(clients)
      .where(and(
        eq(clients.partnerId, ctx.partnerId),
        isNotNull(clients.region)
      ));
    
    return regionsQuery.map(r => r.region!).sort();
  }),
  
  getRouteGroups: protectedProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const groupsQuery = await database
      .selectDistinct({ routeGroup: clients.routeGroup })
      .from(clients)
      .where(and(
        eq(clients.partnerId, ctx.partnerId),
        isNotNull(clients.routeGroup)
      ));
    
    return groupsQuery.map(g => g.routeGroup!).sort();
  }),
  
  findDuplicates: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      excludeId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const whereClauses = [eq(clients.partnerId, ctx.partnerId)];
      
      if (input.excludeId) whereClauses.push(eq(clients.id, input.excludeId));
      if (input.email) whereClauses.push(ilike(clients.email, input.email));
      if (input.name) whereClauses.push(ilike(clients.name, `%${input.name}%`));

      return database
        .select()
        .from(clients)
        .where(and(...whereClauses))
        .limit(10);
    }),
});
