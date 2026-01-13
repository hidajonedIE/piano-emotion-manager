ALTER TABLE `alert_settings` ADD `appointmentsNoticeDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `scheduledServicesNoticeDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `invoicesDueNoticeDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `quotesExpiryNoticeDays` int DEFAULT 7;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `contractsRenewalNoticeDays` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `overduePaymentsNoticeDays` int DEFAULT 15;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `inventoryMinStock` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `inventoryExpiryNoticeDays` int DEFAULT 30;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `toolsMaintenanceDays` int DEFAULT 180;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `clientFollowupDays` int DEFAULT 90;--> statement-breakpoint
ALTER TABLE `alert_settings` ADD `clientInactiveMonths` int DEFAULT 12;