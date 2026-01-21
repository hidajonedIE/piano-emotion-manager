/**
 * Subscription Middleware
 * Verifies feature access and usage limits based on subscription plan
 */

import { TRPCError } from '@trpc/server';
import { getUserByOpenId } from '../getDb().js';
import { getMonthlyAIUsage, trackAIUsage } from './ai-usage-getDb().js';
import {
  normalizePlanName,
  hasFeatureAccess,
  getFeatureLimit,
  FEATURE_UPGRADE_MESSAGES,
  type AIFeature,
  type SubscriptionPlan,
} from './subscription-limits.js';

/**
 * Check if user has access to AI features
 */
export async function checkAIFeatureAccess(
  userId: string,
  feature: AIFeature
): Promise<{ plan: SubscriptionPlan; hasAccess: boolean }> {
  const user = await getUserByOpenId(userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuario no encontrado',
    });
  }

  const plan = normalizePlanName(user.subscriptionPlan);
  const hasAccess = hasFeatureAccess(plan, 'aiChat'); // Todas las features de IA requieren el mismo nivel

  return { plan, hasAccess };
}

/**
 * Check if user has reached usage limit for an AI feature
 */
export async function checkAIUsageLimit(
  userId: string,
  feature: AIFeature
): Promise<{ plan: SubscriptionPlan; usage: number; limit: number; canUse: boolean }> {
  const user = await getUserByOpenId(userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuario no encontrado',
    });
  }

  const plan = normalizePlanName(user.subscriptionPlan);
  const limit = getFeatureLimit(plan, feature);
  const usage = await getMonthlyAIUsage(userId, feature);
  const canUse = limit === -1 || usage < limit; // -1 = ilimitado

  return { plan, usage, limit, canUse };
}

/**
 * Main middleware: Check both access and usage limit
 * Throws TRPCError if user cannot use the feature
 */
export async function requireAIFeature(
  userId: string,
  feature: AIFeature
): Promise<{ plan: SubscriptionPlan; usage: number; limit: number }> {
  // 1. Check if plan has access to AI features
  const { plan, hasAccess } = await checkAIFeatureAccess(userId, feature);

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: FEATURE_UPGRADE_MESSAGES[feature],
    });
  }

  // 2. Check usage limit
  const { usage, limit, canUse } = await checkAIUsageLimit(userId, feature);

  if (!canUse) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `⚠️ Has alcanzado tu límite mensual de ${limit} ${getFeatureName(feature)}.\n\n` +
               `Uso actual: ${usage}/${limit}\n\n` +
               `El límite se reiniciará el próximo mes. Si necesitas más, contacta con soporte.`,
    });
  }

  return { plan, usage, limit };
}

/**
 * Track AI usage after successful operation
 */
export async function recordAIUsage(
  userId: string,
  feature: AIFeature,
  tokensUsed: number = 0
): Promise<void> {
  try {
    await trackAIUsage(userId, feature, tokensUsed);
  } catch (error) {
    console.error('[Subscription Middleware] Failed to record AI usage:', error);
    // No lanzar error para no interrumpir el flujo
  }
}

/**
 * Helper: Get human-readable feature name
 */
function getFeatureName(feature: AIFeature): string {
  const names: Record<AIFeature, string> = {
    chat: 'mensajes de chat',
    email: 'emails generados',
    report: 'informes generados',
    prediction: 'predicciones',
  };
  return names[feature];
}

/**
 * Check if user has access to a general feature (non-AI)
 */
export async function requireFeature(
  userId: string,
  featureName: string
): Promise<SubscriptionPlan> {
  const user = await getUserByOpenId(userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuario no encontrado',
    });
  }

  const plan = normalizePlanName(user.subscriptionPlan);

  // Aquí puedes añadir lógica para features específicas
  // Por ahora, todas las features no-AI están disponibles en PRO y PREMIUM

  return plan;
}

/**
 * Get user's current subscription info
 */
export async function getUserSubscriptionInfo(userId: string): Promise<{
  plan: SubscriptionPlan;
  status: string;
  hasAIAccess: boolean;
}> {
  const user = await getUserByOpenId(userId);
  
  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuario no encontrado',
    });
  }

  const plan = normalizePlanName(user.subscriptionPlan);
  const hasAIAccess = hasFeatureAccess(plan, 'aiChat');

  return {
    plan,
    status: user.subscriptionStatus || 'none',
    hasAIAccess,
  };
}
