CREATE TABLE `shop_cart_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`cart_id` int NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_carts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`user_id` int NOT NULL,
	`shop_id` int NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_carts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_order_lines` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int,
	`product_name` varchar(500) NOT NULL,
	`product_sku` varchar(100),
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`vat_rate` decimal(5,2),
	`discount` decimal(12,2),
	`total` decimal(12,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_order_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`shop_id` int NOT NULL,
	`created_by` int NOT NULL,
	`external_order_id` varchar(100),
	`status` enum('draft','pending','approved','ordered','shipped','delivered','cancelled') DEFAULT 'draft',
	`approval_status` enum('not_required','pending','approved','rejected') DEFAULT 'not_required',
	`approved_by` int,
	`approved_at` timestamp,
	`rejection_reason` text,
	`subtotal` decimal(12,2) NOT NULL,
	`vat_amount` decimal(12,2),
	`shipping_cost` decimal(12,2),
	`discount` decimal(12,2),
	`total` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`shipping_address` json,
	`tracking_number` varchar(100),
	`tracking_url` text,
	`estimated_delivery` timestamp,
	`delivered_at` timestamp,
	`is_auto_generated` boolean DEFAULT false,
	`stock_alert_id` int,
	`notes` text,
	`internal_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_product_inventory_links` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop_product_id` int NOT NULL,
	`inventory_id` int NOT NULL,
	`low_stock_threshold` int DEFAULT 5,
	`reorder_quantity` int DEFAULT 10,
	`auto_reorder_enabled` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_product_inventory_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop_id` int NOT NULL,
	`external_id` varchar(100),
	`sku` varchar(100),
	`name` varchar(500) NOT NULL,
	`description` text,
	`category` varchar(255),
	`brand` varchar(255),
	`price` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`vat_rate` decimal(5,2),
	`in_stock` boolean DEFAULT true,
	`stock_quantity` int,
	`image_url` text,
	`images` json,
	`specifications` json,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_role_permissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop_id` int NOT NULL,
	`role` varchar(50) NOT NULL,
	`can_view` boolean DEFAULT true,
	`can_order` boolean DEFAULT false,
	`can_approve` boolean DEFAULT false,
	`max_order_amount` decimal(12,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_role_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_stock_alerts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`inventory_id` int NOT NULL,
	`shop_product_id` int,
	`current_stock` int NOT NULL,
	`threshold` int NOT NULL,
	`is_resolved` boolean DEFAULT false,
	`resolved_at` timestamp,
	`auto_order_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_stock_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_wishlist` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`product_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_wishlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('platform','distributor','external') NOT NULL,
	`description` text,
	`url` text,
	`api_endpoint` text,
	`api_key` text,
	`username` varchar(255),
	`encrypted_password` text,
	`is_active` boolean DEFAULT true,
	`is_default` boolean DEFAULT false,
	`requires_approval` boolean DEFAULT true,
	`approval_threshold` decimal(12,2),
	`logo_url` text,
	`color` varchar(7),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `shop_cart_items_cart_idx` ON `shop_cart_items` (`cart_id`);--> statement-breakpoint
CREATE INDEX `shop_carts_user_shop_idx` ON `shop_carts` (`user_id`,`shop_id`);--> statement-breakpoint
CREATE INDEX `shop_order_lines_order_idx` ON `shop_order_lines` (`order_id`);--> statement-breakpoint
CREATE INDEX `shop_orders_org_idx` ON `shop_orders` (`organization_id`);--> statement-breakpoint
CREATE INDEX `shop_orders_shop_idx` ON `shop_orders` (`shop_id`);--> statement-breakpoint
CREATE INDEX `shop_orders_status_idx` ON `shop_orders` (`status`);--> statement-breakpoint
CREATE INDEX `shop_orders_auto_idx` ON `shop_orders` (`is_auto_generated`);--> statement-breakpoint
CREATE INDEX `shop_product_inventory_product_idx` ON `shop_product_inventory_links` (`shop_product_id`);--> statement-breakpoint
CREATE INDEX `shop_product_inventory_inventory_idx` ON `shop_product_inventory_links` (`inventory_id`);--> statement-breakpoint
CREATE INDEX `shop_products_shop_idx` ON `shop_products` (`shop_id`);--> statement-breakpoint
CREATE INDEX `shop_products_sku_idx` ON `shop_products` (`sku`);--> statement-breakpoint
CREATE INDEX `shop_role_permissions_idx` ON `shop_role_permissions` (`shop_id`,`role`);--> statement-breakpoint
CREATE INDEX `shop_stock_alerts_org_idx` ON `shop_stock_alerts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `shop_stock_alerts_inventory_idx` ON `shop_stock_alerts` (`inventory_id`);--> statement-breakpoint
CREATE INDEX `shop_stock_alerts_resolved_idx` ON `shop_stock_alerts` (`is_resolved`);--> statement-breakpoint
CREATE INDEX `shop_wishlist_user_idx` ON `shop_wishlist` (`user_id`);--> statement-breakpoint
CREATE INDEX `shops_org_idx` ON `shops` (`organization_id`);