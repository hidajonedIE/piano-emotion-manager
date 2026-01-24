/**
 * Gemini AI Predictions Service - Nuevo desde cero con logs detallados
 * Usa Gemini AI para generar predicciones basadas en datos históricos
 * Piano Emotion Manager
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RevenueData } from './revenue-data.service.js';
import type { ChurnRiskData } from './churn-data.service.js';
import type { MaintenanceData } from './maintenance-data.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
  const startTime = Date.now();
  console.log('[predictRevenue] Iniciando predicción...');
  console.log('[predictRevenue] API Key presente:', !!process.env.GEMINI_API_KEY);
  console.log('[predictRevenue] API Key length:', process.env.GEMINI_API_KEY?.length || 0);
  
  try {
    console.log('[predictRevenue] Obteniendo modelo gemini-1.5-flash-latest...');
    const modelStartTime = Date.now();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    console.log('[predictRevenue] Modelo obtenido en', Date.now() - modelStartTime, 'ms');

    const prompt = `Eres un analista financiero experto. Analiza estos datos de ingresos históricos y genera una predicción para el próximo mes.

Datos históricos (últimos 12 meses):
${JSON.stringify(data.historical, null, 2)}

Ingreso actual: ${data.current}€
Promedio: ${data.average}€
Tendencia: ${data.trend}

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "predictedAmount": número (sin símbolo de moneda),
  "confidence": "high" | "medium" | "low",
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictRevenue] Llamando a Gemini API...');
    const apiStartTime = Date.now();
    const result = await model.generateContent(prompt);
    console.log('[predictRevenue] Gemini API respondió en', Date.now() - apiStartTime, 'ms');
    
    const response = result.response.text();
    console.log('[predictRevenue] Respuesta recibida, longitud:', response.length);
    
    // Extraer JSON de la respuesta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const prediction = JSON.parse(jsonMatch[0]);

    // Calcular próximo mes
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log('[predictRevenue] Predicción completada en', Date.now() - startTime, 'ms');
    
    return {
      nextMonth,
      predictedAmount: Number(prediction.predictedAmount) || 0,
      confidence: prediction.confidence || 'low',
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('[predictRevenue] Error después de', elapsed, 'ms');
    console.error('[predictRevenue] Error type:', error?.constructor?.name);
    console.error('[predictRevenue] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[predictRevenue] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
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
  const startTime = Date.now();
  console.log('[predictChurn] Iniciando predicción...');
  
  try {
    console.log('[predictChurn] Obteniendo modelo gemini-1.5-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `Eres un analista de retención de clientes experto. Analiza estos datos de clientes en riesgo.

Total de clientes en riesgo: ${data.totalAtRisk}
Top clientes en riesgo:
${JSON.stringify(data.clients.slice(0, 5), null, 2)}

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "riskLevel": "high" | "medium" | "low",
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictChurn] Llamando a Gemini API...');
    const apiStartTime = Date.now();
    const result = await model.generateContent(prompt);
    console.log('[predictChurn] Gemini API respondió en', Date.now() - apiStartTime, 'ms');
    
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const prediction = JSON.parse(jsonMatch[0]);

    console.log('[predictChurn] Predicción completada en', Date.now() - startTime, 'ms');
    
    return {
      riskLevel: prediction.riskLevel || 'low',
      affectedClients: data.totalAtRisk,
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('[predictChurn] Error después de', elapsed, 'ms');
    console.error('[predictChurn] Error message:', error instanceof Error ? error.message : String(error));
    
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
  const startTime = Date.now();
  console.log('[predictMaintenance] Iniciando predicción...');
  
  try {
    console.log('[predictMaintenance] Obteniendo modelo gemini-1.5-flash-latest...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `Eres un experto en mantenimiento de pianos. Analiza estos datos de pianos que necesitan mantenimiento.

Total de pianos que necesitan mantenimiento: ${data.totalNeeded}
Top pianos urgentes:
${JSON.stringify(data.pianos.slice(0, 5), null, 2)}

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "urgentCount": número de pianos urgentes (más de 18 meses),
  "scheduledCount": número de pianos a programar (12-18 meses),
  "reasoning": "explicación breve en español (máximo 100 palabras)"
}`;

    console.log('[predictMaintenance] Llamando a Gemini API...');
    const apiStartTime = Date.now();
    const result = await model.generateContent(prompt);
    console.log('[predictMaintenance] Gemini API respondió en', Date.now() - apiStartTime, 'ms');
    
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const prediction = JSON.parse(jsonMatch[0]);

    console.log('[predictMaintenance] Predicción completada en', Date.now() - startTime, 'ms');
    
    return {
      urgentCount: Number(prediction.urgentCount) || 0,
      scheduledCount: Number(prediction.scheduledCount) || 0,
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('[predictMaintenance] Error después de', elapsed, 'ms');
    console.error('[predictMaintenance] Error message:', error instanceof Error ? error.message : String(error));
    
    return {
      urgentCount: 0,
      scheduledCount: 0,
      reasoning: `Error al generar predicción: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
