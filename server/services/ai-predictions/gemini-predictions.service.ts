/**
 * Gemini AI Predictions Service - Usando invokeGemini() funcional
 * Usa Gemini AI para generar predicciones basadas en datos históricos
 * Piano Emotion Manager
 */

import { generateJsonWithGemini } from '../../_core/gemini.js';
import type { RevenueData } from './revenue-data.service.js';
import type { ChurnRiskData } from './churn-data.service.js';
import type { MaintenanceData } from './maintenance-data.service.js';

export interface RevenuePrediction {
  nextMonth: string;
  predictedAmount: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface ChurnPrediction {
  riskLevel: 'high' | 'medium' | 'low';
  affectedClients: number;
  reasoning: string;
}

export interface MaintenancePrediction {
  urgentCount: number;
  scheduledCount: number;
  reasoning: string;
}

/**
 * Genera predicción de ingresos usando Gemini AI
 */
export async function predictRevenue(data: RevenueData): Promise<RevenuePrediction> {
  console.log('[predictRevenue] Iniciando predicción con invokeGemini()...');
  
  try {
    const prompt = `Eres un analista financiero experto. Analiza estos datos de ingresos históricos y genera una predicción para el próximo mes.

Datos históricos (últimos 12 meses):
${JSON.stringify(data.historical, null, 2)}

Ingreso actual: ${data.current}€
Promedio: ${data.average}€
Tendencia: ${data.trend}

Genera un objeto JSON con esta estructura exacta:
{
  "predictedAmount": número (sin símbolo de moneda),
  "confidence": "high" | "medium" | "low",
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictRevenue] Llamando a generateJsonWithGemini()...');
    const prediction = await generateJsonWithGemini<{
      predictedAmount: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Eres un analista financiero experto. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.'
    });
    
    console.log('[predictRevenue] Predicción recibida exitosamente');

    // Calcular próximo mes
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return {
      nextMonth,
      predictedAmount: Number(prediction.predictedAmount) || 0,
      confidence: prediction.confidence || 'low',
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    console.error('[predictRevenue] Error:', error instanceof Error ? error.message : String(error));
    
    return {
      nextMonth: 'N/A',
      predictedAmount: 0,
      confidence: 'low',
      reasoning: `Error al generar predicción: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Genera predicción de riesgo de pérdida de clientes usando Gemini AI
 */
export async function predictChurn(data: ChurnRiskData): Promise<ChurnPrediction> {
  console.log('[predictChurn] Iniciando predicción con invokeGemini()...');
  
  try {
    const prompt = `Eres un analista de retención de clientes experto. Analiza estos datos de clientes en riesgo.

Total de clientes en riesgo: ${data.totalAtRisk}
Top clientes en riesgo:
${JSON.stringify(data.clients.slice(0, 5), null, 2)}

Genera un objeto JSON con esta estructura exacta:
{
  "riskLevel": "high" | "medium" | "low",
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictChurn] Llamando a generateJsonWithGemini()...');
    const prediction = await generateJsonWithGemini<{
      riskLevel: 'high' | 'medium' | 'low';
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Eres un analista de retención de clientes experto. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.'
    });
    
    console.log('[predictChurn] Predicción recibida exitosamente');
    
    return {
      riskLevel: prediction.riskLevel || 'low',
      affectedClients: data.totalAtRisk,
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    console.error('[predictChurn] Error:', error instanceof Error ? error.message : String(error));
    
    return {
      riskLevel: 'low',
      affectedClients: 0,
      reasoning: `Error al generar predicción: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Genera predicción de mantenimientos usando Gemini AI
 */
export async function predictMaintenance(data: MaintenanceData): Promise<MaintenancePrediction> {
  console.log('[predictMaintenance] Iniciando predicción con invokeGemini()...');
  
  try {
    const prompt = `Eres un experto en mantenimiento de pianos. Analiza estos datos de pianos que necesitan mantenimiento.

Total de pianos que necesitan mantenimiento: ${data.totalNeeded}
Top pianos urgentes:
${JSON.stringify(data.pianos.slice(0, 5), null, 2)}

Genera un objeto JSON con esta estructura exacta:
{
  "urgentCount": número de pianos urgentes (más de 18 meses),
  "scheduledCount": número de pianos a programar (12-18 meses),
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictMaintenance] Llamando a generateJsonWithGemini()...');
    const prediction = await generateJsonWithGemini<{
      urgentCount: number;
      scheduledCount: number;
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Eres un experto en mantenimiento de pianos. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.'
    });
    
    console.log('[predictMaintenance] Predicción recibida exitosamente');
    
    return {
      urgentCount: Number(prediction.urgentCount) || 0,
      scheduledCount: Number(prediction.scheduledCount) || 0,
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    console.error('[predictMaintenance] Error:', error instanceof Error ? error.message : String(error));
    
    return {
      urgentCount: 0,
      scheduledCount: 0,
      reasoning: `Error al generar predicción: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
