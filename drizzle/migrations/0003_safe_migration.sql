-- ================================================
-- MIGRACIÓN SEGURA: Sincronización Base de Datos
-- Piano Emotion Manager - Fase 1
-- Fecha: 2026-01-06
-- ================================================

-- PASO 1: Crear tabla organizations (REQUERIDA ANTES DE organization_sharing_settings)
-- ================================================

CREATE TABLE IF NOT EXISTS `organizations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `logo` text,
  `ownerId` int NOT NULL,
  `subscriptionPlan` enum('free','starter','team','business','enterprise') NOT NULL DEFAULT 'free',
  `maxMembers` int NOT NULL DEFAULT 1,
  `subscriptionExpiresAt` timestamp,
  `taxId` varchar(50),
  `legalName` varchar(255),
  `address` text,
  `city` varchar(100),
  `postalCode` varchar(20),
  `country` varchar(2) DEFAULT 'ES',
  `phone` varchar(50),
  `email` varchar(320),
  `website` varchar(255),
  `bankAccount` varchar(50),
  `bankName` varchar(100),
  `swiftBic` varchar(11),
  `invoicePrefix` varchar(10) DEFAULT 'FAC',
  `invoiceNextNumber` int DEFAULT 1,
  `defaultTaxRate` decimal(5,2) DEFAULT 21.00,
  `defaultCurrency` varchar(3) DEFAULT 'EUR',
  `defaultServiceDuration` int DEFAULT 60,
  `workingHoursStart` varchar(5) DEFAULT '09:00',
  `workingHoursEnd` varchar(5) DEFAULT '18:00',
  `workingDays` json,
  `timezone` varchar(50) DEFAULT 'Europe/Madrid',
  `notifyOnNewAppointment` boolean DEFAULT true,
  `notifyOnAssignment` boolean DEFAULT true,
  `notifyOnCompletion` boolean DEFAULT true,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
  CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);

-- PASO 2: Crear tabla partners
-- ================================================

CREATE TABLE IF NOT EXISTS `partners` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `customDomain` varchar(255),
  `logo` text,
  `primaryColor` varchar(7) DEFAULT '#3b82f6',
  `secondaryColor` varchar(7) DEFAULT '#10b981',
  `brandName` varchar(255),
  `status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
  `allowMultipleSuppliers` boolean NOT NULL DEFAULT false,
  `defaultLanguage` varchar(5) NOT NULL DEFAULT 'es',
  `supportEmail` varchar(320),
  `supportPhone` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `partners_id` PRIMARY KEY(`id`),
  CONSTRAINT `partners_slug_unique` UNIQUE(`slug`)
);

-- PASO 3: Insertar partner por defecto
-- ================================================

INSERT INTO `partners` (
  `id`,
  `slug`,
  `name`,
  `email`,
  `status`,
  `defaultLanguage`,
  `brandName`,
  `primaryColor`,
  `secondaryColor`
) VALUES (
  1,
  'piano-emotion',
  'Piano Emotion',
  'info@pianoemotion.com',
  'active',
  'es',
  'Piano Emotion Manager',
  '#3b82f6',
  '#10b981'
);

-- PASO 4: Crear tablas relacionadas de partners
-- ================================================

CREATE TABLE IF NOT EXISTS `partner_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `partnerId` int NOT NULL,
  `ecommerceEnabled` boolean NOT NULL DEFAULT false,
  `ecommerceApiUrl` text,
  `ecommerceApiKey` text,
  `autoOrderEnabled` boolean NOT NULL DEFAULT false,
  `autoOrderThreshold` int DEFAULT 5,
  `notificationEmail` varchar(320),
  `notificationWebhook` text,
  `maxUsers` int,
  `maxOrganizations` int,
  `supportedLanguages` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `partner_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `partner_settings_partnerId_unique` UNIQUE(`partnerId`)
);

