/**
 * Services Router
 * Gestión de servicios con validación mejorada, paginación y funcionalidades avanzadas
 */
import { z } from "zod";
import { protectedProcedure, router } from "../.core/trpc.js";
import * as db from "../db.js";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Tipos de servicio predefinidos
 */
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
  "appraisal", // Peritaje
  "voicing", // Entonación
  "cleaning",
  "other",
] as const;

const serviceTypeSchema = z.enum(predefinedServiceTypes);

/**
 * Estado del servicio
 */
const serviceStatusSchema = z.enum([
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "pending_payment",
  "pending_signature",
]);

/**
 * Esquema de tarea
 */
const taskSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  completed: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(0).optional(), // Duración en minutos
  order: z.number().int().min(0).optional(),
});

/**
 * Esquema de material usado
 */
const materialUsedSchema = z.object({
  materialId: z.number().int().positive(),
  materialName: z.string().optional(), // Para mostrar en la UI
  quantity: z.number().positive(),
  unitPrice: z.number().min(0).optional(),
  totalPrice: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Esquema de foto
 */
const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(255).optional(),
  type: z.enum(["before", "after", "during", "issue", "other"]).optional(),
  timestamp: z.string().optional(),
});

/**
 * Esquema de firma digital
 */
const signatureSchema = z.object({
  data: z.string(), // Base64 de la imagen de la firma
  signedAt: z.string(),
  signerName: z.string().max(255).optional(),
  signerRole: z.enum(["client", "technician", "witness"]).default("client"),
  deviceInfo: z.string().max(500).optional(),
});

/**
 * Esquema de condiciones ambientales durante el servicio
 */
const serviceEnvironmentSchema = z.object({
  humidity: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-20).max(50).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Esquema de paginación para servicios
 */
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["date", "createdAt", "cost", "serviceType", "status"]).default("date"),
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

/**
 * Esquema base de servicio
 */
const serviceBaseSchema = z.object({
  pianoId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  serviceType: serviceTypeSchema,
  customServiceType: z.string().max(100).optional(), // Para tipos personalizados
  date: z.string().or(z.date()),
  startTime: z.string().optional(), // Hora de inicio
  endTime: z.string().optional(), // Hora de fin
  status: serviceStatusSchema.default("scheduled"),
  cost: z.number().min(0).optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(), // Duración en minutos
  estimatedDuration: z.number().int().min(0).optional(), // Duración estimada
  tasks: z.array(taskSchema).optional(),
  notes: z.string().max(5000).optional().nullable(),
  technicianNotes: z.string().max(5000).optional().nullable(), // Notas internas
  materialsUsed: z.array(materialUsedSchema).optional(),
  // Fotos
  photos: z.array(photoSchema).max(50).optional(),
  photosBefore: z.array(z.string().url()).max(20).optional(), // Legacy
  photosAfter: z.array(z.string().url()).max(20).optional(), // Legacy
  // Firma digital
  clientSignature: signatureSchema.optional().nullable(),
  technicianSignature: signatureSchema.optional().nullable(),
  // Condiciones ambientales
  environment: serviceEnvironmentSchema.optional(),
  // Condición del piano después del servicio
  pianoConditionAfter: z.enum(["excellent", "good", "fair", "poor", "needs_repair"]).optional(),
  // Próximo servicio recomendado
  nextServiceRecommendation: z.object({
    serviceType: serviceTypeSchema.optional(),
    recommendedDate: z.string().optional(),
    notes: z.string().max(500).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  }).optional(),
  // Referencia a cita si se creó desde una
  appointmentId: z.number().optional().nullable(),
  // Técnico asignado (para equipos)
  technicianId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
});

// ============================================================================
// PLANTILLAS DE TAREAS POR TIPO DE SERVICIO
// ============================================================================

