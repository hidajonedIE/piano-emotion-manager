CREATE TABLE `member_absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`memberId` int NOT NULL,
	`absenceType` enum('vacation','sick_leave','personal','training','public_holiday','other') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isFullDay` boolean DEFAULT true,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `member_absences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`activityType` enum('member_invited','member_joined','member_removed','member_role_changed','member_suspended','work_assigned','work_reassigned','work_completed','settings_changed','subscription_changed','invoice_created','client_created','service_completed') NOT NULL,
	`description` text NOT NULL,
	`metadata` json,
	`entityType` varchar(50),
	`entityId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`organizationRole` enum('owner','admin','manager','senior_tech','technician','apprentice','receptionist','accountant','viewer') NOT NULL DEFAULT 'technician',
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`invitedBy` int NOT NULL,
	`message` text,
	`acceptedAt` timestamp,
	`acceptedByUserId` int,
	`declinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_invitations_token_unique` UNIQUE(`token`),
	CONSTRAINT `token_idx` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`organizationRole` enum('owner','admin','manager','senior_tech','technician','apprentice','receptionist','accountant','viewer') NOT NULL DEFAULT 'technician',
	`membershipStatus` enum('active','pending_invitation','suspended','inactive') NOT NULL DEFAULT 'pending_invitation',
	`displayName` varchar(100),
	`jobTitle` varchar(100),
	`employeeId` varchar(50),
	`phone` varchar(50),
	`color` varchar(7),
	`canBeAssigned` boolean DEFAULT true,
	`maxDailyAppointments` int DEFAULT 8,
	`workingHoursStart` varchar(5),
	`workingHoursEnd` varchar(5),
	`workingDays` json,
	`assignedZones` json,
	`specialties` json,
	`invitedAt` timestamp,
	`invitedBy` int,
	`joinedAt` timestamp,
	`lastActiveAt` timestamp,
	`suspendedAt` timestamp,
	`suspendedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_user_idx` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
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
	`defaultTaxRate` decimal(5,2) DEFAULT '21.00',
	`defaultCurrency` varchar(3) DEFAULT 'EUR',
	`defaultServiceDuration` int DEFAULT 60,
	`workingHoursStart` varchar(5) DEFAULT '09:00',
	`workingHoursEnd` varchar(5) DEFAULT '18:00',
	`workingDays` json DEFAULT ('[1,2,3,4,5]'),
	`timezone` varchar(50) DEFAULT 'Europe/Madrid',
	`notifyOnNewAppointment` boolean DEFAULT true,
	`notifyOnAssignment` boolean DEFAULT true,
	`notifyOnCompletion` boolean DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `service_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7),
	`postalCodes` json,
	`cities` json,
	`geoJson` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`surchargePercent` decimal(5,2) DEFAULT '0',
	`estimatedTravelTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technician_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`memberId` int NOT NULL,
	`date` timestamp NOT NULL,
	`appointmentsScheduled` int DEFAULT 0,
	`appointmentsCompleted` int DEFAULT 0,
	`appointmentsCancelled` int DEFAULT 0,
	`servicesCompleted` int DEFAULT 0,
	`totalWorkMinutes` int DEFAULT 0,
	`totalTravelMinutes` int DEFAULT 0,
	`averageServiceDuration` int,
	`totalRevenue` decimal(10,2) DEFAULT '0',
	`totalMaterialsCost` decimal(10,2) DEFAULT '0',
	`averageRating` decimal(3,2),
	`ratingsCount` int DEFAULT 0,
	`complaintsCount` int DEFAULT 0,
	`onTimeArrivals` int DEFAULT 0,
	`lateArrivals` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technician_metrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `tm_member_date_idx` UNIQUE(`memberId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `technician_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`memberId` int NOT NULL,
	`zoneId` int NOT NULL,
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technician_zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_zone_idx` UNIQUE(`memberId`,`zoneId`)
);
--> statement-breakpoint
CREATE TABLE `work_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`appointmentId` int,
	`serviceId` int,
	`technicianId` int NOT NULL,
	`workAssignmentStatus` enum('unassigned','assigned','accepted','in_progress','completed','cancelled','reassigned') NOT NULL DEFAULT 'assigned',
	`workPriority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`scheduledDate` timestamp NOT NULL,
	`scheduledStartTime` varchar(5),
	`scheduledEndTime` varchar(5),
	`estimatedDuration` int,
	`actualStartTime` timestamp,
	`actualEndTime` timestamp,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`rejectedAt` timestamp,
	`rejectionReason` text,
	`previousTechnicianId` int,
	`reassignedAt` timestamp,
	`reassignmentReason` text,
	`assignmentNotes` text,
	`technicianNotes` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ma_member_idx` ON `member_absences` (`memberId`);--> statement-breakpoint
CREATE INDEX `ma_date_idx` ON `member_absences` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `al_org_idx` ON `organization_activity_log` (`organizationId`);--> statement-breakpoint
CREATE INDEX `al_user_idx` ON `organization_activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `al_type_idx` ON `organization_activity_log` (`activityType`);--> statement-breakpoint
CREATE INDEX `al_date_idx` ON `organization_activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `email_org_idx` ON `organization_invitations` (`email`,`organizationId`);--> statement-breakpoint
CREATE INDEX `org_idx` ON `organization_members` (`organizationId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `organization_members` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `organization_members` (`membershipStatus`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `organizations` (`ownerId`);--> statement-breakpoint
CREATE INDEX `sz_org_idx` ON `service_zones` (`organizationId`);--> statement-breakpoint
CREATE INDEX `tm_org_date_idx` ON `technician_metrics` (`organizationId`,`date`);--> statement-breakpoint
CREATE INDEX `wa_org_idx` ON `work_assignments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `wa_tech_idx` ON `work_assignments` (`technicianId`);--> statement-breakpoint
CREATE INDEX `wa_date_idx` ON `work_assignments` (`scheduledDate`);--> statement-breakpoint
CREATE INDEX `wa_status_idx` ON `work_assignments` (`workAssignmentStatus`);