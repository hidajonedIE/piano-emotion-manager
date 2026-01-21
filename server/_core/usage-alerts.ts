/**
 * Usage Alerts System
 * Sistema de alertas cuando los usuarios alcanzan ciertos umbrales de uso
 */

import { getMonthlyAIUsage } from './ai-usage-getDb().js';
import { getFeatureLimit, type AIFeature, type SubscriptionPlan } from './subscription-limits.js';

export interface UsageAlert {
  feature: AIFeature;
  usage: number;
  limit: number;
  percentage: number;
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  recommendation: string;
}

/**
 * Niveles de alerta
 */
const ALERT_THRESHOLDS = {
  warning: 80,    // 80% del límite
  critical: 95,   // 95% del límite
  exceeded: 100,  // 100% o más
};

/**
 * Verifica si un usuario debe recibir alertas de uso
 */
export async function checkUsageAlerts(
  userId: string,
  plan: SubscriptionPlan
): Promise<UsageAlert[]> {
  const alerts: UsageAlert[] = [];
  const features: AIFeature[] = ['chat', 'email', 'report', 'prediction'];

  for (const feature of features) {
    const usage = await getMonthlyAIUsage(userId, feature);
    const limit = getFeatureLimit(plan, feature);

    // Si el límite es 0 o ilimitado (-1), no hay alertas
    if (limit <= 0) continue;

    const percentage = (usage / limit) * 100;

    // Determinar nivel de alerta
    let level: UsageAlert['level'] | null = null;
    if (percentage >= ALERT_THRESHOLDS.exceeded) {
      level = 'exceeded';
    } else if (percentage >= ALERT_THRESHOLDS.critical) {
      level = 'critical';
    } else if (percentage >= ALERT_THRESHOLDS.warning) {
      level = 'warning';
    }

    // Si hay alerta, crearla
    if (level) {
      alerts.push(createAlert(feature, usage, limit, percentage, level));
    }
  }

  return alerts;
}

/**
 * Crea un objeto de alerta con mensajes personalizados
 */
function createAlert(
  feature: AIFeature,
  usage: number,
  limit: number,
  percentage: number,
  level: UsageAlert['level']
): UsageAlert {
  const featureNames: Record<AIFeature, string> = {
    chat: 'Chat con IA',
    email: 'Generación de Emails',
    report: 'Informes de Servicio',
    prediction: 'Predicciones',
  };

  const messages = {
    warning: {
      chat: `Has usado ${usage} de ${limit} mensajes de chat este mes (${percentage.toFixed(0)}%). Considera gestionar tu uso.`,
      email: `Has generado ${usage} de ${limit} emails este mes (${percentage.toFixed(0)}%). Te quedan ${limit - usage} emails.`,
      report: `Has generado ${usage} de ${limit} informes este mes (${percentage.toFixed(0)}%). Te quedan ${limit - usage} informes.`,
      prediction: `Has usado ${usage} de ${limit} predicciones este mes (${percentage.toFixed(0)}%). Te quedan ${limit - usage} predicciones.`,
    },
    critical: {
      chat: `⚠️ ¡Atención! Has usado ${usage} de ${limit} mensajes de chat (${percentage.toFixed(0)}%). Solo te quedan ${limit - usage} mensajes.`,
      email: `⚠️ ¡Atención! Has generado ${usage} de ${limit} emails (${percentage.toFixed(0)}%). Solo te quedan ${limit - usage} emails.`,
      report: `⚠️ ¡Atención! Has generado ${usage} de ${limit} informes (${percentage.toFixed(0)}%). Solo te quedan ${limit - usage} informes.`,
      prediction: `⚠️ ¡Atención! Has usado ${usage} de ${limit} predicciones (${percentage.toFixed(0)}%). Solo te quedan ${limit - usage} predicciones.`,
    },
    exceeded: {
      chat: `🚫 Has alcanzado tu límite de ${limit} mensajes de chat este mes. El límite se reiniciará el próximo mes.`,
      email: `🚫 Has alcanzado tu límite de ${limit} emails este mes. El límite se reiniciará el próximo mes.`,
      report: `🚫 Has alcanzado tu límite de ${limit} informes este mes. El límite se reiniciará el próximo mes.`,
      prediction: `🚫 Has alcanzado tu límite de ${limit} predicciones este mes. El límite se reiniciará el próximo mes.`,
    },
  };

  const recommendations = {
    warning: {
      chat: 'Considera optimizar tus consultas para aprovechar mejor el límite mensual.',
      email: 'Planifica tus comunicaciones para distribuir el uso durante el mes.',
      report: 'Genera informes solo cuando sean necesarios para conservar tu límite.',
      prediction: 'Usa las predicciones estratégicamente para obtener el máximo valor.',
    },
    critical: {
      chat: 'Estás cerca del límite. Usa el chat solo para consultas importantes.',
      email: 'Quedan pocos emails disponibles. Prioriza las comunicaciones más importantes.',
      report: 'Quedan pocos informes disponibles. Genera solo los más urgentes.',
      prediction: 'Quedan pocas predicciones disponibles. Úsalas con cuidado.',
    },
    exceeded: {
      chat: 'Si necesitas más capacidad, contacta con soporte o espera al próximo mes.',
      email: 'Si necesitas más capacidad, contacta con soporte o espera al próximo mes.',
      report: 'Si necesitas más capacidad, contacta con soporte o espera al próximo mes.',
      prediction: 'Si necesitas más capacidad, contacta con soporte o espera al próximo mes.',
    },
  };

  return {
    feature,
    usage,
    limit,
    percentage,
    level,
    message: messages[level][feature],
    recommendation: recommendations[level][feature],
  };
}

/**
 * Obtiene un resumen de alertas para mostrar en el dashboard
 */
export function getAlertsSummary(alerts: UsageAlert[]): {
  hasAlerts: boolean;
  warningCount: number;
  criticalCount: number;
  exceededCount: number;
  mostCritical: UsageAlert | null;
} {
  const warningCount = alerts.filter(a => a.level === 'warning').length;
  const criticalCount = alerts.filter(a => a.level === 'critical').length;
  const exceededCount = alerts.filter(a => a.level === 'exceeded').length;

  // Encontrar la alerta más crítica (mayor porcentaje)
  const mostCritical = alerts.length > 0
    ? alerts.reduce((prev, current) => 
        current.percentage > prev.percentage ? current : prev
      )
    : null;

  return {
    hasAlerts: alerts.length > 0,
    warningCount,
    criticalCount,
    exceededCount,
    mostCritical,
  };
}

/**
 * Verifica si se debe mostrar una alerta al usuario
 * (para evitar spam, solo muestra alertas cada X horas)
 */
export function shouldShowAlert(
  lastAlertShown: Date | null,
  minHoursBetweenAlerts: number = 24
): boolean {
  if (!lastAlertShown) return true;

  const hoursSinceLastAlert = 
    (Date.now() - lastAlertShown.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastAlert >= minHoursBetweenAlerts;
}
