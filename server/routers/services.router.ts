/**
 * Services Router (OPTIMIZED)
 * Gestión de servicios con paginación en DB, eager loading y caché
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { services, clients, pianos } from "../../drizzle/schema.js";
import { eq, and, or, gte, lte, asc, desc, count, sql, ilike } from "drizzle-orm";
import * as cache from "../cache.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const predefinedServiceTypes = [
  "tuning",
  "repair",
  "regulation",
  "maintenance_basic",
  "maintenance_complete",
  "maintenance_premium",
  "inspection",
  "restoration",
  "transport",
  "appraisal",
  "voicing",
  "cleaning",
  "other",
] as const;

const serviceTypeSchema = z.enum(predefinedServiceTypes);

const serviceStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "pending_payment",
  "pending_signature",
]);

const taskSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  completed: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
});

const materialUsedSchema = z.object({
  materialId: z.number().int().positive(),
  materialName: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(255).optional(),
  type: z.enum(["before", "after", "during", "issue", "other"]).optional(),
  timestamp: z.string().optional(),
});

const signatureSchema = z.object({
  data: z.string(),
  signedAt: z.string(),
  signerName: z.string().max(255).optional(),
  signerRole: z.enum(["client", "technician", "witness"]).default("client"),
  deviceInfo: z.string().max(500).optional(),
});

const serviceEnvironmentSchema = z.object({
  humidity: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-20).max(50).optional(),
  notes: z.string().max(500).optional(),
});

const serviceBaseSchema = z.object({
  pianoId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  serviceType: serviceTypeSchema,
  date: z.string().or(z.date()),
  cost: z.number().min(0).optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  tasks: z.array(taskSchema).max(50).optional(),
  notes: z.string().max(5000).optional().nullable(),
  technicianNotes: z.string().max(5000).optional().nullable(),
  materialsUsed: z.array(materialUsedSchema).max(100).optional(),
  photosBefore: z.array(photoSchema).max(20).optional(),
  photosAfter: z.array(photoSchema).max(20).optional(),
  clientSignature: signatureSchema.optional().nullable(),
  technicianSignature: signatureSchema.optional().nullable(),
  environment: serviceEnvironmentSchema.optional().nullable(),
  status: serviceStatusSchema.default("scheduled"),
  invoiceId: z.number().int().positive().optional().nullable(),
  appointmentId: z.number().int().positive().optional().nullable(),
});

/**
 * Esquema de paginación para servicios
 */