CREATE TABLE IF NOT EXISTS `partner_pricing` (
  `id` int AUTO_INCREMENT NOT NULL,
  `partnerId` int NOT NULL,
  `planCode` enum('free','professional','premium') NOT NULL,
  `monthlyPrice` decimal(10,2),
  `yearlyPrice` decimal(10,2),
  `minMonthlyRevenue` decimal(10,2),
  `discountPercentage` int DEFAULT 0,
  `customFeatures` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `partner_pricing_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `partner_users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `partnerId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','admin','manager') NOT NULL DEFAULT 'manager',
  `canManageBranding` boolean NOT NULL DEFAULT false,
  `canManagePricing` boolean NOT NULL DEFAULT false,
  `canManageUsers` boolean NOT NULL DEFAULT false,
  `canViewAnalytics` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `partner_users_id` PRIMARY KEY(`id`)
);

-- PASO 5: Crear tabla de configuración de sharing
-- ================================================

CREATE TABLE IF NOT EXISTS `organization_sharing_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `sharable_resource` enum('clients','pianos','services','appointments','inventory','invoices','quotes','reminders') NOT NULL,
  `sharing_model` enum('private','shared_read','shared_write') NOT NULL DEFAULT 'private',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organization_sharing_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `org_resource_idx` UNIQUE(`organizationId`,`sharable_resource`)
);

-- PASO 6: Modificar enums existentes
-- ================================================

ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','starter','professional','enterprise','premium_ia') NOT NULL DEFAULT 'professional';
ALTER TABLE `modules` MODIFY COLUMN `type` enum('free','professional','premium') NOT NULL;
ALTER TABLE `subscription_plans` MODIFY COLUMN `code` enum('free','professional','premium') NOT NULL;
ALTER TABLE `subscriptions` MODIFY COLUMN `planCode` enum('free','professional','premium') NOT NULL;

-- PASO 7: Añadir partnerId a tablas operativas (sin FK aún)
-- ================================================

ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `businessInfo` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `inventory` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `pianos` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `quoteTemplates` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `quotes` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `reminders` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `serviceRates` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `services` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `partnerId` int DEFAULT 1 NOT NULL;

-- PASO 8: Añadir organizationId a tablas operativas (nullable)
-- ================================================

ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `clients` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `inventory` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `pianos` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `quoteTemplates` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `quotes` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `reminders` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `serviceRates` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;
ALTER TABLE `services` ADD COLUMN IF NOT EXISTS `organizationId` int NULL;

-- PASO 9: Añadir campo preferredLanguage a users
-- ================================================

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `preferredLanguage` varchar(5) NULL;

-- PASO 10: Añadir foreign keys
-- ================================================

-- Foreign keys de partner_* tables
ALTER TABLE `partner_settings` 
  ADD CONSTRAINT `partner_settings_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE;

ALTER TABLE `partner_pricing` 
  ADD CONSTRAINT `partner_pricing_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE;

ALTER TABLE `partner_users` 
  ADD CONSTRAINT `partner_users_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE CASCADE;

ALTER TABLE `partner_users` 
  ADD CONSTRAINT `partner_users_userId_users_id_fk` 
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Foreign keys de organization_sharing_settings
ALTER TABLE `organization_sharing_settings` 
  ADD CONSTRAINT `organization_sharing_settings_organizationId_organizations_id_fk` 
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE;

-- Foreign keys de partnerId en tablas operativas
ALTER TABLE `appointments` 
  ADD CONSTRAINT `appointments_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `businessInfo` 
  ADD CONSTRAINT `businessInfo_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `clients` 
  ADD CONSTRAINT `clients_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `inventory` 
  ADD CONSTRAINT `inventory_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `invoices` 
  ADD CONSTRAINT `invoices_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `pianos` 
  ADD CONSTRAINT `pianos_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `quoteTemplates` 
  ADD CONSTRAINT `quoteTemplates_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `quotes` 
  ADD CONSTRAINT `quotes_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `reminders` 
  ADD CONSTRAINT `reminders_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `serviceRates` 
  ADD CONSTRAINT `serviceRates_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `services` 
  ADD CONSTRAINT `services_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

ALTER TABLE `users` 
  ADD CONSTRAINT `users_partnerId_partners_id_fk` 
  FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`);

-- ================================================
-- FIN DE LA MIGRACIÓN
-- ================================================
