-- Migration: Add Organization Sharing System
-- Date: 2026-01-05
-- Description: Adds organizationId to operational tables and creates organization_sharing_settings table

-- ============================================================================
-- STEP 1: Create organization_sharing_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS `organization_sharing_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `organizationId` int NOT NULL,
  `resource` enum('clients', 'pianos', 'services', 'appointments', 'inventory', 'invoices', 'quotes', 'reminders') NOT NULL,
  `sharingModel` enum('private', 'shared_read', 'shared_write') NOT NULL DEFAULT 'private',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `org_resource_idx` UNIQUE(`organizationId`, `resource`),
  CONSTRAINT `organization_sharing_settings_organizationId_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
);

-- ============================================================================
-- STEP 2: Add organizationId column to operational tables
-- ============================================================================

-- Add organizationId to clients table
ALTER TABLE `clients` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to pianos table
ALTER TABLE `pianos` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to services table
ALTER TABLE `services` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to inventory table
ALTER TABLE `inventory` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to appointments table
ALTER TABLE `appointments` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to invoices table
ALTER TABLE `invoices` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to serviceRates table
ALTER TABLE `serviceRates` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to reminders table
ALTER TABLE `reminders` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to quotes table
ALTER TABLE `quotes` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- Add organizationId to quoteTemplates table
ALTER TABLE `quoteTemplates` ADD COLUMN `organizationId` int NULL AFTER `partnerId`;

-- ============================================================================
-- STEP 3: Populate organizationId for existing data
-- ============================================================================

-- For users that belong to an organization, set organizationId in their data
-- This will be done programmatically via a data migration script
-- See: server/migrations/populate_organization_ids.ts

-- ============================================================================
-- STEP 4: Create default sharing settings for existing organizations
-- ============================================================================

-- Insert default sharing settings for all existing organizations
-- Default: All resources are private except inventory (shared_write)
INSERT INTO `organization_sharing_settings` (`organizationId`, `resource`, `sharingModel`)
SELECT 
  o.id,
  r.resource,
  CASE 
    WHEN r.resource = 'inventory' THEN 'shared_write'
    ELSE 'private'
  END as sharingModel
FROM `organizations` o
CROSS JOIN (
  SELECT 'clients' as resource
  UNION ALL SELECT 'pianos'
  UNION ALL SELECT 'services'
  UNION ALL SELECT 'appointments'
  UNION ALL SELECT 'inventory'
  UNION ALL SELECT 'invoices'
  UNION ALL SELECT 'quotes'
  UNION ALL SELECT 'reminders'
) r
WHERE NOT EXISTS (
  SELECT 1 FROM `organization_sharing_settings` oss
  WHERE oss.organizationId = o.id AND oss.resource = r.resource
);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. organizationId is nullable to support individual technicians (not in an organization)
-- 2. For individual technicians, organizationId will remain NULL
-- 3. The sharing system only applies when organizationId is NOT NULL
-- 4. A separate data migration script will populate organizationId for existing organization members
