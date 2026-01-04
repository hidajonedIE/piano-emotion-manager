/**
 * Usage Router
 * Endpoints para consultar el uso de recursos y límites de suscripción
 */

import { router, protectedProcedure } from '../_core/trpc.js';
import { getAllMonthlyAIUsage, getAIUsageStats } from '../_core/ai-usage-db.js';
import { getUserSubscriptionInfo } from '../_core/subscription-middleware.js';
import { getAILimits, getDataLimits, normalizePlanName } from '../_core/subscription-limits.js';
import { checkUsageAlerts, getAlertsSummary } from '../_core/usage-alerts.js';

export const usageRouter = router({
  /**
   * Obtiene el uso actual de IA del usuario
   */
  getAIUsage: protectedProcedure.query(async ({ ctx }) => {
    const usage = await getAllMonthlyAIUsage(ctx.user.openId);
    const { plan } = await getUserSubscriptionInfo(ctx.user.openId);
    const limits = getAILimits(plan);

    return {
      usage,
      limits,
      plan,
      percentages: {
        chat: limits.chatMessagesPerMonth > 0 
          ? (usage.chat / limits.chatMessagesPerMonth) * 100 
          : 0,
        email: limits.emailGenerationsPerMonth > 0
          ? (usage.email / limits.emailGenerationsPerMonth) * 100
          : 0,
        report: limits.reportGenerationsPerMonth > 0
          ? (usage.report / limits.reportGenerationsPerMonth) * 100
          : 0,
        prediction: limits.predictionsPerMonth > 0
          ? (usage.prediction / limits.predictionsPerMonth) * 100
          : 0,
      },
    };
  }),

  /**
   * Obtiene estadísticas detalladas de uso
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getAIUsageStats(ctx.user.openId);
    const { plan, status, hasAIAccess } = await getUserSubscriptionInfo(ctx.user.openId);
    const aiLimits = getAILimits(plan);
    const dataLimits = getDataLimits(plan);

    return {
      plan,
      status,
      hasAIAccess,
      aiUsage: stats,
      limits: {
        ai: aiLimits,
        data: dataLimits,
      },
    };
  }),

  /**
   * Obtiene información de la suscripción del usuario
   */
  getSubscriptionInfo: protectedProcedure.query(async ({ ctx }) => {
    return getUserSubscriptionInfo(ctx.user.openId);
  }),

  /**
   * Obtiene alertas de uso del usuario
   */
  getUsageAlerts: protectedProcedure.query(async ({ ctx }) => {
    const { plan } = await getUserSubscriptionInfo(ctx.user.openId);
    const alerts = await checkUsageAlerts(ctx.user.openId, plan);
    const summary = getAlertsSummary(alerts);

    return {
      alerts,
      summary,
    };
  }),
});
