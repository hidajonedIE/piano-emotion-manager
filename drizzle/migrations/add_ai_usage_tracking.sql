-- Migration: Add AI Usage Tracking Table
-- Created: 2025-12-31
-- Description: Adds table to track AI feature usage for subscription limits

CREATE TABLE IF NOT EXISTS `ai_usage_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` VARCHAR(64) NOT NULL,
  `feature` VARCHAR(50) NOT NULL COMMENT 'chat, email, report, prediction',
  `tokensUsed` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_feature_month` (`userId`, `feature`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE `ai_usage_tracking` COMMENT = 'Tracks AI feature usage per user for subscription limits';