const SERVICE_TASK_TEMPLATES: Record<string, string[]> = {
  tuning: [
    "Verificar estado general del piano",
    "Comprobar si el piano es afinable",
    "Verificar afinación inicial (diapasón)",
    "Ajustar clavijas si es necesario",
    "Afinar octava central (La 440Hz)",
    "Afinar registro grave",
    "Afinar registro agudo",
    "Verificar afinación final",
    "Probar pedales",
    "Recomendar próxima afinación",
  ],
  repair: [
    "Diagnosticar problema",
    "Evaluar si el piano será afinable tras reparación",
    "Identificar piezas a reparar/reemplazar",
    "Realizar reparación",
    "Verificar funcionamiento",
    "Probar todas las teclas afectadas",
    "Actualizar estado del piano",
  ],
  regulation: [
    "Ajustar altura de teclas",
    "Regular escape de macillos",
    "Ajustar repetición",
    "Verificar caída de macillos",
    "Ajustar apagadores",
    "Regular pedales",
    "Verificar uniformidad del teclado",
  ],
  maintenance_basic: [
    "Limpieza exterior",
    "Limpieza de teclado",
    "Revisión general del mecanismo",
    "Afinación básica",
    "Verificar pedales",
  ],
  maintenance_complete: [
    "Limpieza exterior profunda",
    "Limpieza de teclado y teclas",
    "Limpieza interior (cuerdas y tabla)",
    "Revisión completa del mecanismo",
    "Regulación ligera",
    "Ajuste de pedales",
    "Afinación completa",
    "Verificación final",
  ],
  maintenance_premium: [
    "Limpieza exterior profesional",
    "Limpieza y pulido de teclado",
    "Limpieza profunda interior",
    "Revisión y ajuste de clavijero",
    "Regulación completa",
    "Entonación (voicing)",
    "Tratamiento de fieltros",
    "Ajuste de pedales",
    "Afinación de concierto",
    "Informe detallado del estado",
  ],
  inspection: [
    "Inspección visual exterior",
    "Inspección del mecanismo",
    "Verificar estado de cuerdas",
    "Verificar estado de macillos",
    "Verificar estado de apagadores",
    "Evaluar condición general",
    "Documentar con fotos",
    "Elaborar informe",
  ],
  restoration: [
    "Evaluación inicial completa",
    "Documentación fotográfica",
    "Desmontaje de piezas necesarias",
    "Limpieza profunda",
    "Reparación/reemplazo de piezas",
    "Restauración de acabados",
    "Reensamblaje",
    "Regulación completa",
    "Afinación",
    "Control de calidad final",
  ],
  voicing: [
    "Evaluar dureza actual de macillos",
    "Ajustar dureza de macillos",
    "Equilibrar sonoridad entre registros",
    "Verificar uniformidad tonal",
    "Ajustes finos por sección",
  ],
  cleaning: [
    "Limpieza exterior",
    "Limpieza de teclado",
    "Limpieza de pedales",
    "Aspirado interior",
    "Limpieza de cuerdas",
    "Pulido de superficies",
  ],
};

// ============================================================================
// ROUTER
// ============================================================================