const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.number().optional(),
  sortBy: z.enum(["date", "cost", "serviceType", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  serviceType: serviceTypeSchema.optional(),
  status: serviceStatusSchema.optional(),
  clientId: z.number().optional(),
  pianoId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  hasPendingSignature: z.boolean().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const servicesRouter = router({
  /**
   * Lista de servicios con paginación optimizada y eager loading
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const { limit = 30, cursor, sortBy = "date", sortOrder = "desc", search, serviceType, status, clientId, pianoId, dateFrom, dateTo, hasPendingSignature } = input || {};
      
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
            totalRevenue: 0,
            byType: {},
            byStatus: {},
          },
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [eq(services.odId, ctx.user.openId)];
      
      if (search) {
        whereClauses.push(
          or(
            ilike(services.notes, `%${search}%`),
            ilike(services.technicianNotes, `%${search}%`)
          )!
        );
      }
      
      if (serviceType) {
        whereClauses.push(eq(services.serviceType, serviceType));
      }
      
      if (status) {
        whereClauses.push(eq(services.status, status));
      }
      
      if (clientId) {
        whereClauses.push(eq(services.clientId, clientId));
      }
      
      if (pianoId) {
        whereClauses.push(eq(services.pianoId, pianoId));
      }
      
      if (dateFrom) {
        whereClauses.push(gte(services.date, new Date(dateFrom)));
      }
      
      if (dateTo) {
        whereClauses.push(lte(services.date, new Date(dateTo)));
      }

      // Construir ORDER BY
      const sortColumn = services[sortBy as keyof typeof services];
      const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // EAGER LOADING: Consulta con leftJoin para cargar cliente y piano
      const offset = cursor || 0;
      const items = await database
        .select({
          // Service fields
          id: services.id,
          odId: services.odId,
          pianoId: services.pianoId,
          clientId: services.clientId,
          serviceType: services.serviceType,
          date: services.date,
          cost: services.cost,
          duration: services.duration,
          tasks: services.tasks,
          notes: services.notes,
          technicianNotes: services.technicianNotes,
          materialsUsed: services.materialsUsed,
          photosBefore: services.photosBefore,
          photosAfter: services.photosAfter,
          clientSignature: services.clientSignature,
          humidity: services.humidity,
          temperature: services.temperature,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt,
          // Client fields (eager loaded)
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientAddress: clients.address,
          // Piano fields (eager loaded)
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
          pianoSerialNumber: pianos.serialNumber,
        })
        .from(services)
        .leftJoin(clients, eq(services.clientId, clients.id))
        .leftJoin(pianos, eq(services.pianoId, pianos.id))
        .where(and(...whereClauses))
        .orderBy(orderByClause)
        .limit(limit + 1)
        .offset(offset);

      // Consulta de conteo total
      const [{ total }] = await database
        .select({ total: count() })
        .from(services)
        .where(and(...whereClauses));

      // Estadísticas (optimizadas con consultas agregadas)
      const [{ totalRevenue }] = await database
        .select({ totalRevenue: sql<number>`COALESCE(SUM(${services.cost}), 0)` })
        .from(services)
        .where(eq(services.odId, ctx.user.openId));

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
          totalRevenue: Number(totalRevenue) || 0,
        },
      };
    }),
  
  /**
   * Obtener servicio por ID con eager loading
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return undefined;

      const [result] = await database
        .select({
          id: services.id,
          odId: services.odId,
          pianoId: services.pianoId,
          clientId: services.clientId,
          serviceType: services.serviceType,
          date: services.date,
          cost: services.cost,
          duration: services.duration,
          tasks: services.tasks,
          notes: services.notes,
          technicianNotes: services.technicianNotes,
          materialsUsed: services.materialsUsed,
          photosBefore: services.photosBefore,
          photosAfter: services.photosAfter,
          clientSignature: services.clientSignature,
          humidity: services.humidity,
          temperature: services.temperature,
          createdAt: services.createdAt,
          updatedAt: services.updatedAt,
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientAddress: clients.address,
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
          pianoSerialNumber: pianos.serialNumber,
          pianoCategory: pianos.category,
        })
        .from(services)
        .leftJoin(clients, eq(services.clientId, clients.id))
        .leftJoin(pianos, eq(services.pianoId, pianos.id))
        .where(and(eq(services.odId, ctx.user.openId), eq(services.id, input.id)));

      return result;
    }),
  
  /**
   * Obtener servicios de un piano con eager loading
   */
  byPiano: protectedProcedure
    .input(z.object({ pianoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select({
          id: services.id,
          serviceType: services.serviceType,
          date: services.date,
          cost: services.cost,
          duration: services.duration,
          notes: services.notes,
          createdAt: services.createdAt,
          clientName: clients.name,
        })
        .from(services)
        .leftJoin(clients, eq(services.clientId, clients.id))
        .where(and(eq(services.odId, ctx.user.openId), eq(services.pianoId, input.pianoId)))
        .orderBy(desc(services.date));

      return items;
    }),
  
  /**
   * Obtener servicios de un cliente con eager loading
   */
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select({
          id: services.id,
          serviceType: services.serviceType,
          date: services.date,
          cost: services.cost,
          duration: services.duration,
          notes: services.notes,
          createdAt: services.createdAt,
          pianoBrand: pianos.brand,
          pianoModel: pianos.model,
        })
        .from(services)
        .leftJoin(pianos, eq(services.pianoId, pianos.id))
        .where(and(eq(services.odId, ctx.user.openId), eq(services.clientId, input.clientId)))
        .orderBy(desc(services.date));

      return items;
    }),
  
  /**
   * Crear nuevo servicio
   */
  create: protectedProcedure
    .input(serviceBaseSchema)
    .mutation(({ ctx, input }) => {
      return db.createService({
        ...input,
        date: new Date(input.date),
        odId: ctx.user.openId,
      });
    }),
  
  /**
   * Actualizar servicio existente
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
    }).merge(serviceBaseSchema.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateService(ctx.user.openId, id, {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      });
    }),
  
  /**
   * Eliminar servicio
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteService(ctx.user.openId, input.id)),
  
  /**
   * Obtener estadísticas de servicios (con caché)
   */
  getStats: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const cacheKey = `service_stats:${ctx.user.openId}:${input?.dateFrom || 'all'}:${input?.dateTo || 'all'}`;
      
      // Intentar obtener del caché
      const cached = await cache.getCachedValue<any>(cacheKey);
      if (cached) return cached;

      const database = await db.getDb();
      if (!database) {
        return {
          totalServices: 0,
          totalRevenue: 0,
          averageCost: 0,
          byType: {},
          recentServices: [],
        };
      }

      // Construir condiciones WHERE
      const whereClauses = [eq(services.odId, ctx.user.openId)];
      
      if (input?.dateFrom) {
        whereClauses.push(gte(services.date, new Date(input.dateFrom)));
      }
      
      if (input?.dateTo) {
        whereClauses.push(lte(services.date, new Date(input.dateTo)));
      }

      // Consultas agregadas optimizadas
      const [{ totalServices, totalRevenue, averageCost }] = await database
        .select({
          totalServices: count(),
          totalRevenue: sql<number>`COALESCE(SUM(${services.cost}), 0)`,
          averageCost: sql<number>`COALESCE(AVG(${services.cost}), 0)`,
        })
        .from(services)
        .where(and(...whereClauses));

      // Servicios recientes con eager loading
      const recentServices = await database
        .select({
          id: services.id,
          serviceType: services.serviceType,
          date: services.date,
          cost: services.cost,
          clientName: clients.name,
          pianoBrand: pianos.brand,
        })
        .from(services)
        .leftJoin(clients, eq(services.clientId, clients.id))
        .leftJoin(pianos, eq(services.pianoId, pianos.id))
        .where(and(...whereClauses))
        .orderBy(desc(services.date))
        .limit(10);

      const stats = {
        totalServices,
        totalRevenue: Number(totalRevenue) || 0,
        averageCost: Number(averageCost) || 0,
        recentServices,
      };

      // Cachear por 15 minutos
      await cache.setCachedValue(cacheKey, stats, 900);
      
      return stats;
    }),
  
  /**
   * Obtener servicios pendientes de firma
   */
  getPendingSignature: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];

      const items = await database
        .select({
          id: services.id,
          serviceType: services.serviceType,
          date: services.date,
          clientName: clients.name,
          clientEmail: clients.email,
          pianoBrand: pianos.brand,
        })
        .from(services)
        .leftJoin(clients, eq(services.clientId, clients.id))
        .leftJoin(pianos, eq(services.pianoId, pianos.id))
        .where(and(
          eq(services.odId, ctx.user.openId),
          sql`${services.clientSignature} IS NULL`
        ))
        .orderBy(desc(services.date))
        .limit(20);

      return items;
    }),
});
