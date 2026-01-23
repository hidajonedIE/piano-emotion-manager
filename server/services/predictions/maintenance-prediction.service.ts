/**
 * Maintenance Prediction Service
 * Genera predicciones de mantenimiento usando Gemini AI
 * Piano Emotion Manager
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MaintenanceData } from './maintenance-data.service.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface MaintenancePrediction {
  pianos: {
    id: string;
    brand: string;
    model: string;
    clientName: string;
    urgency: 'critical' | 'high' | 'medium';
    daysSinceLastMaintenance: number;
    recommendedAction: string;
    estimatedCost: number;
  }[];
  totalNeeded: number;
  insights: string[];
  recommendations: string[];
}

/**
 * Genera predicción de mantenimiento usando Gemini AI
 */
export async function generateMaintenancePrediction(data: MaintenanceData): Promise<MaintenancePrediction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Eres un experto en mantenimiento de pianos. Analiza estos pianos que necesitan mantenimiento:

PIANOS QUE NECESITAN MANTENIMIENTO (12+ meses sin servicio):
${data.pianos.slice(0, 10).map(p => `
- ${p.brand} ${p.model} (S/N: ${p.serialNumber})
  * Cliente: ${p.clientName}
  * Último mantenimiento: ${p.lastMaintenanceDate || 'Nunca'}
  * Días sin mantenimiento: ${p.daysSinceLastMaintenance}
  * Total mantenimientos: ${p.totalMaintenances}
`).join('\n')}

TAREAS:
1. Clasifica la urgencia de cada piano (critical/high/medium)
2. Sugiere una acción específica para cada uno
3. Estima el costo del mantenimiento necesario
4. Proporciona 3-5 insights generales
5. Da 3-5 recomendaciones para el negocio

FORMATO DE RESPUESTA (JSON estricto):
{
  "pianos": [
    {
      "id": "<id del piano>",
      "brand": "<marca>",
      "model": "<modelo>",
      "clientName": "<nombre cliente>",
      "urgency": "critical|high|medium",
      "daysSinceLastMaintenance": <días>,
      "recommendedAction": "<acción específica>",
      "estimatedCost": <número en euros>
    },
    ...
  ],
  "totalNeeded": <número>,
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

    const prediction = JSON.parse(jsonMatch[0]) as MaintenancePrediction;
    return prediction;

  } catch (error) {
    console.error('[generateMaintenancePrediction] Error:', error);
    
    // Fallback: clasificación simple basada en días
    const pianosWithUrgency = data.pianos.map(piano => {
      const days = piano.daysSinceLastMaintenance;
      let urgency: 'critical' | 'high' | 'medium' = 'medium';
      let action = '';
      let cost = 0;

      if (days >= 1095) { // 3+ años
        urgency = 'critical';
        action = 'Mantenimiento completo urgente + revisión estructural';
        cost = 250;
      } else if (days >= 730) { // 2+ años
        urgency = 'high';
        action = 'Mantenimiento completo + afinación';
        cost = 180;
      } else { // 1+ año
        urgency = 'medium';
        action = 'Afinación y revisión general';
        cost = 120;
      }

      return {
        id: piano.id,
        brand: piano.brand,
        model: piano.model,
        clientName: piano.clientName,
        urgency,
        daysSinceLastMaintenance: days,
        recommendedAction: action,
        estimatedCost: cost
      };
    });

    return {
      pianos: pianosWithUrgency,
      totalNeeded: data.totalNeeded,
      insights: [
        `${data.totalNeeded} pianos necesitan mantenimiento`,
        'Riesgo de deterioro si no se atienden pronto',
        'Oportunidad de ingresos estimada: ' + 
          pianosWithUrgency.reduce((sum, p) => sum + p.estimatedCost, 0).toFixed(2) + '€'
      ],
      recommendations: [
        'Contactar a clientes con pianos críticos inmediatamente',
        'Ofrecer paquetes de mantenimiento preventivo',
        'Implementar recordatorios automáticos anuales'
      ]
    };
  }
}
