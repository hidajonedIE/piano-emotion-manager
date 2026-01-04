-- ============================================================================
-- Migration: Add AI Usage Tracking Table
-- ============================================================================
-- Created: 2025-12-31
-- Author: Manus AI
-- Description: Adds table to track AI feature usage for subscription limits
-- 
-- This migration creates the ai_usage_tracking table which is used to:
-- - Track monthly usage of AI features per user
-- - Enforce subscription limits (FREE, PRO, PREMIUM)
-- - Provide usage statistics for users and admins
-- - Calculate costs and optimize resource allocation
-- ============================================================================

-- Drop table if exists (for development/testing - remove in production)
-- DROP TABLE IF EXISTS `ai_usage_tracking`;

-- Create AI Usage Tracking table
CREATE TABLE IF NOT EXISTS `ai_usage_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique identifier for each usage record',
  `userId` VARCHAR(64) NOT NULL COMMENT 'User openId from users table',
  `feature` VARCHAR(50) NOT NULL COMMENT 'AI feature used: chat, email, report, prediction',
  `tokensUsed` INT NOT NULL DEFAULT 0 COMMENT 'Number of tokens consumed by this operation',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when the feature was used',
  
  -- Indexes for performance
  INDEX `idx_user_feature_month` (`userId`, `feature`, `createdAt`) COMMENT 'Optimizes monthly usage queries',
  INDEX `idx_created_at` (`createdAt`) COMMENT 'Optimizes time-based queries',
  INDEX `idx_user_created` (`userId`, `createdAt`) COMMENT 'Optimizes user timeline queries'
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks AI feature usage per user for subscription limit enforcement';

-- ============================================================================
-- Verification Queries (optional - for testing)
-- ============================================================================

-- Verify table creation
-- SHOW CREATE TABLE `ai_usage_tracking`;

-- Check table structure
-- DESCRIBE `ai_usage_tracking`;

-- Check indexes
-- SHOW INDEX FROM `ai_usage_tracking`;

-- ============================================================================
-- Sample Queries (for reference)
-- ============================================================================

-- Get monthly usage for a specific user and feature
-- SELECT COUNT(*) as usage_count
-- FROM ai_usage_tracking
-- WHERE userId = 'user_openid_here'
--   AND feature = 'chat'
--   AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01');

-- Get all monthly usage for a user
-- SELECT 
--   feature,
--   COUNT(*) as usage_count,
--   SUM(tokensUsed) as total_tokens
-- FROM ai_usage_tracking
-- WHERE userId = 'user_openid_here'
--   AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')
-- GROUP BY feature;

-- Get top users by AI usage this month
-- SELECT 
--   userId,
--   COUNT(*) as total_operations,
--   SUM(tokensUsed) as total_tokens
-- FROM ai_usage_tracking
-- WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')
-- GROUP BY userId
-- ORDER BY total_operations DESC
-- LIMIT 10;

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE IF EXISTS `ai_usage_tracking`;

-- ============================================================================
-- Notes
-- ============================================================================
-- 
-- 1. This table will grow over time. Consider implementing:
--    - Archiving old records (> 6 months) to a separate table
--    - Periodic cleanup of very old records (> 1 year)
--    - Partitioning by month for better performance
--
-- 2. Expected growth rate:
--    - 1000 users × 500 operations/month = 500,000 rows/month
--    - At ~100 bytes per row = ~50 MB/month
--    - Annual growth: ~600 MB
--
-- 3. Index maintenance:
--    - Indexes are optimized for monthly queries
--    - Consider adding more indexes if query patterns change
--
-- 4. Monitoring:
--    - Monitor table size: SELECT table_name, table_rows, data_length, index_length 
--      FROM information_schema.tables WHERE table_name = 'ai_usage_tracking';
--    - Monitor query performance with EXPLAIN
--
-- ============================================================================
