/**
 * AI Predictions Service
 * Servicio para generar predicciones inteligentes usando Gemini
 * Piano Emotion Manager
 */

import { invokeGemini } from '../../_core/gemini.js';

export interface PredictionsData {
  // Datos históricos de ingresos
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  last6MonthsRevenue: number[];
  
  // Datos de clientes
  totalClients: number;
  clientsWithoutRecentServices: number;
  clientsLast6Months: number[];
  
  // Datos de pianos
  totalPianos: number;
  pianosWithoutRecentMaintenance: number;
  servicesLast12Months: number[];
}

export interface AIPredictions {
  revenueGrowth: string; // Ej: "+12%", "-5%", "N/A"
  clientsAtRisk: number;
  pianosNeedingMaintenance: number;
  insights: {
    revenue: string;
    clients: string;
    maintenance: string;
  };
}

/**
 * Genera predicciones inteligentes usando Gemini
 */
export async function generatePredictions(data: PredictionsData): Promise<AIPredictions> {
  const prompt = `Eres un analista predictivo experto en gestión de servicios de pianos. Analiza los siguientes datos históricos y genera PREDICCIONES FUTURAS para el próximo mes:

DATOS DE INGRESOS:
- Ingresos mes actual: ${data.currentMonthRevenue}€
- Ingresos mes anterior: ${data.previousMonthRevenue}€
- Últimos 6 meses: ${data.last6MonthsRevenue.join(', ')}€

DATOS DE CLIENTES:
- Total de clientes: ${data.totalClients}
- Clientes sin servicios recientes (6+ meses): ${data.clientsWithoutRecentServices}
- Nuevos clientes últimos 6 meses: ${data.clientsLast6Months.join(', ')}

DATOS DE MANTENIMIENTO:
- Total de pianos: ${data.totalPianos}
- Pianos sin mantenimiento (12+ meses): ${data.pianosWithoutRecentMaintenance}
- Servicios últimos 12 meses: ${data.servicesLast12Months.join(', ')}

GENERA PREDICCIONES FUTURAS en JSON con este formato exacto:
{
  "revenueGrowth": "porcentaje de crecimiento PREVISTO para el próximo mes basado en tendencia (ej: +15%, -8%, o N/A si no hay datos)",
  "clientsAtRisk": número estimado de clientes que podrían abandonar el próximo mes (basado en inactividad),
  "pianosNeedingMaintenance": número de pianos que NECESITARÁN mantenimiento en el próximo mes (basado en ciclos históricos),
  "insights": {
    "revenue": "predicción de tendencia futura de ingresos (máx 50 caracteres)",
    "clients": "predicción sobre retención de clientes (máx 50 caracteres)",
    "maintenance": "predicción de necesidades de mantenimiento (máx 50 caracteres)"
  }
}

IMPORTANTE: Las predicciones deben ser FUTURAS, no análisis del presente. Usa los datos históricos para predecir el próximo mes.`;

  try {
    const response = await invokeGemini(prompt, {
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      maxTokens: 500,
      systemPrompt: 'Eres un analista de datos preciso. Responde SOLO con JSON válido, sin texto adicional.'
    });

    console.log('[AI Predictions] Respuesta de Gemini recibida:', response.substring(0, 200));

    // Limpiar la respuesta para extraer solo el JSON
    let jsonStr = response.trim();
    
    // Eliminar markdown code blocks si existen
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Buscar el JSON en la respuesta
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const predictions: AIPredictions = JSON.parse(jsonStr);
    
    // Validar que los campos requeridos existen
    if (!predictions.revenueGrowth || typeof predictions.clientsAtRisk !== 'number' || 
        typeof predictions.pianosNeedingMaintenance !== 'number' || !predictions.insights) {
      throw new Error('Respuesta de IA incompleta');
    }

    console.log('[AI Predictions] Predicciones generadas exitosamente:', predictions);
    return predictions;
  } catch (error) {
    console.error('[AI Predictions] Error generando predicciones con IA:', error);
    console.log('[AI Predictions] Usando fallback con datos:', data);
    
    // Fallback: cálculos predictivos más robustos
    // 1. Predicción de ingresos basada en tendencia de últimos 6 meses
    const last6Months = data.last6MonthsRevenue.filter(r => r > 0);
    let revenueGrowth = 'N/A';
    
    if (last6Months.length >= 2) {
      // Calcular tendencia promedio
      const growthRates = [];
      for (let i = 1; i < last6Months.length; i++) {
        const rate = ((last6Months[i] - last6Months[i-1]) / last6Months[i-1]) * 100;
        growthRates.push(rate);
      }
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      revenueGrowth = avgGrowth >= 0 ? `+${avgGrowth.toFixed(0)}%` : `${avgGrowth.toFixed(0)}%`;
    } else if (data.previousMonthRevenue > 0 && data.currentMonthRevenue > 0) {
      const change = ((data.currentMonthRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100;
      revenueGrowth = change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    }
    
    // 2. Clientes en riesgo: los que no han tenido servicios en 6+ meses
    const clientsAtRisk = Math.max(0, data.clientsWithoutRecentServices);
    
    // 3. Pianos que necesitarán mantenimiento: estimación basada en ciclo de 12 meses
    // Si un piano no ha tenido mantenimiento en 12+ meses, probablemente lo necesite pronto
    const pianosNeedingMaintenance = Math.max(0, data.pianosWithoutRecentMaintenance);
    
    return {
      revenueGrowth,
      clientsAtRisk,
      pianosNeedingMaintenance,
      insights: {
        revenue: revenueGrowth !== 'N/A' ? `Tendencia ${revenueGrowth}` : 'Datos insuficientes',
        clients: clientsAtRisk > 0 ? `${clientsAtRisk} clientes inactivos` : 'Retención óptima',
        maintenance: pianosNeedingMaintenance > 0 ? `${pianosNeedingMaintenance} pianos pendientes` : 'Mantenimientos al día'
      }
    };
  }
}
