/**
 * Servicio de Google Gemini AI
 * Piano Emotion Manager
 * 
 * Integración con la API gratuita de Google Gemini
 * Documentación: https://ai.google.dev/gemini-api/docs
 */

import { ENV } from "./env.js";

// Tipos para la API de Gemini
export type GeminiRole = "user" | "model";

export type GeminiPart = {
  text: string;
};

export type GeminiContent = {
  role: GeminiRole;
  parts: GeminiPart[];
};

export type GeminiGenerationConfig = {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
};

export type GeminiSafetySettings = {
  category: string;
  threshold: string;
}[];

export type GeminiRequest = {
  contents: GeminiContent[];
  generationConfig?: GeminiGenerationConfig;
  safetySettings?: GeminiSafetySettings;
  systemInstruction?: {
    parts: GeminiPart[];
  };
};

export type GeminiResponse = {
  candidates: {
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
};

// Configuración
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Obtiene la API key de Gemini desde las variables de entorno
 */
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || ENV.forgeApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }
  return apiKey;
}

/**
 * Invoca el modelo Gemini con un prompt simple
 */
export async function invokeGemini(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const apiKey = getApiKey();
  const model = options?.model || DEFAULT_MODEL;
  
  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
    },
  };

  if (options?.systemPrompt) {
    request.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as GeminiResponse;
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No se recibió respuesta de Gemini");
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Chat con historial de conversación
 */
export async function chatWithGemini(
  messages: GeminiContent[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const apiKey = getApiKey();
  const model = options?.model || DEFAULT_MODEL;

  const request: GeminiRequest = {
    contents: messages,
    generationConfig: {
      maxOutputTokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
    },
  };

  if (options?.systemPrompt) {
    request.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as GeminiResponse;
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No se recibió respuesta de Gemini");
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Analiza texto con un contexto específico
 */
export async function analyzeWithGemini(
  systemPrompt: string,
  userInput: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  return invokeGemini(userInput, {
    ...options,
    systemPrompt,
  });
}

/**
 * Genera JSON estructurado a partir de un prompt
 */
export async function generateJsonWithGemini<T>(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
  }
): Promise<T> {
  const systemPrompt = options?.systemPrompt || 
    "Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.";
  
  const response = await invokeGemini(prompt, {
    ...options,
    systemPrompt,
    temperature: 0.3, // Más determinístico para JSON
  });

  // Limpiar la respuesta de posibles marcadores de código
  let cleanJson = response.trim();
  if (cleanJson.startsWith("```json")) {
    cleanJson = cleanJson.slice(7);
  }
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.slice(3);
  }
  if (cleanJson.endsWith("```")) {
    cleanJson = cleanJson.slice(0, -3);
  }

  try {
    return JSON.parse(cleanJson.trim()) as T;
  } catch (error) {
    throw new Error(`Error parseando JSON de Gemini: ${cleanJson}`);
  }
}

/**
 * Verifica si la API de Gemini está disponible
 */
export async function checkGeminiAvailability(): Promise<boolean> {
  try {
    const apiKey = getApiKey();
    const response = await fetch(
      `${GEMINI_API_BASE}/models?key=${apiKey}`,
      { method: "GET" }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Obtiene la lista de modelos disponibles
 */
export async function listGeminiModels(): Promise<string[]> {
  const apiKey = getApiKey();
  const response = await fetch(
    `${GEMINI_API_BASE}/models?key=${apiKey}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener los modelos de Gemini");
  }

  const data = await response.json();
  return data.models?.map((m: { name: string }) => m.name) || [];
}

// ============================================
// FUNCIONES ESPECÍFICAS PARA PIANO EMOTION MANAGER
// ============================================

/**
 * Genera un informe de servicio profesional
 */
export async function generateServiceReport(serviceData: {
  pianoModel: string;
  pianoBrand: string;
  serviceType: string;
  technicianNotes: string;
  tasksCompleted: string[];
  clientName: string;
}): Promise<string> {
  const prompt = `Genera un informe profesional de servicio de piano:

Piano: ${serviceData.pianoBrand} ${serviceData.pianoModel}
Cliente: ${serviceData.clientName}
Tipo de servicio: ${serviceData.serviceType}
Notas del técnico: ${serviceData.technicianNotes}
Tareas completadas: ${serviceData.tasksCompleted.join(', ')}

El informe debe incluir:
1. Resumen ejecutivo (2-3 líneas)
2. Estado del piano antes del servicio
3. Trabajos realizados detallados
4. Recomendaciones para el cliente
5. Próximo mantenimiento sugerido

Formato: Profesional pero accesible para el cliente. En español.`;

  return invokeGemini(prompt, {
    systemPrompt: "Eres un experto técnico de pianos que redacta informes profesionales.",
    temperature: 0.5,
  });
}

/**
 * Genera un email personalizado
 */
export async function generateClientEmail(params: {
  type: 'reminder' | 'followup' | 'promotion' | 'thank_you';
  clientName: string;
  lastService?: string;
  nextServiceDate?: string;
  customContext?: string;
}): Promise<{ subject: string; body: string }> {
  const templates = {
    reminder: "recordatorio de mantenimiento de piano",
    followup: "seguimiento después del servicio",
    promotion: "oferta especial de servicios",
    thank_you: "agradecimiento por confiar en nosotros",
  };

  const prompt = `Genera un email de ${templates[params.type]} para:

Cliente: ${params.clientName}
${params.lastService ? `Último servicio: ${params.lastService}` : ''}
${params.nextServiceDate ? `Próximo servicio sugerido: ${params.nextServiceDate}` : ''}
${params.customContext ? `Contexto: ${params.customContext}` : ''}

Requisitos:
- Profesional pero cercano
- En español
- Máximo 150 palabras en el cuerpo
- Asunto atractivo y conciso

Responde en JSON: {"subject": "...", "body": "..."}`;

  return generateJsonWithGemini<{ subject: string; body: string }>(prompt, {
    systemPrompt: "Eres un experto en comunicación con clientes. Responde solo con JSON válido.",
  });
}

/**
 * Analiza el riesgo de pérdida de un cliente
 */
export async function analyzeClientChurnRisk(clientData: {
  name: string;
  daysSinceLastService: number;
  totalServices: number;
  averageInterval: number;
  totalSpent: number;
}): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  analysis: string;
  recommendations: string[];
}> {
  const prompt = `Analiza el riesgo de pérdida de este cliente de servicios de piano:

Cliente: ${clientData.name}
Días desde último servicio: ${clientData.daysSinceLastService}
Total de servicios: ${clientData.totalServices}
Intervalo promedio entre servicios: ${clientData.averageInterval} días
Total gastado: ${clientData.totalSpent}€

Proporciona:
1. Nivel de riesgo: "low", "medium" o "high"
2. Análisis breve (2-3 líneas)
3. 3 recomendaciones específicas para retenerlo

Responde en JSON: {"riskLevel": "...", "analysis": "...", "recommendations": ["...", "...", "..."]}`;

  return generateJsonWithGemini(prompt, {
    systemPrompt: "Eres un analista de CRM especializado en retención de clientes. Responde solo con JSON válido.",
  });
}

/**
 * Responde preguntas del asistente de chat
 */
export async function pianoAssistantChat(
  message: string,
  context?: {
    clientCount?: number;
    pendingServices?: number;
    userName?: string;
  }
): Promise<string> {
  const systemPrompt = `Eres PianoBot, un asistente experto en gestión de servicios de afinación y mantenimiento de pianos.

Ayudas a técnicos de piano con:
- Programación de citas y recordatorios
- Consejos técnicos sobre afinación, regulación y reparación
- Gestión de clientes y comunicación
- Facturación y presupuestos
- Mejores prácticas del sector

${context?.userName ? `El usuario se llama ${context.userName}.` : ''}
${context?.clientCount ? `Tiene ${context.clientCount} clientes registrados.` : ''}
${context?.pendingServices ? `Tiene ${context.pendingServices} servicios pendientes.` : ''}

Responde de forma concisa, profesional y útil. En español.
Si no sabes algo específico del negocio del usuario, sugiere dónde encontrar esa información en la app.`;

  return invokeGemini(message, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 500,
  });
}
