CREATE TABLE `shop_purchase_tracking` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`shop_id` int NOT NULL,
	`period_start_date` timestamp NOT NULL,
	`period_end_date` timestamp NOT NULL,
	`total_purchase_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`total_orders` int NOT NULL DEFAULT 0,
	`last_purchase_date` timestamp,
	`current_tier_id` int,
	`eligible_tier_id` int,
	`tier_upgrade_available` boolean DEFAULT false,
	`next_tier_minimum` decimal(12,2),
	`amount_to_next_tier` decimal(12,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_purchase_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_tier_config` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop_id` int NOT NULL,
	`tier_name` varchar(100) NOT NULL,
	`tier_level` int NOT NULL,
	`minimum_purchase_amount` decimal(12,2) NOT NULL,
	`purchase_period_days` int NOT NULL DEFAULT 365,
	`discount_percentage` decimal(5,2),
	`free_shipping` boolean DEFAULT false,
	`priority_support` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_tier_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_tier_history` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`shop_id` int NOT NULL,
	`previous_tier_id` int,
	`new_tier_id` int NOT NULL,
	`change_reason` varchar(100) NOT NULL,
	`total_purchase_amount` decimal(12,2),
	`notes` text,
	`changed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_tier_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `shop_purchase_tracking_org_shop_idx` ON `shop_purchase_tracking` (`organization_id`,`shop_id`);--> statement-breakpoint
CREATE INDEX `shop_purchase_tracking_period_idx` ON `shop_purchase_tracking` (`period_start_date`,`period_end_date`);--> statement-breakpoint
CREATE INDEX `shop_tier_config_shop_idx` ON `shop_tier_config` (`shop_id`);--> statement-breakpoint
CREATE INDEX `shop_tier_config_level_idx` ON `shop_tier_config` (`tier_level`);--> statement-breakpoint
CREATE INDEX `shop_tier_history_org_idx` ON `shop_tier_history` (`organization_id`);--> statement-breakpoint
CREATE INDEX `shop_tier_history_date_idx` ON `shop_tier_history` (`created_at`);