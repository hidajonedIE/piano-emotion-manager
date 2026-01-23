/**
 * Gemini Predictions Service
 * Servicio para generar predicciones inteligentes usando Gemini AI
 * Piano Emotion Manager
 */

import { invokeGemini } from '../../_core/gemini.js';
import type { PredictionsDataComplete } from './predictions-data.service.js';

// ============================================
// INTERFACES DE PREDICCIONES
// ============================================

export interface RevenuePrediction {
  months: Array<{
    month: string;
    estimated: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  factors: string[];
  summary: string;
}

export interface ChurnRiskPrediction {
  totalAtRisk: number;
  clients: Array<{
    id: string;
    name: string;
    riskScore: number;
    daysSinceLastService: number;
    suggestedAction: string;
  }>;
  recommendations: string[];
}

export interface MaintenancePrediction {
  totalNeeded: number;
  pianos: Array<{
    id: string;
    info: string;
    clientName: string;
    daysSinceMaintenance: number;
    urgency: 'high' | 'medium' | 'low';
    recommendedService: string;
  }>;
  summary: string;
}

export interface WorkloadPrediction {
  weeks: Array<{
    week: string;
    estimatedServices: number;
    estimatedHours: number;
    peakDays: string[];
  }>;
  recommendations: string[];
}

export interface InventoryPrediction {
  items: Array<{
    name: string;
    currentStock: number;
    estimatedDemand: number;
    suggestedOrder: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  totalInvestment: number;
  recommendations: string[];
}

export interface AllPredictions {
  revenue: RevenuePrediction;
  churnRisk: ChurnRiskPrediction;
  maintenance: MaintenancePrediction;
  workload?: WorkloadPrediction;
  inventory?: InventoryPrediction;
  generatedAt: string;
}

// ============================================
// FUNCIONES DE GENERACIÓN
// ============================================

/**
 * Genera TODAS las predicciones disponibles según los datos
 */
export async function generateAllPredictions(data: PredictionsDataComplete): Promise<AllPredictions> {
  console.log('[generateAllPredictions] Iniciando generación de predicciones');
  
  const predictions: AllPredictions = {
    revenue: await generateRevenuePredictions(data),
    churnRisk: await generateChurnRiskPredictions(data),
    maintenance: await generateMaintenancePredictions(data),
    generatedAt: new Date().toISOString(),
  };
  
  // Predicciones opcionales
  if (data.appointments) {
    predictions.workload = await generateWorkloadPredictions(data);
  }
  
  if (data.inventory) {
    predictions.inventory = await generateInventoryPredictions(data);
  }
  
  console.log('[generateAllPredictions] Predicciones generadas exitosamente');
  return predictions;
}

/**
 * Genera predicciones de ingresos para los próximos 6 meses
 */
export async function generateRevenuePredictions(data: PredictionsDataComplete): Promise<RevenuePrediction> {
  const prompt = `Eres un analista financiero experto en el sector de servicios de pianos.

DATOS HISTÓRICOS DE INGRESOS (últimos 12 meses en euros):
${data.revenue.last12Months.map((rev, i) => `Mes ${i + 1}: ${rev}€`).join('\n')}

Mes actual: ${data.revenue.current}€
Mes anterior: ${data.revenue.previous}€
Promedio mensual: ${data.revenue.monthlyAverage}€
Tendencia actual: ${data.revenue.trend}

CONTEXTO DEL NEGOCIO:
- Total de clientes: ${data.clients.total}
- Clientes sin servicios recientes: ${data.clients.withoutRecentServices}
- Total de pianos: ${data.pianos.total}
- Pianos sin mantenimiento reciente: ${data.pianos.withoutRecentMaintenance}

TAREA:
Genera una predicción de ingresos para los próximos 6 meses.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "months": [
    {
      "month": "Febrero 2026",
      "estimated": 15000,
      "confidence": 85,
      "trend": "up"
    }
    // ... 6 meses en total
  ],
  "factors": [
    "Factor 1 que influye en la predicción",
    "Factor 2 que influye en la predicción",
    "Factor 3 que influye en la predicción"
  ],
  "summary": "Resumen ejecutivo de la predicción en 2-3 líneas"
}

IMPORTANTE: 
- confidence debe ser un número entre 0-100
- trend debe ser "up", "down" o "stable"
- estimated debe ser un número realista basado en el histórico
- NO incluyas texto adicional, SOLO el JSON`;

  try {
    const response = await invokeGemini(prompt);
    const prediction = JSON.parse(response);
    return prediction;
  } catch (error) {
    console.error('[generateRevenuePredictions] Error:', error);
    // Fallback con predicción básica
    return generateBasicRevenuePrediction(data);
  }
}

/**
 * Genera predicciones de clientes en riesgo de abandono
 */
export async function generateChurnRiskPredictions(data: PredictionsDataComplete): Promise<ChurnRiskPrediction> {
  const prompt = `Eres un experto en retención de clientes en el sector de servicios de pianos.

DATOS DE CLIENTES:
- Total de clientes: ${data.clients.total}
- Clientes sin servicios en 6+ meses: ${data.clients.withoutRecentServices}
- Nuevos clientes últimos 6 meses: ${data.clients.last6MonthsNew.reduce((a, b) => a + b, 0)}
- Intervalo promedio entre servicios: ${data.clients.averageServiceInterval} días

DATOS DE INGRESOS:
- Tendencia: ${data.revenue.trend}
- Mes actual vs anterior: ${data.revenue.current} vs ${data.revenue.previous}

TAREA:
Identifica los clientes con mayor riesgo de abandono y genera recomendaciones.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "totalAtRisk": 15,
  "clients": [
    {
      "id": "client_1",
      "name": "Cliente Ejemplo",
      "riskScore": 85,
      "daysSinceLastService": 210,
      "suggestedAction": "Contactar urgentemente para oferta especial de mantenimiento"
    }
    // ... hasta 20 clientes
  ],
  "recommendations": [
    "Recomendación estratégica 1",
    "Recomendación estratégica 2",
    "Recomendación estratégica 3"
  ]
}

IMPORTANTE:
- riskScore debe ser entre 0-100 (100 = máximo riesgo)
- Ordena los clientes por riskScore descendente
- suggestedAction debe ser específica y accionable
- Si hay menos de 20 clientes en riesgo, incluye solo los que realmente están en riesgo
- NO incluyas texto adicional, SOLO el JSON`;

  try {
    const response = await invokeGemini(prompt);
    const prediction = JSON.parse(response);
    return prediction;
  } catch (error) {
    console.error('[generateChurnRiskPredictions] Error:', error);
    return generateBasicChurnPrediction(data);
  }
}

/**
 * Genera predicciones de mantenimiento necesario
 */
export async function generateMaintenancePredictions(data: PredictionsDataComplete): Promise<MaintenancePrediction> {
  const prompt = `Eres un experto técnico en mantenimiento de pianos.

DATOS DE PIANOS:
- Total de pianos: ${data.pianos.total}
- Pianos sin mantenimiento en 12+ meses: ${data.pianos.withoutRecentMaintenance}
- Distribución por marca: ${JSON.stringify(data.pianos.byBrand)}
- Edad promedio: ${data.pianos.averageAge} años

DATOS DE SERVICIOS:
${data.services ? `
- Total de servicios históricos: ${data.services.total}
- Servicios por tipo: ${JSON.stringify(data.services.byType)}
- Costo promedio: ${data.services.averageCost}€
` : 'No hay datos detallados de servicios disponibles'}

TAREA:
Identifica los pianos que más necesitan mantenimiento y genera recomendaciones.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "totalNeeded": 25,
  "pianos": [
    {
      "id": "piano_1",
      "info": "Yamaha C3 (1995)",
      "clientName": "Cliente Ejemplo",
      "daysSinceMaintenance": 450,
      "urgency": "high",
      "recommendedService": "Afinación completa + revisión mecánica"
    }
    // ... hasta 20 pianos
  ],
  "summary": "Resumen ejecutivo del estado del parque de pianos en 2-3 líneas"
}

IMPORTANTE:
- urgency debe ser "high", "medium" o "low"
- Ordena los pianos por urgencia y días sin mantenimiento
- recommendedService debe ser específico según el tipo de piano y tiempo sin servicio
- Si hay menos de 20 pianos que necesitan mantenimiento, incluye solo los necesarios
- NO incluyas texto adicional, SOLO el JSON`;

  try {
    const response = await invokeGemini(prompt);
    const prediction = JSON.parse(response);
    return prediction;
  } catch (error) {
    console.error('[generateMaintenancePredictions] Error:', error);
    return generateBasicMaintenancePrediction(data);
  }
}

/**
 * Genera predicciones de carga de trabajo
 */
export async function generateWorkloadPredictions(data: PredictionsDataComplete): Promise<WorkloadPrediction> {
  if (!data.appointments) {
    throw new Error('No hay datos de citas disponibles');
  }

  const prompt = `Eres un experto en planificación de recursos para servicios de pianos.

DATOS DE CITAS:
- Citas programadas: ${data.appointments.upcoming}
- Próximas 4 semanas: ${data.appointments.next4Weeks.join(', ')}
- Distribución por tipo: ${JSON.stringify(data.appointments.byType)}

DATOS HISTÓRICOS:
${data.services ? `
- Servicios últimos 12 meses: ${data.services.last12Months.join(', ')}
- Promedio mensual: ${data.services.last12Months.reduce((a, b) => a + b, 0) / 12}
` : ''}

TAREA:
Predice la carga de trabajo para las próximas 4 semanas.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "weeks": [
    {
      "week": "Semana del 27 Ene - 2 Feb",
      "estimatedServices": 12,
      "estimatedHours": 48,
      "peakDays": ["Martes", "Jueves"]
    }
    // ... 4 semanas
  ],
  "recommendations": [
    "Recomendación de planificación 1",
    "Recomendación de planificación 2",
    "Recomendación de planificación 3"
  ]
}

IMPORTANTE:
- estimatedHours asume 4 horas promedio por servicio
- peakDays son los días con más servicios esperados
- recommendations deben ser accionables para optimizar recursos
- NO incluyas texto adicional, SOLO el JSON`;

  try {
    const response = await invokeGemini(prompt);
    const prediction = JSON.parse(response);
    return prediction;
  } catch (error) {
    console.error('[generateWorkloadPredictions] Error:', error);
    return generateBasicWorkloadPrediction(data);
  }
}

/**
 * Genera predicciones de demanda de inventario
 */
export async function generateInventoryPredictions(data: PredictionsDataComplete): Promise<InventoryPrediction> {
  if (!data.inventory) {
    throw new Error('No hay datos de inventario disponibles');
  }

  const prompt = `Eres un experto en gestión de inventario para servicios de pianos.

DATOS DE INVENTARIO:
- Total de items: ${data.inventory.totalItems}
- Items con stock bajo: ${data.inventory.lowStock.length}
- Items en stock crítico: ${data.inventory.criticalStock}

ITEMS CON STOCK BAJO:
${data.inventory.lowStock.map(item => 
  `- ${item.name}: ${item.current}/${item.minimum} (${item.category})`
).join('\n')}

DATOS DE SERVICIOS:
${data.services ? `
- Servicios últimos 12 meses: ${data.services.total}
- Servicios por tipo: ${JSON.stringify(data.services.byType)}
` : ''}

TAREA:
Predice la demanda de inventario y genera recomendaciones de compra.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "items": [
    {
      "name": "Cuerdas de acero calibre 13",
      "currentStock": 5,
      "estimatedDemand": 25,
      "suggestedOrder": 30,
      "priority": "high"
    }
    // ... todos los items necesarios
  ],
  "totalInvestment": 1500,
  "recommendations": [
    "Recomendación de compra 1",
    "Recomendación de compra 2",
    "Recomendación de compra 3"
  ]
}

IMPORTANTE:
- priority debe ser "high", "medium" o "low"
- suggestedOrder debe considerar demanda + stock de seguridad
- totalInvestment es la suma estimada de todas las compras sugeridas
- Ordena por priority descendente
- NO incluyas texto adicional, SOLO el JSON`;

  try {
    const response = await invokeGemini(prompt);
    const prediction = JSON.parse(response);
    return prediction;
  } catch (error) {
    console.error('[generateInventoryPredictions] Error:', error);
    return generateBasicInventoryPrediction(data);
  }
}

// ============================================
// FUNCIONES FALLBACK (predicciones básicas)
// ============================================

function generateBasicRevenuePrediction(data: PredictionsDataComplete): RevenuePrediction {
  const avg = data.revenue.monthlyAverage;
  const trend = data.revenue.trend;
  const factor = trend === 'up' ? 1.05 : trend === 'down' ? 0.95 : 1.0;
  
  const months = [];
  const now = new Date();
  
  for (let i = 1; i <= 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    months.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      estimated: Math.round(avg * Math.pow(factor, i)),
      confidence: 70,
      trend: trend,
    });
  }
  
