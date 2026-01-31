CREATE TABLE `quoteTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('tuning','repair','restoration','maintenance','moving','evaluation','custom') NOT NULL DEFAULT 'custom',
	`items` json,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`quoteNumber` varchar(50) NOT NULL,
	`clientId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`clientAddress` text,
	`pianoId` int,
	`pianoDescription` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('draft','sent','accepted','rejected','expired','converted') NOT NULL DEFAULT 'draft',
	`items` json,
	`subtotal` decimal(10,2) NOT NULL,
	`totalDiscount` decimal(10,2) NOT NULL DEFAULT '0',
	`taxAmount` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`notes` text,
	`termsAndConditions` text,
	`sentAt` timestamp,
	`acceptedAt` timestamp,
	`rejectedAt` timestamp,
	`convertedToInvoiceId` int,
	`businessInfo` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(7),
	`type` enum('core','free','premium','addon') NOT NULL,
	`includedInPlans` json DEFAULT ('[]'),
	`addonPrice` decimal(10,2),
	`addonPriceCurrency` varchar(3) DEFAULT 'EUR',
	`dependencies` json DEFAULT ('[]'),
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`version` varchar(20),
	`releaseNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `modules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `organization_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`moduleCode` varchar(50) NOT NULL,
	`isEnabled` boolean DEFAULT true,
	`accessType` varchar(20) NOT NULL,
	`purchasedAt` timestamp,
	`expiresAt` timestamp,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`usersCount` int DEFAULT 0,
	`clientsCount` int DEFAULT 0,
	`pianosCount` int DEFAULT 0,
	`invoicesCount` int DEFAULT 0,
	`storageMb` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`fromPlan` varchar(50),
	`toPlan` varchar(50),
	`details` json,
	`changedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('free','starter','professional','enterprise') NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2),
	`yearlyPrice` decimal(10,2),
	`currency` varchar(3) DEFAULT 'EUR',
	`maxUsers` int,
	`maxClients` int,
	`maxPianos` int,
	`maxInvoicesPerMonth` int,
	`maxStorageMb` int,
	`features` json DEFAULT ('[]'),
	`isActive` boolean DEFAULT true,
	`isPopular` boolean DEFAULT false,
	`trialDays` int DEFAULT 14,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`planCode` enum('free','starter','professional','enterprise') NOT NULL,
	`status` enum('active','trial','past_due','cancelled','expired') NOT NULL DEFAULT 'trial',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`trialEndDate` timestamp,
	`cancelledAt` timestamp,
	`billingCycle` varchar(20),
	`nextBillingDate` timestamp,
	`paymentProvider` varchar(50),
	`externalSubscriptionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `postalCode` varchar(20);--> statement-breakpoint
ALTER TABLE `clients` ADD `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `clients` ADD `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `clients` ADD `routeGroup` varchar(50);--> statement-breakpoint
ALTER TABLE `services` ADD `humidity` decimal(5,2);--> statement-breakpoint
ALTER TABLE `services` ADD `temperature` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('free','professional','premium_ia') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndDate` timestamp;--> statement-breakpoint
CREATE INDEX `org_modules_idx` ON `organization_modules` (`organizationId`,`moduleCode`);--> statement-breakpoint
CREATE INDEX `resource_usage_org_period_idx` ON `resource_usage` (`organizationId`,`periodStart`);--> statement-breakpoint
CREATE INDEX `subscriptions_org_idx` ON `subscriptions` (`organizationId`);