CREATE TABLE `partner_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`planCode` enum('free','professional','premium') NOT NULL,
	`monthlyPrice` decimal(10,2),
	`yearlyPrice` decimal(10,2),
	`minMonthlyRevenue` decimal(10,2),
	`discountPercentage` int DEFAULT 0,
	`customFeatures` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_settings` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_settings_partnerId_unique` UNIQUE(`partnerId`)
);
--> statement-breakpoint
CREATE TABLE `partner_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','manager') NOT NULL DEFAULT 'manager',
	`canManageBranding` boolean NOT NULL DEFAULT false,
	`canManagePricing` boolean NOT NULL DEFAULT false,
	`canManageUsers` boolean NOT NULL DEFAULT false,
	`canViewAnalytics` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `organization_sharing_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sharable_resource` enum('clients','pianos','services','appointments','inventory','invoices','quotes','reminders') NOT NULL,
	`sharing_model` enum('private','shared_read','shared_write') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_sharing_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_resource_idx` UNIQUE(`organizationId`,`sharable_resource`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','starter','professional','enterprise','premium_ia') NOT NULL DEFAULT 'professional';--> statement-breakpoint
ALTER TABLE `modules` MODIFY COLUMN `type` enum('free','professional','premium') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_plans` MODIFY COLUMN `code` enum('free','professional','premium') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `planCode` enum('free','professional','premium') NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `businessInfo` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `inventory` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `pianos` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `pianos` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `quoteTemplates` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `quoteTemplates` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `quotes` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `reminders` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `reminders` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `serviceRates` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `serviceRates` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `services` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `organizationId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `partnerId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` varchar(5);--> statement-breakpoint
ALTER TABLE `partner_pricing` ADD CONSTRAINT `partner_pricing_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD CONSTRAINT `partner_settings_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_users` ADD CONSTRAINT `partner_users_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_users` ADD CONSTRAINT `partner_users_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` ADD CONSTRAINT `organization_sharing_settings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businessInfo` ADD CONSTRAINT `businessInfo_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pianos` ADD CONSTRAINT `pianos_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quoteTemplates` ADD CONSTRAINT `quoteTemplates_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serviceRates` ADD CONSTRAINT `serviceRates_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;