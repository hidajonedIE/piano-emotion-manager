/**
 * Middleware de Contexto de Organización
 * Piano Emotion Manager
 * 
 * Este middleware enriquece el contexto de tRPC con información sobre:
 * - El partner del usuario
 * - La organización del usuario (si pertenece a una)
 * - El rol del usuario en la organización
 * - La configuración de sharing de la organización
 * 
 * Esto permite que los routers apliquen automáticamente la lógica
 * de filtrado y permisos según la configuración de cada organización.
 */

import { TRPCError } from "@trpc/server";
import { getDb } from "../db.js";
import { users } from "../../drizzle/schema.js";
import { organizations, organizationMembers } from "../../drizzle/schema.js";
import { organizationSharingSettings } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Tipo de contexto enriquecido con información de organización
 */
export interface OrganizationContext {
  userId: number;
  odId: string; // Clerk user ID
  partnerId: number;
  organizationId: number | null;
  organizationRole: string | null;
  isOrganizationOwner: boolean;
  sharingSettings: Map<string, string>; // resource -> sharing_model
}

/**
 * Obtiene el contexto de organización para un usuario
 * 
 * @param userId - ID del usuario autenticado
 * @returns Contexto de organización completo
 */
export async function getOrganizationContext(userId: number): Promise<OrganizationContext> {
  try {
    const db = await getDb();
    
    // 1. Obtener información básica del usuario
    const user = await db
      .select({
        id: users.id,
        odId: users.odId,
        partnerId: users.partnerId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Usuario no encontrado",
      });
    }

    const { odId, partnerId } = user[0];

    // 2. Verificar si el usuario pertenece a una organización
    const membership = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, "active")
        )
      )
      .limit(1);

    let organizationId: number | null = null;
    let organizationRole: string | null = null;
    let isOrganizationOwner = false;
    const sharingSettings = new Map<string, string>();

    if (membership && membership.length > 0) {
      organizationId = membership[0].organizationId;
      organizationRole = membership[0].role;

      // 3. Verificar si es el owner de la organización
      const org = await db
        .select({
          ownerId: organizations.ownerId,
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (org && org.length > 0) {
        isOrganizationOwner = org[0].ownerId === userId;
      }

      // 4. Obtener la configuración de sharing de la organización
      const settings = await db
        .select({
          resource: organizationSharingSettings.resource,
          model: organizationSharingSettings.sharingModel,
        })
        .from(organizationSharingSettings)
        .where(eq(organizationSharingSettings.organizationId, organizationId));

      // Convertir a Map para acceso rápido
      settings.forEach((setting) => {
        sharingSettings.set(setting.resource, setting.model);
      });

      // Si no hay configuración para un recurso, asumir 'private' por defecto
      const defaultResources = [
        "clients",
        "pianos",
        "services",
        "appointments",
        "inventory",
        "invoices",
        "quotes",
        "reminders",
      ];

      defaultResources.forEach((resource) => {
        if (!sharingSettings.has(resource)) {
          sharingSettings.set(resource, "private");
        }
      });
    }

    return {
      userId,
      odId,
      partnerId,
      organizationId,
      organizationRole,
      isOrganizationOwner,
      sharingSettings,
    };
  } catch (error) {
    console.error("Error obteniendo contexto de organización:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error obteniendo contexto de organización",
    });
  }
}

/**
 * Middleware de tRPC que añade el contexto de organización
 * 
 * Uso:
 * ```typescript
 * export const protectedProcedure = publicProcedure
 *   .use(requireAuth)
 *   .use(withOrganizationContext);
 * ```
 */
export const withOrganizationContext = async ({ ctx, next }: any) => {
  if (!ctx.user || !ctx.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Usuario no autenticado",
    });
  }

  const orgContext = await getOrganizationContext(ctx.user.id);

  return next({
    ctx: {
      ...ctx,
      orgContext,
    },
  });
};
