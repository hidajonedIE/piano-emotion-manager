/**
 * Servicio de Filtrado Inteligente
 * Piano Emotion Manager
 * 
 * Este servicio proporciona funciones para construir filtros de base de datos
 * que respetan la configuración de sharing de cada organización.
 * 
 * Decide automáticamente si filtrar por:
 * - odId (datos privados del técnico)
 * - organizationId (datos compartidos de la organización)
 * 
 * Según la configuración de sharing y el rol del usuario.
 */

import { SQL, and, eq, or } from "drizzle-orm";
import { OrganizationContext } from "../../middleware/organization-context";

/**
 * Tipo de recurso compartible
 */
export type SharableResource =
  | "clients"
  | "pianos"
  | "services"
  | "appointments"
  | "inventory"
  | "invoices"
  | "quotes"
  | "reminders";

/**
 * Modelo de sharing
 */
export type SharingModel = "private" | "shared_read" | "shared_write";

/**
 * Opciones para el filtrado
 */
export interface FilterOptions {
  resource: SharableResource;
  userOdId: string;
  includeOwn?: boolean; // Si true, siempre incluye los datos propios del usuario
}

/**
 * Resultado del filtrado
 */
export interface FilterResult {
  shouldFilterByOdId: boolean;
  shouldFilterByOrganization: boolean;
  canWrite: boolean;
  organizationId: number | null;
}

/**
 * Servicio de Filtrado Inteligente
 */
export class SmartFilterService {
  /**
   * Determina cómo filtrar los datos según el contexto de organización
   * 
   * @param orgContext - Contexto de organización del usuario
   * @param options - Opciones de filtrado
   * @returns Resultado del filtrado con instrucciones de cómo filtrar
   */
  static getFilterStrategy(
    orgContext: OrganizationContext,
    options: FilterOptions
  ): FilterResult {
    const { resource, includeOwn = true } = options;

    // Si el usuario NO pertenece a una organización, siempre filtrar por odId
    if (!orgContext.organizationId) {
      return {
        shouldFilterByOdId: true,
        shouldFilterByOrganization: false,
        canWrite: true,
        organizationId: null,
      };
    }

    // Obtener la configuración de sharing para este recurso
    const sharingModel = orgContext.sharingSettings.get(resource) as SharingModel || "private";

    // Determinar la estrategia según el modelo de sharing
    switch (sharingModel) {
      case "private":
        // Datos privados: cada técnico solo ve sus propios datos
        return {
          shouldFilterByOdId: true,
          shouldFilterByOrganization: false,
          canWrite: true,
          organizationId: null,
        };

      case "shared_read":
        // Datos compartidos en lectura: todos ven, solo el creador edita
        return {
          shouldFilterByOdId: false,
          shouldFilterByOrganization: true,
          canWrite: false, // Solo lectura para datos de otros
          organizationId: orgContext.organizationId,
        };

      case "shared_write":
        // Datos compartidos en escritura: todos ven y editan
        return {
          shouldFilterByOdId: false,
          shouldFilterByOrganization: true,
          canWrite: true,
          organizationId: orgContext.organizationId,
        };

      default:
        // Por defecto, privado
        return {
          shouldFilterByOdId: true,
          shouldFilterByOrganization: false,
          canWrite: true,
          organizationId: null,
        };
    }
  }

  /**
   * Construye una condición SQL para filtrar datos según el contexto
   * 
   * @param orgContext - Contexto de organización
   * @param options - Opciones de filtrado
   * @param table - Tabla de Drizzle con los campos odId y organizationId
   * @returns Condición SQL para usar en .where()
   */
  static buildWhereCondition(
    orgContext: OrganizationContext,
    options: FilterOptions,
    table: any
  ): SQL {
    const strategy = this.getFilterStrategy(orgContext, options);
    const { userOdId } = options;

    if (strategy.shouldFilterByOdId) {
      // Filtrar solo por odId (datos privados)
      return eq(table.odId, userOdId);
    }

    if (strategy.shouldFilterByOrganization && strategy.organizationId) {
      if (options.includeOwn) {
        // Filtrar por organizationId O por odId (incluir datos propios)
        return or(
          eq(table.organizationId, strategy.organizationId),
          eq(table.odId, userOdId)
        )!;
      } else {
        // Filtrar solo por organizationId
        return eq(table.organizationId, strategy.organizationId);
      }
    }

    // Fallback: filtrar por odId
    return eq(table.odId, userOdId);
  }

  /**
   * Verifica si el usuario puede escribir/editar un registro
   * 
   * @param orgContext - Contexto de organización
   * @param resource - Recurso a verificar
   * @param recordOdId - odId del registro
   * @param userOdId - odId del usuario actual
   * @returns true si el usuario puede editar el registro
   */
  static canWrite(
    orgContext: OrganizationContext,
    resource: SharableResource,
    recordOdId: string,
    userOdId: string
  ): boolean {
    // El usuario siempre puede editar sus propios registros
    if (recordOdId === userOdId) {
      return true;
    }

    // Si no pertenece a una organización, no puede editar datos de otros
    if (!orgContext.organizationId) {
      return false;
    }

    // Obtener la configuración de sharing
    const sharingModel = orgContext.sharingSettings.get(resource) as SharingModel || "private";

    // Solo puede editar si el sharing es 'shared_write'
    return sharingModel === "shared_write";
  }

  /**
   * Verifica si el usuario puede crear un registro
   * 
   * @param orgContext - Contexto de organización
   * @param resource - Recurso a crear
   * @returns true si el usuario puede crear el registro
   */
  static canCreate(
    orgContext: OrganizationContext,
    resource: SharableResource
  ): boolean {
    // Todos los usuarios pueden crear registros
    // La diferencia está en si se crean como privados o compartidos
    return true;
  }

  /**
   * Determina los valores de odId y organizationId para un nuevo registro
   * 
   * @param orgContext - Contexto de organización
   * @param resource - Recurso a crear
   * @param userOdId - odId del usuario
   * @returns Objeto con odId y organizationId para el nuevo registro
   */
  static getCreateValues(
    orgContext: OrganizationContext,
    resource: SharableResource,
    userOdId: string
  ): { odId: string; organizationId: number | null; partnerId: number } {
    const strategy = this.getFilterStrategy(orgContext, { resource, userOdId });

    return {
      odId: userOdId,
      organizationId: strategy.shouldFilterByOrganization ? strategy.organizationId : null,
      partnerId: orgContext.partnerId,
    };
  }
}
