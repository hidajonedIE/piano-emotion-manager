import { mysqlTable, int, varchar, timestamp, index } from "drizzle-orm/mysql-core";

/**
 * AI Usage Tracking table
 * Tracks AI feature usage per user for subscription limits
 */
export const aiUsageTracking = mysqlTable("ai_usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(), // User openId
  feature: varchar("feature", { length: 50 }).notNull(), // 'chat', 'email', 'report', 'prediction'
  tokensUsed: int("tokensUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userFeatureIdx: index("idx_user_feature_month").on(table.userId, table.feature, table.createdAt),
}));

export type AIUsageTracking = typeof aiUsageTracking.$inferSelect;
export type InsertAIUsageTracking = typeof aiUsageTracking.$inferInsert;
