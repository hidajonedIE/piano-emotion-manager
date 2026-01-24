/**
 * Gemini AI Predictions Service - Versión simplificada
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
  console.log('[predictRevenue] Iniciando predicción...');
  
  try {
    // Crear resumen ultra-simple de los últimos 3 meses
    const last3Months = data.historical.slice(-3);
    const summary = last3Months.map(m => `${m.month}: ${m.amount}€`).join(', ');
    
    const prompt = `Predice ingresos próximo mes.
Últimos 3 meses: ${summary}
Actual: ${data.current}€
Promedio: ${data.average}€

Responde JSON:
{"predictedAmount":número,"confidence":"high/medium/low","reasoning":"max 20 palabras"}`;

    const prediction = await generateJsonWithGemini<{
      predictedAmount: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Responde SOLO JSON válido. reasoning: máximo 20 palabras.',
      maxTokens: 300
    });
    
    console.log('[predictRevenue] OK');

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
      reasoning: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Genera predicción de riesgo de pérdida de clientes usando Gemini AI
 */
export async function predictChurn(data: ChurnRiskData): Promise<ChurnPrediction> {
  console.log('[predictChurn] Iniciando predicción...');
  
  try {
    const prompt = `Evalúa riesgo de pérdida de clientes.
Total en riesgo: ${data.totalAtRisk}
Top 3: ${data.clients.slice(0, 3).map(c => `${c.name} (${c.riskScore}%)`).join(', ')}

Responde JSON:
{"riskLevel":"high/medium/low","affectedClients":número,"reasoning":"max 20 palabras"}`;

    const prediction = await generateJsonWithGemini<{
      riskLevel: 'high' | 'medium' | 'low';
      affectedClients: number;
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Responde SOLO JSON válido. reasoning: máximo 20 palabras.',
      maxTokens: 300
    });
    
    console.log('[predictChurn] OK');
    
    return {
      riskLevel: prediction.riskLevel || 'low',
      affectedClients: Number(prediction.affectedClients) || 0,
      reasoning: prediction.reasoning || 'No disponible'
    };
  } catch (error) {
    console.error('[predictChurn] Error:', error instanceof Error ? error.message : String(error));
    
    return {
      riskLevel: 'low',
      affectedClients: 0,
      reasoning: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Genera predicción de mantenimientos usando Gemini AI
 */
export async function predictMaintenance(data: MaintenanceData): Promise<MaintenancePrediction> {
  console.log('[predictMaintenance] Iniciando predicción...');
  
  try {
    const prompt = `Evalúa necesidad de mantenimientos.
Pianos totales: ${data.totalPianos}
Pianos >18 meses sin mantenimiento: ${data.overdue}
Próximos 30 días: ${data.upcoming}

Responde JSON:
{"urgentCount":número,"scheduledCount":número,"reasoning":"max 20 palabras"}`;

    const prediction = await generateJsonWithGemini<{
      urgentCount: number;
      scheduledCount: number;
      reasoning: string;
    }>(prompt, {
      systemPrompt: 'Responde SOLO JSON válido. reasoning: máximo 20 palabras.',
      maxTokens: 300
    });
    
    console.log('[predictMaintenance] OK');
    
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
      reasoning: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
