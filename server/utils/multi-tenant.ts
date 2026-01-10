import { and, eq, SQL } from "drizzle-orm";

/**
 * Filtra por partnerId solamente
 * Usado para consultas simples donde solo necesitamos filtrar por partner
 */
export function filterByPartner(
  partnerIdColumn: any,
  partnerId: string | null | undefined
): SQL<any> {
  if (partnerId === null || partnerId === undefined) {
    // Si no hay partnerId, retornar una condición que siempre sea verdadera
    return eq(1, 1);
  }
  return eq(partnerIdColumn, partnerId);
}

/**
 * Filtra por partnerId Y una condición adicional
 * Usado para consultas donde necesitamos filtrar por partner y otra condición
 */
export function filterByPartnerAnd(
  partnerIdColumn: any,
  partnerId: string | null | undefined,
  additionalCondition: SQL<any>
): SQL<any> {
  if (partnerId === null || partnerId === undefined) {
    // Si no hay partnerId, solo aplicar la condición adicional
    return additionalCondition;
  }
  return and(eq(partnerIdColumn, partnerId), additionalCondition);
}

/**
 * Añade partnerId a los datos de inserción
 * Usado al crear nuevas entidades para asegurar que se asocien al partner correcto
 */
export function addPartnerToInsert(
  data: any,
  partnerId: string | null | undefined
): any {
  return {
    ...data,
    partnerId: partnerId || null,
  };
}

/**
 * Valida permisos de escritura (comentado por ahora, ya que la lógica de organización está desactivada)
 * En el futuro, esto podría verificar si el usuario tiene permiso para modificar una entidad
 */
export function validateWritePermission(
  orgContext: any,
  resourceType: string,
  ownerId: string
): void {
  // Lógica de validación desactivada temporalmente
  // En el futuro, implementar validación basada en roles/permisos
}

/**
 * Obtiene el contexto de la organización del usuario
 * (Desactivado por ahora, ya que la lógica de organización está siendo eliminada)
 */
export function getOrganizationContext(user: any): any {
  return null;
}