  return {
    months,
    factors: [
      'Tendencia histórica de ingresos',
      'Estacionalidad del sector',
      'Base de clientes actual',
    ],
    summary: `Predicción basada en promedio histórico de ${Math.round(avg)}€/mes con tendencia ${trend === 'up' ? 'al alza' : trend === 'down' ? 'a la baja' : 'estable'}.`,
  };
}

function generateBasicChurnPrediction(data: PredictionsDataComplete): ChurnRiskPrediction {
  const atRisk = data.clients.withoutRecentServices;
  const clients = [];
  
  for (let i = 0; i < Math.min(atRisk, 20); i++) {
    clients.push({
      id: `client_${i + 1}`,
      name: `Cliente ${i + 1}`,
      riskScore: 90 - (i * 3),
      daysSinceLastService: 180 + (i * 10),
      suggestedAction: 'Contactar para oferta de reactivación',
    });
  }
  
  return {
    totalAtRisk: atRisk,
    clients,
    recommendations: [
      'Implementar campaña de reactivación para clientes inactivos',
      'Ofrecer descuentos especiales en servicios de mantenimiento',
      'Establecer programa de seguimiento proactivo',
    ],
  };
}

function generateBasicMaintenancePrediction(data: PredictionsDataComplete): MaintenancePrediction {
  const needed = data.pianos.withoutRecentMaintenance;
  const pianos = [];
  
  for (let i = 0; i < Math.min(needed, 20); i++) {
    pianos.push({
      id: `piano_${i + 1}`,
      info: `Piano ${i + 1}`,
      clientName: `Cliente ${i + 1}`,
      daysSinceMaintenance: 365 + (i * 30),
      urgency: i < 5 ? 'high' : i < 15 ? 'medium' : 'low',
      recommendedService: 'Afinación y revisión general',
    });
  }
  
  return {
    totalNeeded: needed,
    pianos,
    summary: `${needed} pianos requieren mantenimiento. Priorizar los ${Math.min(5, needed)} más urgentes.`,
  };
}

