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

    return predictions;
  } catch (error) {
    console.error('Error generando predicciones con IA:', error);
    
    // Fallback: cálculos simples si Gemini falla
    const revenueChange = data.previousMonthRevenue > 0 
      ? ((data.currentMonthRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100
      : 0;
    
    return {
      revenueGrowth: data.previousMonthRevenue > 0 
        ? (revenueChange >= 0 ? `+${revenueChange.toFixed(0)}%` : `${revenueChange.toFixed(0)}%`)
        : 'N/A',
      clientsAtRisk: data.clientsWithoutRecentServices,
      pianosNeedingMaintenance: data.pianosWithoutRecentMaintenance,
      insights: {
        revenue: 'Análisis basado en datos históricos',
        clients: 'Clientes sin actividad reciente detectados',
        maintenance: 'Pianos requieren revisión periódica'
      }
    };
  }
}
