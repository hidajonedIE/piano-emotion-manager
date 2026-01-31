CREATE TABLE `ai_usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`feature` varchar(50) NOT NULL,
	`tokensUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pianoId` int NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`partnerId` int NOT NULL DEFAULT 1,
	`organizationId` int,
	`alertType` enum('tuning','regulation','repair') NOT NULL,
	`priority` enum('urgent','pending','ok') NOT NULL,
	`message` text NOT NULL,
	`daysSinceLastService` int NOT NULL,
	`status` enum('active','acknowledged','resolved','dismissed') DEFAULT 'active',
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`resolvedByServiceId` int,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alert_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertHistoryId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('email','push','weekly_digest') NOT NULL,
	`status` enum('pending','sent','failed','opened') DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`recipientEmail` varchar(320),
	`subject` varchar(255),
	`errorMessage` text,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alert_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`partnerId` int NOT NULL DEFAULT 1,
	`organizationId` int,
	`tuningPendingDays` int DEFAULT 180,
	`tuningUrgentDays` int DEFAULT 270,
	`regulationPendingDays` int DEFAULT 730,
	`regulationUrgentDays` int DEFAULT 1095,
	`emailNotificationsEnabled` tinyint DEFAULT 1,
	`pushNotificationsEnabled` tinyint DEFAULT 0,
	`weeklyDigestEnabled` tinyint DEFAULT 1,
	`weeklyDigestDay` int DEFAULT 1,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `calendar_connections` (
	`id` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`provider` enum('google','microsoft') NOT NULL,
	`calendarId` varchar(255) NOT NULL,
	`calendarName` varchar(255),
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`expiresAt` timestamp,
	`webhookId` varchar(255),
	`webhookExpiration` timestamp,
	`lastSyncToken` text,
	`lastDeltaLink` text,
	`syncEnabled` tinyint DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `calendar_sync_events` (
	`id` varchar(255) NOT NULL,
	`connectionId` varchar(255) NOT NULL,
	`appointmentId` varchar(255),
	`externalEventId` varchar(255) NOT NULL,
	`provider` enum('google','microsoft') NOT NULL,
	`syncStatus` enum('synced','pending','error') DEFAULT 'synced',
	`lastSyncedAt` timestamp,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `calendar_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` varchar(255) NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`direction` enum('to_external','from_external') NOT NULL,
	`appointmentId` varchar(255),
	`externalEventId` varchar(255),
	`status` enum('success','error') NOT NULL,
	`errorMessage` text,
	`details` json,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `client_messages` (
	`id` varchar(255) NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`fromUserId` varchar(255),
	`fromClientPortalUserId` varchar(255),
	`message` text NOT NULL,
	`isRead` tinyint DEFAULT 0,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `client_portal_invitations` (
	`id` varchar(255) NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `client_portal_password_resets` (
	`id` varchar(255) NOT NULL,
	`clientPortalUserId` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `client_portal_sessions` (
	`id` varchar(255) NOT NULL,
	`clientPortalUserId` varchar(255) NOT NULL,
	`token` varchar(512) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `client_portal_users` (
	`id` varchar(255) NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`isActive` tinyint DEFAULT 1,
	`lastLoginAt` timestamp,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `distributor_module_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`distributor_id` int NOT NULL,
	`suppliers_enabled` tinyint DEFAULT 1,
	`inventory_enabled` tinyint DEFAULT 1,
	`invoicing_enabled` tinyint DEFAULT 1,
	`advanced_invoicing_enabled` tinyint DEFAULT 0,
	`accounting_enabled` tinyint DEFAULT 0,
	`team_enabled` tinyint DEFAULT 0,
	`crm_enabled` tinyint DEFAULT 0,
	`reports_enabled` tinyint DEFAULT 0,
	`shop_enabled` tinyint DEFAULT 1,
	`show_prices` tinyint DEFAULT 1,
	`allow_direct_orders` tinyint DEFAULT 1,
	`show_stock` tinyint DEFAULT 1,
	`stock_alerts_enabled` tinyint DEFAULT 1,
	`custom_branding` tinyint DEFAULT 0,
	`hide_competitor_links` tinyint DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `help_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section_id` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`display_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `help_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`display_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`invited_by` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`used` tinyint NOT NULL DEFAULT 0,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expires_at` timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE `license_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`distributor_id` int,
	`template_id` int,
	`total_licenses` int NOT NULL,
	`activated_licenses` int DEFAULT 0,
	`license_type` enum('trial','free','starter','professional','enterprise') NOT NULL,
	`module_config` json,
	`duration_days` int,
	`created_by_admin_id` int,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `license_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`license_id` int NOT NULL,
	`action` enum('created','activated','deactivated','expired','revoked','suspended','reactivated','transferred','config_changed') NOT NULL,
	`previous_status` enum('available','active','expired','revoked','suspended'),
	`new_status` enum('available','active','expired','revoked','suspended'),
	`performed_by_admin_id` int,
	`performed_by_user_id` int,
	`details` json,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `license_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`license_type` enum('trial','free','pro','premium'),
	`duration_days` int,
	`module_config` json,
	`max_users` int DEFAULT 1,
	`max_clients` int,
	`max_pianos` int,
	`is_active` tinyint DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`license_type` enum('trial','free','pro','premium'),
	`status` enum('available','active','expired','revoked','suspended') DEFAULT 'available',
	`distributor_id` int,
	`template_id` int,
	`activated_by_user_id` int,
	`activated_at` datetime,
	`module_config` json,
	`max_users` int DEFAULT 1,
	`max_clients` int,
	`max_pianos` int,
	`valid_from` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`valid_until` datetime,
	`notes` text,
	`metadata` json,
	`created_by_admin_id` int,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `platform_admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`role` enum('super_admin','admin','support') DEFAULT 'admin',
	`permissions` json,
	`is_active` tinyint DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `service_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceTypeId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `service_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`duration` int NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alert_dismissals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alert_type` varchar(50) NOT NULL,
	`alert_key` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`partner_id` int NOT NULL,
	`dismissed_at` timestamp NOT NULL DEFAULT (now()),
	`reactivate_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_dismissals_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_dismissal` UNIQUE(`alert_type`,`alert_key`,`user_id`,`partner_id`)
);
--> statement-breakpoint
ALTER TABLE `businessInfo` DROP INDEX `businessInfo_odId_unique`;--> statement-breakpoint
ALTER TABLE `partner_settings` DROP INDEX `partner_settings_partnerId_unique`;--> statement-breakpoint
ALTER TABLE `partners` DROP INDEX `partners_slug_unique`;--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` DROP INDEX `org_resource_idx`;--> statement-breakpoint
ALTER TABLE `organization_invitations` DROP INDEX `organization_invitations_token_unique`;--> statement-breakpoint
ALTER TABLE `organization_invitations` DROP INDEX `token_idx`;--> statement-breakpoint
ALTER TABLE `organization_members` DROP INDEX `org_user_idx`;--> statement-breakpoint
ALTER TABLE `organizations` DROP INDEX `organizations_slug_unique`;--> statement-breakpoint
ALTER TABLE `organizations` DROP INDEX `slug_idx`;--> statement-breakpoint
ALTER TABLE `technician_metrics` DROP INDEX `tm_member_date_idx`;--> statement-breakpoint
ALTER TABLE `technician_zones` DROP INDEX `member_zone_idx`;--> statement-breakpoint
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `businessInfo` DROP FOREIGN KEY `businessInfo_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `clients` DROP FOREIGN KEY `clients_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `inventory` DROP FOREIGN KEY `inventory_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `pianos` DROP FOREIGN KEY `pianos_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `quoteTemplates` DROP FOREIGN KEY `quoteTemplates_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `quotes` DROP FOREIGN KEY `quotes_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `reminders` DROP FOREIGN KEY `reminders_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `serviceRates` DROP FOREIGN KEY `serviceRates_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `services` DROP FOREIGN KEY `services_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_partnerId_partners_id_fk`;
--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` DROP FOREIGN KEY `organization_sharing_settings_organizationId_organizations_id_fk`;
--> statement-breakpoint
DROP INDEX `owner_idx` ON `organizations`;--> statement-breakpoint
ALTER TABLE `appointments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `businessInfo` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `clients` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `inventory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `invoices` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `partner_pricing` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `partner_settings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `partner_users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `partners` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pianos` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `quoteTemplates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `quotes` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `reminders` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `serviceRates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `services` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `member_absences` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `organization_activity_log` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `organization_invitations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `organization_members` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `organizations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `service_zones` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `technician_metrics` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `technician_zones` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `work_assignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `businessInfo` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `inventory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `partner_pricing` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `partner_settings` MODIFY COLUMN `ecommerceEnabled` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partner_settings` MODIFY COLUMN `ecommerceEnabled` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partner_settings` MODIFY COLUMN `autoOrderEnabled` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partner_settings` MODIFY COLUMN `autoOrderEnabled` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partner_settings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManageBranding` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManageBranding` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManagePricing` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManagePricing` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManageUsers` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canManageUsers` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `canViewAnalytics` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `partners` MODIFY COLUMN `allowMultipleSuppliers` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `partners` MODIFY COLUMN `allowMultipleSuppliers` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `partners` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `pianos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `quoteTemplates` MODIFY COLUMN `isDefault` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `quoteTemplates` MODIFY COLUMN `isDefault` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `quoteTemplates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `quotes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `reminders` MODIFY COLUMN `isCompleted` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `reminders` MODIFY COLUMN `isCompleted` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `reminders` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `serviceRates` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `serviceRates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','pro','premium') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `member_absences` MODIFY COLUMN `isFullDay` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `member_absences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `organization_activity_log` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `organization_invitations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `organization_members` MODIFY COLUMN `canBeAssigned` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organization_members` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `workingDays` json;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `notifyOnNewAppointment` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `notifyOnAssignment` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `notifyOnCompletion` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `service_zones` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `service_zones` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `technician_metrics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `technician_zones` MODIFY COLUMN `isPrimary` tinyint;--> statement-breakpoint
ALTER TABLE `technician_zones` MODIFY COLUMN `isPrimary` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `technician_zones` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `work_assignments` MODIFY COLUMN `assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `work_assignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertPianoTuning` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertPianoRegulation` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertPianoMaintenance` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertQuotesPending` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertQuotesExpiring` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertInvoicesPending` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertInvoicesOverdue` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertUpcomingAppointments` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertUnconfirmedAppointments` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `alertFrequency` enum('realtime','daily','weekly') DEFAULT 'realtime';--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `pushNotifications` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `emailNotifications` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD `calendarSync` enum('none','google','outlook') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `partners` ADD `legalName` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `businessName` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `taxId` varchar(20);--> statement-breakpoint
ALTER TABLE `partners` ADD `addressStreet` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `addressPostalCode` varchar(5);--> statement-breakpoint
ALTER TABLE `partners` ADD `addressCity` varchar(100);--> statement-breakpoint
ALTER TABLE `partners` ADD `addressProvince` varchar(100);--> statement-breakpoint
ALTER TABLE `partners` ADD `iban` varchar(34);--> statement-breakpoint
ALTER TABLE `partners` ADD `bankName` varchar(255);--> statement-breakpoint
ALTER TABLE `partners` ADD `businessMode` enum('individual','team') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `partners` ADD `emailClientPreference` enum('gmail','outlook','default') DEFAULT 'gmail';--> statement-breakpoint
ALTER TABLE `pianos` ADD `tuningIntervalDays` int DEFAULT 180;--> statement-breakpoint
ALTER TABLE `pianos` ADD `regulationIntervalDays` int DEFAULT 730;--> statement-breakpoint
ALTER TABLE `pianos` ADD `alertsEnabled` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pianos` ADD `customThresholdsEnabled` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `smtpHost` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `smtpPort` int DEFAULT 587;--> statement-breakpoint
ALTER TABLE `users` ADD `smtpUser` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `smtpPassword` text;--> statement-breakpoint
ALTER TABLE `users` ADD `smtpSecure` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `smtpFromName` varchar(255);--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` ADD `resource` enum('clients','pianos','services','appointments','inventory','invoices','quotes','reminders') NOT NULL;--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` ADD `sharingModel` enum('private','shared_read','shared_write') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_pianoId_pianos_id_fk` FOREIGN KEY (`pianoId`) REFERENCES `pianos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_notifications` ADD CONSTRAINT `alert_notifications_alertHistoryId_alert_history_id_fk` FOREIGN KEY (`alertHistoryId`) REFERENCES `alert_history`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD CONSTRAINT `alert_settings_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_sync_events` ADD CONSTRAINT `calendar_sync_events_connectionId_calendar_connections_id_fk` FOREIGN KEY (`connectionId`) REFERENCES `calendar_connections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `help_items` ADD CONSTRAINT `help_items_section_id_help_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `help_sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_tasks` ADD CONSTRAINT `service_tasks_serviceTypeId_service_types_id_fk` FOREIGN KEY (`serviceTypeId`) REFERENCES `service_types`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_types` ADD CONSTRAINT `service_types_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_user_feature_month` ON `ai_usage_tracking` (`userId`,`feature`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `ai_usage_tracking` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_user_created` ON `ai_usage_tracking` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_piano_status` ON `alert_history` (`pianoId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_user_status` ON `alert_history` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `alert_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_priority` ON `alert_history` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_alert_type` ON `alert_notifications` (`alertHistoryId`,`notificationType`);--> statement-breakpoint
CREATE INDEX `idx_user_status` ON `alert_notifications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_sent` ON `alert_notifications` (`sentAt`);--> statement-breakpoint
CREATE INDEX `unique_user_config` ON `alert_settings` (`userId`,`partnerId`);--> statement-breakpoint
CREATE INDEX `unique_org_config` ON `alert_settings` (`organizationId`,`partnerId`);--> statement-breakpoint
CREATE INDEX `idx_user_provider` ON `calendar_connections` (`userId`,`provider`);--> statement-breakpoint
CREATE INDEX `idx_webhook` ON `calendar_connections` (`webhookId`);--> statement-breakpoint
CREATE INDEX `idx_sync_enabled` ON `calendar_connections` (`syncEnabled`);--> statement-breakpoint
CREATE INDEX `idx_webhook_expiration` ON `calendar_connections` (`webhookExpiration`);--> statement-breakpoint
CREATE INDEX `idx_connection` ON `calendar_sync_events` (`connectionId`);--> statement-breakpoint
CREATE INDEX `idx_appointment` ON `calendar_sync_events` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `idx_external` ON `calendar_sync_events` (`externalEventId`,`provider`);--> statement-breakpoint
CREATE INDEX `idx_sync_status` ON `calendar_sync_events` (`syncStatus`);--> statement-breakpoint
CREATE INDEX `unique_appointment_connection` ON `calendar_sync_events` (`appointmentId`,`connectionId`);--> statement-breakpoint
CREATE INDEX `idx_connection_date` ON `calendar_sync_log` (`connectionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `calendar_sync_log` (`status`);--> statement-breakpoint
CREATE INDEX `idx_appointment` ON `calendar_sync_log` (`appointmentId`);--> statement-breakpoint
CREATE INDEX `idx_created` ON `calendar_sync_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `client_messages` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `client_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_isRead` ON `client_messages` (`isRead`);--> statement-breakpoint
CREATE INDEX `idx_fromUserId` ON `client_messages` (`fromUserId`);--> statement-breakpoint
CREATE INDEX `idx_fromClientPortalUserId` ON `client_messages` (`fromClientPortalUserId`);--> statement-breakpoint
CREATE INDEX `idx_token` ON `client_portal_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `client_portal_invitations` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `client_portal_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_expiresAt` ON `client_portal_invitations` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `token` ON `client_portal_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_token` ON `client_portal_password_resets` (`token`);--> statement-breakpoint
CREATE INDEX `idx_clientPortalUserId` ON `client_portal_password_resets` (`clientPortalUserId`);--> statement-breakpoint
CREATE INDEX `idx_expiresAt` ON `client_portal_password_resets` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `token` ON `client_portal_password_resets` (`token`);--> statement-breakpoint
CREATE INDEX `idx_token` ON `client_portal_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_expiresAt` ON `client_portal_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_clientPortalUserId` ON `client_portal_sessions` (`clientPortalUserId`);--> statement-breakpoint
CREATE INDEX `token` ON `client_portal_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `client_portal_users` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_email` ON `client_portal_users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_isActive` ON `client_portal_users` (`isActive`);--> statement-breakpoint
CREATE INDEX `email` ON `client_portal_users` (`email`);--> statement-breakpoint
CREATE INDEX `module_config_distributor_id_idx` ON `distributor_module_config` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `distributor_id` ON `distributor_module_config` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `email_used_idx` ON `invitations` (`email`,`used`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `invitations` (`token`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `invitations` (`expires_at`);--> statement-breakpoint
CREATE INDEX `token` ON `invitations` (`token`);--> statement-breakpoint
CREATE INDEX `license_batches_code_idx` ON `license_batches` (`batch_code`);--> statement-breakpoint
CREATE INDEX `license_batches_distributor_idx` ON `license_batches` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `batch_code` ON `license_batches` (`batch_code`);--> statement-breakpoint
CREATE INDEX `license_history_license_idx` ON `license_history` (`license_id`);--> statement-breakpoint
CREATE INDEX `license_history_action_idx` ON `license_history` (`action`);--> statement-breakpoint
CREATE INDEX `licenses_code_idx` ON `licenses` (`code`);--> statement-breakpoint
CREATE INDEX `licenses_status_idx` ON `licenses` (`status`);--> statement-breakpoint
CREATE INDEX `licenses_distributor_idx` ON `licenses` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `licenses_activated_by_idx` ON `licenses` (`activated_by_user_id`);--> statement-breakpoint
CREATE INDEX `code` ON `licenses` (`code`);--> statement-breakpoint
CREATE INDEX `platform_admins_user_id_idx` ON `platform_admins` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `platform_admins` (`user_id`);--> statement-breakpoint
CREATE INDEX `service_tasks_type_idx` ON `service_tasks` (`serviceTypeId`);--> statement-breakpoint
CREATE INDEX `service_tasks_order_idx` ON `service_tasks` (`serviceTypeId`,`orderIndex`);--> statement-breakpoint
CREATE INDEX `service_types_partner_idx` ON `service_types` (`partnerId`);--> statement-breakpoint
CREATE INDEX `service_types_active_idx` ON `service_types` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_user_partner` ON `alert_dismissals` (`user_id`,`partner_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_lookup` ON `alert_dismissals` (`alert_type`,`alert_key`,`partner_id`);--> statement-breakpoint
CREATE INDEX `idx_reactivate` ON `alert_dismissals` (`reactivate_at`);--> statement-breakpoint
CREATE INDEX `businessInfo_odId_unique` ON `businessInfo` (`odId`);--> statement-breakpoint
CREATE INDEX `partner_settings_partnerId_unique` ON `partner_settings` (`partnerId`);--> statement-breakpoint
CREATE INDEX `partners_slug_unique` ON `partners` (`slug`);--> statement-breakpoint
CREATE INDEX `org_resource_idx` ON `organization_sharing_settings` (`organizationId`,`resource`);--> statement-breakpoint
CREATE INDEX `organization_invitations_token_unique` ON `organization_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `organization_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `org_user_idx` ON `organization_members` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `tm_member_date_idx` ON `technician_metrics` (`memberId`,`date`);--> statement-breakpoint
CREATE INDEX `member_zone_idx` ON `technician_zones` (`memberId`,`zoneId`);--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` DROP COLUMN `sharable_resource`;--> statement-breakpoint
ALTER TABLE `organization_sharing_settings` DROP COLUMN `sharing_model`;