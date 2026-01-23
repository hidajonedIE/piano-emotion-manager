/**
 * Churn Risk Prediction Service
 * Genera predicciones de clientes en riesgo usando Gemini AI
 * Piano Emotion Manager
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChurnRiskData } from './churn-data.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChurnRiskPrediction {
  clients: {
    id: string;
    name: string;
    riskScore: number; // 0-100
    riskLevel: 'high' | 'medium' | 'low';
    daysSinceLastService: number;
    recommendedAction: string;
  }[];
  totalAtRisk: number;
  insights: string[];
  recommendations: string[];
}

/**
 * Genera predicción de churn risk usando Gemini AI
 */
export async function generateChurnRiskPrediction(data: ChurnRiskData): Promise<ChurnRiskPrediction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Eres un analista de retención de clientes experto. Analiza estos clientes en riesgo de un negocio de afinación y reparación de pianos:

CLIENTES EN RIESGO (sin servicio en 6+ meses):
${data.clients.slice(0, 10).map(c => `
- ${c.name}
  * Último servicio: ${c.lastServiceDate || 'Nunca'}
  * Días sin servicio: ${c.daysSinceLastService}
  * Total servicios: ${c.totalServices}
  * Total gastado: ${c.totalSpent.toFixed(2)}€
`).join('\n')}

TAREAS:
1. Asigna un score de riesgo (0-100) a cada cliente
2. Clasifica el nivel de riesgo (high/medium/low)
3. Sugiere una acción específica para cada cliente
4. Proporciona 3-5 insights generales
5. Da 3-5 recomendaciones para reducir el churn

FORMATO DE RESPUESTA (JSON estricto):
{
  "clients": [
    {
      "id": "<id del cliente>",
      "name": "<nombre>",
      "riskScore": <0-100>,
      "riskLevel": "high|medium|low",
      "daysSinceLastService": <días>,
      "recommendedAction": "<acción específica>"
    },
    ...
  ],
  "totalAtRisk": <número>,
  "insights": [
    "<insight 1>",
    ...
  ],
  "recommendations": [
    "<recomendación 1>",
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

    const prediction = JSON.parse(jsonMatch[0]) as ChurnRiskPrediction;
    return prediction;

  } catch (error) {
    console.error('[generateChurnRiskPrediction] Error:', error);
    
    // Fallback: clasificación simple basada en días
    const clientsWithRisk = data.clients.map(client => {
      const days = client.daysSinceLastService;
      let riskScore = 0;
      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      let action = '';

      if (days >= 730) { // 2+ años
        riskScore = 90;
        riskLevel = 'high';
        action = 'Contacto urgente con oferta especial';
      } else if (days >= 365) { // 1+ año
        riskScore = 70;
        riskLevel = 'high';
        action = 'Llamada telefónica para agendar servicio';
      } else if (days >= 270) { // 9+ meses
        riskScore = 50;
        riskLevel = 'medium';
        action = 'Email recordatorio de mantenimiento';
      } else {
        riskScore = 30;
        riskLevel = 'low';
        action = 'Seguimiento preventivo';
      }

      return {
        id: client.id,
        name: client.name,
        riskScore,
        riskLevel,
        daysSinceLastService: days,
        recommendedAction: action
      };
    });

    return {
      clients: clientsWithRisk,
      totalAtRisk: data.totalAtRisk,
      insights: [
        `${data.totalAtRisk} clientes sin servicio en 6+ meses`,
        'Riesgo de pérdida de clientes de alto valor',
        'Necesidad de campaña de reactivación'
      ],
      recommendations: [
        'Implementar programa de recordatorios automáticos',
        'Ofrecer descuentos a clientes inactivos',
        'Contactar personalmente a clientes de alto valor'
      ]
    };
  }
}
