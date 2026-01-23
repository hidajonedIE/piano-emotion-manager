/**
 * Enhanced AI Predictions Service
 * Servicio mejorado para generar predicciones inteligentes usando Gemini con datos completos de la BD
 * Piano Emotion Manager
 */

import { invokeGemini } from '../../_core/gemini.js';
import { getDb } from '../../db.js';
import { services, clients, pianos, appointments, inventory } from '../../../drizzle/schema.js';
import { and, gte, lte, count, sum, sql, desc } from 'drizzle-orm';

// ============================================
// INTERFACES
// ============================================

export interface BusinessData {
  // Datos de ingresos
  revenue: {
    current: number;
    previous: number;
    last12Months: number[];
    monthlyAverage: number;
  };
  
  // Datos de servicios
  services: {
    total: number;
    completed: number;
    pending: number;
    byType: Record<string, number>;
    last12Months: number[];
  };
  
  // Datos de clientes
  clients: {
    total: number;
    active: number;
    inactive: number;
    withoutRecentServices: number;
    averageServiceInterval: number;
  };
  
  // Datos de pianos
  pianos: {
    total: number;
    withoutRecentMaintenance: number;
    byBrand: Record<string, number>;
    averageMaintenanceInterval: number;
  };
  
  // Datos de citas
  appointments: {
    upcoming: number;
    thisWeek: number;
    nextWeek: number;
    last4Weeks: number[];
  };
  
  // Datos de inventario
  inventory: {
    totalItems: number;
    lowStock: number;
    criticalStock: number;
  };
}

export interface AIPredictionsEnhanced {
  // Predicción de ingresos
  revenue: {
    nextMonth: {
      estimated: number;
      confidence: number;
      trend: 'up' | 'down' | 'stable';
      factors: string[];
    };
    next3Months: Array<{
      month: string;
      estimated: number;
      confidence: number;
    }>;
  };
  
  // Clientes en riesgo
  clientChurn: {
    atRiskCount: number;
    highRiskClients: Array<{
      name: string;
      riskScore: number;
      daysSinceLastService: number;
      suggestedAction: string;
    }>;
    retentionRecommendations: string[];
  };
  
  // Mantenimiento predictivo
  maintenance: {
    upcomingCount: number;
    nextMonth: Array<{
      pianoInfo: string;
      clientName: string;
      estimatedDate: string;
      serviceType: string;
      confidence: number;
    }>;
    recommendations: string[];
  };
  
  // Carga de trabajo
  workload: {
    next4Weeks: Array<{
      week: string;
      estimated: number;
      busyDays: string[];
      recommendation: string;
    }>;
  };
  
  // Inventario
  inventory: {
    urgentItems: Array<{
      item: string;
      daysUntilMin: number;
      recommendation: string;
    }>;
  };
  
  // Insights generales
  insights: {
    businessHealth: 'excellent' | 'good' | 'fair' | 'poor';
    keyOpportunities: string[];
    urgentActions: string[];
  };
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

/**
 * Recopila todos los datos relevantes de la base de datos
 */
export async function collectBusinessData(organizationId: string): Promise<BusinessData> {
  const db = getDb();
  const now = new Date();
  
  // Calcular fechas
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  // 1. DATOS DE INGRESOS
  const currentRevenue = await db
    .select({ total: sum(services.cost) })
    .from(services)
    .where(
      and(
        gte(services.date, currentMonthStart.toISOString()),
        lte(services.date, currentMonthEnd.toISOString())
      )
    );
  
  const previousRevenue = await db
    .select({ total: sum(services.cost) })
    .from(services)
    .where(
      and(
        gte(services.date, previousMonthStart.toISOString()),
        lte(services.date, previousMonthEnd.toISOString())
      )
    );
  
  // Ingresos de los últimos 12 meses
  const last12MonthsRevenue: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthRevenue = await db
      .select({ total: sum(services.cost) })
      .from(services)
      .where(
        and(
          gte(services.date, monthStart.toISOString()),
          lte(services.date, monthEnd.toISOString())
        )
      );
    last12MonthsRevenue.push(Number(monthRevenue[0]?.total || 0));
  }
  
