/**
 * Revenue Prediction Service
 * Genera predicciones de ingresos usando Gemini AI
 * Piano Emotion Manager
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RevenueData } from './revenue-data.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface RevenuePrediction {
  nextMonth: {
    estimated: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  next6Months: {
    month: string;
    estimated: number;
  }[];
  insights: string[];
  recommendations: string[];
}

/**
 * Genera predicción de ingresos usando Gemini AI
 */
export async function generateRevenuePrediction(data: RevenueData): Promise<RevenuePrediction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Eres un analista financiero experto. Analiza estos datos de ingresos de un negocio de afinación y reparación de pianos:

DATOS HISTÓRICOS (últimos 12 meses):
${data.historical.map(m => `- ${m.month}: ${m.total.toFixed(2)}€`).join('\n')}

MÉTRICAS:
- Ingreso actual: ${data.current.toFixed(2)}€
- Promedio mensual: ${data.average.toFixed(2)}€
- Tendencia: ${data.trend === 'up' ? 'Creciente' : data.trend === 'down' ? 'Decreciente' : 'Estable'}

TAREAS:
1. Predice los ingresos del próximo mes
2. Predice los ingresos de los próximos 6 meses
3. Proporciona 3-5 insights clave sobre el negocio
4. Da 3-5 recomendaciones accionables

FORMATO DE RESPUESTA (JSON estricto):
{
  "nextMonth": {
    "estimated": <número>,
    "confidence": "high|medium|low",
    "reasoning": "<explicación breve>"
  },
  "next6Months": [
    {"month": "2026-02", "estimated": <número>},
    ...
  ],
  "insights": [
    "<insight 1>",
    "<insight 2>",
    ...
  ],
  "recommendations": [
    "<recomendación 1>",
    "<recomendación 2>",
    ...
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const prediction = JSON.parse(jsonMatch[0]) as RevenuePrediction;
    return prediction;

  } catch (error) {
    console.error('[generateRevenuePrediction] Error:', error);
    
    // Fallback: predicción basada en promedio
    const nextMonth = data.average * (data.trend === 'up' ? 1.1 : data.trend === 'down' ? 0.9 : 1);
    
    return {
      nextMonth: {
        estimated: nextMonth,
        confidence: 'low',
        reasoning: 'Predicción basada en promedio histórico (Gemini no disponible)'
      },
      next6Months: Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() + i + 1);
        return {
          month: date.toISOString().slice(0, 7),
          estimated: nextMonth * (1 + (i * 0.02)) // Crecimiento del 2% mensual
        };
      }),
      insights: [
        `Ingreso promedio mensual: ${data.average.toFixed(2)}€`,
        `Tendencia actual: ${data.trend === 'up' ? 'Creciente' : data.trend === 'down' ? 'Decreciente' : 'Estable'}`,
        'Datos insuficientes para análisis detallado'
      ],
      recommendations: [
        'Recopila más datos históricos para mejores predicciones',
        'Monitorea la tendencia mensualmente',
        'Considera factores estacionales'
      ]
    };
  }
}
