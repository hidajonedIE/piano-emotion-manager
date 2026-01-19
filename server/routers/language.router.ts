/**
 * Language Router
 * Gestión de idiomas para el sistema multi-tenant
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { users, partners, partnerSettings } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

/**
 * Idiomas soportados por la aplicación
 * Debe coincidir con los idiomas en /locales
 */
export const SUPPORTED_LANGUAGES = ['es', 'pt', 'it', 'fr', 'de', 'da', 'en', 'no', 'sv'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Información de idiomas
 */
export const LANGUAGE_INFO: Record<SupportedLanguage, { name: string; nativeName: string; flag: string }> = {
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  da: { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  no: { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
};

/**
 * Idioma por defecto de la aplicación
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Schema para código de idioma
 */
const languageCodeSchema = z.enum(SUPPORTED_LANGUAGES, {
  errorMap: () => ({ message: 'Idioma no soportado' }),
});

/**
 * Schema para array de códigos de idioma
 */
const languageArraySchema = z.array(languageCodeSchema).min(1, 'Debe haber al menos un idioma');

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Validar que un idioma esté soportado
 */
function isLanguageSupported(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage);
}

/**
 * Obtener idiomas disponibles para un partner
 */
async function getPartnerAvailableLanguages(partnerId: number): Promise<SupportedLanguage[]> {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Obtener configuración del partner
  const [settings] = await database
    .select({ supportedLanguages: partnerSettings.supportedLanguages })
    .from(partnerSettings)
    .where(eq(partnerSettings.partnerId, partnerId))
    .limit(1);

  // Si no hay restricción, todos los idiomas están disponibles
  if (!settings || !settings.supportedLanguages) {
    return [...SUPPORTED_LANGUAGES];
  }

  // Validar y filtrar idiomas soportados
  const partnerLanguages = settings.supportedLanguages as string[];
  return partnerLanguages.filter(isLanguageSupported) as SupportedLanguage[];
}

/**
 * Determinar el idioma apropiado para un usuario
 * Flujo: preferredLanguage > partner defaultLanguage > DEFAULT_LANGUAGE
 */
async function getUserLanguage(userId: number, partnerId: number): Promise<SupportedLanguage> {
  const database = await getDb();
  if (!database) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // 1. Obtener idioma preferido del usuario
  const [user] = await database
    .select({ preferredLanguage: users.preferredLanguage })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.preferredLanguage && isLanguageSupported(user.preferredLanguage)) {
    return user.preferredLanguage as SupportedLanguage;
  }

  // 2. Obtener idioma por defecto del partner
  const [partner] = await database
    .select({ defaultLanguage: partners.defaultLanguage })
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);

  if (partner?.defaultLanguage && isLanguageSupported(partner.defaultLanguage)) {
    return partner.defaultLanguage as SupportedLanguage;
  }

  // 3. Fallback al idioma por defecto
  return DEFAULT_LANGUAGE;
}

// ============================================================================
// ROUTER
// ============================================================================

