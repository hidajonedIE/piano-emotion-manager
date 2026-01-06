/**
 * Onboarding Router
 * Sistema de registro y configuración inicial de nuevos partners
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { partners, partnerSettings, partnerUsers, users } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Schema para verificar disponibilidad de slug
 */
const checkSlugSchema = z.object({
  slug: z.string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(50, "El slug no puede tener más de 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
});

/**
 * Schema para verificar disponibilidad de email
 */
const checkEmailSchema = z.object({
  email: z.string().email("Email no válido").max(320),
});

/**
 * Schema para el paso 1: Información básica del partner
 */
const step1Schema = z.object({
  slug: z.string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(50, "El slug no puede tener más de 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  name: z.string()
    .min(1, "El nombre es obligatorio")
    .max(255, "El nombre no puede tener más de 255 caracteres"),
  email: z.string()
    .email("Email no válido")
    .max(320, "El email no puede tener más de 320 caracteres"),
  supportEmail: z.string()
    .email("Email no válido")
    .max(320)
    .optional()
    .nullable(),
  supportPhone: z.string()
    .max(50)
    .optional()
    .nullable(),
});

/**
 * Schema para el paso 2: Branding
 */
const step2Schema = z.object({
  brandName: z.string()
    .max(255, "El nombre de marca no puede tener más de 255 caracteres")
    .optional()
    .nullable(),
  logo: z.string()
    .optional()
    .nullable(),
  primaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex válido requerido (#RRGGBB)")
    .default("#3b82f6"),
  secondaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex válido requerido (#RRGGBB)")
    .default("#10b981"),
});

/**
 * Schema para el paso 3: Configuración inicial
 */
const step3Schema = z.object({
  allowMultipleSuppliers: z.boolean().default(false),
  ecommerceEnabled: z.boolean().default(false),
  autoOrderEnabled: z.boolean().default(false),
  autoOrderThreshold: z.number().int().min(0).default(5),
  notificationEmail: z.string()
    .email("Email no válido")
    .max(320)
    .optional()
    .nullable(),
});

/**
 * Schema completo para registro de partner
 */
const completeRegistrationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .extend({
    // Información del usuario administrador
    adminUserName: z.string()
      .min(1, "El nombre del administrador es obligatorio")
      .max(255),
    adminUserEmail: z.string()
      .email("Email no válido")
      .max(320),
  });

// ============================================================================
// ROUTER
// ============================================================================

export const onboardingRouter = router({
  /**
   * Verificar disponibilidad de slug
   * Endpoint público para validación en tiempo real
   */
  checkSlugAvailability: publicProcedure
    .input(checkSlugSchema)
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [existing] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.slug, input.slug))
        .limit(1);

      return {
        available: !existing,
        slug: input.slug,
      };
    }),

  /**
   * Verificar disponibilidad de email
   * Endpoint público para validación en tiempo real
   */
  checkEmailAvailability: publicProcedure
    .input(checkEmailSchema)
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [existingPartner] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.email, input.email))
        .limit(1);

      const [existingUser] = await database
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      return {
        available: !existingPartner && !existingUser,
        email: input.email,
      };
    }),

  /**
   * Generar sugerencias de slug basadas en el nombre
   */
  suggestSlug: publicProcedure
    .input(z.object({ name: z.string().min(1).max(255) }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Generar slug base desde el nombre
      const baseSlug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, "") // Remover guiones al inicio y final
        .substring(0, 50); // Limitar longitud

      const suggestions: string[] = [];

      // Verificar disponibilidad del slug base
      const [existing] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.slug, baseSlug))
        .limit(1);

      // Si está disponible, agregarlo como primera opción
      if (!existing) {
        suggestions.push(baseSlug);
      }

      // Generar alternativas con números
      for (let i = 1; i <= 5; i++) {
        const altSlug = `${baseSlug}-${i}`;
        const [altExisting] = await database
          .select({ id: partners.id })
          .from(partners)
          .where(eq(partners.slug, altSlug))
          .limit(1);

        if (!altExisting) {
          suggestions.push(altSlug);
        }

        // Si ya tenemos 5 sugerencias, parar
        if (suggestions.length >= 5) break;
      }

      return {
        suggestions,
        baseSlug,
      };
    }),

  /**
   * Validar paso 1: Información básica
   */
  validateStep1: publicProcedure
    .input(step1Schema)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verificar slug único
      const [existingSlug] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.slug, input.slug))
        .limit(1);

      if (existingSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El slug ya está en uso",
        });
      }

      // Verificar email único
      const [existingEmail] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.email, input.email))
        .limit(1);

      if (existingEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El email ya está en uso",
        });
      }

      return {
        valid: true,
        data: input,
      };
    }),

  /**
   * Validar paso 2: Branding
   */
  validateStep2: publicProcedure
    .input(step2Schema)
    .mutation(async ({ input }) => {
      // Validación de colores (ya hecha por Zod)
      // Aquí se pueden agregar validaciones adicionales si es necesario

      return {
        valid: true,
        data: input,
      };
    }),

  /**
   * Validar paso 3: Configuración
   */
  validateStep3: publicProcedure
    .input(step3Schema)
    .mutation(async ({ input }) => {
      // Validaciones adicionales si es necesario
      
      return {
        valid: true,
        data: input,
      };
    }),

  /**
   * Registro completo de nuevo partner
   * Este endpoint crea el partner, sus settings y el usuario administrador
   */
  completeRegistration: publicProcedure
    .input(completeRegistrationSchema)
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Extraer datos por sección
      const {
        slug,
        name,
        email,
        supportEmail,
        supportPhone,
        brandName,
        logo,
        primaryColor,
        secondaryColor,
        allowMultipleSuppliers,
        ecommerceEnabled,
        autoOrderEnabled,
        autoOrderThreshold,
        notificationEmail,
        adminUserName,
        adminUserEmail,
      } = input;

      // Verificaciones finales
      const [existingSlug] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.slug, slug))
        .limit(1);

      if (existingSlug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El slug ya está en uso",
        });
      }

      const [existingEmail] = await database
        .select({ id: partners.id })
        .from(partners)
        .where(eq(partners.email, email))
        .limit(1);

      if (existingEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El email del partner ya está en uso",
        });
      }

      // Iniciar transacción (simulada con múltiples inserts)
      try {
        // 1. Crear partner
        const partnerResult = await database.insert(partners).values({
          slug,
          name,
          email,
          supportEmail,
          supportPhone,
          brandName,
          logo,
          primaryColor,
          secondaryColor,
          allowMultipleSuppliers,
          status: "active",
        });

        const partnerId = partnerResult[0].insertId;

        // 2. Crear settings del partner
        await database.insert(partnerSettings).values({
          partnerId,
          ecommerceEnabled,
          autoOrderEnabled,
          autoOrderThreshold,
          notificationEmail,
          maxUsers: null, // Sin límite por defecto
          maxOrganizations: null, // Sin límite por defecto
        });

        // 3. Verificar si el usuario administrador ya existe
        const [existingUser] = await database
          .select()
          .from(users)
          .where(eq(users.email, adminUserEmail))
          .limit(1);

        let adminUserId: number;

        if (existingUser) {
          // Usuario ya existe, usar su ID
          // NO modificamos su partnerId porque podría pertenecer a otro partner
          // La relación multi-partner se maneja en partner_users
          adminUserId = existingUser.id;
          
          // Verificar si ya está asociado a este partner
          const [existingPartnerUser] = await database
            .select()
            .from(partnerUsers)
            .where(
              and(
                eq(partnerUsers.partnerId, partnerId),
                eq(partnerUsers.userId, adminUserId)
              )
            )
            .limit(1);
          
          if (existingPartnerUser) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Este usuario ya está asociado a este partner",
            });
          }
        } else {
          // Crear nuevo usuario
          // Nota: En producción, esto debería integrarse con Clerk
          const userResult = await database.insert(users).values({
            openId: `temp-${Date.now()}-${Math.random()}`, // Temporal, se actualizará con Clerk
            name: adminUserName,
            email: adminUserEmail,
            loginMethod: "clerk",
            role: "admin",
            partnerId, // Este es su partner principal
          });

          adminUserId = userResult[0].insertId;
        }

        // 4. Crear relación en partner_users
        await database.insert(partnerUsers).values({
          partnerId,
          userId: adminUserId,
          role: "owner",
          canManageBranding: true,
          canManagePricing: true,
          canManageUsers: true,
          canViewAnalytics: true,
        });

        return {
          success: true,
          partnerId,
          userId: adminUserId,
          slug,
          message: "Partner registrado exitosamente",
        };
      } catch (error) {
        console.error("[Onboarding] Error during registration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al registrar el partner. Por favor, intente nuevamente.",
        });
      }
    }),

  /**
   * Obtener estado del onboarding del usuario actual
   * Verifica si el usuario ya completó el onboarding
   */
  getOnboardingStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      if (!ctx.partnerId) {
        return {
          completed: false,
          hasPartner: false,
        };
      }

      // Verificar que el partner existe y está activo
      const [partner] = await database
        .select()
        .from(partners)
        .where(eq(partners.id, ctx.partnerId))
        .limit(1);

      if (!partner) {
        return {
          completed: false,
          hasPartner: false,
        };
      }

      // Verificar que el usuario es parte del partner
      const [partnerUser] = await database
        .select()
        .from(partnerUsers)
        .where(
          and(
            eq(partnerUsers.partnerId, ctx.partnerId),
            eq(partnerUsers.userId, ctx.user.id)
          )
        )
        .limit(1);

      return {
        completed: true,
        hasPartner: true,
        isPartnerUser: !!partnerUser,
        partnerStatus: partner.status,
        partnerName: partner.name,
        partnerSlug: partner.slug,
      };
    }),

  /**
   * Reenviar invitación de onboarding
   * Para usuarios que no completaron el proceso
   */
  resendInvitation: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Aquí se implementaría el envío de email
      // Por ahora solo retornamos éxito
      
      console.log(`[Onboarding] Resending invitation to ${input.email}`);
      
      return {
        success: true,
        message: "Invitación reenviada exitosamente",
      };
    }),
});