  // 2. DATOS DE SERVICIOS
  const totalServices = await db.select({ count: count() }).from(services);
  const completedServices = await db
    .select({ count: count() })
    .from(services)
    .where(sql`${services.status} = 'completed'`);
  const pendingServices = await db
    .select({ count: count() })
    .from(services)
    .where(sql`${services.status} = 'pending'`);
  
  const servicesByType = await db
    .select({
      type: services.type,
      count: count()
    })
    .from(services)
    .groupBy(services.type);
  
  const last12MonthsServices: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthServices = await db
      .select({ count: count() })
      .from(services)
      .where(
        and(
          gte(services.date, monthStart.toISOString()),
          lte(services.date, monthEnd.toISOString())
        )
      );
    last12MonthsServices.push(Number(monthServices[0]?.count || 0));
  }
  
  // 3. DATOS DE CLIENTES
  const totalClients = await db.select({ count: count() }).from(clients);
  
  const recentClientIds = new Set(
    (await db
      .select({ clientId: services.clientId })
      .from(services)
      .where(gte(services.date, sixMonthsAgo.toISOString())))
      .map(s => s.clientId)
      .filter(id => id !== null)
  );
  
  const clientsWithoutRecentServices = Number(totalClients[0]?.count || 0) - recentClientIds.size;
  
  // 4. DATOS DE PIANOS
  const totalPianos = await db.select({ count: count() }).from(pianos);
  
  const recentPianoIds = new Set(
    (await db
      .select({ pianoId: services.pianoId })
      .from(services)
      .where(gte(services.date, twelveMonthsAgo.toISOString())))
      .map(s => s.pianoId)
      .filter(id => id !== null)
  );
  
  const pianosWithoutRecentMaintenance = Number(totalPianos[0]?.count || 0) - recentPianoIds.size;
  
  const pianosByBrand = await db
    .select({
      brand: pianos.brand,
      count: count()
    })
    .from(pianos)
    .groupBy(pianos.brand);
  
  // 5. DATOS DE CITAS
  const upcomingAppointments = await db
    .select({ count: count() })
    .from(appointments)
    .where(gte(appointments.date, now.toISOString()));
  
  const thisWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thisWeekAppointments = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        gte(appointments.date, now.toISOString()),
        lte(appointments.date, thisWeekEnd.toISOString())
      )
    );
  
  const nextWeekStart = thisWeekEnd;
  const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekAppointments = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        gte(appointments.date, nextWeekStart.toISOString()),
        lte(appointments.date, nextWeekEnd.toISOString())
      )
    );
  
  // 6. DATOS DE INVENTARIO
  const totalInventory = await db.select({ count: count() }).from(inventory);
  const lowStockItems = await db
    .select({ count: count() })
    .from(inventory)
    .where(sql`${inventory.quantity} < ${inventory.minQuantity} * 1.5`);
  const criticalStockItems = await db
    .select({ count: count() })
    .from(inventory)
    .where(sql`${inventory.quantity} < ${inventory.minQuantity}`);
  
  // Construir objeto de datos
  return {
    revenue: {
      current: Number(currentRevenue[0]?.total || 0),
      previous: Number(previousRevenue[0]?.total || 0),
      last12Months: last12MonthsRevenue,
      monthlyAverage: last12MonthsRevenue.reduce((a, b) => a + b, 0) / 12,
    },
    services: {
      total: Number(totalServices[0]?.count || 0),
      completed: Number(completedServices[0]?.count || 0),
      pending: Number(pendingServices[0]?.count || 0),
      byType: Object.fromEntries(servicesByType.map(s => [s.type, Number(s.count)])),
      last12Months: last12MonthsServices,
    },
    clients: {
      total: Number(totalClients[0]?.count || 0),
      active: recentClientIds.size,
      inactive: clientsWithoutRecentServices,
      withoutRecentServices: clientsWithoutRecentServices,
      averageServiceInterval: 90, // Simplificado por ahora
    },
    pianos: {
      total: Number(totalPianos[0]?.count || 0),
      withoutRecentMaintenance: pianosWithoutRecentMaintenance,
      byBrand: Object.fromEntries(pianosByBrand.map(p => [p.brand || 'Unknown', Number(p.count)])),
      averageMaintenanceInterval: 180, // Simplificado por ahora
    },
    appointments: {
      upcoming: Number(upcomingAppointments[0]?.count || 0),
      thisWeek: Number(thisWeekAppointments[0]?.count || 0),
      nextWeek: Number(nextWeekAppointments[0]?.count || 0),
      last4Weeks: [0, 0, 0, 0], // Simplificado por ahora
    },
    inventory: {
      totalItems: Number(totalInventory[0]?.count || 0),
      lowStock: Number(lowStockItems[0]?.count || 0),
      criticalStock: Number(criticalStockItems[0]?.count || 0),
    },
  };
}

