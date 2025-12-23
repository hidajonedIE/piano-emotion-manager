CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`pianoId` int,
	`title` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`duration` int NOT NULL DEFAULT 60,
	`serviceType` varchar(50),
	`status` enum('scheduled','confirmed','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businessInfo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`taxId` varchar(50),
	`address` text,
	`city` varchar(100),
	`postalCode` varchar(20),
	`phone` varchar(50),
	`email` varchar(320),
	`bankAccount` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessInfo_id` PRIMARY KEY(`id`),
	CONSTRAINT `businessInfo_odId_unique` UNIQUE(`odId`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`clientType` enum('particular','student','professional','music_school','conservatory','concert_hall') NOT NULL DEFAULT 'particular',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('strings','hammers','dampers','keys','action_parts','pedals','tuning_pins','felts','tools','chemicals','other') NOT NULL,
	`description` text,
	`quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` varchar(20) NOT NULL DEFAULT 'unidad',
	`minStock` decimal(10,2) NOT NULL DEFAULT '0',
	`costPerUnit` decimal(10,2),
	`supplier` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`clientId` int NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pianos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100),
	`serialNumber` varchar(100),
	`year` int,
	`category` enum('vertical','grand') NOT NULL DEFAULT 'vertical',
	`pianoType` varchar(50) NOT NULL,
	`condition` enum('excellent','good','fair','poor','needs_repair') NOT NULL DEFAULT 'good',
	`location` text,
	`notes` text,
	`photos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pianos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`clientId` int NOT NULL,
	`pianoId` int,
	`reminderType` enum('call','visit','email','whatsapp','follow_up') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`title` varchar(255) NOT NULL,
	`notes` text,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('tuning','maintenance','regulation','repair','restoration','inspection','other') NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`taxRate` int NOT NULL DEFAULT 21,
	`estimatedDuration` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`odId` varchar(64) NOT NULL,
	`pianoId` int NOT NULL,
	`clientId` int NOT NULL,
	`serviceType` enum('tuning','repair','regulation','maintenance_basic','maintenance_complete','maintenance_premium','inspection','restoration','other') NOT NULL,
	`date` timestamp NOT NULL,
	`cost` decimal(10,2),
	`duration` int,
	`tasks` json,
	`notes` text,
	`technicianNotes` text,
	`materialsUsed` json,
	`photosBefore` json,
	`photosAfter` json,
	`clientSignature` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
