/**
 * Enhanced AI Predictions Service - OPTIMIZED VERSION
 * Consultas SQL optimizadas para evitar timeouts
 */

import { invokeGemini } from '../../_core/gemini.js';
import { getDb } from '../../db.js';
import { services, clients, pianos, appointments, inventory } from '../../../drizzle/schema.js';
import { and, gte, lte, count, sum, sql, desc, eq } from 'drizzle-orm';

// ============================================
// INTERFACES
// ============================================

export interface BusinessDataOptimized {
  revenue: {
    last12Months: number[];
    monthlyAverage: number;
  };
  services: {
    total: number;
    last12Months: number[];
  };
  clients: {
    total: number;
    active: number;
  };
}

export interface AIPredictionsEnhanced {
  revenue: {
    predictions: Array<{
      period: string;
      value: number;
      confidence: number;
      trend: 'up' | 'down' | 'stable';
      factors: string[];
    }>;
  };
  clientChurn: {
    topRiskClients: Array<{
      clientId: number;
      clientName: string;
      riskScore: number;
      lastService: string;
      daysSinceLastService: number;
      reason: string;
    }>;
  };
  maintenance: {
    predictions: Array<{
      pianoId: number;
      clientName: string;
      pianoInfo: string;
      lastService: string;
      predictedDate: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>;
  };
  workload: {
    predictions: Array<{
      week: string;
      scheduled: number;
      estimated: number;
      recommendation: string;
    }>;
  };
  inventory: {
    predictions: Array<{
      itemName: string;
      currentStock: number;
      predictedDemand: number;
      recommendedOrder: number;
      urgency: 'high' | 'medium' | 'low';
    }>;
  };
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Recopila datos de la BD de forma optimizada
 */
export async function collectBusinessDataOptimized(partnerId: string): Promise<BusinessDataOptimized> {
  const db = await getDb();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  
  console.log('[collectBusinessDataOptimized] Iniciando consultas optimizadas...');
  
  try {
    // CONSULTA OPTIMIZADA: Ingresos de los últimos 12 meses en una sola query
    const revenueQuery = sql`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COALESCE(SUM(cost), 0) as total
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= ${twelveMonthsAgo.toISOString()}
        AND date <= ${now.toISOString()}
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const revenueResult = await db.execute(revenueQuery);
    const revenueByMonth = (revenueResult[0] as any[]).reduce((acc: any, row: any) => {
      acc[row.month] = Number(row.total || 0);
      return acc;
    }, {});
    
    // Generar array de 12 meses
    const last12MonthsRevenue: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      last12MonthsRevenue.push(revenueByMonth[monthKey] || 0);
    }
    
    const monthlyAverage = last12MonthsRevenue.reduce((a, b) => a + b, 0) / 12;
    
    console.log('[collectBusinessDataOptimized] ✅ Ingresos calculados');
    
    // CONSULTA OPTIMIZADA: Servicios de los últimos 12 meses
    const servicesQuery = sql`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total
      FROM services
      WHERE partnerId = ${partnerId}
        AND date >= ${twelveMonthsAgo.toISOString()}
        AND date <= ${now.toISOString()}
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const servicesResult = await db.execute(servicesQuery);
    const servicesByMonth = (servicesResult[0] as any[]).reduce((acc: any, row: any) => {
      acc[row.month] = Number(row.total || 0);
      return acc;
    }, {});
    
    const last12MonthsServices: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      last12MonthsServices.push(servicesByMonth[monthKey] || 0);
    }
    
    console.log('[collectBusinessDataOptimized] ✅ Servicios calculados');
    
    // CONSULTAS SIMPLES EN PARALELO
    const [totalServices, totalClients, activeClientsResult] = await Promise.all([
      db.select({ count: count() }).from(services).where(eq(services.partnerId, Number(partnerId))),
      db.select({ count: count() }).from(clients).where(eq(clients.partnerId, Number(partnerId))),
      db.execute(sql`
        SELECT COUNT(DISTINCT clientId) as count
        FROM services
        WHERE partnerId = ${partnerId}
          AND date >= ${new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()}
      `)
    ]);
    
    console.log('[collectBusinessDataOptimized] ✅ Totales calculados');
    
    return {
      revenue: {
        last12Months: last12MonthsRevenue,
        monthlyAverage
      },
      services: {
        total: totalServices[0].count,
        last12Months: last12MonthsServices
      },
      clients: {
        total: totalClients[0].count,
        active: Number((activeClientsResult[0] as any[])[0]?.count || 0)
      }
    };
  } catch (error) {
    console.error('[collectBusinessDataOptimized] ❌ Error:', error);
    throw error;
  }
}

/**
 * Genera predicciones usando Gemini con datos optimizados
 */
export async function generateEnhancedPredictionsOptimized(businessData: BusinessDataOptimized): Promise<AIPredictionsEnhanced> {
  const now = new Date();
  
  const prompt = `Eres un analista financiero experto. Analiza estos datos de un negocio de afinación de pianos y genera predicciones de ingresos para los próximos 6 meses.

DATOS HISTÓRICOS (últimos 12 meses):
- Ingresos mensuales: ${businessData.revenue.last12Months.map((v, i) => `Mes ${i+1}: ${v}€`).join(', ')}
- Promedio mensual: ${businessData.revenue.monthlyAverage.toFixed(0)}€
- Servicios mensuales: ${businessData.services.last12Months.join(', ')}
- Total clientes: ${businessData.clients.total}
- Clientes activos (últimos 6 meses): ${businessData.clients.active}

INSTRUCCIONES:
1. Analiza la tendencia de los últimos 12 meses
2. Identifica patrones estacionales
3. Genera predicciones realistas para los próximos 6 meses
4. Responde SOLO con un JSON válido en este formato exacto:

{
  "predictions": [
    {
      "period": "Febrero 2026",
      "value": 12500,
      "confidence": 85,
      "trend": "up",
      "factors": ["Factor 1", "Factor 2"]
    }
  ]
}

IMPORTANTE: 
- trend debe ser: "up", "down" o "stable"
- confidence debe ser un número entre 0 y 100
- value debe ser un número entero
- Genera exactamente 6 predicciones (una por mes)
- NO incluyas explicaciones, solo el JSON`;

  try {
    const response = await invokeGemini(prompt, {
      temperature: 0.3,
      maxTokens: 2000
    });
    
    // Limpiar respuesta
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      revenue: {
        predictions: parsed.predictions || []
      },
      clientChurn: {
        topRiskClients: []
      },
      maintenance: {
        predictions: []
      },
      workload: {
        predictions: []
      },
      inventory: {
        predictions: []
      }
    };
  } catch (error) {
    console.error('[generateEnhancedPredictionsOptimized] Error:', error);
    
    // Fallback: predicciones basadas en promedio
    const predictions = [];
    for (let i = 1; i <= 6; i++) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = nextMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      predictions.push({
        period: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: Math.round(businessData.revenue.monthlyAverage * (0.95 + Math.random() * 0.1)),
        confidence: 70,
        trend: 'stable' as const,
        factors: ['Basado en promedio histórico']
      });
    }
    
    return {
      revenue: {
        predictions
      },
      clientChurn: {
        topRiskClients: []
      },
      maintenance: {
        predictions: []
      },
      workload: {
        predictions: []
      },
      inventory: {
        predictions: []
      }
    };
  }
}
