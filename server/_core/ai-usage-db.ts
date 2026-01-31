/**
 * AI Usage Database Functions
 * Handles tracking and querying of AI feature usage
 */

import { eq, and, gte, sql } from 'drizzle-orm';
import { getDb } from '../db.js';
import { aiUsageTracking, type InsertAIUsageTracking } from '../../drizzle/ai-usage-schema.js';
import type { AIFeature } from './subscription-limits.js';

/**
 * Insert a new AI usage record
 */
export async function trackAIUsage(
  userId: string,
  feature: AIFeature,
  tokensUsed: number = 0
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[AI Usage] Cannot track usage: database not available');
    return;
  }

  try {
    const record: InsertAIUsageTracking = {
      userId,
      feature,
      tokensUsed,
      createdAt: new Date(),
    };

    await getDb().insert(aiUsageTracking).values(record);
  } catch (error) {
    console.error('[AI Usage] Failed to track usage:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Get monthly usage count for a specific feature
 */
export async function getMonthlyAIUsage(
  userId: string,
  feature: AIFeature
): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn('[AI Usage] Cannot get usage: database not available');
    return 0;
  }

  try {
    // Get first day of current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          eq(aiUsageTracking.feature, feature),
          gte(aiUsageTracking.createdAt, firstDayOfMonth)
        )
      );

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('[AI Usage] Failed to get monthly usage:', error);
    return 0;
  }
}

/**
 * Get all monthly usage for a user (all features)
 */
export async function getAllMonthlyAIUsage(userId: string): Promise<Record<AIFeature, number>> {
  const db = await getDb();
  if (!db) {
    console.warn('[AI Usage] Cannot get usage: database not available');
    return {
      chat: 0,
      email: 0,
      report: 0,
      prediction: 0,
    };
  }

  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        feature: aiUsageTracking.feature,
        count: sql<number>`COUNT(*)`,
      })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, firstDayOfMonth)
        )
      )
      .groupBy(aiUsageTracking.feature);

    const usage: Record<AIFeature, number> = {
      chat: 0,
      email: 0,
      report: 0,
      prediction: 0,
    };

    result.forEach((row) => {
      if (row.feature in usage) {
        usage[row.feature as AIFeature] = row.count;
      }
    });

    return usage;
  } catch (error) {
    console.error('[AI Usage] Failed to get all monthly usage:', error);
    return {
      chat: 0,
      email: 0,
      report: 0,
      prediction: 0,
    };
  }
}

/**
 * Get total tokens used this month
 */
export async function getMonthlyTokensUsed(userId: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn('[AI Usage] Cannot get tokens: database not available');
    return 0;
  }

  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({ total: sql<number>`SUM(${aiUsageTracking.tokensUsed})` })
      .from(aiUsageTracking)
      .where(
        and(
          eq(aiUsageTracking.userId, userId),
          gte(aiUsageTracking.createdAt, firstDayOfMonth)
        )
      );

    return result[0]?.total ?? 0;
  } catch (error) {
    console.error('[AI Usage] Failed to get monthly tokens:', error);
    return 0;
  }
}

/**
 * Get usage statistics for admin/analytics
 */
export async function getAIUsageStats(userId: string): Promise<{
  currentMonth: Record<AIFeature, number>;
  totalTokens: number;
  lastUsed: Date | null;
}> {
  const currentMonth = await getAllMonthlyAIUsage(userId);
  const totalTokens = await getMonthlyTokensUsed(userId);

  const db = await getDb();
  let lastUsed: Date | null = null;

  if (db) {
    try {
      const result = await db
        .select({ createdAt: aiUsageTracking.createdAt })
        .from(aiUsageTracking)
        .where(eq(aiUsageTracking.userId, userId))
        .orderBy(sql`${aiUsageTracking.createdAt} DESC`)
        .limit(1);

      lastUsed = result[0]?.createdAt ?? null;
    } catch (error) {
      console.error('[AI Usage] Failed to get last used:', error);
    }
  }

  return {
    currentMonth,
    totalTokens,
    lastUsed,
  };
}