export const languageRouter = router({
  /**
   * Obtener idioma actual del usuario
   * Determina el idioma según: preferencia del usuario > partner > defecto
   */
  getCurrentLanguage: protectedProcedure
    .query(async ({ ctx }) => {
      const language = await getUserLanguage(ctx.user.id, ctx.partnerId);
      
      return {
        code: language,
        ...LANGUAGE_INFO[language],
      };
    }),

  /**
   * Obtener todos los idiomas soportados por la aplicación
   */
  getSupportedLanguages: protectedProcedure
    .query(async () => {
      return SUPPORTED_LANGUAGES.map(code => ({
        code,
        ...LANGUAGE_INFO[code],
      }));
    }),

  /**
   * Obtener idiomas disponibles para el partner actual
   * Respeta las restricciones configuradas en partner_settings
   */
  getAvailableLanguages: protectedProcedure
    .query(async ({ ctx }) => {
      const availableLanguages = await getPartnerAvailableLanguages(ctx.partnerId);
      
      return availableLanguages.map(code => ({
        code,
        ...LANGUAGE_INFO[code],
      }));
    }),

  /**
   * Actualizar idioma preferido del usuario
   */
  updateUserLanguage: protectedProcedure
    .input(z.object({ language: languageCodeSchema }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verificar que el idioma esté disponible para el partner
      const availableLanguages = await getPartnerAvailableLanguages(ctx.partnerId);
      
      if (!availableLanguages.includes(input.language)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este idioma no está disponible para tu organización",
        });
      }

      // Actualizar idioma del usuario
      await database
        .update(users)
        .set({ preferredLanguage: input.language })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        language: input.language,
        message: "Idioma actualizado correctamente",
      };
    }),

  /**
   * Obtener configuración de idioma del partner actual
   * Solo para administradores del partner
   */
  getPartnerLanguageConfig: adminProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Obtener idioma por defecto del partner
      const [partner] = await database
        .select({ defaultLanguage: partners.defaultLanguage })
        .from(partners)
        .where(eq(partners.id, ctx.partnerId))
        .limit(1);

      // Obtener idiomas soportados del partner
      const [settings] = await database
        .select({ supportedLanguages: partnerSettings.supportedLanguages })
        .from(partnerSettings)
        .where(eq(partnerSettings.partnerId, ctx.partnerId))
        .limit(1);

      const supportedLanguages = settings?.supportedLanguages as string[] | null;

      return {
        defaultLanguage: partner?.defaultLanguage || DEFAULT_LANGUAGE,
        supportedLanguages: supportedLanguages || [...SUPPORTED_LANGUAGES],
        allLanguagesEnabled: !supportedLanguages,
      };
    }),

  /**
   * Actualizar idioma por defecto del partner
   * Solo para administradores
   */
  updatePartnerDefaultLanguage: adminProcedure
    .input(z.object({ language: languageCodeSchema }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verificar que el idioma esté en los idiomas soportados del partner
      const availableLanguages = await getPartnerAvailableLanguages(ctx.partnerId);
      
      if (!availableLanguages.includes(input.language)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este idioma no está en la lista de idiomas soportados del partner",
        });
      }

      // Actualizar idioma por defecto
      await database
        .update(partners)
        .set({ defaultLanguage: input.language })
        .where(eq(partners.id, ctx.partnerId));

      return {
        success: true,
        language: input.language,
        message: "Idioma por defecto actualizado correctamente",
      };
    }),

  /**
   * Actualizar idiomas soportados por el partner
   * Solo para administradores
   */
  updatePartnerSupportedLanguages: protectedProcedure
    .input(z.object({ 
      languages: languageArraySchema,
      enableAll: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Si enableAll es true, permitir todos los idiomas (NULL)
      const supportedLanguages = input.enableAll ? null : input.languages;

      // Verificar que el idioma por defecto del partner esté en la lista
      if (!input.enableAll) {
        const [partner] = await database
          .select({ defaultLanguage: partners.defaultLanguage })
          .from(partners)
          .where(eq(partners.id, ctx.partnerId))
          .limit(1);

        if (partner && !input.languages.includes(partner.defaultLanguage as SupportedLanguage)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "El idioma por defecto del partner debe estar en la lista de idiomas soportados",
          });
        }
      }

      // Actualizar idiomas soportados
      await database
        .update(partnerSettings)
        .set({ supportedLanguages: supportedLanguages as any })
        .where(eq(partnerSettings.partnerId, ctx.partnerId));

      return {
        success: true,
        languages: supportedLanguages || [...SUPPORTED_LANGUAGES],
        message: "Idiomas soportados actualizados correctamente",
      };
    }),

  /**
   * Obtener estadísticas de uso de idiomas
   * Solo para administradores
   */
  getLanguageStats: adminProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Obtener usuarios del partner con su idioma preferido
      const usersWithLanguage = await database
        .select({
          preferredLanguage: users.preferredLanguage,
        })
        .from(users)
        .where(eq(users.partnerId, ctx.partnerId));

      // Contar usuarios por idioma
      const languageCounts: Record<string, number> = {};
      let usersWithoutPreference = 0;

      for (const user of usersWithLanguage) {
        if (user.preferredLanguage) {
          languageCounts[user.preferredLanguage] = (languageCounts[user.preferredLanguage] || 0) + 1;
        } else {
          usersWithoutPreference++;
        }
      }

      // Obtener idioma por defecto del partner
      const [partner] = await database
        .select({ defaultLanguage: partners.defaultLanguage })
        .from(partners)
        .where(eq(partners.id, ctx.partnerId))
        .limit(1);

      const defaultLanguage = partner?.defaultLanguage || DEFAULT_LANGUAGE;

      return {
        totalUsers: usersWithLanguage.length,
        usersWithoutPreference,
        usersWithPreference: usersWithLanguage.length - usersWithoutPreference,
        languageCounts,
        defaultLanguage,
        mostUsedLanguage: Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || defaultLanguage,
      };
    }),
});
