/**
 * Gemini AI Predictions Service - Usando SDK oficial de Google
 * Piano Emotion Manager
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RevenueData } from './revenue-data.service.js';
import type { ChurnRiskData } from './churn-data.service.js';
import type { MaintenanceData } from './maintenance-data.service.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY no está configurada');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
 * Genera predicción de ingresos usando Gemini AI con SDK oficial
 */
export async function predictRevenue(data: RevenueData): Promise<RevenuePrediction> {
  console.log('[predictRevenue] Iniciando predicción con SDK de Google...');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      },
    });

    // Crear resumen ultra-simple de los últimos 3 meses
    const last3Months = data.historical.slice(-3);
    const summary = last3Months.map(m => `${m.month}: ${m.amount}€`).join(', ');
    
    const prompt = `Predice ingresos próximo mes.
Últimos 3 meses: ${summary}
Actual: ${data.current}€
Promedio: ${data.average}€

Responde SOLO JSON válido (sin markdown):
{"predictedAmount":número,"confidence":"high/medium/low","reasoning":"max 20 palabras"}`;

    console.log('[predictRevenue] Enviando prompt a Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log(`[predictRevenue] Respuesta recibida (${text.length} caracteres): ${text}`);
    
    const prediction = JSON.parse(text.trim()) as {
      predictedAmount: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
    };
    
    console.log('[predictRevenue] Predicción parseada correctamente');

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
 * Genera predicción de riesgo de pérdida de clientes usando Gemini AI con SDK oficial
 */
export async function predictChurn(data: ChurnRiskData): Promise<ChurnPrediction> {
  console.log('[predictChurn] Iniciando predicción con SDK de Google...');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      },
    });

    const prompt = `Evalúa riesgo de pérdida de clientes.
Total en riesgo: ${data.totalAtRisk}
Top 3: ${data.clients.slice(0, 3).map(c => `${c.name} (${c.riskScore}%)`).join(', ')}

Responde SOLO JSON válido (sin markdown):
{"riskLevel":"high/medium/low","affectedClients":número,"reasoning":"max 20 palabras"}`;

    console.log('[predictChurn] Enviando prompt a Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log(`[predictChurn] Respuesta recibida (${text.length} caracteres): ${text}`);
    
    const prediction = JSON.parse(text.trim()) as {
      riskLevel: 'high' | 'medium' | 'low';
      affectedClients: number;
      reasoning: string;
    };
    
    console.log('[predictChurn] Predicción parseada correctamente');
    
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
 * Genera predicción de mantenimientos usando Gemini AI con SDK oficial
 */
export async function predictMaintenance(data: MaintenanceData): Promise<MaintenancePrediction> {
  console.log('[predictMaintenance] Iniciando predicción con SDK de Google...');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3,
      },
    });

    const prompt = `Evalúa necesidad de mantenimientos.
Pianos totales: ${data.totalPianos}
Pianos >18 meses sin mantenimiento: ${data.overdue}
Próximos 30 días: ${data.upcoming}

Responde SOLO JSON válido (sin markdown):
{"urgentCount":número,"scheduledCount":número,"reasoning":"max 20 palabras"}`;

    console.log('[predictMaintenance] Enviando prompt a Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log(`[predictMaintenance] Respuesta recibida (${text.length} caracteres): ${text}`);
    
    const prediction = JSON.parse(text.trim()) as {
      urgentCount: number;
      scheduledCount: number;
      reasoning: string;
    };
    
    console.log('[predictMaintenance] Predicción parseada correctamente');
    
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
