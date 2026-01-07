-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `ai_usage_tracking` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`feature` varchar(50) NOT NULL,
	`tokensUsed` int(11) NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`pianoId` int(11) NOT NULL,
	`clientId` int(11) NOT NULL,
	`userId` int(11) NOT NULL,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11),
	`alertType` enum('tuning','regulation','repair') NOT NULL,
	`priority` enum('urgent','pending','ok') NOT NULL,
	`message` text NOT NULL,
	`daysSinceLastService` int(11) NOT NULL,
	`status` enum('active','acknowledged','resolved','dismissed') DEFAULT 'active',
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`resolvedByServiceId` int(11),
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alert_notifications` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`alertHistoryId` int(11) NOT NULL,
	`userId` int(11) NOT NULL,
	`notificationType` enum('email','push','weekly_digest') NOT NULL,
	`status` enum('pending','sent','failed','opened') DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`recipientEmail` varchar(320),
	`subject` varchar(255),
	`errorMessage` text,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `alert_settings` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`userId` int(11),
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11),
	`tuningPendingDays` int(11) DEFAULT 180,
	`tuningUrgentDays` int(11) DEFAULT 270,
	`regulationPendingDays` int(11) DEFAULT 730,
	`regulationUrgentDays` int(11) DEFAULT 1095,
	`emailNotificationsEnabled` tinyint(1) DEFAULT 1,
	`pushNotificationsEnabled` tinyint(1) DEFAULT 0,
	`weeklyDigestEnabled` tinyint(1) DEFAULT 1,
	`weeklyDigestDay` int(11) DEFAULT 1,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int(11) NOT NULL,
	`pianoId` int(11),
	`title` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`duration` int(11) NOT NULL DEFAULT 60,
	`serviceType` varchar(50),
	`status` enum('scheduled','confirmed','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `businessInfo` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`taxId` varchar(50),
	`address` text,
	`city` varchar(100),
	`postalCode` varchar(20),
	`phone` varchar(50),
	`email` varchar(320),
	`bankAccount` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1
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
	`syncEnabled` tinyint(1) DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
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
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `calendar_sync_log` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
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
	`isRead` tinyint(1) DEFAULT 0,
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
	`isActive` tinyint(1) DEFAULT 1,
	`lastLoginAt` timestamp,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`clientType` enum('particular','student','professional','music_school','conservatory','concert_hall') NOT NULL DEFAULT 'particular',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`region` varchar(100),
	`city` varchar(100),
	`postalCode` varchar(20),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`routeGroup` varchar(50),
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organization_id` int(11)
);
--> statement-breakpoint
CREATE TABLE `distributor_module_config` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`distributor_id` int(11) NOT NULL,
	`suppliers_enabled` tinyint(1) DEFAULT 1,
	`inventory_enabled` tinyint(1) DEFAULT 1,
	`invoicing_enabled` tinyint(1) DEFAULT 1,
	`advanced_invoicing_enabled` tinyint(1) DEFAULT 0,
	`accounting_enabled` tinyint(1) DEFAULT 0,
	`team_enabled` tinyint(1) DEFAULT 0,
	`crm_enabled` tinyint(1) DEFAULT 0,
	`reports_enabled` tinyint(1) DEFAULT 0,
	`shop_enabled` tinyint(1) DEFAULT 1,
	`show_prices` tinyint(1) DEFAULT 1,
	`allow_direct_orders` tinyint(1) DEFAULT 1,
	`show_stock` tinyint(1) DEFAULT 1,
	`stock_alerts_enabled` tinyint(1) DEFAULT 1,
	`custom_branding` tinyint(1) DEFAULT 0,
	`hide_competitor_links` tinyint(1) DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `help_items` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`section_id` int(11) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`display_order` int(11) DEFAULT 0,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `help_sections` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`display_order` int(11) DEFAULT 0,
	`created_at` timestamp DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('strings','hammers','dampers','keys','action_parts','pedals','tuning_pins','felts','tools','chemicals','other') NOT NULL,
	`description` text,
	`quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` varchar(20) NOT NULL DEFAULT 'unidad',
	`minStock` decimal(10,2) NOT NULL DEFAULT '0',
	`costPerUnit` decimal(10,2),
	`supplier` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) NOT NULL,
	`email` varchar(320) NOT NULL,
	`invited_by` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`used` tinyint(1) NOT NULL DEFAULT 0,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expires_at` timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`clientId` int(11) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`clientAddress` text,
	`date` timestamp NOT NULL,
	`dueDate` timestamp,
	`status` enum('draft','sent','paid','cancelled') NOT NULL DEFAULT 'draft',
	`items` json,
	`subtotal` decimal(10,2) NOT NULL,
	`taxAmount` decimal(10,2) NOT NULL,
	`total` decimal(10,2) NOT NULL,
	`notes` text,
	`businessInfo` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `license_batches` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`batch_code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`distributor_id` int(11),
	`template_id` int(11),
	`total_licenses` int(11) NOT NULL,
	`activated_licenses` int(11) DEFAULT 0,
	`license_type` enum('trial','free','starter','professional','enterprise') NOT NULL,
	`module_config` json,
	`duration_days` int(11),
	`created_by_admin_id` int(11),
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `license_history` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`license_id` int(11) NOT NULL,
	`action` enum('created','activated','deactivated','expired','revoked','suspended','reactivated','transferred','config_changed') NOT NULL,
	`previous_status` enum('available','active','expired','revoked','suspended'),
	`new_status` enum('available','active','expired','revoked','suspended'),
	`performed_by_admin_id` int(11),
	`performed_by_user_id` int(11),
	`details` json,
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `license_templates` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`license_type` enum('trial','free','pro','premium'),
	`duration_days` int(11),
	`module_config` json,
	`max_users` int(11) DEFAULT 1,
	`max_clients` int(11),
	`max_pianos` int(11),
	`is_active` tinyint(1) DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`license_type` enum('trial','free','pro','premium'),
	`status` enum('available','active','expired','revoked','suspended') DEFAULT 'available',
	`distributor_id` int(11),
	`template_id` int(11),
	`activated_by_user_id` int(11),
	`activated_at` datetime,
	`module_config` json,
	`max_users` int(11) DEFAULT 1,
	`max_clients` int(11),
	`max_pianos` int(11),
	`valid_from` datetime DEFAULT 'CURRENT_TIMESTAMP',
	`valid_until` datetime,
	`notes` text,
	`metadata` json,
	`created_by_admin_id` int(11),
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `member_absences` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`memberId` int(11) NOT NULL,
	`absenceType` enum('vacation','sick_leave','personal','training','public_holiday','other') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isFullDay` tinyint(1) DEFAULT 1,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int(11),
	`approvedAt` timestamp,
	`rejectionReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(7),
	`type` enum('core','free','premium','addon') NOT NULL DEFAULT 'core',
	`includedInPlans` json,
	`addonPrice` decimal(10,2),
	`addonPriceCurrency` varchar(3) DEFAULT 'EUR',
	`dependencies` json,
	`sortOrder` int(11) DEFAULT 0,
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organization_activity_log` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`userId` int(11) NOT NULL,
	`activityType` enum('member_invited','member_joined','member_removed','member_role_changed','member_suspended','work_assigned','work_reassigned','work_completed','settings_changed','subscription_changed','invoice_created','client_created','service_completed') NOT NULL,
	`description` text NOT NULL,
	`metadata` json,
	`entityType` varchar(50),
	`entityId` int(11),
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`email` varchar(320) NOT NULL,
	`organizationRole` enum('owner','admin','manager','senior_tech','technician','apprentice','receptionist','accountant','viewer') NOT NULL DEFAULT 'technician',
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`invitedBy` int(11) NOT NULL,
	`message` text,
	`acceptedAt` timestamp,
	`acceptedByUserId` int(11),
	`declinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`userId` int(11) NOT NULL,
	`organizationRole` enum('owner','admin','manager','senior_tech','technician','apprentice','receptionist','accountant','viewer') NOT NULL DEFAULT 'technician',
	`membershipStatus` enum('active','pending_invitation','suspended','inactive') NOT NULL DEFAULT 'pending_invitation',
	`displayName` varchar(100),
	`jobTitle` varchar(100),
	`employeeId` varchar(50),
	`phone` varchar(50),
	`color` varchar(7),
	`canBeAssigned` tinyint(1) DEFAULT 1,
	`maxDailyAppointments` int(11) DEFAULT 8,
	`workingHoursStart` varchar(5),
	`workingHoursEnd` varchar(5),
	`workingDays` json,
	`assignedZones` json,
	`specialties` json,
	`invitedAt` timestamp,
	`invitedBy` int(11),
	`joinedAt` timestamp,
	`lastActiveAt` timestamp,
	`suspendedAt` timestamp,
	`suspendedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organization_modules` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`moduleCode` varchar(50) NOT NULL,
	`isEnabled` tinyint(1) DEFAULT 1,
	`accessType` varchar(20) NOT NULL DEFAULT 'plan',
	`purchasedAt` timestamp,
	`expiresAt` timestamp,
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organization_sharing_settings` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`resource` enum('clients','pianos','services','appointments','inventory','invoices','quotes','reminders') NOT NULL,
	`sharingModel` enum('private','shared_read','shared_write') NOT NULL DEFAULT 'private',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`logo` text,
	`ownerId` int(11) NOT NULL,
	`subscriptionPlan` enum('free','starter','team','business','enterprise') NOT NULL DEFAULT 'free',
	`maxMembers` int(11) NOT NULL DEFAULT 1,
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
	`invoiceNextNumber` int(11) DEFAULT 1,
	`defaultTaxRate` decimal(5,2) DEFAULT '21.00',
	`defaultCurrency` varchar(3) DEFAULT 'EUR',
	`defaultServiceDuration` int(11) DEFAULT 60,
	`workingHoursStart` varchar(5) DEFAULT '09:00',
	`workingHoursEnd` varchar(5) DEFAULT '18:00',
	`workingDays` json,
	`timezone` varchar(50) DEFAULT 'Europe/Madrid',
	`notifyOnNewAppointment` tinyint(1) DEFAULT 1,
	`notifyOnAssignment` tinyint(1) DEFAULT 1,
	`notifyOnCompletion` tinyint(1) DEFAULT 1,
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `partner_pricing` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`partnerId` int(11) NOT NULL,
	`planCode` enum('free','professional','premium') NOT NULL,
	`monthlyPrice` decimal(10,2),
	`yearlyPrice` decimal(10,2),
	`minMonthlyRevenue` decimal(10,2),
	`discountPercentage` int(11) DEFAULT 0,
	`customFeatures` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `partner_settings` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`partnerId` int(11) NOT NULL,
	`ecommerceEnabled` tinyint(1) NOT NULL DEFAULT 0,
	`ecommerceApiUrl` text,
	`ecommerceApiKey` text,
	`autoOrderEnabled` tinyint(1) NOT NULL DEFAULT 0,
	`autoOrderThreshold` int(11) DEFAULT 5,
	`notificationEmail` varchar(320),
	`notificationWebhook` text,
	`maxUsers` int(11),
	`maxOrganizations` int(11),
	`supportedLanguages` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `partner_users` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`partnerId` int(11) NOT NULL,
	`userId` int(11) NOT NULL,
	`role` enum('owner','admin','manager') NOT NULL DEFAULT 'manager',
	`canManageBranding` tinyint(1) NOT NULL DEFAULT 0,
	`canManagePricing` tinyint(1) NOT NULL DEFAULT 0,
	`canManageUsers` tinyint(1) NOT NULL DEFAULT 0,
	`canViewAnalytics` tinyint(1) NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`customDomain` varchar(255),
	`logo` text,
	`primaryColor` varchar(7) DEFAULT '#3b82f6',
	`secondaryColor` varchar(7) DEFAULT '#10b981',
	`brandName` varchar(255),
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`allowMultipleSuppliers` tinyint(1) NOT NULL DEFAULT 0,
	`defaultLanguage` varchar(5) NOT NULL DEFAULT 'es',
	`supportEmail` varchar(320),
	`supportPhone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `pianos` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int(11) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100),
	`serialNumber` varchar(100),
	`year` int(11),
	`category` enum('vertical','grand') NOT NULL DEFAULT 'vertical',
	`pianoType` varchar(50) NOT NULL,
	`condition` enum('excellent','good','fair','poor','needs_repair') NOT NULL DEFAULT 'good',
	`location` text,
	`notes` text,
	`photos` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11),
	`tuningIntervalDays` int(11) DEFAULT 180,
	`regulationIntervalDays` int(11) DEFAULT 730,
	`alertsEnabled` tinyint(1) DEFAULT 1,
	`customThresholdsEnabled` tinyint(1) DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `platform_admins` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`user_id` int(11) NOT NULL,
	`role` enum('super_admin','admin','support') DEFAULT 'admin',
	`permissions` json,
	`is_active` tinyint(1) DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `quoteTemplates` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('tuning','repair','restoration','maintenance','moving','evaluation','custom') NOT NULL DEFAULT 'custom',
	`items` json,
	`isDefault` tinyint(1) NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`quoteNumber` varchar(50) NOT NULL,
	`clientId` int(11) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`clientAddress` text,
	`pianoId` int(11),
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
	`convertedToInvoiceId` int(11),
	`businessInfo` json,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int(11) NOT NULL,
	`pianoId` int(11),
	`reminderType` enum('call','visit','email','whatsapp','follow_up') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`title` varchar(255) NOT NULL,
	`notes` text,
	`isCompleted` tinyint(1) NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `serviceRates` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('tuning','maintenance','regulation','repair','restoration','inspection','other') NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`taxRate` int(11) NOT NULL DEFAULT 21,
	`estimatedDuration` int(11),
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `service_zones` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7),
	`postalCodes` json,
	`cities` json,
	`geoJson` json,
	`isActive` tinyint(1) NOT NULL DEFAULT 1,
	`surchargePercent` decimal(5,2) DEFAULT '0',
	`estimatedTravelTime` int(11),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`pianoId` int(11) NOT NULL,
	`clientId` int(11) NOT NULL,
	`serviceType` enum('tuning','repair','regulation','maintenance_basic','maintenance_complete','maintenance_premium','inspection','restoration','other') NOT NULL,
	`date` timestamp NOT NULL,
	`cost` decimal(10,2),
	`duration` int(11),
	`tasks` json,
	`notes` text,
	`technicianNotes` text,
	`materialsUsed` json,
	`photosBefore` json,
	`photosAfter` json,
	`clientSignature` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`humidity` decimal(5,2),
	`temperature` decimal(5,2),
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`organizationId` int(11)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`monthly_price` decimal(10,2) NOT NULL DEFAULT '0',
	`yearly_price` decimal(10,2) NOT NULL DEFAULT '0',
	`currency` varchar(3) DEFAULT 'EUR',
	`max_users` int(11),
	`max_clients` int(11),
	`max_pianos` int(11),
	`max_invoices_per_month` int(11),
	`max_storage_mb` int(11),
	`features` json,
	`is_active` tinyint(1) NOT NULL DEFAULT 1,
	`is_popular` tinyint(1) DEFAULT 0,
	`trial_days` int(11) DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `technician_metrics` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`memberId` int(11) NOT NULL,
	`date` timestamp NOT NULL,
	`appointmentsScheduled` int(11) DEFAULT 0,
	`appointmentsCompleted` int(11) DEFAULT 0,
	`appointmentsCancelled` int(11) DEFAULT 0,
	`servicesCompleted` int(11) DEFAULT 0,
	`totalWorkMinutes` int(11) DEFAULT 0,
	`totalTravelMinutes` int(11) DEFAULT 0,
	`averageServiceDuration` int(11),
	`totalRevenue` decimal(10,2) DEFAULT '0',
	`totalMaterialsCost` decimal(10,2) DEFAULT '0',
	`averageRating` decimal(3,2),
	`ratingsCount` int(11) DEFAULT 0,
	`complaintsCount` int(11) DEFAULT 0,
	`onTimeArrivals` int(11) DEFAULT 0,
	`lateArrivals` int(11) DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `technician_zones` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`memberId` int(11) NOT NULL,
	`zoneId` int(11) NOT NULL,
	`isPrimary` tinyint(1) DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`stripeCustomerId` varchar(255),
	`subscriptionPlan` enum('free','pro','premium') NOT NULL DEFAULT 'free',
	`subscriptionStatus` enum('active','canceled','past_due','trialing','none') NOT NULL DEFAULT 'none',
	`subscriptionId` varchar(255),
	`subscriptionEndDate` timestamp,
	`partnerId` int(11) NOT NULL DEFAULT 1,
	`preferredLanguage` varchar(5),
	`smtpHost` varchar(255),
	`smtpPort` int(11) DEFAULT 587,
	`smtpUser` varchar(320),
	`smtpPassword` text,
	`smtpSecure` tinyint(1) DEFAULT 0,
	`smtpFromName` varchar(255)
);
--> statement-breakpoint
CREATE TABLE `work_assignments` (
	`id` int(11) AUTO_INCREMENT NOT NULL,
	`organizationId` int(11) NOT NULL,
	`appointmentId` int(11),
	`serviceId` int(11),
	`technicianId` int(11) NOT NULL,
	`workAssignmentStatus` enum('unassigned','assigned','accepted','in_progress','completed','cancelled','reassigned') NOT NULL DEFAULT 'assigned',
	`workPriority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`scheduledDate` timestamp NOT NULL,
	`scheduledStartTime` varchar(5),
	`scheduledEndTime` varchar(5),
	`estimatedDuration` int(11),
	`actualStartTime` timestamp,
	`actualEndTime` timestamp,
	`assignedBy` int(11) NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`acceptedAt` timestamp,
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`previousTechnicianId` int(11),
	`reassignedAt` timestamp,
	`reassignmentReason` text,
	`assignmentNotes` text,
	`technicianNotes` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `fk_1` FOREIGN KEY (`pianoId`) REFERENCES `pianos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `fk_2` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `fk_3` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_notifications` ADD CONSTRAINT `fk_1` FOREIGN KEY (`alertHistoryId`) REFERENCES `alert_history`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD CONSTRAINT `fk_1` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_sync_events` ADD CONSTRAINT `fk_1` FOREIGN KEY (`connectionId`) REFERENCES `calendar_connections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `help_items` ADD CONSTRAINT `fk_1` FOREIGN KEY (`section_id`) REFERENCES `help_sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_pricing` ADD CONSTRAINT `partner_pricing_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_settings` ADD CONSTRAINT `partner_settings_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_users` ADD CONSTRAINT `partner_users_partnerId_partners_id_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_users` ADD CONSTRAINT `partner_users_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX `businessInfo_odId_unique` ON `businessInfo` (`odId`);--> statement-breakpoint
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
CREATE INDEX `ma_member_idx` ON `member_absences` (`memberId`);--> statement-breakpoint
CREATE INDEX `ma_date_idx` ON `member_absences` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `modules_code_unique` ON `modules` (`code`);--> statement-breakpoint
CREATE INDEX `al_org_idx` ON `organization_activity_log` (`organizationId`);--> statement-breakpoint
CREATE INDEX `al_user_idx` ON `organization_activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `al_type_idx` ON `organization_activity_log` (`activityType`);--> statement-breakpoint
CREATE INDEX `al_date_idx` ON `organization_activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `organization_invitations_token_unique` ON `organization_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `organization_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `email_org_idx` ON `organization_invitations` (`email`,`organizationId`);--> statement-breakpoint
CREATE INDEX `org_user_idx` ON `organization_members` (`organizationId`,`userId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `organization_members` (`organizationId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `organization_members` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `organization_members` (`membershipStatus`);--> statement-breakpoint
CREATE INDEX `org_modules_idx` ON `organization_modules` (`organizationId`,`moduleCode`);--> statement-breakpoint
CREATE INDEX `org_resource_idx` ON `organization_sharing_settings` (`organizationId`,`resource`);--> statement-breakpoint
CREATE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `partner_settings_partnerId_unique` ON `partner_settings` (`partnerId`);--> statement-breakpoint
CREATE INDEX `partners_slug_unique` ON `partners` (`slug`);--> statement-breakpoint
CREATE INDEX `platform_admins_user_id_idx` ON `platform_admins` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `platform_admins` (`user_id`);--> statement-breakpoint
CREATE INDEX `sz_org_idx` ON `service_zones` (`organizationId`);--> statement-breakpoint
CREATE INDEX `subscription_plans_code_unique` ON `subscription_plans` (`code`);--> statement-breakpoint
CREATE INDEX `tm_member_date_idx` ON `technician_metrics` (`memberId`,`date`);--> statement-breakpoint
CREATE INDEX `tm_org_date_idx` ON `technician_metrics` (`organizationId`,`date`);--> statement-breakpoint
CREATE INDEX `member_zone_idx` ON `technician_zones` (`memberId`,`zoneId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `wa_org_idx` ON `work_assignments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `wa_tech_idx` ON `work_assignments` (`technicianId`);--> statement-breakpoint
CREATE INDEX `wa_date_idx` ON `work_assignments` (`scheduledDate`);--> statement-breakpoint
CREATE INDEX `wa_status_idx` ON `work_assignments` (`workAssignmentStatus`);
*/