/**
 * Genera predicciones completas usando Gemini con todos los datos del negocio
 */
export async function generateEnhancedPredictions(
  businessData: BusinessData
): Promise<AIPredictionsEnhanced> {
  const prompt = `Eres un analista de negocios experto en gestión de servicios de pianos. Analiza los siguientes datos COMPLETOS del negocio y genera predicciones FUTURAS detalladas.

DATOS DEL NEGOCIO:

📊 INGRESOS:
- Mes actual: ${businessData.revenue.current}€
- Mes anterior: ${businessData.revenue.previous}€
- Últimos 12 meses: ${businessData.revenue.last12Months.join(', ')}€
- Promedio mensual: ${businessData.revenue.monthlyAverage.toFixed(2)}€

🔧 SERVICIOS:
- Total: ${businessData.services.total}
- Completados: ${businessData.services.completed}
- Pendientes: ${businessData.services.pending}
- Por tipo: ${JSON.stringify(businessData.services.byType)}
- Últimos 12 meses: ${businessData.services.last12Months.join(', ')}

👥 CLIENTES:
- Total: ${businessData.clients.total}
- Activos (últimos 6 meses): ${businessData.clients.active}
- Inactivos: ${businessData.clients.inactive}
- Sin servicios recientes: ${businessData.clients.withoutRecentServices}

🎹 PIANOS:
- Total: ${businessData.pianos.total}
- Sin mantenimiento reciente (12+ meses): ${businessData.pianos.withoutRecentMaintenance}
- Por marca: ${JSON.stringify(businessData.pianos.byBrand)}

📅 CITAS:
- Próximas: ${businessData.appointments.upcoming}
- Esta semana: ${businessData.appointments.thisWeek}
- Próxima semana: ${businessData.appointments.nextWeek}

📦 INVENTARIO:
- Total items: ${businessData.inventory.totalItems}
- Stock bajo: ${businessData.inventory.lowStock}
- Stock crítico: ${businessData.inventory.criticalStock}

GENERA PREDICCIONES FUTURAS en JSON con este formato exacto (responde SOLO con JSON válido):

{
  "revenue": {
    "nextMonth": {
      "estimated": número estimado de ingresos para el próximo mes,
      "confidence": porcentaje de confianza (0-100),
      "trend": "up" | "down" | "stable",
      "factors": ["factor 1", "factor 2", ...]
    },
    "next3Months": [
      { "month": "nombre del mes", "estimated": número, "confidence": porcentaje },
      ...
    ]
  },
  "clientChurn": {
    "atRiskCount": número estimado de clientes en riesgo,
    "highRiskClients": [
      { "name": "Cliente", "riskScore": 0-100, "daysSinceLastService": días, "suggestedAction": "acción" }
    ],
    "retentionRecommendations": ["recomendación 1", ...]
  },
  "maintenance": {
    "upcomingCount": número de mantenimientos estimados próximo mes,
    "nextMonth": [
      { "pianoInfo": "info", "clientName": "cliente", "estimatedDate": "fecha", "serviceType": "tipo", "confidence": porcentaje }
    ],
    "recommendations": ["recomendación 1", ...]
  },
  "workload": {
    "next4Weeks": [
      { "week": "Semana del X", "estimated": número, "busyDays": ["día 1", ...], "recommendation": "texto" }
    ]
  },
  "inventory": {
    "urgentItems": [
      { "item": "nombre", "daysUntilMin": días, "recommendation": "acción" }
    ]
  },
  "insights": {
    "businessHealth": "excellent" | "good" | "fair" | "poor",
    "keyOpportunities": ["oportunidad 1", ...],
    "urgentActions": ["acción 1", ...]
  }
}

IMPORTANTE: 
- Las predicciones deben ser FUTURAS, no análisis del presente
- Usa los datos históricos para identificar patrones y tendencias
- Sé específico y realista en las estimaciones
- Las recomendaciones deben ser accionables`;

  try {
    const response = await invokeGemini(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: 'Eres un analista de datos preciso. Responde SOLO con JSON válido, sin texto adicional ni markdown.',
    });

    console.log('[Enhanced AI Predictions] Respuesta de Gemini recibida');

    // Limpiar la respuesta
    let jsonStr = response.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const predictions: AIPredictionsEnhanced = JSON.parse(jsonStr);
    console.log('[Enhanced AI Predictions] Predicciones generadas exitosamente');
    
    return predictions;
  } catch (error) {
    console.error('[Enhanced AI Predictions] Error generando predicciones con IA:', error);
    console.log('[Enhanced AI Predictions] Usando fallback con cálculos basados en datos reales');
    
    // Fallback: cálculos basados en datos reales
    return generateFallbackPredictions(businessData);
  }
}

