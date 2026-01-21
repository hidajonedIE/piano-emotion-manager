CREATE TABLE `distributor_premium_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`distributor_id` int NOT NULL,
	`minimum_purchase_amount` decimal(10,2) DEFAULT '100.00',
	`trial_period_days` int DEFAULT 30,
	`grace_period_days` int DEFAULT 7,
	`whatsapp_enabled` boolean DEFAULT true,
	`portal_enabled` boolean DEFAULT true,
	`auto_reminders_enabled` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `distributor_premium_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `distributor_premium_config_distributor_id_unique` UNIQUE(`distributor_id`)
);
--> statement-breakpoint
CREATE TABLE `distributor_woocommerce_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`distributor_id` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`consumer_key` varchar(255) NOT NULL,
	`consumer_secret` varchar(255) NOT NULL,
	`enabled` boolean DEFAULT false,
	`connection_status` enum('connected','disconnected','error','testing') DEFAULT 'disconnected',
	`last_test_date` datetime,
	`error_message` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `distributor_woocommerce_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `distributor_woocommerce_config_distributor_id_unique` UNIQUE(`distributor_id`)
);
--> statement-breakpoint
CREATE TABLE `distributors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	`logo_url` varchar(500),
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `distributors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_verification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`log_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`distributor_id` int NOT NULL,
	`verification_date` datetime NOT NULL,
	`purchases_found` decimal(10,2) NOT NULL,
	`minimum_required` decimal(10,2) NOT NULL,
	`meets_minimum` boolean NOT NULL,
	`previous_tier` enum('trial','basic','premium'),
	`new_tier` enum('trial','basic','premium'),
	`tier_changed` boolean DEFAULT false,
	`orders_count` int DEFAULT 0,
	`status` enum('success','error','skipped') DEFAULT 'success',
	`error_message` text,
	`created_at` datetime NOT NULL,
	CONSTRAINT `purchase_verification_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_verification_logs_log_id_unique` UNIQUE(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `technician_account_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`distributor_id` int NOT NULL,
	`account_tier` enum('trial','basic','premium') DEFAULT 'trial',
	`trial_ends_at` datetime,
	`purchases_last_30_days` decimal(10,2) DEFAULT '0.00',
	`last_purchase_check` datetime,
	`last_purchase_date` datetime,
	`tier_changed_at` datetime,
	`previous_tier` enum('trial','basic','premium'),
	`grace_period_ends_at` datetime,
	`manual_override` boolean DEFAULT false,
	`manual_override_reason` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `technician_account_status_id` PRIMARY KEY(`id`),
	CONSTRAINT `technician_account_status_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `distributor_premium_config` ADD CONSTRAINT `distributor_premium_config_distributor_id_distributors_id_fk` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `distributor_woocommerce_config` ADD CONSTRAINT `distributor_woocommerce_config_distributor_id_distributors_id_fk` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_verification_logs` ADD CONSTRAINT `purchase_verification_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_verification_logs` ADD CONSTRAINT `purchase_verification_logs_distributor_id_distributors_id_fk` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `technician_account_status` ADD CONSTRAINT `technician_account_status_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `technician_account_status` ADD CONSTRAINT `technician_account_status_distributor_id_distributors_id_fk` FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `premium_config_distributor_id_idx` ON `distributor_premium_config` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `wc_config_distributor_id_idx` ON `distributor_woocommerce_config` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `verification_log_user_id_idx` ON `purchase_verification_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_log_distributor_id_idx` ON `purchase_verification_logs` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `verification_log_date_idx` ON `purchase_verification_logs` (`verification_date`);--> statement-breakpoint
CREATE INDEX `tech_status_user_id_idx` ON `technician_account_status` (`user_id`);--> statement-breakpoint
CREATE INDEX `tech_status_distributor_id_idx` ON `technician_account_status` (`distributor_id`);--> statement-breakpoint
CREATE INDEX `tech_status_tier_idx` ON `technician_account_status` (`account_tier`);