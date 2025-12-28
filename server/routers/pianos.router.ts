/**
 * Pianos Router
 * Gestión de pianos con validación mejorada y paginación
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

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
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["brand", "model", "year", "createdAt", "updatedAt", "lastServiceDate"]).default("brand"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  category: pianoCategorySchema.optional(),
  brand: z.string().optional(),
  condition: pianoConditionSchema.optional(),
  clientId: z.number().optional(),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
  needsService: z.boolean().optional(), // Pianos que necesitan servicio pronto
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
  location: z.string().max(500).optional().nullable(), // Ubicación dentro del domicilio
  notes: z.string().max(5000).optional().nullable(),
  photos: z.array(z.string().url()).max(20).optional(), // Hasta 20 fotos
  // Nuevos campos
  color: z.string().max(50).optional().nullable(),
  finish: z.enum(["polished", "satin", "matte", "other"]).optional().nullable(),
  size: z.number().positive().optional().nullable(), // Altura (vertical) o longitud (cola) en cm
  keys: z.number().int().min(44).max(97).default(88).optional(), // Número de teclas
  pedals: z.number().int().min(1).max(4).default(3).optional(), // Número de pedales
  // Condiciones ambientales
  environment: environmentSchema,
  // Accesorios
  accessories: accessoriesSchema,
  // Mantenimiento
  lastServiceDate: z.string().or(z.date()).optional().nullable(),
  nextServiceDate: z.string().or(z.date()).optional().nullable(),
  serviceIntervalMonths: z.number().int().min(1).max(24).default(6).optional(),
  // Garantía
  warrantyExpiry: z.string().or(z.date()).optional().nullable(),
  purchaseDate: z.string().or(z.date()).optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  // Valor estimado actual
  estimatedValue: z.number().min(0).optional().nullable(),
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
   * Lista de pianos con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "brand", sortOrder: "asc" };
      
      const allPianos = await db.getPianos(ctx.user.openId);
      
      // Filtrar
      let filtered = allPianos;
      
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.brand.toLowerCase().includes(searchLower) ||
          p.model?.toLowerCase().includes(searchLower) ||
          p.serialNumber?.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.category) {
        filtered = filtered.filter(p => p.category === pagination.category);
      }
      
      if (pagination.brand) {
        filtered = filtered.filter(p => p.brand.toLowerCase() === pagination.brand?.toLowerCase());
      }
      
      if (pagination.condition) {
        filtered = filtered.filter(p => p.condition === pagination.condition);
      }
      
      if (pagination.clientId) {
        filtered = filtered.filter(p => p.clientId === pagination.clientId);
      }
      
      if (pagination.yearFrom) {
        filtered = filtered.filter(p => p.year && p.year >= pagination.yearFrom!);
      }
      
      if (pagination.yearTo) {
        filtered = filtered.filter(p => p.year && p.year <= pagination.yearTo!);
      }
      
      // Filtrar pianos que necesitan servicio pronto (próximos 30 días)
      if (pagination.needsService) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        filtered = filtered.filter(p => {
          if (!p.nextServiceDate) return false;
          return new Date(p.nextServiceDate) <= thirtyDaysFromNow;
        });
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        let aVal: string | number | Date = a[pagination.sortBy as keyof typeof a] ?? "";
        let bVal: string | number | Date = b[pagination.sortBy as keyof typeof b] ?? "";
        
        if (pagination.sortBy === "year") {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
          return pagination.sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        
        if (pagination.sortBy.includes("Date")) {
          aVal = aVal ? new Date(aVal as string).getTime() : 0;
          bVal = bVal ? new Date(bVal as string).getTime() : 0;
          return pagination.sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return pagination.sortOrder === "asc" ? comparison : -comparison;
      });
      
      // Paginar
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const offset = (pagination.page - 1) * pagination.limit;
      const items = filtered.slice(offset, offset + pagination.limit);
      
      // Estadísticas
      const stats = {
        total: allPianos.length,
        byCategory: {
          vertical: allPianos.filter(p => p.category === "vertical").length,
          grand: allPianos.filter(p => p.category === "grand").length,
        },
        byCondition: {
          excellent: allPianos.filter(p => p.condition === "excellent").length,
          good: allPianos.filter(p => p.condition === "good").length,
          fair: allPianos.filter(p => p.condition === "fair").length,
          poor: allPianos.filter(p => p.condition === "poor").length,
          needs_repair: allPianos.filter(p => p.condition === "needs_repair").length,
        },
        needingService: allPianos.filter(p => {
          if (!p.nextServiceDate) return false;
          return new Date(p.nextServiceDate) <= new Date();
        }).length,
      };
      
      return {
        items,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasMore: pagination.page < totalPages,
        },
        stats,
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
      // Calcular próxima fecha de servicio si no se proporciona
      let nextServiceDate = input.nextServiceDate;
      if (!nextServiceDate && input.lastServiceDate) {
        const lastDate = new Date(input.lastServiceDate);
        const intervalMonths = input.serviceIntervalMonths || 6;
        lastDate.setMonth(lastDate.getMonth() + intervalMonths);
        nextServiceDate = lastDate.toISOString();
      }
      
      return db.createPiano({
        ...input,
        nextServiceDate,
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
      
      // Recalcular próxima fecha de servicio si se actualiza la última
      let updateData = { ...data };
      if (data.lastServiceDate && !data.nextServiceDate) {
        const lastDate = new Date(data.lastServiceDate);
        const intervalMonths = data.serviceIntervalMonths || 6;
        lastDate.setMonth(lastDate.getMonth() + intervalMonths);
        updateData.nextServiceDate = lastDate.toISOString();
      }
      
      return db.updatePiano(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar piano
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deletePiano(ctx.user.openId, input.id)),
  
  /**
   * Obtener marcas únicas (para filtros y autocompletado)
   */
  getBrands: protectedProcedure.query(async ({ ctx }) => {
    const pianos = await db.getPianos(ctx.user.openId);
    const userBrands = [...new Set(pianos.map(p => p.brand))];
    
    // Combinar con marcas conocidas
    const allBrands = [...new Set([...userBrands, ...KNOWN_BRANDS])];
    return allBrands.sort();
  }),
  
  /**
   * Obtener pianos que necesitan servicio
   */
  getNeedingService: protectedProcedure
    .input(z.object({
      daysAhead: z.number().int().min(0).max(365).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const daysAhead = input?.daysAhead || 30;
      const pianos = await db.getPianos(ctx.user.openId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
      
      return pianos.filter(p => {
        if (!p.nextServiceDate) {
          // Si no tiene fecha de próximo servicio, verificar si han pasado más de 6 meses desde el último
          if (p.lastServiceDate) {
            const lastDate = new Date(p.lastServiceDate);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return lastDate < sixMonthsAgo;
          }
          return false;
        }
        return new Date(p.nextServiceDate) <= cutoffDate;
      }).sort((a, b) => {
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
      // Obtener servicios del piano
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
      // Actualizar el piano con las nuevas lecturas
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
