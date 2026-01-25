/**
 * Servicio de Groq AI
 * Piano Emotion Manager
 * 
 * Integración con la API de Groq para el asistente flotante
 * Documentación: https://console.groq.com/docs
 */

import Groq from "groq-sdk";

// Configuración
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Obtiene el cliente de Groq configurado
 */
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY no está configurada");
  }
  return new Groq({ apiKey });
}

/**
 * Invoca el modelo Groq con un prompt simple
 */
export async function invokeGroq(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const groq = getGroqClient();
  const model = options?.model || DEFAULT_MODEL;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

  if (options?.systemPrompt) {
    messages.push({
      role: "system",
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const response = await groq.chat.completions.create({
    model,
    messages,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("No se recibió respuesta de Groq");
  }

  return response.choices[0].message.content || "";
}

/**
 * Genera JSON estructurado a partir de un prompt
 */
export async function generateJsonWithGroq<T>(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }
): Promise<T> {
  const systemPrompt = options?.systemPrompt || 
    "Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.";
  
  const response = await invokeGroq(prompt, {
    model: options?.model,
    maxTokens: options?.maxTokens,
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
    throw new Error(`Error parseando JSON de Groq: ${cleanJson}`);
  }
}

/**
 * Verifica si la API de Groq está disponible
 */
export async function checkGroqAvailability(): Promise<boolean> {
  try {
    const groq = getGroqClient();
    // Hacer una llamada simple para verificar conectividad
    await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5,
    });
    return true;
  } catch {
    return false;
  }
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
  const { getAIPrompt, interpolatePrompt } = await import('../utils/ai-prompts.js');
  
  const userTemplate = getAIPrompt('serviceReport', language, 'user');
  const systemPrompt = getAIPrompt('serviceReport', language, 'system');
  
  const prompt = interpolatePrompt(userTemplate, {
    pianoBrand: serviceData.pianoBrand,
    pianoModel: serviceData.pianoModel,
    clientName: serviceData.clientName,
    serviceType: serviceData.serviceType,
    technicianNotes: serviceData.technicianNotes,
    tasksCompleted: serviceData.tasksCompleted.join(', ')
  });

  return invokeGroq(prompt, {
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
  const { prepareEmailPrompt } = await import('../utils/ai-prompts.js');
  
  const { userPrompt, systemPrompt } = prepareEmailPrompt(
    language,
    params.type,
    params.clientName,
    params.lastService,
    params.nextServiceDate,
    params.customContext
  );

  return generateJsonWithGroq<{ subject: string; body: string }>(userPrompt, {
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
  const { prepareChatAssistantPrompt } = await import('../utils/ai-prompts.js');
  
  const { userPrompt, systemPrompt } = prepareChatAssistantPrompt(
    language,
    message,
    context
  );

  return invokeGroq(userPrompt, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 500,
  });
}
