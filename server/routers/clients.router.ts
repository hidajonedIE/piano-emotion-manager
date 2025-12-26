/**
 * Clients Router
 * Gestión de clientes con validación mejorada y paginación
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";

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
  "student", 
  "professional",
  "music_school",
  "conservatory",
  "concert_hall"
]).default("particular");

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
   * Lista de clientes con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "name", sortOrder: "asc" };
      
      // Obtener todos los clientes (la paginación se hace en memoria por ahora)
      // TODO: Implementar paginación a nivel de base de datos
      const allClients = await db.getClients(ctx.user.openId);
      
      // Filtrar
      let filtered = allClients;
      
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.clientType) {
        filtered = filtered.filter(c => c.clientType === pagination.clientType);
      }
      
      if (pagination.region) {
        filtered = filtered.filter(c => c.region === pagination.region);
      }
      
      if (pagination.routeGroup) {
        filtered = filtered.filter(c => c.routeGroup === pagination.routeGroup);
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        const aVal = a[pagination.sortBy as keyof typeof a] ?? "";
        const bVal = b[pagination.sortBy as keyof typeof b] ?? "";
        const comparison = String(aVal).localeCompare(String(bVal));
        return pagination.sortOrder === "asc" ? comparison : -comparison;
      });
      
      // Paginar
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const offset = (pagination.page - 1) * pagination.limit;
      const items = filtered.slice(offset, offset + pagination.limit);
      
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
      
      return db.updateClient(ctx.user.openId, id, updateData);
    }),
  
  /**
   * Eliminar cliente
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteClient(ctx.user.openId, input.id)),
  
  /**
   * Obtener regiones únicas (para filtros)
   */
  getRegions: protectedProcedure.query(async ({ ctx }) => {
    const clients = await db.getClients(ctx.user.openId);
    const regions = [...new Set(clients.map(c => c.region).filter(Boolean))];
    return regions.sort();
  }),
  
  /**
   * Obtener grupos de ruta únicos (para filtros)
   */
  getRouteGroups: protectedProcedure.query(async ({ ctx }) => {
    const clients = await db.getClients(ctx.user.openId);
    const groups = [...new Set(clients.map(c => c.routeGroup).filter(Boolean))];
    return groups.sort();
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
      const clients = await db.getClients(ctx.user.openId);
      
      return clients.filter(c => {
        if (input.excludeId && c.id === input.excludeId) return false;
        
        if (input.name) {
          const nameSimilarity = calculateSimilarity(c.name.toLowerCase(), input.name.toLowerCase());
          if (nameSimilarity > 0.8) return true;
        }
        
        if (input.email && c.email) {
          if (c.email.toLowerCase() === input.email.toLowerCase()) return true;
        }
        
        return false;
      });
    }),
});

/**
 * Calcula la similitud entre dos strings (algoritmo de Levenshtein normalizado)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}