export const servicesRouter = router({
  /**
   * Lista de servicios con paginación y filtros
   */
  list: protectedProcedure
    .input(paginationSchema.optional())
    .query(async ({ ctx, input }) => {
      const pagination = input || { page: 1, limit: 20, sortBy: "date", sortOrder: "desc" };
      
      const allServices = await db.getServices(ctx.user.openId);
      
      // Filtrar
      let filtered = allServices;
      
      if (pagination.search) {
        const searchLower = pagination.search.toLowerCase();
        filtered = filtered.filter(s => 
          s.notes?.toLowerCase().includes(searchLower) ||
          s.technicianNotes?.toLowerCase().includes(searchLower)
        );
      }
      
      if (pagination.serviceType) {
        filtered = filtered.filter(s => s.serviceType === pagination.serviceType);
      }
      
      if (pagination.status) {
        filtered = filtered.filter(s => s.status === pagination.status);
      }
      
      if (pagination.clientId) {
        filtered = filtered.filter(s => s.clientId === pagination.clientId);
      }
      
      if (pagination.pianoId) {
        filtered = filtered.filter(s => s.pianoId === pagination.pianoId);
      }
      
      if (pagination.dateFrom) {
        const fromDate = new Date(pagination.dateFrom);
        filtered = filtered.filter(s => new Date(s.date) >= fromDate);
      }
      
      if (pagination.dateTo) {
        const toDate = new Date(pagination.dateTo);
        filtered = filtered.filter(s => new Date(s.date) <= toDate);
      }
      
      if (pagination.hasPendingSignature) {
        filtered = filtered.filter(s => 
          s.status === "completed" && !s.clientSignature
        );
      }
      
      // Ordenar
      filtered.sort((a, b) => {
        let aVal: string | number | Date = a[pagination.sortBy as keyof typeof a] ?? "";
        let bVal: string | number | Date = b[pagination.sortBy as keyof typeof b] ?? "";
        
        if (pagination.sortBy === "date" || pagination.sortBy === "createdAt") {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }
        
        if (typeof aVal === "number" && typeof bVal === "number") {
          return pagination.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
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
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthServices = allServices.filter(s => new Date(s.date) >= thisMonth);
      
      const stats = {
        total: allServices.length,
        thisMonth: thisMonthServices.length,
        revenue: {
          total: allServices.reduce((sum, s) => sum + Number(s.cost || 0), 0),
          thisMonth: thisMonthServices.reduce((sum, s) => sum + Number(s.cost || 0), 0),
        },
        byType: Object.fromEntries(
          predefinedServiceTypes.map(type => [
            type,
            allServices.filter(s => s.serviceType === type).length,
          ])
        ),
        pendingSignatures: allServices.filter(s => 
          s.status === "completed" && !s.clientSignature
        ).length,
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
   * Lista simple sin paginación
   */
  listAll: protectedProcedure.query(({ ctx }) => db.getServices(ctx.user.openId)),
  
  /**
   * Obtener servicio por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getService(ctx.user.openId, input.id)),
  
  /**
   * Obtener servicios de un piano
   */
  byPiano: protectedProcedure
    .input(z.object({ pianoId: z.number() }))
    .query(({ ctx, input }) => db.getServicesByPiano(ctx.user.openId, input.pianoId)),
  
  /**
   * Obtener servicios de un cliente
   */
  byClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const services = await db.getServices(ctx.user.openId);
      return services.filter(s => s.clientId === input.clientId);
    }),
  
  /**
   * Crear nuevo servicio
   */
  create: protectedProcedure
    .input(serviceBaseSchema)
    .mutation(async ({ ctx, input }) => {
      // Descontar materiales del inventario si se usaron
      if (input.materialsUsed && input.materialsUsed.length > 0) {
        for (const material of input.materialsUsed) {
          try {
            await db.updateInventoryQuantity(
              ctx.user.openId,
              material.materialId,
              -material.quantity
            );
          } catch {
            // Continuar aunque falle la actualización de inventario
          }
        }
      }
      
      // Actualizar fecha de último servicio del piano
      if (input.status === "completed") {
        try {
          await db.updatePiano(ctx.user.openId, input.pianoId, {
            lastServiceDate: new Date(input.date),
            condition: input.pianoConditionAfter,
          });
        } catch {
          // Continuar aunque falle la actualización del piano
        }
      }
      
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
    .mutation(async ({ ctx, input }) => {
      const { id, date, ...data } = input;
      
      // Si se completa el servicio, actualizar el piano
      if (data.status === "completed") {
        const service = await db.getService(ctx.user.openId, id);
        if (service) {
          try {
            await db.updatePiano(ctx.user.openId, service.pianoId, {
              lastServiceDate: date ? new Date(date) : new Date(service.date),
              condition: data.pianoConditionAfter,
            });
          } catch {
            // Continuar
          }
        }
      }
      
      return db.updateService(ctx.user.openId, id, {
        ...data,
        ...(date ? { date: new Date(date) } : {}),
      });
    }),
  
  /**
   * Eliminar servicio
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => db.deleteService(ctx.user.openId, input.id)),
  
  /**
   * Obtener plantilla de tareas para un tipo de servicio
   */
  getTaskTemplate: protectedProcedure
    .input(z.object({ serviceType: serviceTypeSchema }))
    .query(({ input }) => {
      const tasks = SERVICE_TASK_TEMPLATES[input.serviceType] || [];
      return tasks.map((name, index) => ({
        id: `task-${index}`,
        name,
        completed: false,
        order: index,
      }));
    }),
  
  /**
   * Añadir firma del cliente
   */
  addClientSignature: protectedProcedure
    .input(z.object({
      serviceId: z.number(),
      signature: signatureSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return db.updateService(ctx.user.openId, input.serviceId, {
        clientSignature: input.signature,
        status: "completed",
      });
    }),
  
  /**
   * Añadir fotos al servicio
   */
  addPhotos: protectedProcedure
    .input(z.object({
      serviceId: z.number(),
      photos: z.array(photoSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = await db.getService(ctx.user.openId, input.serviceId);
      if (!service) {
        throw new Error("Servicio no encontrado");
      }
      
      const existingPhotos = (service.photos as typeof input.photos) || [];
      const updatedPhotos = [...existingPhotos, ...input.photos].slice(0, 50);
      
      return db.updateService(ctx.user.openId, input.serviceId, {
        photos: updatedPhotos,
      });
    }),
  
  /**
   * Generar factura desde servicio
   */
  generateInvoice: protectedProcedure
    .input(z.object({
      serviceId: z.number(),
      includeDetails: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = await db.getService(ctx.user.openId, input.serviceId);
      if (!service) {
        throw new Error("Servicio no encontrado");
      }
      
      // Obtener datos del cliente
      const client = await db.getClient(ctx.user.openId, service.clientId);
      if (!client) {
        throw new Error("Cliente no encontrado");
      }
      
      // Generar número de factura
      const invoices = await db.getInvoices(ctx.user.openId);
      const year = new Date().getFullYear();
      const lastNumber = invoices
        .filter(inv => inv.invoiceNumber.startsWith(String(year)))
        .map(inv => {
          const match = inv.invoiceNumber.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => Math.max(max, num), 0);
      
      const invoiceNumber = `${year}-${String(lastNumber + 1).padStart(4, "0")}`;
      
      // Crear líneas de factura
      const items = [];
      
      // Línea principal del servicio
      const serviceTypeLabels: Record<string, string> = {
        tuning: "Afinación",
        repair: "Reparación",
        regulation: "Regulación",
        maintenance_basic: "Mantenimiento Básico",
        maintenance_complete: "Mantenimiento Completo",
        maintenance_premium: "Mantenimiento Premium",
        inspection: "Inspección",
        restoration: "Restauración",
        transport: "Transporte",
        appraisal: "Peritaje",
        voicing: "Entonación",
        cleaning: "Limpieza",
        other: "Otro servicio",
      };
      
      items.push({
        description: serviceTypeLabels[service.serviceType] || service.serviceType,
        quantity: 1,
        unitPrice: Number(service.cost || 0),
        taxRate: 21,
        total: Number(service.cost || 0),
      });
      
      // Añadir materiales si se incluyen detalles
      if (input.includeDetails && service.materialsUsed) {
        const materials = service.materialsUsed as Array<{ materialName?: string; quantity: number; unitPrice?: number; totalPrice?: number }>;
        for (const material of materials) {
          if (material.totalPrice && material.totalPrice > 0) {
            items.push({
              description: `Material: ${material.materialName || "Material"}`,
              quantity: material.quantity,
              unitPrice: material.unitPrice || 0,
              taxRate: 21,
              total: material.totalPrice,
            });
          }
        }
      }
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * 0.21;
      const total = subtotal + taxAmount;
      
      // Crear la factura
      const invoice = await db.createInvoice({
        invoiceNumber,
        clientId: service.clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        date: new Date(),
        status: "draft",
        items,
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: String(taxAmount.toFixed(2)),
        total: String(total.toFixed(2)),
        serviceId: service.id,
        odId: ctx.user.openId,
      });
      
      return invoice;
    }),
  
  /**
   * Obtener tipos de servicio disponibles
   */
  getServiceTypes: protectedProcedure.query(() => {
    return predefinedServiceTypes.map(type => ({
      value: type,
      label: {
        tuning: "Afinación",
        repair: "Reparación",
        regulation: "Regulación",
        maintenance_basic: "Mantenimiento Básico",
        maintenance_complete: "Mantenimiento Completo",
        maintenance_premium: "Mantenimiento Premium",
        inspection: "Inspección",
        restoration: "Restauración",
        transport: "Transporte",
        appraisal: "Peritaje",
        voicing: "Entonación",
        cleaning: "Limpieza",
        other: "Otro",
      }[type] || type,
    }));
  }),
});
