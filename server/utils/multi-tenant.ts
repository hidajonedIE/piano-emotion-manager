/**
 * Multi-Tenant Utilities
 * 
 * Helper functions for multi-tenant operations in Piano Emotion Manager
 * Supports both partnerId (licensing) and organizationId (team workspace)
 */

import { eq, and, or, SQL } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { SmartFilterService, type SharableResource } from "../services/organization/smart-filter.service.js";
import type { OrganizationContext } from "../middleware/organization-context.js";

/**
 * Creates a WHERE clause for filtering by partnerId
 * 
 * @param partnerIdColumn - The partnerId column from the table
 * @param partnerId - The partner ID to filter by
 * @returns SQL condition for WHERE clause
 * 
 * @example
 * ```typescript
 * const items = await db
 *   .select()
 *   .from(clients)
 *   .where(filterByPartner(clients.partnerId, ctx.partnerId));
 * ```
 */
export function filterByPartner(
  partnerIdColumn: MySqlColumn,
  partnerId: number | null
): SQL {
  if (!partnerId) {
    throw new Error("partnerId is required for multi-tenant operations");
  }
  return eq(partnerIdColumn, partnerId);
}

/**
 * Combines multiple WHERE conditions with partnerId filter
 * 
 * @param partnerIdColumn - The partnerId column from the table
 * @param partnerId - The partner ID to filter by
 * @param conditions - Additional SQL conditions
 * @returns Combined SQL condition
 * 
 * @example
 * ```typescript
 * const items = await db
 *   .select()
 *   .from(clients)
 *   .where(filterByPartnerAnd(
 *     clients.partnerId,
 *     ctx.partnerId,
 *     eq(clients.id, clientId)
 *   ));
 * ```
 */
export function filterByPartnerAnd(
  partnerIdColumn: MySqlColumn,
  partnerId: number | null,
  ...conditions: SQL[]
): SQL {
  const partnerFilter = filterByPartner(partnerIdColumn, partnerId);
  return and(partnerFilter, ...conditions)!;
}

/**
 * Validates that a partnerId is present in the context
 * Throws an error if not present
 * 
 * @param partnerId - The partner ID from context
 * @throws Error if partnerId is null or undefined
 * 
 * @example
 * ```typescript
 * .query(async ({ ctx }) => {
 *   validatePartnerContext(ctx.partnerId);
 *   // Continue with query...
 * })
 * ```
 */
export function validatePartnerContext(partnerId: number | null): asserts partnerId is number {
  if (!partnerId) {
    throw new Error("Partner context is required but not available. User may not be properly authenticated.");
  }
}

/**
 * Adds partnerId to insert data
 * 
 * @param data - The data object to insert
 * @param partnerId - The partner ID to add
 * @returns Data with partnerId added
 * 
 * @example
 * ```typescript
 * const newClient = addPartnerToInsert({
 *   name: "John Doe",
 *   email: "john@example.com"
 * }, ctx.partnerId);
 * 
 * await getDb().insert(clients).values(newClient);
 * ```
 */
export function addPartnerToInsert<T extends Record<string, unknown>>(
  data: T,
  partnerId: number | null
): T & { partnerId: number } {
  validatePartnerContext(partnerId);
  return {
    ...data,
    partnerId,
  };
}

/**
 * Type guard to check if a value is a valid partner ID
 * 
 * @param value - Value to check
 * @returns True if value is a valid partner ID
 */