/**
 * Genera predicciones de fallback basadas en cálculos simples pero reales
 */
function generateFallbackPredictions(data: BusinessData): AIPredictionsEnhanced {
  // Calcular tendencia de ingresos
  const last3Months = data.revenue.last12Months.slice(-3);
  const avgGrowth = last3Months.length >= 2
    ? ((last3Months[last3Months.length - 1] - last3Months[0]) / last3Months[0]) * 100
    : 0;
  
  const nextMonthEstimate = data.revenue.current * (1 + avgGrowth / 100);
  
  return {
    revenue: {
      nextMonth: {
        estimated: Math.round(nextMonthEstimate),
        confidence: Math.min(85, 50 + data.revenue.last12Months.filter(r => r > 0).length * 5),
        trend: avgGrowth > 5 ? 'up' : avgGrowth < -5 ? 'down' : 'stable',
        factors: [
          avgGrowth > 0 ? 'Tendencia de crecimiento' : 'Tendencia estable',
          `Basado en ${data.services.completed} servicios completados`,
        ],
      },
      next3Months: [
        { month: 'Próximo mes', estimated: Math.round(nextMonthEstimate), confidence: 75 },
        { month: 'En 2 meses', estimated: Math.round(nextMonthEstimate * 1.05), confidence: 65 },
        { month: 'En 3 meses', estimated: Math.round(nextMonthEstimate * 1.1), confidence: 55 },
      ],
    },
    clientChurn: {
      atRiskCount: data.clients.withoutRecentServices,
      highRiskClients: [],
      retentionRecommendations: [
        `Contactar a ${data.clients.withoutRecentServices} clientes inactivos`,
        'Enviar recordatorios de mantenimiento',
      ],
    },
    maintenance: {
      upcomingCount: data.pianos.withoutRecentMaintenance,
      nextMonth: [],
      recommendations: [
        `${data.pianos.withoutRecentMaintenance} pianos requieren mantenimiento`,
        'Programar afinaciones periódicas',
      ],
    },
    workload: {
      next4Weeks: [
        { week: 'Semana 1', estimated: data.appointments.thisWeek + 2, busyDays: ['Lunes', 'Miércoles'], recommendation: 'Carga normal' },
        { week: 'Semana 2', estimated: data.appointments.nextWeek + 2, busyDays: ['Martes', 'Jueves'], recommendation: 'Carga normal' },
        { week: 'Semana 3', estimated: 5, busyDays: ['Miércoles', 'Viernes'], recommendation: 'Carga normal' },
        { week: 'Semana 4', estimated: 4, busyDays: ['Lunes', 'Jueves'], recommendation: 'Carga ligera' },
      ],
    },
    inventory: {
      urgentItems: data.inventory.criticalStock > 0
        ? [{ item: 'Items críticos', daysUntilMin: 0, recommendation: 'Reponer urgentemente' }]
        : [],
    },
    insights: {
      businessHealth: data.revenue.current > data.revenue.monthlyAverage ? 'good' : 'fair',
      keyOpportunities: [
        data.clients.withoutRecentServices > 0 ? 'Reactivar clientes inactivos' : 'Mantener clientes activos',
        'Optimizar calendario de servicios',
      ],
      urgentActions: [
        ...(data.inventory.criticalStock > 0 ? ['Reponer inventario crítico'] : []),
        ...(data.clients.withoutRecentServices > 5 ? ['Contactar clientes en riesgo'] : []),
      ],
    },
  };
}