function generateBasicWorkloadPrediction(data: PredictionsDataComplete): WorkloadPrediction {
  const weeks = [];
  const now = new Date();
  
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekLabel = `Semana del ${weekStart.getDate()} ${weekStart.toLocaleDateString('es-ES', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('es-ES', { month: 'short' })}`;
    
    weeks.push({
      week: weekLabel,
      estimatedServices: data.appointments?.next4Weeks[i] || 10,
      estimatedHours: (data.appointments?.next4Weeks[i] || 10) * 4,
      peakDays: ['Martes', 'Jueves'],
    });
  }
  
  return {
    weeks,
    recommendations: [
      'Optimizar rutas de servicio para reducir tiempos de desplazamiento',
      'Considerar contratación temporal en semanas de alta demanda',
      'Implementar sistema de recordatorios automáticos',
    ],
  };
}

function generateBasicInventoryPrediction(data: PredictionsDataComplete): InventoryPrediction {
  if (!data.inventory) {
    throw new Error('No hay datos de inventario');
  }
  
  const items = data.inventory.lowStock.map(item => ({
    name: item.name,
    currentStock: item.current,
    estimatedDemand: item.minimum * 2,
    suggestedOrder: Math.max(item.minimum * 3 - item.current, 0),
    priority: item.current === 0 ? 'high' as const : item.current < item.minimum / 2 ? 'medium' as const : 'low' as const,
  }));
  
  const totalInvestment = items.reduce((sum, item) => sum + (item.suggestedOrder * 10), 0);
  
  return {
    items,
    totalInvestment,
    recommendations: [
      'Priorizar reposición de items en stock crítico',
      'Establecer alertas automáticas de stock bajo',
      'Negociar descuentos por volumen con proveedores',
    ],
  };
}