export function isValidPartnerId(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

/**
 * Gets the default partner ID (Piano Emotion)
 * Used for fallback scenarios
 * 
 * @returns Default partner ID
 */
export function getDefaultPartnerId(): number {
  return 1; // Piano Emotion
}

/**
 * Ensures a partnerId is valid, falling back to default if needed
 * 
 * @param partnerId - Partner ID to validate
 * @param allowDefault - Whether to allow fallback to default (default: false)
 * @returns Valid partner ID
 * @throws Error if partnerId is invalid and allowDefault is false
 */
export function ensureValidPartnerId(
  partnerId: number | null | undefined,
  allowDefault = false
): number {
  if (isValidPartnerId(partnerId)) {
    return partnerId;
  }
  
  if (allowDefault) {
    return getDefaultPartnerId();
  }
  
  throw new Error("Invalid partnerId and default not allowed");
}

// ============================================================================
// ORGANIZATION & SHARING UTILITIES
// ============================================================================

/**
 * Creates a smart WHERE clause that respects organization sharing settings
 * 
 * This function automatically determines whether to filter by:
 * - odId (private data)
 * - organizationId (shared data)
 * 
 * Based on the user's organization context and sharing configuration.
 * 
 * @param table - The table with odId and organizationId columns
 * @param orgContext - Organization context from middleware
 * @param resource - The resource type being queried
 * @param options - Additional filtering options
 * @returns SQL condition for WHERE clause
 * 
 * @example
 * ```typescript
 * const items = await db
 *   .select()
 *   .from(clients)
 *   .where(filterByOrganization(
 *     clients,
 *     ctx.organization,
 *     "clients"
 *   ));
 * ```
 */
export function filterByOrganization(
  table: any,
  orgContext: OrganizationContext,
  resource: SharableResource,
  options?: { includeOwn?: boolean }
): SQL {
  return SmartFilterService.buildWhereCondition(
    orgContext,
    {
      resource,
      userOdId: orgContext.odId,
      includeOwn: options?.includeOwn ?? true,
    },
    table
  );
}

/**
 * Combines partner filter with organization filter
 * 
 * @param table - The table with partnerId, odId, and organizationId
 * @param partnerId - Partner ID to filter by
 * @param orgContext - Organization context from middleware
 * @param resource - The resource type being queried
 * @param additionalConditions - Additional SQL conditions
 * @returns Combined SQL condition
 * 
 * @example
 * ```typescript
 * const items = await db
 *   .select()
 *   .from(clients)
 *   .where(filterByPartnerAndOrganization(
 *     clients,
 *     ctx.partnerId,
 *     ctx.organization,
 *     "clients",
 *     eq(clients.id, clientId)
 *   ));
 * ```
 */
export function filterByPartnerAndOrganization(
  table: any,
  partnerId: number | null,
  orgContext: OrganizationContext,
  resource: SharableResource,
  ...additionalConditions: SQL[]
): SQL {
  const partnerFilter = filterByPartner(table.partnerId, partnerId);
  const orgFilter = filterByOrganization(table, orgContext, resource);
  
  if (additionalConditions.length > 0) {
    return and(partnerFilter, orgFilter, ...additionalConditions)!;
  }
  
  return and(partnerFilter, orgFilter)!;
}

/**
 * Adds partnerId, odId, and organizationId to insert data
 * 
 * Automatically determines the correct organizationId based on sharing settings.
 * 
 * @param data - The data object to insert
 * @param orgContext - Organization context from middleware
 * @param resource - The resource type being created
 * @returns Data with partnerId, odId, and organizationId added
 * 
 * @example
 * ```typescript
 * const newClient = addOrganizationToInsert(
 *   { name: "John Doe", email: "john@example.com" },
 *   ctx.organization,
 *   "clients"
 * );
 * 
 * await getDb().insert(clients).values(newClient);
 * ```
 */
export function addOrganizationToInsert<T extends Record<string, unknown>>(
  data: T,
  orgContext: OrganizationContext,
  resource: SharableResource
): T & { partnerId: number; odId: string; organizationId: number | null } {
  const values = SmartFilterService.getCreateValues(
    orgContext,
    resource,
    orgContext.odId
  );
  
  return {
    ...data,
    partnerId: values.partnerId,
    odId: values.odId,
    organizationId: values.organizationId,
  };
}

/**
 * Checks if a user can write/edit a specific record
 * 
 * @param orgContext - Organization context from middleware
 * @param resource - The resource type
 * @param recordOdId - The odId of the record
 * @returns True if the user can edit the record
 * 
 * @example
 * ```typescript
 * if (!canWriteRecord(ctx.organization, "clients", client.odId)) {
 *   throw new Error("No tienes permisos para editar este cliente");
 * }
 * ```
 */
export function canWriteRecord(
  orgContext: OrganizationContext,
  resource: SharableResource,
  recordOdId: string
): boolean {
  return SmartFilterService.canWrite(
    orgContext,
    resource,
    recordOdId,
    orgContext.odId
  );
}

/**
 * Validates that a user has write permissions for a record
 * Throws an error if not
 * 
 * @param orgContext - Organization context from middleware
 * @param resource - The resource type
 * @param recordOdId - The odId of the record
 * @throws Error if user cannot write to the record
 * 
 * @example
 * ```typescript
 * validateWritePermission(ctx.organization, "clients", client.odId);
 * // Continue with update...
 * ```
 */
export function validateWritePermission(
  orgContext: OrganizationContext,
  resource: SharableResource,
  recordOdId: string
): void {
  if (!canWriteRecord(orgContext, resource, recordOdId)) {
    throw new Error(
      `No tienes permisos para editar este ${resource}. Solo el creador o miembros con permisos de escritura pueden editarlo.`
    );
  }
}
