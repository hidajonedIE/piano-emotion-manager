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
    maxTokens?: number;
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
export async function generateServiceReport(
  serviceData: {
    pianoModel: string;
    pianoBrand: string;
    serviceType: string;
    technicianNotes: string;
    tasksCompleted: string[];
    clientName: string;
  },
  language: string = 'es'
): Promise<string> {
  // Import AI prompts system
  const { getAIPrompt, interpolatePrompt } = await import('../utils/ai-prompts.js');
  
  // Get prompt templates for the specified language
  const userTemplate = getAIPrompt('serviceReport', language, 'user');
  const systemPrompt = getAIPrompt('serviceReport', language, 'system');
  
  // Interpolate variables into the prompt
  const prompt = interpolatePrompt(userTemplate, {
    pianoBrand: serviceData.pianoBrand,
    pianoModel: serviceData.pianoModel,
    clientName: serviceData.clientName,
    serviceType: serviceData.serviceType,
    technicianNotes: serviceData.technicianNotes,
    tasksCompleted: serviceData.tasksCompleted.join(', ')
  });

  return invokeGemini(prompt, {
    systemPrompt,
    temperature: 0.5,
  });
}

/**
 * Genera un email personalizado
 */
export async function generateClientEmail(
  params: {
    type: 'reminder' | 'followup' | 'promotion' | 'thank_you';
    clientName: string;
    lastService?: string;
    nextServiceDate?: string;
    customContext?: string;
  },
  language: string = 'es'
): Promise<{ subject: string; body: string }> {
  // Import AI prompts system
  const { prepareEmailPrompt } = await import('../utils/ai-prompts.js');
  
  // Prepare prompts with all parameters
  const { userPrompt, systemPrompt } = prepareEmailPrompt(
    language,
    params.type,
    params.clientName,
    params.lastService,
    params.nextServiceDate,
    params.customContext
  );

  return generateJsonWithGemini<{ subject: string; body: string }>(userPrompt, {
    systemPrompt,
  });
}

/**
 * Analiza el riesgo de pérdida de un cliente
 */
export async function analyzeClientChurnRisk(
  clientData: {
    name: string;
    daysSinceLastService: number;
    totalServices: number;
    averageInterval: number;
    totalSpent: number;
  },
  language: string = 'es'
): Promise<{
  riskLevel: 'low' | 'medium' | 'high';
  analysis: string;
  recommendations: string[];
}> {
  // Import AI prompts system
  const { getAIPrompt, interpolatePrompt } = await import('../utils/ai-prompts.js');
  
  // Get prompt templates for the specified language
  const userTemplate = getAIPrompt('churnRisk', language, 'user');
  const systemPrompt = getAIPrompt('churnRisk', language, 'system');
  
  // Interpolate variables into the prompt
  const prompt = interpolatePrompt(userTemplate, {
    clientName: clientData.name,
    daysSinceLastService: clientData.daysSinceLastService.toString(),
    totalServices: clientData.totalServices.toString(),
    averageInterval: clientData.averageInterval.toString(),
    totalSpent: clientData.totalSpent.toString()
  });

  return generateJsonWithGemini(prompt, {
    systemPrompt,
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
  },
  language: string = 'es'
): Promise<string> {
  // Import AI prompts system
  const { prepareChatAssistantPrompt } = await import('../utils/ai-prompts.js');
  
  // Prepare prompts with context
  const { userPrompt, systemPrompt } = prepareChatAssistantPrompt(
    language,
    message,
    context
  );

  return invokeGemini(userPrompt, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 500,
  });
}
