-- ============================================================================
-- Maintenance Script: AI Usage Tracking
-- ============================================================================
-- Created: 2025-12-31
-- Author: Manus AI
-- Description: Optional maintenance queries for ai_usage_tracking table
-- 
-- This script provides utilities for:
-- - Archiving old records
-- - Cleaning up data
-- - Analyzing usage patterns
-- - Optimizing performance
-- ============================================================================

-- ============================================================================
-- 1. ARCHIVE OLD RECORDS (Optional - Run monthly)
-- ============================================================================

-- Create archive table (run once)
CREATE TABLE IF NOT EXISTS `ai_usage_tracking_archive` LIKE `ai_usage_tracking`;

-- Archive records older than 6 months
-- INSERT INTO `ai_usage_tracking_archive`
-- SELECT * FROM `ai_usage_tracking`
-- WHERE createdAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Delete archived records from main table
-- DELETE FROM `ai_usage_tracking`
-- WHERE createdAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- ============================================================================
-- 2. CLEANUP OLD RECORDS (Optional - Run annually)
-- ============================================================================

-- Delete records older than 1 year (be careful!)
-- DELETE FROM `ai_usage_tracking`
-- WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Delete records from archive older than 2 years
-- DELETE FROM `ai_usage_tracking_archive`
-- WHERE createdAt < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- ============================================================================
-- 3. ANALYZE USAGE PATTERNS
-- ============================================================================

-- Monthly usage by feature (current month)
SELECT 
  feature,
  COUNT(*) as operations,
  SUM(tokensUsed) as total_tokens,
  AVG(tokensUsed) as avg_tokens_per_operation,
  COUNT(DISTINCT userId) as unique_users
FROM ai_usage_tracking
WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY feature
ORDER BY operations DESC;

-- Daily usage trend (last 30 days)
SELECT 
  DATE(createdAt) as date,
  feature,
  COUNT(*) as operations,
  SUM(tokensUsed) as tokens
FROM ai_usage_tracking
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(createdAt), feature
ORDER BY date DESC, feature;

-- Top 20 users by AI usage (current month)
SELECT 
  userId,
  COUNT(*) as total_operations,
  SUM(tokensUsed) as total_tokens,
  SUM(CASE WHEN feature = 'chat' THEN 1 ELSE 0 END) as chat_count,
  SUM(CASE WHEN feature = 'email' THEN 1 ELSE 0 END) as email_count,
  SUM(CASE WHEN feature = 'report' THEN 1 ELSE 0 END) as report_count,
  SUM(CASE WHEN feature = 'prediction' THEN 1 ELSE 0 END) as prediction_count
FROM ai_usage_tracking
WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY userId
ORDER BY total_operations DESC
LIMIT 20;

-- Users approaching limits (assuming PREMIUM limits)
SELECT 
  userId,
  feature,
  COUNT(*) as current_usage,
  CASE 
    WHEN feature = 'chat' THEN 500
    WHEN feature = 'email' THEN 200
    WHEN feature = 'report' THEN 100
    WHEN feature = 'prediction' THEN 50
  END as limit,
  ROUND((COUNT(*) / CASE 
    WHEN feature = 'chat' THEN 500
    WHEN feature = 'email' THEN 200
    WHEN feature = 'report' THEN 100
    WHEN feature = 'prediction' THEN 50
  END) * 100, 2) as usage_percentage
FROM ai_usage_tracking
WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY userId, feature
HAVING usage_percentage >= 80
ORDER BY usage_percentage DESC;

-- ============================================================================
-- 4. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Check table size and index size
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
  ROUND((data_length / 1024 / 1024), 2) as data_mb,
  ROUND((index_length / 1024 / 1024), 2) as index_mb,
  table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('ai_usage_tracking', 'ai_usage_tracking_archive');

-- Analyze table (updates statistics for query optimizer)
ANALYZE TABLE `ai_usage_tracking`;

-- Optimize table (defragments and reclaims space)
-- OPTIMIZE TABLE `ai_usage_tracking`;

-- Check index usage
SELECT 
  table_name,
  index_name,
  cardinality,
  seq_in_index
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'ai_usage_tracking'
ORDER BY table_name, index_name, seq_in_index;

-- ============================================================================
-- 5. COST ESTIMATION (Gemini API)
-- ============================================================================

-- Estimate monthly Gemini costs
-- Assuming: $0.30 per 1M input tokens, $2.50 per 1M output tokens
-- Simplified: Average $1.00 per 1M tokens
SELECT 
  DATE_FORMAT(createdAt, '%Y-%m') as month,
  SUM(tokensUsed) as total_tokens,
  ROUND(SUM(tokensUsed) / 1000000 * 1.00, 2) as estimated_cost_usd
FROM ai_usage_tracking
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
ORDER BY month DESC;

-- Current month cost estimation
SELECT 
  SUM(tokensUsed) as total_tokens,
  ROUND(SUM(tokensUsed) / 1000000 * 1.00, 2) as estimated_cost_usd,
  COUNT(DISTINCT userId) as active_users,
  ROUND(SUM(tokensUsed) / COUNT(DISTINCT userId), 0) as avg_tokens_per_user
FROM ai_usage_tracking
WHERE createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01');

-- ============================================================================
-- 6. DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for invalid feature values
SELECT DISTINCT feature
FROM ai_usage_tracking
WHERE feature NOT IN ('chat', 'email', 'report', 'prediction');

-- Check for negative token values
SELECT COUNT(*) as invalid_records
FROM ai_usage_tracking
WHERE tokensUsed < 0;

-- Check for missing userId
SELECT COUNT(*) as invalid_records
FROM ai_usage_tracking
WHERE userId IS NULL OR userId = '';

-- Check for future dates (should not exist)
SELECT COUNT(*) as invalid_records
FROM ai_usage_tracking
WHERE createdAt > NOW();

-- ============================================================================
-- 7. MONITORING QUERIES (for dashboards)
-- ============================================================================

-- Real-time usage (last hour)
SELECT 
  feature,
  COUNT(*) as operations_last_hour
FROM ai_usage_tracking
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY feature;

-- Today's usage vs yesterday
SELECT 
  'Today' as period,
  feature,
  COUNT(*) as operations
FROM ai_usage_tracking
WHERE DATE(createdAt) = CURDATE()
GROUP BY feature

UNION ALL

SELECT 
  'Yesterday' as period,
  feature,
  COUNT(*) as operations
FROM ai_usage_tracking
WHERE DATE(createdAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
GROUP BY feature
ORDER BY period DESC, feature;

-- ============================================================================
-- Notes
-- ============================================================================
--
-- Schedule recommendations:
-- - Run ANALYZE TABLE: Weekly
-- - Run OPTIMIZE TABLE: Monthly (during low-traffic hours)
-- - Archive old records: Monthly
-- - Delete very old records: Annually
-- - Review usage patterns: Weekly
-- - Cost estimation: Monthly
--
-- ============================================================================
